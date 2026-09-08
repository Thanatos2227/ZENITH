import React from 'react';
import { useZenithStore } from '../../stores/useZenithStore';
import {
  Zap,
  TrendingUp,
  PieChart,
  History,
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Wallet
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    sourceChain,
    openChainPicker,
    isWalletConnected,
    walletAddress,
    connectedWalletName,
    openWalletModal,
    notifications,
    toggleNotificationDrawer
  } = useZenithStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080B11]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div
            onClick={() => setActiveTab('TRADE')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow-cyan">
              <Zap className="w-6 h-6 text-slate-950 fill-slate-950 transform group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl tracking-wider text-white">
                  ZENITH
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  v4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5">
                Trade Beyond Limits
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('TRADE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'TRADE'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Zap className="w-4 h-4" />
              Trade
            </button>

            <button
              onClick={() => setActiveTab('MARKETS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'MARKETS'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Markets
            </button>

            <button
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'PORTFOLIO'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Portfolio
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'HISTORY'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>

            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'SETTINGS'
                  ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openChainPicker('SOURCE')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-sm font-medium text-slate-200"
          >
            <img
              src={sourceChain.iconURI}
              alt={sourceChain.shortName}
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
              }}
            />
            <span className="hidden sm:inline">{sourceChain.shortName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={toggleNotificationDrawer}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-yellow-400 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isWalletConnected ? (
            <button
              onClick={openWalletModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 font-mono text-sm font-semibold transition-all shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{connectedWalletName ? `${connectedWalletName}: ` : ''}{walletAddress}</span>
            </button>
          ) : (
            <button
              onClick={openWalletModal}
              className="gradient-brand text-slate-950 px-4 py-1.5 rounded-lg font-bold text-sm shadow-glow-cyan hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
