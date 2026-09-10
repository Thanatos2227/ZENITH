import { QuoteResponse, TransactionStatus } from '@zenith/types';

export interface SolanaExecutionParams {
  quote: QuoteResponse;
  userPublicKey: string;
  onStatusChange?: (status: TransactionStatus, txSignature?: string) => void;
}

export interface SolanaExecutionResult {
  isSuccess: boolean;
  txSignature: string;
  slot: number;
  computeUnitsUsed: number;
  priorityFeeLamports: number;
  revertReason?: string;
}

export class SolanaExecutionAdapter {
  public async checkAssociatedTokenAccount(_params: {
    walletPublicKey: string;
    tokenMintAddress: string;
  }): Promise<boolean> {
    return true;
  }

  public async executeSwap(params: SolanaExecutionParams): Promise<SolanaExecutionResult> {
    params.onStatusChange?.('SIGNING');
    await new Promise((resolve) => setTimeout(resolve, 600));

    params.onStatusChange?.('SUBMITTING');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockSignature = Array.from({ length: 88 }, () =>
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]
    ).join('');

    params.onStatusChange?.('BROADCASTED', mockSignature);
    params.onStatusChange?.('CONFIRMING', mockSignature);
    await new Promise((resolve) => setTimeout(resolve, 800));

    params.onStatusChange?.('COMPLETED', mockSignature);

    return {
      isSuccess: true,
      txSignature: mockSignature,
      slot: 284910200,
      computeUnitsUsed: 78000,
      priorityFeeLamports: 10000
    };
  }
}

export const defaultSolanaAdapter = new SolanaExecutionAdapter();
