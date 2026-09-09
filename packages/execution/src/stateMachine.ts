import { ExecutionStep, ReceiptView, TransactionStatus } from '@zenith/types';

export type StateChangeCallback = (status: TransactionStatus, steps: ExecutionStep[]) => void;

export class ExecutionStateMachine {
  private currentStatus: TransactionStatus = 'IDLE';
  private steps: ExecutionStep[] = [];
  private listeners: Set<StateChangeCallback> = new Set();
  private lastReceipt?: ReceiptView;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentStatus = 'IDLE';
    this.steps = [];
    this.lastReceipt = undefined;
    this.notify();
  }

  public getStatus(): TransactionStatus {
    return this.currentStatus;
  }

  public getSteps(): ExecutionStep[] {
    return [...this.steps];
  }

  public getReceipt(): ReceiptView | undefined {
    return this.lastReceipt;
  }

  public setReceipt(receipt: ReceiptView): void {
    this.lastReceipt = receipt;
  }

  public subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentStatus, this.steps);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public transitionTo(
    newStatus: TransactionStatus,
    stepUpdate?: { id: string; status: ExecutionStep['status']; txHash?: string; error?: string }
  ): void {
    this.currentStatus = newStatus;

    if (stepUpdate) {
      const stepIdx = this.steps.findIndex((s) => s.id === stepUpdate.id);
      if (stepIdx >= 0) {
        this.steps[stepIdx] = {
          ...this.steps[stepIdx],
          status: stepUpdate.status,
          txHash: stepUpdate.txHash || this.steps[stepIdx].txHash,
          error: stepUpdate.error,
          timestamp: Date.now()
        };
      }
    }

    this.notify();
  }

  public initializeSteps(steps: ExecutionStep[]): void {
    this.steps = [...steps];
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentStatus, [...this.steps]);
      } catch (err) {
        console.error('[ExecutionStateMachine] Listener error:', err);
      }
    });
  }
}
