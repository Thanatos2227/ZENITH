import {
  CrossChainProvider,
  CrossChainQuote,
  QuoteRequest,
  SwapRoute,
  RouteHop
} from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import { defaultAcrossProvider } from './providers/acrossProvider';
import { defaultStargateProvider } from './providers/stargateProvider';
import { defaultDeBridgeProvider } from './providers/debridgeProvider';
import { EVMContractRegistry } from '@zenith/contracts';

export class CrossChainAggregator {
  private providers: CrossChainProvider[];

  constructor(providers?: CrossChainProvider[]) {
    this.providers = providers || [
      defaultAcrossProvider,
      defaultStargateProvider,
      defaultDeBridgeProvider
    ];
  }

  public getProviders(): CrossChainProvider[] {
    return [...this.providers];
  }

  public getProvider(id: string): CrossChainProvider | undefined {
    return this.providers.find((p) => p.id.toLowerCase() === id.toLowerCase());
  }

  public async getQuotes(request: QuoteRequest): Promise<CrossChainQuote[]> {
    const sourceChainId = request.sourceChainId || (request as any).srcChainId;
    const destinationChainId = request.destinationChainId || (request as any).destChainId;

    const isCrossChain = sourceChainId !== destinationChainId;
    if (!isCrossChain || !sourceChainId || !destinationChainId) return [];

    const availableProviders = this.providers.filter((p) =>
      p.isAvailable(sourceChainId, destinationChainId, request.tokenIn, request.tokenOut)
    );

    if (availableProviders.length === 0) {
      return [];
    }

    const quotePromises = availableProviders.map(async (provider) => {
      try {
        return await provider.getQuote(request);
      } catch (err) {
        console.warn(`[CrossChainAggregator] Provider ${provider.name} quote failed:`, err);
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    const validQuotes = results.filter((q): q is CrossChainQuote => q !== null);

    // Rank quotes: Highest net destination amount, then lowest gas, then lowest latency
    return validQuotes.sort((a, b) => {
      const diff = BigInt(b.destinationAmountRaw) - BigInt(a.destinationAmountRaw);
      if (diff !== 0n) {
        return diff > 0n ? 1 : -1;
      }
      return a.gasEstimateUSD - b.gasEstimateUSD;
    });
  }

  public async getBestQuote(request: QuoteRequest): Promise<CrossChainQuote | null> {
    const quotes = await this.getQuotes(request);
    return quotes.length > 0 ? quotes[0] : null;
  }


  public async findCrossChainRoutes(params: {
    request: QuoteRequest;
    userAddress?: string;
  }): Promise<SwapRoute[]> {
    const { request, userAddress } = params;
    const quotes = await this.getQuotes(request);

    if (quotes.length === 0) {
      return [];
    }

    const routes: SwapRoute[] = [];

    for (const quote of quotes) {
      const srcChain = defaultChainRegistry.getChain(quote.sourceChainId);
      const chainIdNum = srcChain?.chainId || 1;
      const primaryDEX = srcChain?.executionEnvironment === 'EVM'
        ? EVMContractRegistry.getPrimaryRouter(chainIdNum)
        : quote.executionTarget;

      const sourceHops: RouteHop[] = [
        {
          dexProtocol: 'UNISWAP_V3',
          poolAddress: primaryDEX,
          tokenIn: quote.sourceToken,
          tokenOut: quote.sourceToken,
          proportionPercent: 100,
          estimatedGas: 150000n
        }
      ];

      let execution = undefined;
      const provider = this.getProvider(quote.provider);
      if (provider && userAddress) {
        try {
          execution = await provider.buildExecution(quote, userAddress, request.recipientAddress);
        } catch {
          // Execution will be constructed upon user connection
        }
      }

      routes.push({
        id: `route-bridge-${quote.provider.toLowerCase()}-${quote.sourceChainId}-${quote.destinationChainId}`,
        routeType: 'CROSS_CHAIN',
        hops: sourceHops,
        bridgeStep: {
          bridgeProtocol: quote.provider,
          sourceChainId: quote.sourceChainId,
          destinationChainId: quote.destinationChainId,
          tokenIn: quote.sourceToken,
          tokenOut: quote.destinationToken,
          estimatedTransferTimeSec: quote.estimatedTransferTimeSec,
          bridgeFeeUSD: quote.bridgeFeeUSD,
          securityRating: quote.securityRating,
          relayerFee: quote.relayerFee
        },
        crossChainQuote: quote,
        execution,
        gasCostUSD: quote.gasEstimateUSD,
        estimatedGasUnits: 180000n
      });
    }

    return routes;
  }
}

export const defaultCrossChainAggregator = new CrossChainAggregator();
