import { Contract, JsonRpcSigner, BrowserProvider } from 'ethers';
import { QuoteResponse, TransactionStatus } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import {
  EVMContractRegistry,
  EVM_WRAPPED_NATIVE_TOKENS,
  SignerRequiredError
} from '@zenith/contracts';

export interface EVMExecutionParams {
  quote: QuoteResponse;
  userAddress: string;
  signer?: JsonRpcSigner | null;
  provider?: BrowserProvider | null;
  onStatusChange?: (status: TransactionStatus, txHash?: string) => void;
}

export interface EVMExecutionResult {
  isSuccess: boolean;
  txHash: string;
  blockNumber: number;
  gasUsed: bigint;
  effectiveGasPriceWei: bigint;
  revertReason?: string;
}

const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)',
  'function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)',
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
  'function refundETH() external payable'
];

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

export class EVMExecutionAdapter {
  public async checkAllowance(params: {
    tokenAddress: string;
    ownerAddress: string;
    spenderAddress: string;
    signer?: JsonRpcSigner | null;
  }): Promise<bigint> {
    if (
      params.tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
      params.tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase()
    ) {
      return BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    }

    if (params.signer) {
      try {
        const tokenContract = new Contract(params.tokenAddress, ERC20_ABI, params.signer);
        return await tokenContract.allowance(params.ownerAddress, params.spenderAddress);
      } catch (err) {
        console.warn('[EVMAdapter] checkAllowance error:', err);
      }
    }

    return 0n;
  }

