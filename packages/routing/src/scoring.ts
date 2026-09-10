import { PriceImpact, ProtocolFee, Token } from '@zenith/types';
import { MAX_SWAP_AMOUNT_NUM } from './amountValidation';

export class ScoringService {
  private static PROTOCOL_FEE_BPS = 5;
  private static TREASURY_ADDRESS = '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B';

  public calculatePriceImpact(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountInNum: number;
    amountOutExpectedNum: number;
  }): PriceImpact {
    if (!params.tokenIn.priceUSD || !params.tokenOut.priceUSD || params.amountInNum <= 0) {
      return { percentage: 0.05, level: 'NEGLIGIBLE' };
    }

    const valueInUSD = params.amountInNum * params.tokenIn.priceUSD;
    const valueOutUSD = params.amountOutExpectedNum * params.tokenOut.priceUSD;

    if (valueInUSD <= 0) {
      return { percentage: 0, level: 'NEGLIGIBLE' };
    }

    const rawImpact = Math.max(0, ((valueInUSD - valueOutUSD) / valueInUSD) * 100);
    const percentage = Number(rawImpact.toFixed(3));

    let level: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NEGLIGIBLE';
    let warningMessage: string | undefined;

    if (percentage > 5.0) {
      level = 'CRITICAL';
      warningMessage = `Critical Price Impact (${percentage}%). You will lose a significant portion of value.`;
    } else if (percentage > 2.0) {
      level = 'HIGH';
      warningMessage = `High Price Impact (${percentage}%). Consider trading a smaller amount or splitting your trade.`;
    } else if (percentage > 0.5) {
      level = 'MEDIUM';
      warningMessage = `Moderate Price Impact (${percentage}%).`;
    } else if (percentage > 0.1) {
      level = 'LOW';
    }

    return { percentage, level, warningMessage };
  }

  public calculateProtocolFee(params: {
    tokenIn: Token;
    amountInRaw: string;
    amountInNum: number;
  }): ProtocolFee {
    if (params.amountInNum > MAX_SWAP_AMOUNT_NUM) {
      throw new Error(`Amount (${params.amountInNum.toLocaleString()}) exceeds maximum allowed limit of ${MAX_SWAP_AMOUNT_NUM.toLocaleString()}`);
    }
    const feeBps = ScoringService.PROTOCOL_FEE_BPS;
    const rawBigInt = BigInt(params.amountInRaw);
    const feeAmountRaw = ((rawBigInt * BigInt(feeBps)) / 10000n).toString();
    const feeAmountNum = (params.amountInNum * feeBps) / 10000;
    const feeUSD = params.tokenIn.priceUSD ? feeAmountNum * params.tokenIn.priceUSD : 0;

    return {
      feeBps,
      feeAmountRaw,
      feeAmountFormatted: feeAmountNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      feeUSD: Number(feeUSD.toFixed(4)),
      treasuryRecipient: ScoringService.TREASURY_ADDRESS
    };
  }

  public calculateEffectiveExecutionScore(params: {
    priceImpactPercent: number;
    gasCostUSD: number;
    tradeValueUSD: number;
    slippagePercent: number;
    hasBridgeStep: boolean;
  }): number {
    let score = 100;

    score -= params.priceImpactPercent * 8;

    if (params.tradeValueUSD > 0) {
      const gasRatio = (params.gasCostUSD / params.tradeValueUSD) * 100;
      if (gasRatio > 5) score -= (gasRatio - 5) * 4;
      else if (gasRatio > 1) score -= gasRatio * 2;
    }

    if (params.slippagePercent > 1.0) {
      score -= (params.slippagePercent - 1.0) * 5;
    }

    if (params.hasBridgeStep) {
      score -= 3;
    }

    return Math.max(10, Math.min(100, Math.round(score)));
  }

  public calculateMinimumReceived(
    amountOutRaw: string,
    slippageTolerancePercent: number
  ): string {
    const rawBig = BigInt(amountOutRaw);
    const slippageBps = BigInt(Math.round(slippageTolerancePercent * 100));
    const minReceivedBig = (rawBig * (10000n - slippageBps)) / 10000n;
    return minReceivedBig.toString();
  }

  public calculateMaximumInput(
    amountInRaw: string,
    slippageTolerancePercent: number
  ): string {
    const rawBig = BigInt(amountInRaw);
    const slippageBps = BigInt(Math.round(slippageTolerancePercent * 100));
    const maxInputBig = (rawBig * (10000n + slippageBps)) / 10000n;
    return maxInputBig.toString();
  }
}

export const defaultScoringService = new ScoringService();
