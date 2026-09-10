import { QuoteRequest, QuoteResponse, SwapRoute, TradeType, CrossChainIntent } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import { defaultDEXAggregator, DEXAggregator } from './dexAggregator';
import { defaultBridgeAggregator, BridgeAggregator } from './bridgeAggregator';
import { defaultScoringService, ScoringService } from './scoring';
import { defaultSimulationEngine, SimulationEngine } from '@zenith/security';
import { ConstantProductMath } from './math/ammMath';

export class ZenithRouter {
  private dexAggregator: DEXAggregator;
  private bridgeAggregator: BridgeAggregator;
  private scoringService: ScoringService;
  private simulationEngine: SimulationEngine;
  private intentNonceCounter: number = 1001;

  constructor(
    dexAggregator = defaultDEXAggregator,
    bridgeAggregator = defaultBridgeAggregator,
    scoringService = defaultScoringService,
    simulationEngine = defaultSimulationEngine
  ) {
    this.dexAggregator = dexAggregator;
    this.bridgeAggregator = bridgeAggregator;
    this.scoringService = scoringService;
    this.simulationEngine = simulationEngine;
  }

  public async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const sourceChain = defaultChainRegistry.getChain(request.sourceChainId);
    const destChain = defaultChainRegistry.getChain(request.destinationChainId);

    if (sourceChain && !defaultChainRegistry.supportsCapability(request.sourceChainId, 'swap')) {
      throw new Error(`[ZenithRouter] Swap capability is not supported on ${sourceChain.canonicalName} (${sourceChain.tier} - ${sourceChain.operationalStatus})`);
    }

    if (destChain && !defaultChainRegistry.supportsCapability(request.destinationChainId, 'swap')) {
      throw new Error(`[ZenithRouter] Swap capability is not supported on ${destChain.canonicalName} (${destChain.tier} - ${destChain.operationalStatus})`);
    }

    const isCrossChain = request.sourceChainId !== request.destinationChainId;
    const tradeType: TradeType = request.tradeType || 'EXACT_INPUT';
    const tokenInDecimals = request.tokenIn.decimals || 18;
    const tokenOutDecimals = request.tokenOut.decimals || 18;

    const priceInUSD = request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 ? request.tokenIn.priceUSD : 1;
    const priceOutUSD = request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0 ? request.tokenOut.priceUSD : 1;

    let amountInBig: bigint = 0n;
    let amountOutBig: bigint = 0n;
    let amountInNum: number = 0;
    let amountOutNum: number = 0;
    let maximumInputRaw: string | undefined;
    let maximumInputFormatted: string | undefined;
    let minimumReceivedRaw: string = '0';
    let minimumReceivedNum: number = 0;

    // AMM Simulation pool reserves (e.g. simulated deep DEX pool: $10M pool)
    const simulatedPoolReserveIn = BigInt(Math.floor((5000000 / priceInUSD) * 10 ** tokenInDecimals));
    const simulatedPoolReserveOut = BigInt(Math.floor((5000000 / priceOutUSD) * 10 ** tokenOutDecimals));

    if (tradeType === 'EXACT_INPUT') {
      amountInBig = BigInt(request.amountInRaw || '0');
      amountInNum = Number(amountInBig) / 10 ** tokenInDecimals;

      const protocolFee = this.scoringService.calculateProtocolFee({
        tokenIn: request.tokenIn,
        amountInRaw: request.amountInRaw,
        amountInNum
      });
      const netAmountInBig = amountInBig - BigInt(protocolFee.feeAmountRaw);

      // Calculate output using Constant-Product AMM formula (x * y = k)
      amountOutBig = ConstantProductMath.getAmountOut(
        netAmountInBig,
        simulatedPoolReserveIn,
        simulatedPoolReserveOut,
        30 // 30 bps pool fee (0.3%)
      );

      amountOutNum = Number(amountOutBig) / 10 ** tokenOutDecimals;

      minimumReceivedRaw = this.scoringService.calculateMinimumReceived(
        amountOutBig.toString(),
        request.slippageTolerancePercent
      );
      minimumReceivedNum = Number(BigInt(minimumReceivedRaw)) / 10 ** tokenOutDecimals;
    } else {
      // EXACT_OUTPUT
      amountOutBig = BigInt(request.amountOutRaw || '0');
      amountOutNum = Number(amountOutBig) / 10 ** tokenOutDecimals;

      const rawAmountInRequired = ConstantProductMath.getAmountIn(
        amountOutBig,
        simulatedPoolReserveIn,
        simulatedPoolReserveOut,
        30
      );

      const feeBps = 5n; // 5 bps protocol fee
      amountInBig = (rawAmountInRequired * 10000n) / (10000n - feeBps);
      amountInNum = Number(amountInBig) / 10 ** tokenInDecimals;

      maximumInputRaw = this.scoringService.calculateMaximumInput(
        amountInBig.toString(),
        request.slippageTolerancePercent
      );
      maximumInputFormatted = (Number(BigInt(maximumInputRaw)) / 10 ** tokenInDecimals).toLocaleString(undefined, { maximumFractionDigits: 6 });

      minimumReceivedRaw = amountOutBig.toString();
      minimumReceivedNum = amountOutNum;
    }

