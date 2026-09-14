import { Interface } from 'ethers';
import {
  BridgeProtocol,
  CrossChainExecution,
  CrossChainProvider,
  CrossChainQuote,
  CrossChainStatus,
  QuoteRequest,
  Token
} from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import {
  getAcrossSpokePool,
  isAcrossSupported,
  ACROSS_SPOKE_POOL_ABI,
  validateEvmAddress,
  validateTokenAddress,
  validateRecipientAddress,
  validateExecutionTarget
} from '@zenith/contracts';
import { calculateCrossChainOutput, isNativeToken } from '../../dex/dexMath';

const spokePoolInterface = new Interface(ACROSS_SPOKE_POOL_ABI);

export class AcrossProvider implements CrossChainProvider {
  public readonly id: BridgeProtocol = 'ACROSS';
  public readonly name = 'Across Protocol V3';

  public isAvailable(
    sourceChainId?: string,
    destinationChainId?: string,
    _tokenIn?: Token,
    _tokenOut?: Token
  ): boolean {
    if (!sourceChainId || !destinationChainId) return false;
    if (sourceChainId === destinationChainId) return false;
    const src = defaultChainRegistry.getChain(sourceChainId);
    const dst = defaultChainRegistry.getChain(destinationChainId);

    if (!src?.chainId || !dst?.chainId) return false;
    if (src.executionEnvironment !== 'EVM' || dst.executionEnvironment !== 'EVM') return false;

    return isAcrossSupported(src.chainId) && isAcrossSupported(dst.chainId);
  }

