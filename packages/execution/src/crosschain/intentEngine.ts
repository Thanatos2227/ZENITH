import { CrossChainIntent, SettlementState, SolverFillQuote } from '@zenith/types';

export interface SolverProfile {
  id: string;
  name: string;
  reputationScore: number;
  avgFillTimeSec: number;
  availableLiquidityUSD: number;
  isActive: boolean;
}

export class CrossChainIntentEngine {
  private solvers: SolverProfile[] = [
    {
      id: 'solver-zenith-alpha',
      name: 'ZENITH Stargate Fast Relayer',
      reputationScore: 99,
      avgFillTimeSec: 4,
      availableLiquidityUSD: 25000000,
      isActive: true
    },
    {
      id: 'solver-across-mm',
      name: 'Across Intent MM',
      reputationScore: 98,
      avgFillTimeSec: 6,
      availableLiquidityUSD: 18000000,
      isActive: true
    },
    {
      id: 'solver-dln-debridge',
      name: 'deBridge DLN Solver',
      reputationScore: 96,
      avgFillTimeSec: 8,
      availableLiquidityUSD: 12000000,
      isActive: true
    }
  ];

  private intentStore: Map<string, CrossChainIntent> = new Map();
  private processedNonces: Set<string> = new Set();

  public async getCompetitiveQuotes(intent: CrossChainIntent): Promise<SolverFillQuote[]> {
    const rawDestAmount = BigInt(intent.minDestinationAmountRaw);
    const tokenOutDecimals = intent.destinationToken.decimals || 18;

    return this.solvers
      .filter((s) => s.isActive)
      .map((solver) => {

        const bonusBps = solver.id === 'solver-zenith-alpha' ? 3n : 1n;
        const adjustedAmountBig = rawDestAmount + (rawDestAmount * bonusBps / 10000n);
        const formatted = (Number(adjustedAmountBig) / 10 ** tokenOutDecimals).toLocaleString(undefined, { maximumFractionDigits: 6 });

        return {
          solverId: solver.id,
          solverName: solver.name,
          destinationAmountRaw: adjustedAmountBig.toString(),
          destinationAmountFormatted: formatted,
          estimatedTimeSec: solver.avgFillTimeSec,
          executionCostUSD: 0.15,
          solverReputationScore: solver.reputationScore,
          isGuaranteed: true
        };
      })
      .sort((a, b) => b.solverReputationScore - a.solverReputationScore);
  }

  public registerIntent(intent: CrossChainIntent): void {
    const nonceKey = `${intent.recipient.toLowerCase()}:${intent.nonce}`;
    if (this.processedNonces.has(nonceKey)) {
      throw new Error(`[CrossChainIntentEngine] Nonce replay detected for ${intent.recipient} (nonce: ${intent.nonce})`);
    }

    if (Date.now() > intent.deadline) {
      throw new Error(`[CrossChainIntentEngine] Intent expired at ${new Date(intent.deadline).toISOString()}`);
    }

    this.processedNonces.add(nonceKey);
    this.intentStore.set(intent.orderId, { ...intent, status: 'CREATED' });
  }

  public updateIntentState(
    orderId: string,
    newState: SettlementState,
    meta?: { solverId?: string; txHashSource?: string; txHashDestination?: string }
  ): CrossChainIntent {
    const existing = this.intentStore.get(orderId);
    if (!existing) {
      throw new Error(`[CrossChainIntentEngine] Intent ${orderId} not found`);
    }

    this.validateStateTransition(existing.status, newState);

    const updated: CrossChainIntent = {
      ...existing,
      status: newState,
      solverId: meta?.solverId || existing.solverId,
      txHashSource: meta?.txHashSource || existing.txHashSource,
      txHashDestination: meta?.txHashDestination || existing.txHashDestination
    };

    this.intentStore.set(orderId, updated);
    return updated;
  }

  public processRefund(orderId: string, reason: string): CrossChainIntent {
    const intent = this.intentStore.get(orderId);
    if (!intent) {
      throw new Error(`[CrossChainIntentEngine] Intent ${orderId} not found`);
    }

    if (intent.status === 'SETTLED' || intent.status === 'REFUNDED') {
      throw new Error(`[CrossChainIntentEngine] Cannot refund already finalized intent (${intent.status})`);
    }

    this.updateIntentState(orderId, 'REFUND_PENDING');

    const finalized = this.updateIntentState(orderId, 'REFUNDED');
    console.warn(`[CrossChainIntentEngine] Refunded ${orderId}. Reason: ${reason}`);
    return finalized;
  }

  public getIntent(orderId: string): CrossChainIntent | undefined {
    return this.intentStore.get(orderId);
  }

  private validateStateTransition(current: SettlementState, next: SettlementState): void {
    const allowedTransitions: Record<SettlementState, SettlementState[]> = {
      CREATED: ['SIGNED', 'CANCELLED', 'EXPIRED'],
      SIGNED: ['SUBMITTED', 'CANCELLED', 'EXPIRED'],
      SUBMITTED: ['ACCEPTED', 'REJECTED', 'FAILED', 'EXPIRED'],
      ACCEPTED: ['FULFILLING', 'FAILED', 'REFUND_PENDING'],
      FULFILLING: ['DESTINATION_FILLED', 'FAILED', 'REFUND_PENDING'],
      DESTINATION_FILLED: ['VERIFIED', 'FAILED', 'REFUND_PENDING'],
      VERIFIED: ['SETTLING', 'FAILED', 'REFUND_PENDING'],
      SETTLING: ['SETTLED', 'FAILED', 'REFUND_PENDING'],
      SETTLED: [],
      EXPIRED: ['REFUND_PENDING', 'REFUNDED'],
      CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
      REJECTED: ['REFUND_PENDING', 'REFUNDED'],
      FAILED: ['REFUND_PENDING', 'REFUNDED'],
      REFUND_PENDING: ['REFUNDED'],
      REFUNDED: []
    };

    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new Error(`[CrossChainIntentEngine] Invalid state transition from ${current} to ${next}`);
    }
  }
}

export const defaultIntentEngine = new CrossChainIntentEngine();
