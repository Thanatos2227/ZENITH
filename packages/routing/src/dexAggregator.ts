import { DEXProtocol, GasPreset, RouteHop, SwapRoute, Token } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';
import { EVMContractRegistry, SolanaProgramRegistry } from '@zenith/contracts';

export class DEXAggregator {
  public findRoutes(params: {
    chainId: string;
    tokenIn: Token;
    tokenOut: Token;
    amountInRaw: string;
    amountInNum: number;
    gasPreset?: GasPreset;
  }): SwapRoute[] {
    const isSameChain = params.tokenIn.chainId === params.tokenOut.chainId;
    if (!isSameChain) return [];

    const routes: SwapRoute[] = [];
    const chainId = params.chainId.toLowerCase();
    const chain = defaultChainRegistry.getChain(chainId);
    const chainIdNum = chain?.chainId || 1;

    const directDEX = this.selectPrimaryDEX(chainId);
    const directGasUnits = defaultChainRegistry.getGasUnits(chainId, false);
    const directGasCostUSD = defaultChainRegistry.getEstimatedGasCostUSD(chainId, 'SWAP', params.gasPreset);

    let routerAddress: string;
    if (chain?.executionEnvironment === 'SOLANA') {
      routerAddress = SolanaProgramRegistry.getProgramId('RAYDIUM');
    } else {
      try {
        routerAddress = EVMContractRegistry.getPrimaryRouter(chainIdNum);
      } catch {
        routerAddress = params.tokenIn.address;
      }
    }

    const directHops: RouteHop[] = [
      {
        dexProtocol: directDEX,
        poolAddress: routerAddress,
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        feeTierBps: 30,
        proportionPercent: 100,
        estimatedGas: directGasUnits
      }
    ];

    routes.push({
      id: `route-direct-${directDEX.toLowerCase()}-${chainId}`,
      routeType: 'DIRECT',
      hops: directHops,
      gasCostUSD: directGasCostUSD,
      estimatedGasUnits: directGasUnits
    });

    const isDirectStablePair =
      (params.tokenIn.symbol === 'USDC' && params.tokenOut.symbol === 'USDT') ||
      (params.tokenIn.symbol === 'USDT' && params.tokenOut.symbol === 'USDC') ||
      params.tokenIn.symbol === 'ETH' ||
      params.tokenOut.symbol === 'ETH';

    if (!isDirectStablePair && params.tokenIn.symbol !== params.tokenOut.symbol && chain?.executionEnvironment === 'EVM') {
      let wrappedNativeAddress: string;
      try {
        wrappedNativeAddress = EVMContractRegistry.getWrappedNative(chainIdNum);
      } catch {
        wrappedNativeAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      }

      const intermediateToken: Token = {
        address: wrappedNativeAddress,
        chainId: params.chainId,
        name: 'Wrapped Native Asset',
        symbol: chain.nativeCurrency?.symbol ? `W${chain.nativeCurrency.symbol}` : 'WETH',
        decimals: 18,
        verificationTier: 'VERIFIED_CANONICAL',
        priceUSD: 2465.87
      };

      const multiHopGasUnits = (directGasUnits * 14n) / 10n;
      const multiHopGasCostUSD = directGasCostUSD * 1.4;

      const multiHops: RouteHop[] = [
        {
          dexProtocol: directDEX,
          poolAddress: routerAddress,
          tokenIn: params.tokenIn,
          tokenOut: intermediateToken,
          feeTierBps: 30,
          proportionPercent: 100,
          estimatedGas: directGasUnits
        },
        {
          dexProtocol: directDEX,
          poolAddress: routerAddress,
          tokenIn: intermediateToken,
          tokenOut: params.tokenOut,
          feeTierBps: 30,
          proportionPercent: 100,
          estimatedGas: directGasUnits
        }
      ];

      routes.push({
        id: `route-multihop-${params.tokenIn.symbol.toLowerCase()}-wnative-${params.tokenOut.symbol.toLowerCase()}`,
        routeType: 'MULTI_HOP',
        hops: multiHops,
        gasCostUSD: multiHopGasCostUSD,
        estimatedGasUnits: multiHopGasUnits
      });
    }

    if (chain?.executionEnvironment === 'EVM') {
      const splitGasUnits = (directGasUnits * 16n) / 10n;
      const splitGasCostUSD = directGasCostUSD * 1.6;
      routes.push({
        id: `route-split-${params.tokenIn.symbol.toLowerCase()}-${params.tokenOut.symbol.toLowerCase()}-${chainId}`,
        routeType: 'SPLIT_ROUTE',
        hops: [
          {
            dexProtocol: directDEX,
            poolAddress: routerAddress,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            feeTierBps: 30,
            proportionPercent: 60,
            estimatedGas: (directGasUnits * 6n) / 10n
          },
          {
            dexProtocol: 'UNISWAP_V2',
            poolAddress: routerAddress,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            feeTierBps: 30,
            proportionPercent: 40,
            estimatedGas: (directGasUnits * 4n) / 10n
          }
        ],
        gasCostUSD: splitGasCostUSD,
        estimatedGasUnits: splitGasUnits
      });

      routes.push({
        id: `route-v4-${params.tokenIn.symbol.toLowerCase()}-${params.tokenOut.symbol.toLowerCase()}-${chainId}`,
        routeType: 'DIRECT',
        hops: [
          {
            dexProtocol: 'ZENITH_V4_CONCENTRATED',
            poolAddress: routerAddress,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            feeTierBps: 25,
            proportionPercent: 100,
            estimatedGas: directGasUnits
          }
        ],
        gasCostUSD: directGasCostUSD * 0.8,
        estimatedGasUnits: (directGasUnits * 8n) / 10n
      });

      routes.push({
        id: `route-intent-${params.tokenIn.symbol.toLowerCase()}-${params.tokenOut.symbol.toLowerCase()}-${chainId}`,
        routeType: 'INTENT_SOLVER',
        hops: [
          {
            dexProtocol: 'ZENITH_DUTCH_INTENT',
            poolAddress: routerAddress,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            feeTierBps: 0,
            proportionPercent: 100,
            estimatedGas: 0n
          }
        ],
        gasCostUSD: 0,
        estimatedGasUnits: 0n
      });
    }

    return routes;
  }

  private selectPrimaryDEX(chainId: string): DEXProtocol {
    switch (chainId) {
      case 'solana':
        return 'RAYDIUM';
      case 'base':
        return 'AERODROME';
      case 'arbitrum':
      case 'arbitrumnova':
        return 'CAMELOT';
      case 'bnb':
        return 'PANCAKESWAP';
      case 'avalanche':
        return 'TRADER_JOE';
      case 'polygon':
      case 'polygonzkevm':
        return 'QUICKSWAP';
      case 'optimism':
        return 'VELODROME';
      case 'linea':
      case 'scroll':
      case 'blast':
      case 'zksync':
      case 'mode':
      case 'taiko':
      case 'berachain':
      case 'sonic':
      case 'soneium':
      case 'unichain':
        return 'UNISWAP_V3';
      case 'sui':
      case 'aptos':
      case 'sei':
      case 'near':
      case 'osmosis':
      case 'cosmoshub':
      case 'injective':
        return 'ZENITH_INTERNAL_RFIS';
      default:
        return 'UNISWAP_V3';
    }
  }
}

export const defaultDEXAggregator = new DEXAggregator();
export const DynamicDEXSplitter = DEXAggregator;
