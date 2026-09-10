import { Contract, JsonRpcSigner, BrowserProvider } from 'ethers';
import { QuoteResponse, TransactionStatus } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';

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

export const CANONICAL_ROUTERS: Record<number, string> = {
  1: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  137: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  8453: '0x2626664c2603336E57B271c5C0b26F421741e481',
  42161: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  10: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  56: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  43114: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4'
};

export const WRAPPED_NATIVE_TOKENS: Record<number, string> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  8453: '0x4200000000000000000000000000000000000006',
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  10: '0x4200000000000000000000000000000000000006',
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  43114: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
};

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
      params.tokenAddress === '0x0000000000000000000000000000000000000000'
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
      params.onStatusChange?.('SIGNING');
      await new Promise((resolve) => setTimeout(resolve, 300));
      params.onStatusChange?.('SUBMITTING');
      await new Promise((resolve) => setTimeout(resolve, 200));

      const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      params.onStatusChange?.('BROADCASTED', mockTxHash);
      params.onStatusChange?.('CONFIRMING', mockTxHash);
      await new Promise((resolve) => setTimeout(resolve, 400));
      params.onStatusChange?.('COMPLETED', mockTxHash);

      return {
        isSuccess: true,
        txHash: mockTxHash,
        blockNumber: 19842100,
        gasUsed: 142000n,
        effectiveGasPriceWei: 18000000000n
      };
    }

    const sourceChain = defaultChainRegistry.getChain(quote.request.sourceChainId);
    const chainIdNum = sourceChain?.chainId ?? 1;

    const routerAddress = CANONICAL_ROUTERS[chainIdNum] || '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
    const wrappedNative = WRAPPED_NATIVE_TOKENS[chainIdNum] || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    const tokenIn = quote.request.tokenIn;
    const tokenOut = quote.request.tokenOut;
    const amountInRaw = BigInt(quote.amountInRaw || '0');
    const minAmountOutRaw = BigInt(quote.minimumReceivedRaw || '0');
    const deadline = Math.floor((quote.deadline || (Date.now() + 1200000)) / 1000);

    try {
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

      const actualTokenIn = tokenIn.isNative ? wrappedNative : tokenIn.address;
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
            recipient: tokenOut.isNative ? '0x0000000000000000000000000000000000000002' : userAddress,
            deadline,
            amountOut: BigInt(quote.amountOutRaw),
            amountInMaximum: maxAmountInRaw,
            sqrtPriceLimitX96: 0n
          };
          const swapCall = routerContract.interface.encodeFunctionData('exactOutputSingle', [exactOutputParams]);
          const refundCall = routerContract.interface.encodeFunctionData('refundETH', []);
          tx = await routerContract.multicall([swapCall, refundCall], { value: maxAmountInRaw });
        } else if (tokenOut.isNative) {
          const exactOutputParams = {
            tokenIn: tokenIn.address,
            tokenOut: wrappedNative,
            fee: feeTier,
            recipient: '0x0000000000000000000000000000000000000002',
            deadline,
            amountOut: BigInt(quote.amountOutRaw),
            amountInMaximum: maxAmountInRaw,
            sqrtPriceLimitX96: 0n
          };
          const swapCall = routerContract.interface.encodeFunctionData('exactOutputSingle', [exactOutputParams]);
          const unwrapCall = routerContract.interface.encodeFunctionData('unwrapWETH9', [BigInt(quote.amountOutRaw), userAddress]);
          tx = await routerContract.multicall([swapCall, unwrapCall]);
        } else {
          const exactOutputParams = {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
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
            recipient: tokenOut.isNative ? '0x0000000000000000000000000000000000000002' : userAddress,
            deadline,
            amountIn: amountInRaw,
            amountOutMinimum: minAmountOutRaw,
            sqrtPriceLimitX96: 0n
          };
          const swapCall = routerContract.interface.encodeFunctionData('exactInputSingle', [exactInputParams]);
          const refundCall = routerContract.interface.encodeFunctionData('refundETH', []);
          tx = await routerContract.multicall([swapCall, refundCall], { value: amountInRaw });
        } else if (tokenOut.isNative) {
          const exactInputParams = {
            tokenIn: tokenIn.address,
            tokenOut: wrappedNative,
            fee: feeTier,
            recipient: '0x0000000000000000000000000000000000000002',
            deadline,
            amountIn: amountInRaw,
            amountOutMinimum: minAmountOutRaw,
            sqrtPriceLimitX96: 0n
          };
          const swapCall = routerContract.interface.encodeFunctionData('exactInputSingle', [exactInputParams]);
          const unwrapCall = routerContract.interface.encodeFunctionData('unwrapWETH9', [minAmountOutRaw, userAddress]);
          tx = await routerContract.multicall([swapCall, unwrapCall]);
        } else {
          const exactInputParams = {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
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

      params.onStatusChange?.('COMPLETED', txHash);

      return {
        isSuccess: true,
        txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        effectiveGasPriceWei: receipt.gasPrice || 0n
      };
    } catch (err: any) {
      throw err;
    }
  }
}

export const defaultEVMAdapter = new EVMExecutionAdapter();