  public async executeSwap(params: EVMExecutionParams): Promise<EVMExecutionResult> {
    const { quote, userAddress, signer } = params;

    if (!signer) {
      throw new SignerRequiredError('Wallet signer is required to sign and broadcast transaction on-chain.');
    }

    const isCrossChain = quote.request.sourceChainId !== quote.request.destinationChainId;
    const sourceChain = defaultChainRegistry.getChain(quote.request.sourceChainId);
    const chainIdNum = sourceChain?.chainId ?? 1;

    // Cross-Chain execution path
    if (isCrossChain && quote.bestRoute.crossChainQuote) {
      const ccQuote = quote.bestRoute.crossChainQuote;
      const targetSpender = ccQuote.approvalTarget || ccQuote.executionTarget;
      const amountInRaw = BigInt(quote.amountInRaw || ccQuote.sourceAmountRaw);

      if (!quote.request.tokenIn.isNative) {
        const currentAllowance = await this.checkAllowance({
          tokenAddress: quote.request.tokenIn.address,
          ownerAddress: userAddress,
          spenderAddress: targetSpender,
          signer
        });

        if (currentAllowance < amountInRaw) {
          params.onStatusChange?.('APPROVING');
          const tokenContract = new Contract(quote.request.tokenIn.address, ERC20_ABI, signer);
          const approveTx = await tokenContract.approve(targetSpender, amountInRaw);
          await approveTx.wait(1);
          params.onStatusChange?.('APPROVED');
        }
      }

      params.onStatusChange?.('SIGNING');

      // Send the cross-chain execution transaction constructed by the verified bridge provider
      const tx = await signer.sendTransaction({
        to: ccQuote.executionTarget,
        data: ccQuote.calldata && ccQuote.calldata !== '0x' ? ccQuote.calldata : undefined,
        value: quote.request.tokenIn.isNative ? amountInRaw : 0n
      });

      const txHash = tx.hash;
      params.onStatusChange?.('SUBMITTING', txHash);
      params.onStatusChange?.('BROADCASTED', txHash);
      params.onStatusChange?.('CONFIRMING', txHash);

      const receipt = await tx.wait(1);
      if (!receipt || receipt.status === 0) {
        throw new Error(`Cross-chain source transaction reverted on-chain: ${txHash}`);
      }

      params.onStatusChange?.('COMPLETED', txHash);

      return {
        isSuccess: true,
        txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPriceWei: receipt.gasPrice || 0n
      };
    }

    // Same-Chain DEX execution path
    const routerAddress = EVMContractRegistry.getPrimaryRouter(chainIdNum);
    const wrappedNative = EVM_WRAPPED_NATIVE_TOKENS[chainIdNum] || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    const tokenIn = quote.request.tokenIn;
    const tokenOut = quote.request.tokenOut;
    const amountInRaw = BigInt(quote.amountInRaw || '0');
    const minAmountOutRaw = BigInt(quote.minimumReceivedRaw || '0');
    const deadline = Math.floor((quote.deadline || (Date.now() + 1200000)) / 1000);

    if (!tokenIn.isNative) {
      const currentAllowance = await this.checkAllowance({
        tokenAddress: tokenIn.address,
        ownerAddress: userAddress,
        spenderAddress: routerAddress,
        signer
      });

      if (currentAllowance < amountInRaw) {
        params.onStatusChange?.('APPROVING');
        const tokenContract = new Contract(tokenIn.address, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(routerAddress, amountInRaw);
        await approveTx.wait(1);
        params.onStatusChange?.('APPROVED');
      }
    }

    params.onStatusChange?.('SIGNING');

    const routerContract = new Contract(routerAddress, SWAP_ROUTER_ABI, signer);
    const actualTokenOut = tokenOut.isNative ? wrappedNative : tokenOut.address;
    const feeTierBps = quote.bestRoute.hops[0]?.feeTierBps || 30;
    const feeTier = feeTierBps <= 1 ? 100 : (feeTierBps <= 5 ? 500 : (feeTierBps <= 30 ? 3000 : 10000));

    let tx: any;

    if (quote.tradeType === 'EXACT_OUTPUT') {
      const maxAmountInRaw = BigInt(quote.maximumInputRaw || quote.amountInRaw);
      if (tokenIn.isNative) {
        const exactOutputParams = {
          tokenIn: wrappedNative,
          tokenOut: actualTokenOut,
          fee: feeTier,
          recipient: userAddress,
          deadline,
          amountOut: BigInt(quote.amountOutRaw),
          amountInMaximum: maxAmountInRaw,
          sqrtPriceLimitX96: 0n
        };
        tx = await routerContract.exactOutputSingle(exactOutputParams, { value: maxAmountInRaw });
      } else {
        const exactOutputParams = {
          tokenIn: tokenIn.address,
          tokenOut: actualTokenOut,
          fee: feeTier,
          recipient: userAddress,
          deadline,
          amountOut: BigInt(quote.amountOutRaw),
          amountInMaximum: maxAmountInRaw,
          sqrtPriceLimitX96: 0n
        };
        tx = await routerContract.exactOutputSingle(exactOutputParams);
      }
    } else {
      if (tokenIn.isNative) {
        const exactInputParams = {
          tokenIn: wrappedNative,
          tokenOut: actualTokenOut,
          fee: feeTier,
          recipient: userAddress,
          deadline,
          amountIn: amountInRaw,
          amountOutMinimum: minAmountOutRaw,
          sqrtPriceLimitX96: 0n
        };
        tx = await routerContract.exactInputSingle(exactInputParams, { value: amountInRaw });
      } else {
        const exactInputParams = {
          tokenIn: tokenIn.address,
          tokenOut: actualTokenOut,
          fee: feeTier,
          recipient: userAddress,
          deadline,
          amountIn: amountInRaw,
          amountOutMinimum: minAmountOutRaw,
          sqrtPriceLimitX96: 0n
        };
        tx = await routerContract.exactInputSingle(exactInputParams);
      }
    }

    const txHash = tx.hash;
    params.onStatusChange?.('SUBMITTING', txHash);
    params.onStatusChange?.('BROADCASTED', txHash);
    params.onStatusChange?.('CONFIRMING', txHash);

    const receipt = await tx.wait(1);
    if (!receipt || receipt.status === 0) {
      throw new Error(`Transaction reverted on-chain: ${txHash}`);
    }

    params.onStatusChange?.('COMPLETED', txHash);

    return {
      isSuccess: true,
      txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      effectiveGasPriceWei: receipt.gasPrice || 0n
    };
  }
}

export const defaultEVMAdapter = new EVMExecutionAdapter();
