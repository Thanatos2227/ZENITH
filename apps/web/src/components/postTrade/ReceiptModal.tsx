import React from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import {
  CheckCircle2,
  ExternalLink,
  X
} from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { isReceiptOpen, closeReceipt, lastReceipt } = useZenithStore();

  if (!isReceiptOpen || !lastReceipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-emerald-500/40 shadow-glow-emerald overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Execution Receipt</h3>
              <p className="text-xs text-slate-400">Transaction Confirmed On-Chain</p>
            </div>
          </div>
          <button
            onClick={closeReceipt}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800 text-center space-y-1">
            <p className="text-xs text-slate-400">Successfully Swapped</p>
            <p className="text-xl font-bold font-mono text-white">
              {lastReceipt.amountInFormatted} {lastReceipt.tokenIn.symbol}
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <span>into</span>
              <span className="font-bold text-emerald-400 font-mono">
                {lastReceipt.amountOutFormatted} {lastReceipt.tokenOut.symbol}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Transaction Hash</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {lastReceipt.txHash.slice(0, 10)}...{lastReceipt.txHash.slice(-8)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Execution Score</span>
              <span className="font-mono font-bold text-emerald-400">
                {lastReceipt.effectiveExecutionScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Realized Price Impact</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {lastReceipt.realizedPriceImpactPercent}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gas Paid ({lastReceipt.sourceChain.shortName})</span>
              <span className="font-mono text-emerald-400 font-semibold">
                ${lastReceipt.gasPaidUSD < 0.01 ? lastReceipt.gasPaidUSD.toFixed(4) : lastReceipt.gasPaidUSD.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Route Execution</span>
              <span className="font-mono text-slate-300">{lastReceipt.routeSummary}</span>
            </div>
          </div>

          <a
            href={lastReceipt.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            View on {lastReceipt.sourceChain.explorer.name}
          </a>
        </div>
      </div>
    </div>
  );
};
