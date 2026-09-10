import { DEXProtocol, GasPreset, RouteHop, SwapRoute, Token } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';

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

    const directDEX = this.selectPrimaryDEX(chainId);
    const directGasUnits = defaultChainRegistry.getGasUnits(chainId, false);
    const directGasCostUSD = defaultChainRegistry.getEstimatedGasCostUSD(chainId, 'SWAP', params.gasPreset);

    const zenithNativeGasUnits = (directGasUnits * 8n) / 10n;
    routes.push({
      id: `route-zenith-v4-concentrated`,
      routeType: 'DIRECT',
      hops: [
        {
          dexProtocol: 'ZENITH_V4_CONCENTRATED',
          poolAddress: '0xZENITHPoolManagerSingleton000000000001',
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          feeTierBps: 5,
          proportionPercent: 100,
          estimatedGas: zenithNativeGasUnits
        }
      ],
      gasCostUSD: directGasCostUSD * 0.8,
      estimatedGasUnits: zenithNativeGasUnits
    });

    routes.push({
      id: `route-zenith-dutch-intent`,
      routeType: 'DIRECT',
      hops: [
        {
          dexProtocol: 'ZENITH_DUTCH_INTENT',
          poolAddress: '0xZENITHReactorSettlement000000000001',
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

    const directHops: RouteHop[] = [
      {
        dexProtocol: directDEX,
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        feeTierBps: 5,
        proportionPercent: 100,
        estimatedGas: directGasUnits
      }
    ];

    routes.push({
      id: `route-direct-${directDEX.toLowerCase()}`,
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

    if (!isDirectStablePair && params.tokenIn.symbol !== params.tokenOut.symbol) {
      const intermediateToken: Token = {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        chainId: params.chainId,
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        verificationTier: 'VERIFIED_CANONICAL',
        priceUSD: 2465.87
      };

      const multiHopGasUnits = directGasUnits * 14n / 10n;
      const multiHopGasCostUSD = directGasCostUSD * 1.4;

      const multiHops: RouteHop[] = [
        {
          dexProtocol: directDEX,
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          tokenIn: params.tokenIn,
          tokenOut: intermediateToken,
          feeTierBps: 5,
          proportionPercent: 100,
          estimatedGas: directGasUnits
        },
        {
          dexProtocol: directDEX,
          poolAddress: '0x11b815efb8f581194ae79006d24e0d814b7697f6',
          tokenIn: intermediateToken,
          tokenOut: params.tokenOut,
          feeTierBps: 30,
          proportionPercent: 100,
          estimatedGas: directGasUnits
        }
      ];

      routes.push({
        id: `route-multihop-${params.tokenIn.symbol.toLowerCase()}-weth-${params.tokenOut.symbol.toLowerCase()}`,
        routeType: 'MULTI_HOP',
        hops: multiHops,
        gasCostUSD: multiHopGasCostUSD,
        estimatedGasUnits: multiHopGasUnits
      });
    }

    if (params.amountInNum * (params.tokenIn.priceUSD || 1) > 1500) {
      const secondaryDEX = this.selectSecondaryDEX(chainId);
      const splitGasUnits = defaultChainRegistry.getGasUnits(chainId, true);
      const splitGasCostUSD = defaultChainRegistry.getEstimatedGasCostUSD(chainId, 'SPLIT_SWAP', params.gasPreset);

      const splitHops: RouteHop[] = [
        {
          dexProtocol: directDEX,
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          feeTierBps: 5,
          proportionPercent: 60,
          estimatedGas: splitGasUnits / 2n
        },
        {
          dexProtocol: secondaryDEX,
          poolAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          feeTierBps: 10,
          proportionPercent: 40,
          estimatedGas: splitGasUnits / 2n
        }
      ];

      routes.push({
        id: `route-split-${directDEX.toLowerCase()}-${secondaryDEX.toLowerCase()}`,
        routeType: 'SPLIT_ROUTE',
        hops: splitHops,
        gasCostUSD: splitGasCostUSD,
        estimatedGasUnits: splitGasUnits
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
        return 'UNISWAP_V3';
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

  private selectSecondaryDEX(chainId: string): DEXProtocol {
    switch (chainId) {
      case 'solana':
        return 'ORCA_WHIRLPOOL';
      case 'base':
        return 'UNISWAP_V3';
      case 'arbitrum':
        return 'UNISWAP_V3';
      case 'polygon':
        return 'UNISWAP_V3';
      case 'bnb':
        return 'UNISWAP_V3';
      case 'avalanche':
        return 'PANCAKESWAP';
      case 'optimism':
        return 'UNISWAP_V3';
      default:
        return 'CURVE';
    }
  }
}

export const defaultDEXAggregator = new DEXAggregator();
