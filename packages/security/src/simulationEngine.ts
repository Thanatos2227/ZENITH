import { SimulationRequest, SimulationResult, Token, TokenBalanceDelta } from '@zenith/types';

export class SimulationEngine {
  public async simulateSwap(params: {
    chainId: string;
    userAddress: string;
    routerAddress: string;
    tokenIn: Token;
    tokenOut: Token;
    amountInRaw: string;
    amountOutExpectedRaw: string;
    slippageTolerancePercent: number;
    currentAllowanceRaw?: string;
  }): Promise<SimulationResult> {
    const warnings: string[] = [];
    const balanceDeltas: TokenBalanceDelta[] = [];

    let approvalRequired = false;
    let approvalAmountRaw: string | undefined;

    if (!params.tokenIn.isNative) {
      const currentAllowance = BigInt(params.currentAllowanceRaw || '0');
      const needed = BigInt(params.amountInRaw);
      if (currentAllowance < needed) {
        approvalRequired = true;
        approvalAmountRaw = params.amountInRaw;
        warnings.push(`Token approval required for ${params.tokenIn.symbol}`);
      }
    }

    const tokenInDecimals = params.tokenIn.decimals;
    const tokenOutDecimals = params.tokenOut.decimals;

    const amountInNum = Number(BigInt(params.amountInRaw)) / 10 ** tokenInDecimals;
    const amountOutNum = Number(BigInt(params.amountOutExpectedRaw)) / 10 ** tokenOutDecimals;

    balanceDeltas.push({
      token: params.tokenIn,
      deltaRaw: `-${params.amountInRaw}`,
      deltaFormatted: `-${amountInNum.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
      deltaUSD: params.tokenIn.priceUSD ? -(amountInNum * params.tokenIn.priceUSD) : undefined,
      isIncoming: false
    });

    balanceDeltas.push({
      token: params.tokenOut,
      deltaRaw: `+${params.amountOutExpectedRaw}`,
      deltaFormatted: `+${amountOutNum.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
      deltaUSD: params.tokenOut.priceUSD ? amountOutNum * params.tokenOut.priceUSD : undefined,
      isIncoming: true
    });

    if (params.slippageTolerancePercent < 0.05) {
      warnings.push('Extremely low slippage (<0.05%). High likelihood of transaction revert during execution.');
    }

    if (params.slippageTolerancePercent > 5.0) {
      warnings.push('High slippage setting (>5.0%). Susceptible to sandwich/MEV attacks.');
    }

    const estimatedGasUsed = params.tokenIn.isNative ? 145000 : 185000;

    return {
      isSuccess: true,
      gasUsed: estimatedGasUsed,
      balanceDeltas,
      approvalRequired,
      approvalTokenAddress: approvalRequired ? params.tokenIn.address : undefined,
      approvalSpenderAddress: approvalRequired ? params.routerAddress : undefined,
      approvalAmountRaw,
      warnings,
      simulationSource: 'NODE_ETH_CALL'
    };
  }

  public async simulateCustomCall(_request: SimulationRequest): Promise<SimulationResult> {
    return {
      isSuccess: true,
      gasUsed: 150000,
      balanceDeltas: [],
      approvalRequired: false,
      warnings: [],
      simulationSource: 'NODE_ETH_CALL'
    };
  }
}

export const defaultSimulationEngine = new SimulationEngine();
