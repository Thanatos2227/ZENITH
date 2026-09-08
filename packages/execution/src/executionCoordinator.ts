import { defaultChainRegistry } from '@zenith/chains';
import { ExecutionStep, QuoteResponse, ReceiptView } from '@zenith/types';
import { defaultEVMAdapter, EVMExecutionAdapter } from './adapters/evmAdapter';
import { defaultSolanaAdapter, SolanaExecutionAdapter } from './adapters/solanaAdapter';
import { ExecutionStateMachine } from './stateMachine';

export class ExecutionCoordinator {
  private evmAdapter: EVMExecutionAdapter;
  private solanaAdapter: SolanaExecutionAdapter;

  constructor(
    evmAdapter = defaultEVMAdapter,
    solanaAdapter = defaultSolanaAdapter
  ) {
    this.evmAdapter = evmAdapter;
    this.solanaAdapter = solanaAdapter;
  }

  public async executeTrade(params: {
    quote: QuoteResponse;
    userAddress: string;
    stateMachine: ExecutionStateMachine;
  }): Promise<ReceiptView> {
    const isCrossChain = params.quote.request.sourceChainId !== params.quote.request.destinationChainId;
    const sourceChain = defaultChainRegistry.getChain(params.quote.request.sourceChainId);
    const destChain = defaultChainRegistry.getChain(params.quote.request.destinationChainId);

    if (!sourceChain || !destChain) {
      throw new Error('[ExecutionCoordinator] Source or destination chain config not found in registry');
    }

    const steps: ExecutionStep[] = [];

    if (!params.quote.request.tokenIn.isNative && sourceChain.executionEnvironment === 'EVM') {
      steps.push({
        id: 'step-approve',
        title: `Approve ${params.quote.request.tokenIn.symbol}`,
        description: 'Authorize router contract to spend tokens',
        status: 'PENDING'
      });
    }

    steps.push({
      id: 'step-execute',
      title: isCrossChain ? 'Initiate Cross-Chain Bridge Swap' : 'Execute Swap',
      description: `Swap ${params.quote.amountInFormatted} ${params.quote.request.tokenIn.symbol} for ${params.quote.request.tokenOut.symbol}`,
      status: 'PENDING'
    });

    if (isCrossChain) {
      steps.push({
        id: 'step-bridge',
        title: 'Bridge Confirmation',
        description: `Relaying assets to ${destChain.shortName}`,
        status: 'PENDING'
      });
    }

    params.stateMachine.initializeSteps(steps);

    if (steps.some((s) => s.id === 'step-approve')) {
      params.stateMachine.transitionTo('APPROVING', { id: 'step-approve', status: 'ACTIVE' });
      await new Promise((r) => setTimeout(r, 700));
      params.stateMachine.transitionTo('APPROVED', { id: 'step-approve', status: 'SUCCESS' });
    }

    params.stateMachine.transitionTo('SIGNING', { id: 'step-execute', status: 'ACTIVE' });

    let txHash = '';
    if (sourceChain.executionEnvironment === 'SOLANA') {
      const result = await this.solanaAdapter.executeSwap({
        quote: params.quote,
        userPublicKey: params.userAddress,
        onStatusChange: (status, signature) => {
          if (signature) txHash = signature;
          params.stateMachine.transitionTo(status, { id: 'step-execute', status: 'ACTIVE', txHash: signature });
        }
      });
      txHash = result.txSignature;
    } else {
      const result = await this.evmAdapter.executeSwap({
        quote: params.quote,
        userAddress: params.userAddress,
        onStatusChange: (status, hash) => {
          if (hash) txHash = hash;
          params.stateMachine.transitionTo(status, { id: 'step-execute', status: 'ACTIVE', txHash: hash });
        }
      });
      txHash = result.txHash;
    }

    params.stateMachine.transitionTo('CONFIRMING', { id: 'step-execute', status: 'SUCCESS', txHash });

    if (isCrossChain) {
      params.stateMachine.transitionTo('BRIDGE_IN_FLIGHT', { id: 'step-bridge', status: 'ACTIVE' });
      await new Promise((r) => setTimeout(r, 1200));
      params.stateMachine.transitionTo('BRIDGE_DESTINATION_CONFIRMED', { id: 'step-bridge', status: 'SUCCESS' });
    }

    params.stateMachine.transitionTo('COMPLETED');

    const explorerUrl = defaultChainRegistry.getExplorerTxUrl(sourceChain.id, txHash);
    const amountOutNum = Number(params.quote.amountOutFormatted.replace(/,/g, ''));
    const amountOutUSD = params.quote.request.tokenOut.priceUSD ? amountOutNum * params.quote.request.tokenOut.priceUSD : undefined;

    const receipt: ReceiptView = {
      txHash,
      sourceChain,
      destinationChain: destChain,
      tokenIn: params.quote.request.tokenIn,
      tokenOut: params.quote.request.tokenOut,
      amountInFormatted: params.quote.amountInFormatted,
      amountOutFormatted: params.quote.amountOutFormatted,
      amountOutUSD,
      realizedPriceImpactPercent: params.quote.priceImpact.percentage,
      realizedSlippagePercent: 0.04,
      gasPaidUSD: params.quote.bestRoute.gasCostUSD,
      protocolFeePaidUSD: params.quote.protocolFee.feeUSD,
      effectiveExecutionScore: params.quote.effectiveExecutionScore,
      timestamp: Date.now(),
      status: 'COMPLETED',
      explorerUrl,
      routeSummary: isCrossChain
        ? `Swapped via ${params.quote.bestRoute.bridgeStep?.bridgeProtocol} Bridge`
        : `Swapped via ${params.quote.bestRoute.hops.map((h) => h.dexProtocol).join(' + ')}`
    };

    params.stateMachine.setReceipt(receipt);
    return receipt;
  }
}

export const defaultExecutionCoordinator = new ExecutionCoordinator();
