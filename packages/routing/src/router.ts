import { QuoteRequest, QuoteResponse, SwapRoute, TradeType, CrossChainIntent, SwapFee } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import { defaultDEXAggregator, DEXAggregator } from './dexAggregator';
import { defaultCrossChainAggregator, CrossChainAggregator } from './crosschain/crossChainAggregator';
import { defaultScoringService, ScoringService } from './scoring';
import { defaultSimulationEngine, SimulationEngine } from '@zenith/security';
import { MAX_SWAP_AMOUNT_NUM } from './amountValidation';
import { EVMContractRegistry, ConfigurationError } from '@zenith/contracts';
import { parseTokenUnits, formatTokenUnits } from './tokenDecimals';

export class ZenithRouter {
  private dexAggregator: DEXAggregator;
  private crossChainAggregator: CrossChainAggregator;
  private scoringService: ScoringService;
  private simulationEngine: SimulationEngine;
  private intentNonceCounter: number = 1001;

  constructor(
    dexAggregator = defaultDEXAggregator,
    crossChainAggregator = defaultCrossChainAggregator,
    scoringService = defaultScoringService,
    simulationEngine = defaultSimulationEngine
  ) {
    this.dexAggregator = dexAggregator;
    this.crossChainAggregator = crossChainAggregator;
    this.scoringService = scoringService;
    this.simulationEngine = simulationEngine;
  }

  public async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const sourceChain = defaultChainRegistry.getChain(request.sourceChainId);
    const destChain = defaultChainRegistry.getChain(request.destinationChainId);

    if (!sourceChain) {
      throw new ConfigurationError(`Source chain ${request.sourceChainId} is not recognized`, 'UNKNOWN_SOURCE_CHAIN');
    }
    if (!destChain) {
      throw new ConfigurationError(`Destination chain ${request.destinationChainId} is not recognized`, 'UNKNOWN_DEST_CHAIN');
    }

    if (!defaultChainRegistry.supportsCapability(request.sourceChainId, 'swap')) {
      throw new ConfigurationError(
        `Swap capability is not supported on ${sourceChain.canonicalName} (${sourceChain.tier} - ${sourceChain.operationalStatus})`,
        'SWAP_UNSUPPORTED'
      );
    }

    if (!defaultChainRegistry.supportsCapability(request.destinationChainId, 'swap')) {
      throw new ConfigurationError(
        `Swap capability is not supported on ${destChain.canonicalName} (${destChain.tier} - ${destChain.operationalStatus})`,
        'SWAP_UNSUPPORTED'
      );
    }

    const isCrossChain = request.sourceChainId !== request.destinationChainId;
    const tradeType: TradeType = request.tradeType || 'EXACT_INPUT';
    const tokenInDecimals = request.tokenIn.decimals !== undefined ? request.tokenIn.decimals : 18;
    const tokenOutDecimals = request.tokenOut.decimals !== undefined ? request.tokenOut.decimals : 18;

    const hasValidPrices = Boolean(
      request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 &&
      request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0
    );
    const priceInUSD = request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 ? request.tokenIn.priceUSD : 1;
    const priceOutUSD = request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0 ? request.tokenOut.priceUSD : 1;

    const referencePrice = hasValidPrices ? (request.tokenIn.priceUSD! / request.tokenOut.priceUSD!) : undefined;

    let amountInBig: bigint = 0n;
    let amountOutBig: bigint = 0n;
    let amountInNum: number = 0;
    let amountOutNum: number = 0;
    let maximumInputRaw: string | undefined;
    let maximumInputFormatted: string | undefined;
    let minimumReceivedRaw: string = '0';
    let minimumReceivedNum: number = 0;

    let routes: SwapRoute[] = [];
    let bestRoute: SwapRoute;

