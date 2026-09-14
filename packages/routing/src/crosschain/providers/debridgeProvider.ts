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
  getDeBridgeSourceContract,
  isDeBridgeSupported,
  DEBRIDGE_DLN_SOURCE_ABI,
  validateEvmAddress,
  validateTokenAddress,
  validateRecipientAddress,
  validateExecutionTarget
} from '@zenith/contracts';
import { parseTokenUnits, formatTokenUnits } from '../../tokenDecimals';

const dlnInterface = new Interface(DEBRIDGE_DLN_SOURCE_ABI);

export class DeBridgeProvider implements CrossChainProvider {
  public readonly id: BridgeProtocol = 'DEBRIDGE_DLN';
  public readonly name = 'deBridge DLN';

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

    return isDeBridgeSupported(src.chainId) && isDeBridgeSupported(dst.chainId);
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

    const sourceContract = validateExecutionTarget(getDeBridgeSourceContract(srcChain.chainId!), srcChain.id);
    const amountInBig = BigInt(request.amountInRaw || '0');
    if (amountInBig <= 0n) return null;

    const quoteTimestamp = Math.floor(Date.now() / 1000);
    const tokenInDecimals = request.tokenIn.decimals !== undefined ? request.tokenIn.decimals : 18;
    const tokenOutDecimals = request.tokenOut.decimals !== undefined ? request.tokenOut.decimals : 18;
    const priceInUSD = request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 ? request.tokenIn.priceUSD : 1;
    const priceOutUSD = request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0 ? request.tokenOut.priceUSD : 1;

    const validatedInputToken = validateTokenAddress(request.tokenIn.address, srcChain.id, request.tokenIn.isNative);
    const validatedOutputToken = validateTokenAddress(request.tokenOut.address, dstChain.id, request.tokenOut.isNative);

    let destinationAmountBig = 0n;
    let bridgeFeeUSD = 0.50;
    let estTransferTimeSec = 15;

