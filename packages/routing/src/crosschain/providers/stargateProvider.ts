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
  STARGATE_ROUTER_ABI,
  validateEvmAddress,
  validateTokenAddress,
  validateRecipientAddress,
  validateExecutionTarget
} from '@zenith/contracts';
import { parseTokenUnits, formatTokenUnits } from '../../tokenDecimals';

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

    const routerAddress = validateExecutionTarget(getStargateRouter(srcChain.chainId!), srcChain.id);
    const amountInBig = BigInt(request.amountInRaw || '0');
    if (amountInBig <= 0n) return null;

    const quoteTimestamp = Math.floor(Date.now() / 1000);
    const tokenInDecimals = request.tokenIn.decimals !== undefined ? request.tokenIn.decimals : 18;
    const tokenOutDecimals = request.tokenOut.decimals !== undefined ? request.tokenOut.decimals : 18;
    const priceInUSD = request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 ? request.tokenIn.priceUSD : 1;
    const priceOutUSD = request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0 ? request.tokenOut.priceUSD : 1;

    // Validate tokens
    validateTokenAddress(request.tokenIn.address, srcChain.id, request.tokenIn.isNative);
    validateTokenAddress(request.tokenOut.address, dstChain.id, request.tokenOut.isNative);

    // Stargate base protocol fee is typically 6 bps (0.06%)
    const protocolFeePct = 0.0006;
    const amountInNum = Number(formatTokenUnits(amountInBig, tokenInDecimals));
    const bridgeFeeAmountNum = amountInNum * protocolFeePct;
    const netAmountOutNum = (amountInNum - bridgeFeeAmountNum) * (priceInUSD / priceOutUSD);
    const rawOutStr = parseTokenUnits(netAmountOutNum.toFixed(Math.min(tokenOutDecimals, 18)), tokenOutDecimals);
    const destinationAmountBig = BigInt(rawOutStr === '0' ? '1' : rawOutStr);

    const slippageMultiplier = 10000n - BigInt(Math.floor(request.slippageTolerancePercent * 100));
    const minDestinationAmountBig = (destinationAmountBig * slippageMultiplier) / 10000n;

    const bridgeFeeUSD = Number((amountInNum * priceInUSD * protocolFeePct).toFixed(4));
    const gasEstimateUSD = defaultChainRegistry.getEstimatedGasCostUSD(srcChain.id, 'BRIDGE', request.gasPreset);

    const targetRecipient = recipient || request.userWalletAddress;

    let calldata = '0x';
    if (targetRecipient) {
      try {
        const safeRecipient = validateRecipientAddress(targetRecipient, srcChain.id);
        const recipientBytes = AbiCoder.defaultAbiCoder().encode(['address'], [safeRecipient.toLowerCase()]);
        calldata = stargateInterface.encodeFunctionData('swap', [
          dstChain.chainId!,
          1, // srcPoolId (e.g. USDC pool)
          1, // dstPoolId
          safeRecipient.toLowerCase(),
          amountInBig,
          minDestinationAmountBig,
          [200000, 0, '0x'], // LZ tx params
          recipientBytes,
          '0x'
        ]);
      } catch (err) {
        console.warn('[StargateProvider] Error encoding calldata preview:', err);
      }
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
    const routerAddress = validateExecutionTarget(getStargateRouter(srcChain.chainId!), srcChain.id);

    const safeUser = validateEvmAddress(userAddress, 'User Address');
    const safeRecipient = validateRecipientAddress(recipientAddress || userAddress, srcChain.id);
    const recipientBytes = AbiCoder.defaultAbiCoder().encode(['address'], [safeRecipient.toLowerCase()]);

    const data = stargateInterface.encodeFunctionData('swap', [
      dstChain.chainId!,
      1,
      1,
      safeUser.toLowerCase(),
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