    const tradeValueUSD = amountInNum * priceInUSD;
    const spotPrice = (priceInUSD / priceOutUSD);
    const executionPrice = amountInNum > 0 && amountOutNum > 0 ? (amountOutNum / amountInNum) : spotPrice;

    const priceImpact = this.scoringService.calculatePriceImpact({
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountInNum,
      amountOutExpectedNum: amountOutNum
    });

    const protocolFee = this.scoringService.calculateProtocolFee({
      tokenIn: request.tokenIn,
      amountInRaw: amountInBig.toString(),
      amountInNum
    });

    // Discover Routes (Direct, Multi-Hop, Split, Cross-Chain)
    let routes: SwapRoute[] = [];
    if (isCrossChain) {
      routes = this.bridgeAggregator.findCrossChainRoutes({
        sourceChainId: request.sourceChainId,
        destinationChainId: request.destinationChainId,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountInRaw: amountInBig.toString(),
        amountInNum,
        gasPreset: request.gasPreset
      });
    } else {
      routes = this.dexAggregator.findRoutes({
        chainId: request.sourceChainId,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountInRaw: amountInBig.toString(),
        amountInNum,
        gasPreset: request.gasPreset
      });
    }

    if (routes.length === 0) {
      throw new Error(
        `[ZenithRouter] No liquidity/route available for ${request.tokenIn.symbol}/${request.tokenOut.symbol}`
      );
    }

    const bestRoute = routes[0];

    const effectiveExecutionScore = this.scoringService.calculateEffectiveExecutionScore({
      priceImpactPercent: priceImpact.percentage,
      gasCostUSD: bestRoute.gasCostUSD || 0.1,
      tradeValueUSD,
      slippagePercent: request.slippageTolerancePercent,
      hasBridgeStep: isCrossChain
    });

    const quoteTimestamp = Date.now();
    const freshnessSeconds = 10;
    const expiresAt = quoteTimestamp + freshnessSeconds * 1000;
    const deadline = quoteTimestamp + (request.deadlineSeconds || 1200) * 1000; // 20 min default deadline

    // Simulation Pre-flight
    const simulationPreview = await this.simulationEngine.simulateSwap({
      chainId: request.sourceChainId,
      userAddress: request.userWalletAddress || '0x000000000000000000000000000000000000dEaD',
      routerAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountInRaw: amountInBig.toString(),
      amountOutExpectedRaw: amountOutBig.toString(),
      slippageTolerancePercent: request.slippageTolerancePercent
    });

    // Generate Intent if Cross-Chain
    let intent: CrossChainIntent | undefined;
    if (isCrossChain) {
      const orderId = `intent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      intent = {
        orderId,
        sourceChainId: request.sourceChainId,
        destinationChainId: request.destinationChainId,
        sourceToken: request.tokenIn,
        destinationToken: request.tokenOut,
        sourceAmountRaw: amountInBig.toString(),
        minDestinationAmountRaw: minimumReceivedRaw,
        recipient: request.recipientAddress || request.userWalletAddress || '0x000000000000000000000000000000000000dEaD',
        deadline,
        nonce: this.intentNonceCounter++,
        status: 'CREATED',
        createdAt: quoteTimestamp
      };
    }

    return {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      request,
      tradeType,
      routes,
      bestRoute,
      amountInRaw: amountInBig.toString(),
      amountInFormatted: amountInNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      amountOutRaw: amountOutBig.toString(),
      amountOutFormatted: amountOutNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      minimumReceivedRaw,
      minimumReceivedFormatted: minimumReceivedNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      maximumInputRaw,
      maximumInputFormatted,
      executionPrice,
      priceImpact,
      protocolFee,
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
