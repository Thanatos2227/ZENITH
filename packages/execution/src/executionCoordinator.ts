import { defaultChainRegistry } from '@zenith/chains';
import { ExecutionStep, QuoteResponse, ReceiptView } from '@zenith/types';
import { defaultEVMAdapter, EVMExecutionAdapter } from './adapters/evmAdapter';
import { defaultSolanaAdapter, SolanaExecutionAdapter } from './adapters/solanaAdapter';
import { ExecutionStateMachine } from './stateMachine';
import { defaultIntentEngine, CrossChainIntentEngine } from './crosschain/intentEngine';

export class ExecutionCoordinator {
  private evmAdapter: EVMExecutionAdapter;
  private solanaAdapter: SolanaExecutionAdapter;
  private intentEngine: CrossChainIntentEngine;

  constructor(
    evmAdapter = defaultEVMAdapter,
    solanaAdapter = defaultSolanaAdapter,
    intentEngine = defaultIntentEngine
  ) {
    this.evmAdapter = evmAdapter;
    this.solanaAdapter = solanaAdapter;
    this.intentEngine = intentEngine;
  }

  public async executeTrade(params: {
    quote: QuoteResponse;
    userAddress: string;
    stateMachine: ExecutionStateMachine;
    signer?: any;
    provider?: any;
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
      title: isCrossChain ? 'Initiate Cross-Chain Intent Swap' : (params.quote.tradeType === 'EXACT_OUTPUT' ? 'Execute Exact-Output Swap' : 'Execute Swap'),
      description: `Swap ${params.quote.amountInFormatted} ${params.quote.request.tokenIn.symbol} for ${params.quote.amountOutFormatted} ${params.quote.request.tokenOut.symbol}`,
      status: 'PENDING'
    });

    if (isCrossChain) {
      steps.push({
        id: 'step-intent-fulfill',
        title: 'Solver Intent Fulfillment',
        description: `Filler settling assets on ${destChain.shortName}`,
        status: 'PENDING'
      });
    }

    params.stateMachine.initializeSteps(steps);

    let txHash = '';

    if (isCrossChain && params.quote.intent) {
      this.intentEngine.registerIntent(params.quote.intent);
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'SIGNED');
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'SUBMITTED');
    }

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
        signer: params.signer,
        provider: params.provider,
        onStatusChange: (status, hash) => {
          if (hash) txHash = hash;
          if (status === 'APPROVING') {
            params.stateMachine.transitionTo('APPROVING', { id: 'step-approve', status: 'ACTIVE' });
          } else if (status === 'APPROVED') {
            params.stateMachine.transitionTo('APPROVED', { id: 'step-approve', status: 'SUCCESS' });
          } else if (status === 'SIGNING') {
            params.stateMachine.transitionTo('SIGNING', { id: 'step-execute', status: 'ACTIVE' });
          } else if (status === 'SUBMITTING' || status === 'BROADCASTED') {
            params.stateMachine.transitionTo(status, { id: 'step-execute', status: 'ACTIVE', txHash: hash });
          } else if (status === 'CONFIRMING') {
            params.stateMachine.transitionTo('CONFIRMING', { id: 'step-execute', status: 'ACTIVE', txHash: hash });
          } else if (status === 'COMPLETED') {
            params.stateMachine.transitionTo('COMPLETED', { id: 'step-execute', status: 'SUCCESS', txHash: hash });
          }
        }
      });
      txHash = result.txHash;
    }

    params.stateMachine.transitionTo('CONFIRMING', { id: 'step-execute', status: 'SUCCESS', txHash });

    if (isCrossChain && params.quote.intent) {
      params.stateMachine.transitionTo('BRIDGE_IN_FLIGHT', { id: 'step-intent-fulfill', status: 'ACTIVE' });
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'ACCEPTED', { txHashSource: txHash });
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'FULFILLING');

      await new Promise((r) => setTimeout(r, 600));

      const destTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'DESTINATION_FILLED', { txHashDestination: destTxHash });
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'VERIFIED');
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'SETTLING');
      this.intentEngine.updateIntentState(params.quote.intent.orderId, 'SETTLED');

      params.stateMachine.transitionTo('BRIDGE_DESTINATION_CONFIRMED', {
        id: 'step-intent-fulfill',
        status: 'SUCCESS',
        txHash: destTxHash
      });
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
        ? `Cross-chain fill via ${params.quote.intent?.solverId || 'ZENITH Stargate Relayer'}`
        : `Swapped via ${params.quote.bestRoute.hops.map((h) => h.dexProtocol).join(' + ')}`
    };

    params.stateMachine.setReceipt(receipt);
    return receipt;
  }
}

export const defaultExecutionCoordinator = new ExecutionCoordinator();
