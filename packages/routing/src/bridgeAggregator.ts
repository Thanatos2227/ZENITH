import { BridgeStep, GasPreset, RouteHop, SwapRoute, Token } from '@zenith/types';
import { defaultChainRegistry } from '@zenith/chains';

export class BridgeAggregator {
  public findCrossChainRoutes(params: {
    sourceChainId: string;
    destinationChainId: string;
    tokenIn: Token;
    tokenOut: Token;
    amountInRaw: string;
    amountInNum: number;
    gasPreset?: GasPreset;
  }): SwapRoute[] {
    const isCrossChain = params.sourceChainId !== params.destinationChainId;
    if (!isCrossChain) return [];

    const routes: SwapRoute[] = [];
    const sourceGas = defaultChainRegistry.getEstimatedGasCostUSD(params.sourceChainId, 'SWAP', params.gasPreset);
    const destGas = defaultChainRegistry.getEstimatedGasCostUSD(params.destinationChainId, 'SWAP', params.gasPreset);
    const sourceGasUnits = defaultChainRegistry.getGasUnits(params.sourceChainId, false);

    // Stargate route
    const stargateRelayerFeeUSD = 0.80;
    const stargateTotalGasUSD = Number((sourceGas + destGas * 0.5 + stargateRelayerFeeUSD).toFixed(3));

    const bridgeStep: BridgeStep = {
      bridgeProtocol: 'STARGATE',
      sourceChainId: params.sourceChainId,
      destinationChainId: params.destinationChainId,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      estimatedTransferTimeSec: 45,
      bridgeFeeUSD: 1.50,
      securityRating: 'A+',
      relayerFee: '0.0005'
    };

    const sourceHops: RouteHop[] = [
      {
        dexProtocol: 'UNISWAP_V3',
        poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        tokenIn: params.tokenIn,
        tokenOut: params.tokenIn,
        proportionPercent: 100,
        estimatedGas: sourceGasUnits
      }
    ];

    routes.push({
      id: `route-bridge-stargate-${params.sourceChainId}-${params.destinationChainId}`,
      routeType: 'CROSS_CHAIN',
      hops: sourceHops,
      bridgeStep,
      gasCostUSD: stargateTotalGasUSD,
      estimatedGasUnits: sourceGasUnits + 80000n
    });

    // Across route
    const acrossRelayerFeeUSD = 0.65;
    const acrossTotalGasUSD = Number((sourceGas + destGas * 0.4 + acrossRelayerFeeUSD).toFixed(3));

    const acrossBridgeStep: BridgeStep = {
      bridgeProtocol: 'ACROSS',
      sourceChainId: params.sourceChainId,
      destinationChainId: params.destinationChainId,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      estimatedTransferTimeSec: 25,
      bridgeFeeUSD: 1.20,
      securityRating: 'A',
      relayerFee: '0.0004'
    };

    routes.push({
      id: `route-bridge-across-${params.sourceChainId}-${params.destinationChainId}`,
      routeType: 'CROSS_CHAIN',
      hops: sourceHops,
      bridgeStep: acrossBridgeStep,
      gasCostUSD: acrossTotalGasUSD,
      estimatedGasUnits: sourceGasUnits + 70000n
    });

    return routes;
  }
}

export const defaultBridgeAggregator = new BridgeAggregator();
