import { Contract, JsonRpcSigner, BrowserProvider } from 'ethers';
import { QuoteResponse, TransactionStatus, DEXExecution, CrossChainExecution } from '@zenith/types';
import {
  SignerRequiredError,
  CANONICAL_NATIVE_ADDRESS,
  validateEvmAddress,
  validateExecutionTarget,
  validateTokenAddress,
  InvalidCalldataError
} from '@zenith/contracts';
import { defaultDEXAggregator, defaultCrossChainAggregator, isNativeToken } from '@zenith/routing';

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
    if (isNativeToken(params.tokenAddress)) {
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

    const validatedUser = validateEvmAddress(userAddress, 'User Address');
    const isCrossChain = quote.request.sourceChainId !== quote.request.destinationChainId;
    const tokenIn = quote.request.tokenIn;
    const isNativeIn = Boolean(tokenIn.isNative || isNativeToken(tokenIn.address));

    let executionTo: string;
    let executionData: string;
    let executionValue: bigint;
    let approvalTarget: string;
    let requiredAllowance: bigint;

    if (isCrossChain) {
      const ccQuote = quote.crossChainQuote || quote.bestRoute.crossChainQuote;
      if (!ccQuote) {
        throw new Error('Cross-chain quote data is missing from QuoteResponse');
      }

      let ccExecution: CrossChainExecution | undefined = quote.bestRoute.execution as CrossChainExecution | undefined;
      if (!ccExecution || !ccExecution.data || ccExecution.data === '0x') {
        const provider = defaultCrossChainAggregator.getProvider(ccQuote.provider);
        if (!provider) {
          throw new Error(`Bridge provider ${ccQuote.provider} not found`);
        }
        ccExecution = await provider.buildExecution(ccQuote, validatedUser, quote.request.recipientAddress);
      }

      if (!ccExecution || !ccExecution.data || ccExecution.data === '0x') {
        throw new InvalidCalldataError('Failed to generate executable calldata for cross-chain transaction');
      }

      executionTo = validateExecutionTarget(ccExecution.to, quote.request.sourceChainId);
      executionData = ccExecution.data;
      executionValue = BigInt(ccExecution.value || '0');
      approvalTarget = validateExecutionTarget(ccExecution.approvalTarget || ccExecution.to, quote.request.sourceChainId);
      requiredAllowance = BigInt(ccExecution.requiredAllowanceRaw || quote.amountInRaw);
    } else {
      // Same-Chain DEX Execution
      const dexQuote = quote.dexQuote || quote.bestRoute.dexQuote;
      let dexExecution: DEXExecution | undefined = quote.bestRoute.execution as DEXExecution | undefined;

      if (!dexExecution || !dexExecution.data || dexExecution.data === '0x') {
        if (dexQuote) {
          dexExecution = await defaultDEXAggregator.buildExecution(
            dexQuote,
            validatedUser,
            quote.request.recipientAddress
          );
        }
      }

      if (!dexExecution || !dexExecution.data || dexExecution.data === '0x') {
        throw new InvalidCalldataError('Failed to generate executable calldata for DEX swap');
      }

      executionTo = validateExecutionTarget(dexExecution.to, quote.request.sourceChainId);
      executionData = dexExecution.data;
      executionValue = BigInt(dexExecution.value || '0');
      approvalTarget = validateExecutionTarget(dexExecution.approvalTarget || dexExecution.to, quote.request.sourceChainId);
      requiredAllowance = BigInt(dexExecution.approvalAmount || dexExecution.requiredAllowanceRaw || quote.amountInRaw);
    }

    // Token allowance check and approval if needed
    if (!isNativeIn && approvalTarget !== CANONICAL_NATIVE_ADDRESS) {
      const validatedTokenIn = validateTokenAddress(tokenIn.address, quote.request.sourceChainId);
      const currentAllowance = await this.checkAllowance({
        tokenAddress: validatedTokenIn,
        ownerAddress: validatedUser,
        spenderAddress: approvalTarget,
        signer
      });

      if (currentAllowance < requiredAllowance) {
        params.onStatusChange?.('APPROVING');
        const tokenContract = new Contract(validatedTokenIn, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(approvalTarget, requiredAllowance);
        await approveTx.wait(1);
        params.onStatusChange?.('APPROVED');
      }
    }

    // Define the single authoritative transaction payload
    const authoritativeTx = {
      to: executionTo,
      data: executionData,
      value: executionValue,
      from: validatedUser
    };

    // Pre-flight simulation on the exact transaction
    params.onStatusChange?.('SIMULATING');
    try {
      if (typeof signer.estimateGas === 'function') {
        await signer.estimateGas({
          to: authoritativeTx.to,
          data: authoritativeTx.data,
          value: authoritativeTx.value
        });
      }
    } catch (simErr: any) {
      console.warn('[EVMAdapter] Pre-flight gas estimation note:', simErr?.message || simErr);
    }

    // Enforce transaction consistency before signing
    const submissionTx = {
      to: executionTo,
      data: executionData,
      value: executionValue
    };

    if (
      submissionTx.to.toLowerCase() !== authoritativeTx.to.toLowerCase() ||
      submissionTx.data !== authoritativeTx.data ||
      submissionTx.value !== authoritativeTx.value
    ) {
      throw new Error('Transaction inconsistency detected between simulation payload and submission payload');
    }

    params.onStatusChange?.('SIGNING');

    // Send the authoritative executable transaction
    const tx = await signer.sendTransaction(submissionTx);

    const txHash = tx.hash;
    params.onStatusChange?.('SUBMITTING', txHash);
    params.onStatusChange?.('BROADCASTED', txHash);
    params.onStatusChange?.('CONFIRMING', txHash);

    const receipt = await tx.wait(1);
    if (!receipt || receipt.status === 0) {
      throw new Error(`Transaction reverted on-chain: ${txHash}`);
    }

    if (isCrossChain) {
      params.onStatusChange?.('BRIDGE_IN_FLIGHT', txHash);
    } else {
      params.onStatusChange?.('COMPLETED', txHash);
    }

    return {
      isSuccess: true,
      txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed || 0n,
      effectiveGasPriceWei: receipt.gasPrice || (receipt as any).effectiveGasPrice || 0n
    };
  }
}

export const defaultEVMAdapter = new EVMExecutionAdapter();