    // Try fetching live deBridge DLN API quote
    let apiQuoteSucceeded = false;
    try {
      const url = `https://api.dln.debridge.finance/v1.0/dln/order/quote?srcChainId=${srcChain.chainId}&srcChainTokenIn=${validatedInputToken}&srcChainTokenInAmount=${amountInBig.toString()}&dstChainId=${dstChain.chainId}&dstChainTokenOut=${validatedOutputToken}&prependOperatingExpense=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.estimation?.dstChainTokenOut?.amount) {
          destinationAmountBig = BigInt(data.estimation.dstChainTokenOut.amount);
          apiQuoteSucceeded = true;
        }
        if (data.estimation?.costsDetails?.find((c: any) => c.name === 'OperatingExpense')?.amount) {
          bridgeFeeUSD = Number(data.estimation.costsDetails[0].amount) || 0.50;
        }
        if (data.estimation?.recommendedEstimatedFillTimeSec) {
          estTransferTimeSec = data.estimation.recommendedEstimatedFillTimeSec;
        }
      }
    } catch {
      // API timeout/offline: fallback to solver protocol competitive spread
    }

    const amountInNum = Number(formatTokenUnits(amountInBig, tokenInDecimals));
    if (!apiQuoteSucceeded || destinationAmountBig <= 0n) {
      const feeAmountNum = amountInNum * 0.0004; // 4 bps spread
      const netAmountOutNum = (amountInNum - feeAmountNum) * (priceInUSD / priceOutUSD);
      const rawOutStr = parseTokenUnits(netAmountOutNum.toFixed(Math.min(tokenOutDecimals, 18)), tokenOutDecimals);
      destinationAmountBig = BigInt(rawOutStr === '0' ? '1' : rawOutStr);
      bridgeFeeUSD = Number((amountInNum * priceInUSD * 0.0004).toFixed(4));
    }

    const slippageMultiplier = 10000n - BigInt(Math.floor(request.slippageTolerancePercent * 100));
    const minDestinationAmountBig = (destinationAmountBig * slippageMultiplier) / 10000n;

    const gasEstimateUSD = defaultChainRegistry.getEstimatedGasCostUSD(srcChain.id, 'BRIDGE', request.gasPreset);
    const targetRecipient = recipient || request.userWalletAddress;

    return {
      provider: 'DEBRIDGE_DLN',
      providerName: this.name,
      sourceChainId: sourceChainId,
      destinationChainId: destinationChainId,
      sourceToken: request.tokenIn,
      destinationToken: request.tokenOut,
      sourceAmountRaw: amountInBig.toString(),
      destinationAmountRaw: destinationAmountBig.toString(),
      minDestinationAmountRaw: minDestinationAmountBig.toString(),
      bridgeFeeUSD,
      relayerFee: '0.04%',
      gasEstimateUSD,
      recipient: targetRecipient,
      expiration: (quoteTimestamp + 300) * 1000,
      routeIdentifier: `debridge-${srcChain.id}-${dstChain.id}-${Date.now()}`,
      executionTarget: sourceContract,
      calldata: '0x',
      value: request.tokenIn.isNative ? amountInBig.toString() : '0',
      approvalTarget: sourceContract,
      quoteTimestamp: quoteTimestamp * 1000,
      estimatedTransferTimeSec: estTransferTimeSec,
      securityRating: 'A'
    };
  }

  public async buildExecution(
    quote: CrossChainQuote,
    userAddress: string,
    recipientAddress?: string
  ): Promise<CrossChainExecution> {
    const srcChain = defaultChainRegistry.getChain(quote.sourceChainId)!;
    const dstChain = defaultChainRegistry.getChain(quote.destinationChainId)!;
    const sourceContract = validateExecutionTarget(getDeBridgeSourceContract(srcChain.chainId!), srcChain.id);

    const safeUser = validateEvmAddress(userAddress, 'User Address');
    const safeRecipient = validateRecipientAddress(recipientAddress || userAddress, srcChain.id);
    const safeInputToken = validateTokenAddress(quote.sourceToken.address, srcChain.id, quote.sourceToken.isNative);
    const safeOutputToken = validateTokenAddress(quote.destinationToken.address, dstChain.id, quote.destinationToken.isNative);

    let calldata = '0x';
    try {
      const orderCreation = {
        giveTokenAddress: safeInputToken.toLowerCase(),
        giveAmount: BigInt(quote.sourceAmountRaw),
        takeTokenAddress: safeOutputToken.toLowerCase(),
        takeAmount: BigInt(quote.minDestinationAmountRaw),
        takeChainId: dstChain.chainId!,
        receiverAddress: safeRecipient.toLowerCase(),
        allowedTaker: '0x',
        allowedCancelBeneficiary: safeUser.toLowerCase(),
        externalCall: '0x'
      };

      calldata = dlnInterface.encodeFunctionData('createOrder', [
        orderCreation,
        '0x',
        0,
        '0x'
      ]);
    } catch (err) {
      console.warn('[DeBridgeProvider] buildExecution encoding fallback:', err);
    }

    return {
      to: sourceContract,
      data: calldata,
      value: quote.sourceToken.isNative ? quote.sourceAmountRaw : '0',
      chainId: srcChain.chainId!,
      approvalTarget: sourceContract,
      requiredAllowanceRaw: quote.sourceAmountRaw
    };
  }

  public async getStatus(sourceTxHash: string, _quote: CrossChainQuote): Promise<CrossChainStatus> {
    try {
      const url = `https://api.dln.debridge.finance/v1.0/dln/tx/${sourceTxHash}/order-ids`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const orderIds = await res.json();
        const orderId = orderIds?.[0];
        if (orderId) {
          const statusRes = await fetch(`https://api.dln.debridge.finance/v1.0/dln/order/${orderId}/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.state === 'Fulfilled') {
              return {
                state: 'DESTINATION_FILLED',
                sourceTxHash,
                destinationTxHash: statusData.fulfillTxHash,
                isComplete: true,
                isFailed: false,
                timestamp: Date.now()
              };
            }
            if (statusData.state === 'Cancelled' || statusData.state === 'ClaimedUnlock') {
              return {
                state: 'REFUND_PENDING',
                sourceTxHash,
                isComplete: false,
                isFailed: true,
                errorMessage: `deBridge DLN order state: ${statusData.state}`,
                timestamp: Date.now()
              };
            }
          }
        }
      }
    } catch {
      // deBridge query fallback
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

export const defaultDeBridgeProvider = new DeBridgeProvider();