    if (isCrossChain) {
      routes = await this.crossChainAggregator.findCrossChainRoutes({
        request,
        userAddress: request.userWalletAddress
      });

      if (routes.length === 0) {
        throw new ConfigurationError(
          `[ZenithRouter] No valid cross-chain bridge quote available for ${request.tokenIn.symbol} (${sourceChain.shortName}) -> ${request.tokenOut.symbol} (${destChain.shortName})`,
          'CROSS_CHAIN_QUOTE_UNAVAILABLE'
        );
      }

      bestRoute = routes[0];
      const ccQuote = bestRoute.crossChainQuote!;

      amountInBig = BigInt(ccQuote.sourceAmountRaw);
      amountOutBig = BigInt(ccQuote.destinationAmountRaw);
      minimumReceivedRaw = ccQuote.minDestinationAmountRaw;

      amountInNum = Number(formatTokenUnits(amountInBig, tokenInDecimals));
      amountOutNum = Number(formatTokenUnits(amountOutBig, tokenOutDecimals));
      minimumReceivedNum = Number(formatTokenUnits(minimumReceivedRaw, tokenOutDecimals));
    } else {
      if (tradeType === 'EXACT_INPUT') {
        amountInBig = BigInt(request.amountInRaw || '0');
        amountInNum = Number(formatTokenUnits(amountInBig, tokenInDecimals));
        if (amountInNum > MAX_SWAP_AMOUNT_NUM) {
          throw new Error(`Swap amount (${amountInNum.toLocaleString()}) exceeds maximum allowed limit of ${MAX_SWAP_AMOUNT_NUM.toLocaleString()}`);
        }

        const poolFeeBps = 30n;
        const netAmountInBig = amountInBig - (amountInBig * poolFeeBps / 10000n);
        const netAmountInNum = Number(formatTokenUnits(netAmountInBig, tokenInDecimals));
        
        // Exact price calculation based on verified spot ratio
        const spotRatio = priceInUSD / priceOutUSD;
        const expectedOutNum = netAmountInNum * spotRatio;
        const rawOutStr = parseTokenUnits(expectedOutNum.toFixed(Math.min(tokenOutDecimals, 18)), tokenOutDecimals);
        amountOutBig = BigInt(rawOutStr === '0' ? '1' : rawOutStr);
        amountOutNum = Number(formatTokenUnits(amountOutBig, tokenOutDecimals));

        minimumReceivedRaw = this.scoringService.calculateMinimumReceived(
          amountOutBig.toString(),
          request.slippageTolerancePercent
        );
        minimumReceivedNum = Number(formatTokenUnits(minimumReceivedRaw, tokenOutDecimals));
      } else {
        amountOutBig = BigInt(request.amountOutRaw || '0');
        amountOutNum = Number(formatTokenUnits(amountOutBig, tokenOutDecimals));
        if (amountOutNum > MAX_SWAP_AMOUNT_NUM) {
          throw new Error(`Swap amount (${amountOutNum.toLocaleString()}) exceeds maximum allowed limit of ${MAX_SWAP_AMOUNT_NUM.toLocaleString()}`);
        }

        const spotRatio = priceOutUSD / priceInUSD;
        const expectedInNum = amountOutNum * spotRatio * (10000 / 9970);
        const rawInStr = parseTokenUnits(expectedInNum.toFixed(Math.min(tokenInDecimals, 18)), tokenInDecimals);
        amountInBig = BigInt(rawInStr === '0' ? '1' : rawInStr);
        amountInNum = Number(formatTokenUnits(amountInBig, tokenInDecimals));

        maximumInputRaw = this.scoringService.calculateMaximumInput(
          amountInBig.toString(),
          request.slippageTolerancePercent
        );
        maximumInputFormatted = Number(formatTokenUnits(maximumInputRaw, tokenInDecimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });

        minimumReceivedRaw = amountOutBig.toString();
        minimumReceivedNum = amountOutNum;
      }

      routes = this.dexAggregator.findRoutes({
        chainId: request.sourceChainId,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountInRaw: amountInBig.toString(),
        amountInNum,
        gasPreset: request.gasPreset
      });

      if (routes.length === 0) {
        throw new Error(
          `[ZenithRouter] No liquidity/route available for ${request.tokenIn.symbol}/${request.tokenOut.symbol}`
        );
      }

      bestRoute = routes[0];
    }

    const tradeValueUSD = amountInNum * priceInUSD;
    const spotPrice = (priceInUSD / priceOutUSD);
    const isMicroDust = amountInNum < 1e-8;
    const executionPrice = isMicroDust ? spotPrice : (amountInNum > 0 && amountOutNum > 0 ? (amountOutNum / amountInNum) : spotPrice);

    // QUOTE SANITY INVARIANT CHECK:
    // Reject quotes with impossible rates, zero outputs, or extreme deviations
    if (amountInBig <= 0n || amountOutBig <= 0n || amountInNum <= 0 || amountOutNum <= 0) {
      throw new ConfigurationError('QUOTE_INVALID: Quoted amount is zero or negative', 'QUOTE_INVALID');
    }

    if (referencePrice !== undefined && referencePrice > 0 && !isMicroDust) {
      const priceRatio = executionPrice / referencePrice;
      // Reject quotes outside sanity boundary (deviating more than 2x or losing 99%)
      if (priceRatio > 2.0 || priceRatio < 0.01) {
        throw new ConfigurationError(
          `QUOTE_INVALID: Executable rate (${executionPrice.toFixed(6)}) deviates abnormally from market reference rate (${referencePrice.toFixed(6)})`,
          'QUOTE_INVALID'
        );
      }
    }

