import { PriceImpact, ProtocolFee, Token } from '@zenith/types';
import { MAX_SWAP_AMOUNT_NUM } from './amountValidation';

export class ScoringService {
  private static PROTOCOL_FEE_BPS = 5;
  private static TREASURY_ADDRESS = '0x739B5579C5d617534803d5129F9563B30E42e3a8';

  /**
   * Calculates realized price impact percentage from execution price deviation relative to reference market price.
   *
   * Crucially, price impact measures ONLY execution price degradation against the pool curve/liquidity depth.
   * It must NOT conflate or include:
   * - Platform/protocol fees
   * - DEX/LP swap fees
   * - Network gas costs
   * - Cross-chain bridge fees
   *
   * Preferred formula:
   * netAmountInSwapped = amountInNum * (1 - feeBpsTotal / 10000)
   * poolExecutionPrice = amountOutExpectedNum / netAmountInSwapped
   * referencePrice = pre-trade reference market price (tokenOut per tokenIn)
   * priceImpact = max(0, (1 - poolExecutionPrice / referencePrice) * 100)
   *
   * Edge cases handled safely:
   * - If an authoritative directPriceImpact is provided by the DEX/aggregator, use it directly.
   * - If referencePrice or token prices are unavailable, safely return 0% (NEGLIGIBLE) without inventing prices.
   * - If amounts are 0 or negative, return 0% (NEGLIGIBLE).
   * - Guard against NaN and Infinity.
   */
  public calculatePriceImpact(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountInNum: number;
    amountOutExpectedNum: number;
    referencePrice?: number;
    feeBpsTotal?: number;
    directPriceImpact?: number;
  }): PriceImpact {

    if (params.directPriceImpact !== undefined && !isNaN(params.directPriceImpact) && isFinite(params.directPriceImpact)) {
      const percentage = Number(Math.min(100, Math.max(0, params.directPriceImpact)).toFixed(3));
      return this.formatPriceImpactResponse(percentage);
    }


    if (params.amountInNum <= 0 || params.amountOutExpectedNum <= 0) {
      return { percentage: 0, level: 'NEGLIGIBLE' };
    }


    let refPrice = params.referencePrice;
    if (!refPrice || refPrice <= 0) {
      if (params.tokenIn.priceUSD && params.tokenOut.priceUSD && params.tokenIn.priceUSD > 0 && params.tokenOut.priceUSD > 0) {
        refPrice = params.tokenIn.priceUSD / params.tokenOut.priceUSD;
      }
    }


    if (!refPrice || refPrice <= 0 || isNaN(refPrice) || !isFinite(refPrice)) {
      return { percentage: 0, level: 'NEGLIGIBLE' };
    }


    const feeBps = Math.max(0, params.feeBpsTotal ?? 0);
    const netAmountInSwapped = params.amountInNum * (1 - feeBps / 10000);

    if (netAmountInSwapped <= 0) {
      return { percentage: 0, level: 'NEGLIGIBLE' };
    }


    const executionPrice = params.amountOutExpectedNum / netAmountInSwapped;

    if (executionPrice <= 0 || isNaN(executionPrice) || !isFinite(executionPrice)) {
      return { percentage: 0, level: 'NEGLIGIBLE' };
    }


    const rawImpact = Math.max(0, (1 - (executionPrice / refPrice)) * 100);
    const percentage = Number(Math.min(100, isNaN(rawImpact) || !isFinite(rawImpact) ? 0 : rawImpact).toFixed(3));

    return this.formatPriceImpactResponse(percentage);
  }

  private formatPriceImpactResponse(percentage: number): PriceImpact {
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
