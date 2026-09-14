import { Interface, AbiCoder } from 'ethers';
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
  getStargateRouter,
  isStargateSupported,
  STARGATE_ROUTER_ABI
} from '@zenith/contracts';

const stargateInterface = new Interface(STARGATE_ROUTER_ABI);

export class StargateProvider implements CrossChainProvider {
  public readonly id: BridgeProtocol = 'STARGATE';
  public readonly name = 'Stargate V2 (LayerZero)';

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

    return isStargateSupported(src.chainId) && isStargateSupported(dst.chainId);
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

    const routerAddress = getStargateRouter(srcChain.chainId!);
    const amountInBig = BigInt(request.amountInRaw || '0');
    if (amountInBig <= 0n) return null;

    const quoteTimestamp = Math.floor(Date.now() / 1000);
    const tokenInDecimals = request.tokenIn.decimals || 18;

    // Stargate base protocol fee is typically 6 bps (0.06%)
    const protocolFeePct = 0.0006;
    const bridgeFeeAmountBig = (amountInBig * BigInt(Math.floor(protocolFeePct * 10000))) / 10000n;
    const destinationAmountBig = amountInBig - bridgeFeeAmountBig;

    const slippageMultiplier = 10000n - BigInt(Math.floor(request.slippageTolerancePercent * 100));
    const minDestinationAmountBig = (destinationAmountBig * slippageMultiplier) / 10000n;

    const amountInNum = Number(amountInBig) / 10 ** tokenInDecimals;
    const bridgeFeeUSD = Number((amountInNum * (request.tokenIn.priceUSD || 1) * protocolFeePct).toFixed(4));
    const gasEstimateUSD = defaultChainRegistry.getEstimatedGasCostUSD(srcChain.id, 'BRIDGE', request.gasPreset);

    const targetRecipient = recipient || request.userWalletAddress || '';
    const safeRecipient = targetRecipient && targetRecipient.startsWith('0x') && targetRecipient.length === 42
      ? targetRecipient.toLowerCase()
      : '0x1111111111111111111111111111111111111111';
    const recipientBytes = AbiCoder.defaultAbiCoder().encode(['address'], [safeRecipient]);

    let calldata = '0x';
    try {
      calldata = stargateInterface.encodeFunctionData('swap', [
        dstChain.chainId!,
        1, // srcPoolId (e.g. USDC pool)
        1, // dstPoolId
        safeRecipient,
        amountInBig,
        minDestinationAmountBig,
        [200000, 0, '0x'], // LZ tx params
        recipientBytes,
        '0x'
      ]);
    } catch (err) {
      console.warn('[StargateProvider] Error encoding calldata preview:', err);
    }

    return {
      provider: 'STARGATE',
      providerName: this.name,
      sourceChainId: request.sourceChainId,
      destinationChainId: request.destinationChainId,
      sourceToken: request.tokenIn,
      destinationToken: request.tokenOut,
      sourceAmountRaw: amountInBig.toString(),
      destinationAmountRaw: destinationAmountBig.toString(),
      minDestinationAmountRaw: minDestinationAmountBig.toString(),
      bridgeFeeUSD,
      relayerFee: '0.0005 ETH',
      gasEstimateUSD,
      recipient,
      expiration: (quoteTimestamp + 300) * 1000,
      routeIdentifier: `stargate-${srcChain.id}-${dstChain.id}-${Date.now()}`,
      executionTarget: routerAddress,
      calldata,
      value: request.tokenIn.isNative ? amountInBig.toString() : '0',
      approvalTarget: routerAddress,
      quoteTimestamp: quoteTimestamp * 1000,
      estimatedTransferTimeSec: 45,
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
    const routerAddress = getStargateRouter(srcChain.chainId!);

    const recipient = recipientAddress || userAddress;
    const recipientBytes = AbiCoder.defaultAbiCoder().encode(['address'], [recipient]);

    const data = stargateInterface.encodeFunctionData('swap', [
      dstChain.chainId!,
      1,
      1,
      userAddress,
      BigInt(quote.sourceAmountRaw),
      BigInt(quote.minDestinationAmountRaw),
      [200000, 0, '0x'],
      recipientBytes,
      '0x'
    ]);

    return {
      to: routerAddress,
      data,
      value: quote.sourceToken.isNative ? quote.sourceAmountRaw : '0',
      chainId: srcChain.chainId!,
      approvalTarget: routerAddress,
      requiredAllowanceRaw: quote.sourceAmountRaw
    };
  }

  public async getStatus(sourceTxHash: string, _quote: CrossChainQuote): Promise<CrossChainStatus> {
    try {
      const url = `https://api-mainnet.layerzero-scan.com/tx/${sourceTxHash}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const msg = data.messages?.[0];
        if (msg?.status === 'DELIVERED') {
          return {
            state: 'DESTINATION_FILLED',
            sourceTxHash,
            destinationTxHash: msg.dstTxHash,
            isComplete: true,
            isFailed: false,
            timestamp: Date.now()
          };
        }
        if (msg?.status === 'FAILED') {
          return {
            state: 'FAILED',
            sourceTxHash,
            isComplete: false,
            isFailed: true,
            errorMessage: 'LayerZero message delivery failed',
            timestamp: Date.now()
          };
        }
      }
    } catch {
      // LayerZero Scan query fallback
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

export const defaultStargateProvider = new StargateProvider();