    if (BigInt(minimumReceivedRaw) > amountOutBig) {
      throw new ConfigurationError(
        'QUOTE_INVALID: Minimum received raw amount exceeds quoted output amount',
        'QUOTE_INVALID'
      );
    }

    const poolFeeBps = 30;
    const swapFeeRaw = ((amountInBig * BigInt(poolFeeBps)) / 10000n).toString();
    const swapFeeNum = (amountInNum * poolFeeBps) / 10000;
    const swapFeeUSD = request.tokenIn.priceUSD ? swapFeeNum * request.tokenIn.priceUSD : 0;
    const swapFee: SwapFee = {
      feeBps: poolFeeBps,
      feeAmountRaw: swapFeeRaw,
      feeAmountFormatted: swapFeeNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      feeUSD: Number(swapFeeUSD.toFixed(4))
    };

    const protocolFee = this.scoringService.calculateProtocolFee({
      tokenIn: request.tokenIn,
      amountInRaw: amountInBig.toString(),
      amountInNum
    });

    const totalFeeBps = protocolFee.feeBps + poolFeeBps;
    const priceImpact = this.scoringService.calculatePriceImpact({
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountInNum,
      amountOutExpectedNum: amountOutNum,
      referencePrice,
      feeBpsTotal: totalFeeBps
    });

    const effectiveExecutionScore = this.scoringService.calculateEffectiveExecutionScore({
      priceImpactPercent: priceImpact.percentage,
      gasCostUSD: bestRoute.gasCostUSD || 0.1,
      tradeValueUSD,
      slippagePercent: request.slippageTolerancePercent,
      hasBridgeStep: isCrossChain
    });

    const quoteTimestamp = Date.now();
    const freshnessSeconds = 15;
    const expiresAt = quoteTimestamp + freshnessSeconds * 1000;
    const deadline = quoteTimestamp + (request.deadlineSeconds || 1200) * 1000;

    // Pre-flight simulation using the actual target router/bridge
    const sourceChainIdNum = sourceChain.chainId || 1;
    const routerAddress = isCrossChain
      ? bestRoute.crossChainQuote?.executionTarget
      : (sourceChain.executionEnvironment === 'EVM' ? EVMContractRegistry.getPrimaryRouter(sourceChainIdNum) : undefined);

    const callerAddress = request.userWalletAddress || (request as any).userAddress || (request as any).recipient || '0xd2206B1A832104F5E6cEBebBf1C2920fDba4Af88';

    let simulationPreview = undefined;
    if (routerAddress) {
      simulationPreview = await this.simulationEngine.simulateSwap({
        chainId: request.sourceChainId,
        userAddress: callerAddress,
        routerAddress,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountInRaw: amountInBig.toString(),
        amountOutExpectedRaw: amountOutBig.toString(),
        slippageTolerancePercent: request.slippageTolerancePercent,
        calldata: isCrossChain ? bestRoute.crossChainQuote?.calldata : undefined
      });
    }

    let intent: CrossChainIntent | undefined;
    if (isCrossChain) {
      const orderId = `intent_${Date.now()}_${this.intentNonceCounter++}`;
      intent = {
        orderId,
        sourceChainId: request.sourceChainId,
        destinationChainId: request.destinationChainId,
        sourceToken: request.tokenIn,
        destinationToken: request.tokenOut,
        sourceAmountRaw: amountInBig.toString(),
        minDestinationAmountRaw: minimumReceivedRaw,
        recipient: request.recipientAddress || request.userWalletAddress || (request as any).userAddress || (request as any).recipient || '',
        deadline,
        nonce: this.intentNonceCounter,
        status: 'CREATED',
        solverId: bestRoute.crossChainQuote?.provider,
        createdAt: quoteTimestamp
      };
    }

    const uniqueNonce = this.intentNonceCounter++;
    return {
      requestId: `req_${Date.now()}_${uniqueNonce}`,
      request,
      tradeType,
      routes,
      bestRoute,
      amountInRaw: amountInBig.toString(),
      amountInFormatted: amountInNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      amountOutRaw: amountOutBig.toString(),
      amountOutFormatted: amountOutNum < 0.0001 ? amountOutNum.toFixed(6) : amountOutNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      minimumReceivedRaw,
      minimumReceivedFormatted: minimumReceivedNum < 0.0001 ? minimumReceivedNum.toFixed(6) : minimumReceivedNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      maximumInputRaw,
      maximumInputFormatted,
      executionPrice,
      referencePrice,
      priceImpact,
      protocolFee,
      swapFee,
      effectiveExecutionScore,
      quoteTimestamp,
      expiresAt,
      deadline,
      freshnessSeconds,
      simulationPreview,
      intent
    };
  }
}

export const defaultZenithRouter = new ZenithRouter();
