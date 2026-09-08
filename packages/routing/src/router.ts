import { QuoteRequest, QuoteResponse, SwapRoute } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import { defaultDEXAggregator, DEXAggregator } from './dexAggregator';
import { defaultBridgeAggregator, BridgeAggregator } from './bridgeAggregator';
import { defaultScoringService, ScoringService } from './scoring';
import { defaultSimulationEngine, SimulationEngine } from '@zenith/security';

export class ZenithRouter {
  private dexAggregator: DEXAggregator;
  private bridgeAggregator: BridgeAggregator;
  private scoringService: ScoringService;
  private simulationEngine: SimulationEngine;

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
    const tokenInDecimals = request.tokenIn.decimals || 18;
    const tokenOutDecimals = request.tokenOut.decimals || 18;

    const rawBig = BigInt(request.amountInRaw || '0');
    const amountInNum = Number(rawBig) / 10 ** tokenInDecimals;

    const priceInUSD = request.tokenIn.priceUSD && request.tokenIn.priceUSD > 0 ? request.tokenIn.priceUSD : 1;
    const priceOutUSD = request.tokenOut.priceUSD && request.tokenOut.priceUSD > 0 ? request.tokenOut.priceUSD : 1;
    const tradeValueUSD = amountInNum * priceInUSD;

    const protocolFee = this.scoringService.calculateProtocolFee({
      tokenIn: request.tokenIn,
      amountInRaw: request.amountInRaw,
      amountInNum
    });

    const feeAmountNum = Number(BigInt(protocolFee.feeAmountRaw)) / 10 ** tokenInDecimals;
    const netAmountInNum = Math.max(0, amountInNum - feeAmountNum);
    const baseOutputNum = (netAmountInNum * priceInUSD) / priceOutUSD;

    const impactFactor = Math.max(0.0005, Math.min(0.08, (tradeValueUSD / 5000000) * 0.02));
    const amountOutNum = Math.max(0, baseOutputNum * (1 - impactFactor));

    const amountOutBig = BigInt(Math.floor(amountOutNum * 10 ** tokenOutDecimals));
    const amountOutRaw = amountOutBig.toString();

    const priceImpact = this.scoringService.calculatePriceImpact({
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountInNum,
      amountOutExpectedNum: amountOutNum
    });

    const minimumReceivedRaw = this.scoringService.calculateMinimumReceived(
      amountOutRaw,
      request.slippageTolerancePercent
    );
    const minimumReceivedNum = Number(BigInt(minimumReceivedRaw)) / 10 ** tokenOutDecimals;

    let routes: SwapRoute[] = [];
    if (isCrossChain) {
      routes = this.bridgeAggregator.findCrossChainRoutes({
        sourceChainId: request.sourceChainId,
        destinationChainId: request.destinationChainId,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountInRaw: request.amountInRaw,
        amountInNum,
        gasPreset: request.gasPreset
      });
    } else {
      routes = this.dexAggregator.findRoutes({
        chainId: request.sourceChainId,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountInRaw: request.amountInRaw,
        amountInNum,
        gasPreset: request.gasPreset
      });
    }

    const bestRoute = routes[0] || {
      id: 'fallback-direct',
      routeType: 'DIRECT',
      hops: [{
        dexProtocol: 'UNISWAP_V3',
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        proportionPercent: 100,
        estimatedGas: 120000n
      }],
      gasCostUSD: 0.02,
      estimatedGasUnits: 120000n
    };

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

    const simulationPreview = await this.simulationEngine.simulateSwap({
      chainId: request.sourceChainId,
      userAddress: request.userWalletAddress || '0x000000000000000000000000000000000000dEaD',
      routerAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountInRaw: request.amountInRaw,
      amountOutExpectedRaw: amountOutRaw,
      slippageTolerancePercent: request.slippageTolerancePercent
    });

    const executionPrice = amountInNum > 0 && amountOutNum > 0 ? amountOutNum / amountInNum : (priceInUSD / priceOutUSD);

    return {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      request,
      routes,
      bestRoute,
      amountInFormatted: amountInNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      amountOutRaw,
      amountOutFormatted: amountOutNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      minimumReceivedRaw,
      minimumReceivedFormatted: minimumReceivedNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      executionPrice,
      priceImpact,
      protocolFee,
      effectiveExecutionScore,
      quoteTimestamp,
      expiresAt,
      freshnessSeconds,
      simulationPreview
    };
  }
}

export const defaultZenithRouter = new ZenithRouter();