  public async getQuote(request: QuoteRequest): Promise<CrossChainQuote | null> {
    const sourceChainId = request.sourceChainId || (request as any).srcChainId;
    const destinationChainId = request.destinationChainId || (request as any).destChainId;
    const recipient = request.recipientAddress || (request as any).recipient || request.userWalletAddress;

    if (!this.isAvailable(sourceChainId, destinationChainId, request.tokenIn, request.tokenOut)) {
      return null;
    }

    const srcChain = defaultChainRegistry.getChain(sourceChainId)!;
    const dstChain = defaultChainRegistry.getChain(destinationChainId)!;

    const spokePool = validateExecutionTarget(getAcrossSpokePool(srcChain.chainId!), srcChain.id);
    const amountInBig = BigInt(request.amountInRaw || (request as any).amountIn || '0');
    if (amountInBig <= 0n) return null;

    const quoteTimestamp = Math.floor(Date.now() / 1000);

    const validatedInputToken = validateTokenAddress(request.tokenIn.address, srcChain.id, request.tokenIn.isNative);
    const validatedOutputToken = validateTokenAddress(request.tokenOut.address, dstChain.id, request.tokenOut.isNative);

    let relayerFeeBps = 6n; // 6 bps standard across relayer fee
    let estTransferTimeSec = 25;
    let bridgeFeeUSD = 0.50;

    // Fetch live Across fee from suggested-fees API if available
    try {
      const url = `https://app.across.to/api/suggested-fees?inputToken=${validatedInputToken}&outputToken=${validatedOutputToken}&originChainId=${srcChain.chainId}&destinationChainId=${dstChain.chainId}&amount=${amountInBig.toString()}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.relayFeePct) {
          const feePctNum = Number(data.relayFeePct) / 1e18;
          relayerFeeBps = BigInt(Math.max(1, Math.round(feePctNum * 10000)));
        }
        if (data.estimatedFillTimeSec) {
          estTransferTimeSec = data.estimatedFillTimeSec;
        }
      }
    } catch {
      // API timeout/offline: standard verified protocol fee
    }

    const destinationAmountBig = calculateCrossChainOutput({
      amountInRaw: amountInBig,
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      bridgeFeeBps: relayerFeeBps
    });

    if (destinationAmountBig <= 0n) {
      return null;
    }

    const slippagePct = request.slippageTolerancePercent !== undefined && !isNaN(request.slippageTolerancePercent) ? request.slippageTolerancePercent : 0.5;
    const slippageBps = BigInt(Math.floor(slippagePct * 100));
    const slippageMultiplier = 10000n - slippageBps;
    const minDestinationAmountBig = (destinationAmountBig * slippageMultiplier) / 10000n;

    const gasEstimateUSD = defaultChainRegistry.getEstimatedGasCostUSD(srcChain.id, 'BRIDGE', request.gasPreset);
    const targetRecipient = recipient || '0x1234567890123456789012345678901234567890';
    const fillDeadline = quoteTimestamp + (request.deadlineSeconds || 1800);

    const isNative = isNativeToken(request.tokenIn.address) || Boolean(request.tokenIn.isNative);
    const value = isNative ? amountInBig.toString() : '0';

    let calldata = '0x';
    try {
      const safeRecipient = validateRecipientAddress(targetRecipient, srcChain.id);
      calldata = spokePoolInterface.encodeFunctionData('depositV3', [
        safeRecipient.toLowerCase(),
        safeRecipient.toLowerCase(),
        validatedInputToken.toLowerCase(),
        validatedOutputToken.toLowerCase(),
        amountInBig,
        minDestinationAmountBig,
        dstChain.chainId!,
        '0x0000000000000000000000000000000000000000',
        quoteTimestamp,
        fillDeadline,
        0,
        '0x'
      ]);
    } catch (encErr) {
      console.warn('[AcrossProvider] Error encoding calldata preview:', encErr);
    }

    return {
      provider: 'ACROSS',
      providerName: this.name,
      sourceChainId: request.sourceChainId,
      destinationChainId: request.destinationChainId,
      sourceToken: request.tokenIn,
      destinationToken: request.tokenOut,
      sourceAmountRaw: amountInBig.toString(),
      destinationAmountRaw: destinationAmountBig.toString(),
      minDestinationAmountRaw: minDestinationAmountBig.toString(),
      bridgeFeeUSD,
      relayerFee: `${(Number(relayerFeeBps) / 100).toFixed(2)}%`,
      gasEstimateUSD,
      recipient: targetRecipient,
      expiration: (quoteTimestamp + 300) * 1000,
      routeIdentifier: `across-${srcChain.id}-${dstChain.id}-${Date.now()}`,
      executionTarget: spokePool,
      calldata,
      value,
      approvalTarget: spokePool,
      quoteTimestamp: quoteTimestamp * 1000,
      estimatedTransferTimeSec: estTransferTimeSec,
      securityRating: 'A+'
    };
  }

  public async buildExecution(
    quote: CrossChainQuote,
    userAddress: string,
    recipientAddress?: string
  ): Promise<CrossChainExecution> {
    const srcChain = defaultChainRegistry.getChain(quote.sourceChainId)!;
    const dstChain = defaultChainRegistry.getChain(quote.destinationChainId)!;
    const spokePool = validateExecutionTarget(getAcrossSpokePool(srcChain.chainId!), srcChain.id);

    const safeUser = validateEvmAddress(userAddress, 'User Address');
    const safeRecipient = validateRecipientAddress(recipientAddress || userAddress, srcChain.id);
    const safeInputToken = validateTokenAddress(quote.sourceToken.address, srcChain.id, quote.sourceToken.isNative);
    const safeOutputToken = validateTokenAddress(quote.destinationToken.address, dstChain.id, quote.destinationToken.isNative);

    const quoteTimestampSec = Math.floor(quote.quoteTimestamp / 1000);
    const fillDeadlineSec = quoteTimestampSec + 1800;

    const data = spokePoolInterface.encodeFunctionData('depositV3', [
      safeUser.toLowerCase(),
      safeRecipient.toLowerCase(),
      safeInputToken.toLowerCase(),
      safeOutputToken.toLowerCase(),
      BigInt(quote.sourceAmountRaw),
      BigInt(quote.minDestinationAmountRaw),
      dstChain.chainId!,
      '0x0000000000000000000000000000000000000000',
      quoteTimestampSec,
      fillDeadlineSec,
      0,
      '0x'
    ]);

    const isNative = isNativeToken(quote.sourceToken.address) || Boolean(quote.sourceToken.isNative);

    return {
      to: spokePool,
      data,
      calldata: data,
      isExecutable: true,
      value: isNative ? quote.sourceAmountRaw : '0',
      chainId: srcChain.chainId!,
      approvalTarget: spokePool,
      requiredAllowanceRaw: quote.sourceAmountRaw,
      approvalAmount: quote.sourceAmountRaw
    } as any;
  }

  public async getStatus(sourceTxHash: string, quote: CrossChainQuote): Promise<CrossChainStatus> {
    const srcChain = defaultChainRegistry.getChain(quote.sourceChainId);
    const chainIdNum = srcChain?.chainId || 1;

    try {
      const url = `https://app.across.to/api/deposit/status?originChainId=${chainIdNum}&depositTxHash=${sourceTxHash}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'filled') {
          return {
            state: 'DESTINATION_FILLED',
            sourceTxHash,
            destinationTxHash: data.fillTxHash,
            isComplete: true,
            isFailed: false,
            timestamp: Date.now()
          };
        }
        if (data.status === 'pending') {
          return {
            state: 'FULFILLING',
            sourceTxHash,
            isComplete: false,
            isFailed: false,
            timestamp: Date.now()
          };
        }
        if (data.status === 'refunded' || data.status === 'expired') {
          return {
            state: 'REFUND_PENDING',
            sourceTxHash,
            isComplete: false,
            isFailed: true,
            errorMessage: `Across order status: ${data.status}`,
            timestamp: Date.now()
          };
        }
      }
    } catch {
      // API lookup timeout
    }

    return {
      state: 'FULFILLING',
      sourceTxHash,
      isComplete: false,
      isFailed: false,
      timestamp: Date.now()
    };
  }

  public async getDestinationTransaction(sourceTxHash: string, quote: CrossChainQuote): Promise<string | null> {
    const status = await this.getStatus(sourceTxHash, quote);
    return status.destinationTxHash || null;
  }
}

export const defaultAcrossProvider = new AcrossProvider();
