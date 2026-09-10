import React from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import {
  X,
  ShieldCheck,
  Zap,
  ArrowDown,
  Lock,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export const ConfirmSheet: React.FC = () => {
  const {
    isConfirmSheetOpen,
    closeConfirmSheet,
    quote,
    sourceChain,
    destChain,
    tokenIn,
    tokenOut,
    amountIn,
    slippageTolerancePercent,
    mevProtection,
    executionStatus,
    executionSteps,
    executeTrade
  } = useZenithStore();

  if (!isConfirmSheetOpen || !quote) return null;

  const isExecuting = executionStatus !== 'IDLE' && executionStatus !== 'COMPLETED' && executionStatus !== 'FAILED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-modal overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Review & Confirm Swap</h3>
              <p className="text-xs text-slate-400">Non-custodial pre-flight verification</p>
            </div>
          </div>

          {!isExecuting && (
            <button
              onClick={closeConfirmSheet}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="bg-[#0B111E] rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">You Pay</p>
                <p className="text-xl font-bold font-mono text-white">
                  {amountIn} {tokenIn.symbol}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-7 h-7 rounded-full" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {sourceChain.shortName}
                </span>
              </div>
            </div>

            <div className="flex justify-center -my-1">
              <ArrowDown className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">You Receive (Estimated)</p>
                <p className="text-xl font-bold font-mono text-emerald-400">
                  {quote.amountOutFormatted} {tokenOut.symbol}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-7 h-7 rounded-full" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {destChain.shortName}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Minimum Received</span>
              <span className="font-mono font-semibold text-white">
                {quote.minimumReceivedFormatted} {tokenOut.symbol} ({slippageTolerancePercent}% slip)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Price Impact</span>
              <span
                className={`font-mono font-semibold ${
                  quote.priceImpact.level === 'CRITICAL' || quote.priceImpact.level === 'HIGH'
                    ? 'text-red-400'
                    : quote.priceImpact.level === 'MEDIUM'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {quote.priceImpact.percentage}% ({quote.priceImpact.level})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network Gas Fee ({sourceChain.shortName})</span>
              <span className="font-mono text-emerald-400 font-semibold">
                ~${quote.bestRoute.gasCostUSD < 0.01 ? quote.bestRoute.gasCostUSD.toFixed(4) : quote.bestRoute.gasCostUSD.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">MEV Protection</span>
              <span className="font-mono text-cyan-400 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />
                Enabled (Private Relay)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Execution Score</span>
              <span className="font-mono font-bold text-emerald-400">
                {quote.effectiveExecutionScore}/100
              </span>
            </div>
          </div>

          {executionSteps.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl bg-[#0B111E] border border-cyan-500/30">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                Live Transaction Progress
              </h4>
              <div className="space-y-2">
                {executionSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {step.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : step.status === 'ACTIVE' ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                      <span className={step.status === 'ACTIVE' ? 'font-bold text-white' : 'text-slate-400'}>
                        {step.title}
                      </span>
                    </div>
                    {step.txHash && (
                      <span className="font-mono text-[10px] text-cyan-400">
                        {step.txHash.slice(0, 8)}...{step.txHash.slice(-6)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 bg-[#0B111E]/50">
          <button
            onClick={executeTrade}
            disabled={isExecuting}
            className="w-full py-3.5 rounded-xl gradient-brand text-slate-950 font-display font-extrabold text-base tracking-wide shadow-glow-cyan hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing Trade ({executionStatus})...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-950" />
                Confirm & Sign Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
