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
import { parseTokenUnits, formatTokenUnits } from '../../tokenDecimals';

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
    const src = defaultChainRegistry.getChain(sourceChainId);
    const dst = defaultChainRegistry.getChain(destinationChainId);

    if (!src?.chainId || !dst?.chainId) return false;
    if (src.executionEnvironment !== 'EVM' || dst.executionEnvironment !== 'EVM') return false;

    return isAcrossSupported(src.chainId) && isAcrossSupported(dst.chainId);
  }

  public async getQuote(request: QuoteRequest): Promise<CrossChainQuote | null> {
    const sourceChainId = request.sourceChainId || (request as any).srcChainId;
    const destinationChainId = request.destinationChainId || (request as any).destChainId;
    const recipient = request.recipientAddress || (request as any).recipient;

    if (!this.isAvailable(sourceChainId, destinationChainId, request.tokenIn, request.tokenOut)) {
      return null;
    }

    const srcChain = defaultChainRegistry.getChain(sourceChainId)!;
    const dstChain = defaultChainRegistry.getChain(destinationChainId)!;

    const spokePool = validateExecutionTarget(getAcrossSpokePool(srcChain.chainId!), srcChain.id);
    const amountInBig = BigInt(request.amountInRaw || '0');
    if (amountInBig <= 0n) return null;

    const quoteTimestamp = Math.floor(Date.now() / 1000);
    const tokenInDecimals = request.tokenIn.decimals !== undefined ? request.tokenIn.decimals : 18;
    const tokenOutDecimals = request.tokenOut.decimals !== undefined ? request.tokenOut.decimals : 18;
    const priceInUSD = request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 ? request.tokenIn.priceUSD : 1;
    const priceOutUSD = request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0 ? request.tokenOut.priceUSD : 1;

    // Validate token addresses
    const validatedInputToken = validateTokenAddress(request.tokenIn.address, srcChain.id, request.tokenIn.isNative);
    const validatedOutputToken = validateTokenAddress(request.tokenOut.address, dstChain.id, request.tokenOut.isNative);

    // Fetch live Across fee from suggested-fees API or fallback to verified fee tiers
    let relayerFeePct = 0.0006; // 6 bps typical Across relayer fee
    let estTransferTimeSec = 25;

    try {
      const url = `https://app.across.to/api/suggested-fees?inputToken=${validatedInputToken}&outputToken=${validatedOutputToken}&originChainId=${srcChain.chainId}&destinationChainId=${dstChain.chainId}&amount=${amountInBig.toString()}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.relayFeePct) {
          relayerFeePct = Number(data.relayFeePct) / 1e18;
        }
        if (data.estimatedFillTimeSec) {
          estTransferTimeSec = data.estimatedFillTimeSec;
        }
      }
    } catch {
      // API timeout/offline: use verified protocol default fee tier
    }

    const amountInNum = Number(formatTokenUnits(amountInBig, tokenInDecimals));
    const relayerFeeAmountNum = amountInNum * relayerFeePct;
    const netAmountOutNum = (amountInNum - relayerFeeAmountNum) * (priceInUSD / priceOutUSD);
    const rawOutStr = parseTokenUnits(netAmountOutNum.toFixed(Math.min(tokenOutDecimals, 18)), tokenOutDecimals);
    const destinationAmountBig = BigInt(rawOutStr === '0' ? '1' : rawOutStr);

    const slippageMultiplier = 10000n - BigInt(Math.floor(request.slippageTolerancePercent * 100));
    const minDestinationAmountBig = (destinationAmountBig * slippageMultiplier) / 10000n;

    const bridgeFeeUSD = Number((amountInNum * priceInUSD * relayerFeePct).toFixed(4));
    const gasEstimateUSD = defaultChainRegistry.getEstimatedGasCostUSD(srcChain.id, 'BRIDGE', request.gasPreset);

    const targetRecipient = recipient || request.userWalletAddress;
    const fillDeadline = quoteTimestamp + (request.deadlineSeconds || 1800);

    const executionTarget = spokePool;
    const value = request.tokenIn.isNative ? amountInBig.toString() : '0';

    // Encode SpokePool depositV3 calldata only if a valid wallet address is supplied
    let calldata = '0x';
    if (targetRecipient) {
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
          '0x0000000000000000000000000000000000000000', // exclusiveRelayer = 0 for public relayer network
          quoteTimestamp,
          fillDeadline,
          0, // exclusivityDeadline = 0
          '0x' // message
        ]);
      } catch (encErr) {
        console.warn('[AcrossProvider] Error encoding calldata preview:', encErr);
      }
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
      relayerFee: (relayerFeePct * 100).toFixed(4) + '%',
      gasEstimateUSD,
      recipient,
      expiration: (quoteTimestamp + 300) * 1000,
      routeIdentifier: `across-${srcChain.id}-${dstChain.id}-${Date.now()}`,
      executionTarget,
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

    return {
      to: spokePool,
      data,
      value: quote.sourceToken.isNative ? quote.sourceAmountRaw : '0',
      chainId: srcChain.chainId!,
      approvalTarget: spokePool,
      requiredAllowanceRaw: quote.sourceAmountRaw
    };
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
      // API lookup error, return pending
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
