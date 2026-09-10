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

    if (params.amountInNum * (params.tokenIn.priceUSD || 1) > 2000) {
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
