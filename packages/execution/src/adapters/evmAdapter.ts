import { QuoteResponse, TransactionStatus } from '@zenith/types';

export interface EVMExecutionParams {
  quote: QuoteResponse;
  userAddress: string;
  onStatusChange?: (status: TransactionStatus, txHash?: string) => void;
}

export interface EVMExecutionResult {
  isSuccess: boolean;
  txHash: string;
  blockNumber: number;
  gasUsed: bigint;
  effectiveGasPriceWei: bigint;
  revertReason?: string;
}

export class EVMExecutionAdapter {
  public async checkAllowance(params: {
    tokenAddress: string;
    ownerAddress: string;
    spenderAddress: string;
  }): Promise<bigint> {
    if (params.tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    }
    return 0n;
  }

  public async executeSwap(params: EVMExecutionParams): Promise<EVMExecutionResult> {
    params.onStatusChange?.('SIGNING');
    await new Promise((resolve) => setTimeout(resolve, 800));

    params.onStatusChange?.('SUBMITTING');
    await new Promise((resolve) => setTimeout(resolve, 600));

    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    params.onStatusChange?.('BROADCASTED', mockTxHash);

    params.onStatusChange?.('CONFIRMING', mockTxHash);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    params.onStatusChange?.('COMPLETED', mockTxHash);

    return {
      isSuccess: true,
      txHash: mockTxHash,
      blockNumber: 19842100,
      gasUsed: 142000n,
      effectiveGasPriceWei: 18000000000n
    };
  }
}

export const defaultEVMAdapter = new EVMExecutionAdapter();
