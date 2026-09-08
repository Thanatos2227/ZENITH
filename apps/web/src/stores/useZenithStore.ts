import { create } from 'zustand';
import {
  ChainConfig,
  ExecutionStep,
  GasPreset,
  MEVProtectionLevel,
  QuoteResponse,
  ReceiptView,
  SlippagePreset,
  Token,
  TransactionStatus,
  WalletType,
  ZenithNotification
} from '@zenith/types';
import { defaultChainRegistry, ZENITH_SUPPORTED_CHAINS } from '@zenith/chains';
import { DEFAULT_TOKENS, defaultTokenService } from '@zenith/tokens';
import { defaultZenithRouter } from '@zenith/routing';
import { defaultExecutionCoordinator, ExecutionStateMachine } from '@zenith/execution';
import { connectToWalletProvider } from '../utils/walletDetector';

export interface ZenithState {
  activeTab: 'TRADE' | 'MARKETS' | 'PORTFOLIO' | 'HISTORY' | 'SETTINGS';
  isProMode: boolean;
  theme: 'dark' | 'light';

  sourceChain: ChainConfig;
  destChain: ChainConfig;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;

  slippagePreset: SlippagePreset;
  slippageTolerancePercent: number;
  gasPreset: GasPreset;
  mevProtection: MEVProtectionLevel;

  isWalletConnected: boolean;
  isWalletConnecting: boolean;
  walletAddress: string;
  connectedWalletName: string;
  walletBalances: Record<string, string>;

  quote: QuoteResponse | null;
  isQuoteLoading: boolean;
  quoteCountdown: number;
  quoteError: string | null;

  isConfirmSheetOpen: boolean;
  isReceiptOpen: boolean;
  isTokenPickerOpen: boolean;
  tokenPickerTarget: 'IN' | 'OUT';
  isChainPickerOpen: boolean;
  chainPickerTarget: 'SOURCE' | 'DEST';
  isNotificationDrawerOpen: boolean;
  isWalletModalOpen: boolean;

  executionStatus: TransactionStatus;
  executionSteps: ExecutionStep[];
  lastReceipt: ReceiptView | null;

  transactionHistory: ReceiptView[];
  notifications: ZenithNotification[];

  setActiveTab: (tab: ZenithState['activeTab']) => void;
  setProMode: (pro: boolean) => void;
  toggleTheme: () => void;
  setSourceChain: (chain: ChainConfig) => void;
  setDestChain: (chain: ChainConfig) => void;
  setTokenIn: (token: Token) => void;
  setTokenOut: (token: Token) => void;
  switchTokens: () => void;
  setAmountIn: (amount: string) => void;
  setSlippage: (preset: SlippagePreset, customPercent?: number) => void;
  setGasPreset: (preset: GasPreset) => void;
  setMEVProtection: (level: MEVProtectionLevel) => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWalletWithType: (walletType: WalletType) => Promise<void>;
  connectWallet: () => void;
  disconnectWallet: () => void;
  openTokenPicker: (target: 'IN' | 'OUT') => void;
  closeTokenPicker: () => void;
  openChainPicker: (target: 'SOURCE' | 'DEST') => void;
  closeChainPicker: () => void;
  openConfirmSheet: () => void;
  closeConfirmSheet: () => void;
  closeReceipt: () => void;
  toggleNotificationDrawer: () => void;
  fetchQuote: () => Promise<void>;
  executeTrade: () => Promise<void>;
  addNotification: (notification: Omit<ZenithNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationsAsRead: () => void;
}

const defaultEthChain = ZENITH_SUPPORTED_CHAINS.ethereum;
const defaultEthToken = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.isNative) || DEFAULT_TOKENS[0];
const defaultUsdcToken = DEFAULT_TOKENS.find((t) => t.chainId === 'ethereum' && t.symbol === 'USDC') || DEFAULT_TOKENS[1];

const executionSM = new ExecutionStateMachine();

export const useZenithStore = create<ZenithState>((set, get) => {
  executionSM.subscribe((status, steps) => {
    set({
      executionStatus: status,
      executionSteps: steps,
      lastReceipt: executionSM.getReceipt() || null
    });
  });

  return {
    activeTab: 'TRADE',
    isProMode: true,
    theme: 'dark',

    sourceChain: defaultEthChain,
    destChain: defaultEthChain,
    tokenIn: defaultEthToken,
    tokenOut: defaultUsdcToken,
    amountIn: '1.0',

    slippagePreset: 'AUTO',
    slippageTolerancePercent: 0.5,
    gasPreset: 'FAST',
    mevProtection: 'FLASHBOTS_PRIVATE',

    isWalletConnected: false,
    isWalletConnecting: false,
    walletAddress: '',
    connectedWalletName: '',
    walletBalances: {
      'ethereum:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '4.825',
      'ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '12450.00',
      'arbitrum:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '2.140',
      'solana:11111111111111111111111111111111': '18.45'
    },

    quote: null,
    isQuoteLoading: false,
    quoteCountdown: 10,
    quoteError: null,

    isConfirmSheetOpen: false,
    isReceiptOpen: false,
    isTokenPickerOpen: false,
    tokenPickerTarget: 'IN',
    isChainPickerOpen: false,
    chainPickerTarget: 'SOURCE',
    isNotificationDrawerOpen: false,
    isWalletModalOpen: false,

    executionStatus: 'IDLE',
    executionSteps: [],
    lastReceipt: null,

    transactionHistory: [],
    notifications: [
      {
        id: 'notif-1',
        title: 'Welcome to ZENITH v4',
        message: 'Connected to 21 target chains with MEV protection & simulation enabled.',
        type: 'INFO',
        timestamp: Date.now() - 1000 * 60 * 5,
        isRead: false
      }
    ],

    setActiveTab: (tab) => set({ activeTab: tab }),
    setProMode: (isProMode) => set({ isProMode }),
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      }
      set({ theme: nextTheme });
    },

    setSourceChain: (chain) => {
      const prevSource = get().sourceChain;
      const prevDest = get().destChain;
      const isSameChainTrade = prevSource.id === prevDest.id;

      const sourceTokens = defaultTokenService.getTokensForChain(chain.id);
      const newIn = defaultTokenService.getNativeToken(chain.id) || sourceTokens[0] || get().tokenIn;

      let nextDest = prevDest;
      let nextOut = get().tokenOut;

      if (isSameChainTrade) {
        nextDest = chain;
        const destTokens = defaultTokenService.getTokensForChain(chain.id);
        const stable = destTokens.find(
          (t) => (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI') && t.address !== newIn.address
        );
        nextOut =
          stable ||
          destTokens.find((t) => t.address !== newIn.address) ||
          destTokens[1] ||
          destTokens[0] ||
          newIn;
      } else {
        if (nextOut.chainId !== nextDest.id) {
          const destTokens = defaultTokenService.getTokensForChain(nextDest.id);
          const stable = destTokens.find((t) => t.symbol === 'USDC' || t.symbol === 'USDT');
          nextOut = stable || destTokens[0] || nextOut;
        }
      }

      set({
        sourceChain: chain,
        tokenIn: newIn,
        destChain: nextDest,
        tokenOut: nextOut
      });

      get().fetchQuote();
    },

    setDestChain: (chain) => {
      const currentIn = get().tokenIn;
      const isSameChain = get().sourceChain.id === chain.id;
      const destTokens = defaultTokenService.getTokensForChain(chain.id);

      let newOut = destTokens.find(
        (t) =>
          (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI') &&
          (!isSameChain || t.address !== currentIn.address)
      );

      if (!newOut) {
        newOut =
          destTokens.find((t) => !isSameChain || t.address !== currentIn.address) ||
          destTokens[1] ||
          destTokens[0] ||
          get().tokenOut;
      }

      set({ destChain: chain, tokenOut: newOut });
      get().fetchQuote();
    },

    setTokenIn: (token) => {
      const chain = defaultChainRegistry.getChain(token.chainId);
      const isSameChain = (chain ? chain.id : get().sourceChain.id) === get().destChain.id;
      let nextOut = get().tokenOut;

      if (isSameChain && token.address.toLowerCase() === nextOut.address.toLowerCase()) {
        const destTokens = defaultTokenService.getTokensForChain(token.chainId);
        const alt = destTokens.find((t) => t.address.toLowerCase() !== token.address.toLowerCase());
        if (alt) nextOut = alt;
      }

      if (chain && chain.id !== get().sourceChain.id) {
        set({ sourceChain: chain, tokenIn: token, tokenOut: nextOut });
      } else {
        set({ tokenIn: token, tokenOut: nextOut });
      }
      get().fetchQuote();
    },

    setTokenOut: (token) => {
      const chain = defaultChainRegistry.getChain(token.chainId);
      const isSameChain = get().sourceChain.id === (chain ? chain.id : get().destChain.id);
      let nextIn = get().tokenIn;

      if (isSameChain && token.address.toLowerCase() === nextIn.address.toLowerCase()) {
        const sourceTokens = defaultTokenService.getTokensForChain(token.chainId);
        const alt = sourceTokens.find((t) => t.address.toLowerCase() !== token.address.toLowerCase());
        if (alt) nextIn = alt;
      }

      if (chain && chain.id !== get().destChain.id) {
        set({ destChain: chain, tokenOut: token, tokenIn: nextIn });
      } else {
        set({ tokenOut: token, tokenIn: nextIn });
      }
      get().fetchQuote();
    },

    switchTokens: () => {
      const { tokenIn, tokenOut, sourceChain, destChain } = get();
      set({
        tokenIn: tokenOut,
        tokenOut: tokenIn,
        sourceChain: destChain,
        destChain: sourceChain
      });
      get().fetchQuote();
    },

    setAmountIn: (amountIn) => {
      set({ amountIn });
      get().fetchQuote();
    },

    setSlippage: (preset, customPercent) => {
      let percent = 0.5;
      if (preset === '0.1%') percent = 0.1;
      else if (preset === '0.5%') percent = 0.5;
      else if (preset === '1.0%') percent = 1.0;
      else if (preset === 'CUSTOM' && customPercent !== undefined) percent = customPercent;
      else if (preset === 'AUTO') percent = 0.5;

      set({ slippagePreset: preset, slippageTolerancePercent: percent });
      get().fetchQuote();
    },

    setGasPreset: (gasPreset) => set({ gasPreset }),
    setMEVProtection: (mevProtection) => set({ mevProtection }),

    openWalletModal: () => set({ isWalletModalOpen: true }),
    closeWalletModal: () => set({ isWalletModalOpen: false }),

    connectWalletWithType: async (walletType: WalletType) => {
      set({ isWalletConnecting: true });
      try {
        const { address, walletName } = await connectToWalletProvider(walletType);
        set({
          isWalletConnected: true,
          isWalletConnecting: false,
          walletAddress: address,
          connectedWalletName: walletName,
          isWalletModalOpen: false
        });
        get().addNotification({
          title: 'Wallet Connected',
          message: `Connected with ${walletName} (${address})`,
          type: 'SUCCESS'
        });
      } catch (err: any) {
        set({ isWalletConnecting: false });
        get().addNotification({
          title: 'Connection Failed',
          message: err.message || 'Could not connect to wallet',
          type: 'ERROR'
        });
      }
    },

    connectWallet: () => {
      set({ isWalletModalOpen: true });
    },

    disconnectWallet: () => {
      set({
        isWalletConnected: false,
        walletAddress: '',
        connectedWalletName: ''
      });
      get().addNotification({
        title: 'Wallet Disconnected',
        message: 'Wallet session ended',
        type: 'INFO'
      });
    },

    openTokenPicker: (target) => set({ isTokenPickerOpen: true, tokenPickerTarget: target }),
    closeTokenPicker: () => set({ isTokenPickerOpen: false }),

    openChainPicker: (target) => set({ isChainPickerOpen: true, chainPickerTarget: target }),
    closeChainPicker: () => set({ isChainPickerOpen: false }),

    openConfirmSheet: () => set({ isConfirmSheetOpen: true }),
    closeConfirmSheet: () => {
      const isExecuting = get().executionStatus !== 'IDLE' && get().executionStatus !== 'COMPLETED' && get().executionStatus !== 'FAILED';
      if (!isExecuting) {
        set({ isConfirmSheetOpen: false });
      }
    },
    closeReceipt: () => set({ isReceiptOpen: false }),

    toggleNotificationDrawer: () => set((state) => ({ isNotificationDrawerOpen: !state.isNotificationDrawerOpen })),

    fetchQuote: async () => {
      const { sourceChain, destChain, tokenIn, tokenOut, amountIn, slippageTolerancePercent, walletAddress, gasPreset } = get();
      const cleanAmount = amountIn.replace(/,/g, '').trim();
      const numAmount = parseFloat(cleanAmount);

      if (isNaN(numAmount) || numAmount <= 0) {
        set({ quote: null, quoteError: null, isQuoteLoading: false });
        return;
      }

      set({ isQuoteLoading: true, quoteError: null });

      try {
        const decimals = tokenIn.decimals || 18;
        const [wholePart = '0', fracPart = ''] = cleanAmount.split('.');
        const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
        const rawAmountIn = (wholePart + paddedFrac).replace(/^0+/, '') || '0';

        const quote = await defaultZenithRouter.getQuote({
          sourceChainId: sourceChain.id,
          destinationChainId: destChain.id,
          tokenIn,
          tokenOut,
          amountInRaw: rawAmountIn === '0' ? '1' : rawAmountIn,
          slippageTolerancePercent,
          userWalletAddress: walletAddress || undefined,
          gasPreset
        });

        set({
          quote,
          isQuoteLoading: false,
          quoteCountdown: quote.freshnessSeconds,
          quoteError: null
        });
      } catch (err: any) {
        set({
          quote: null,
          isQuoteLoading: false,
          quoteError: err.message || 'Failed to fetch executable quote'
        });
      }
    },

    executeTrade: async () => {
      const { quote, walletAddress, isWalletConnected, openWalletModal } = get();
      if (!quote) return;

      if (!isWalletConnected || !walletAddress) {
        openWalletModal();
        return;
      }

      try {
        const receipt = await defaultExecutionCoordinator.executeTrade({
          quote,
          userAddress: walletAddress,
          stateMachine: executionSM
        });

        set((state) => ({
          isConfirmSheetOpen: false,
          lastReceipt: receipt,
          isReceiptOpen: true,
          transactionHistory: [receipt, ...state.transactionHistory]
        }));

        get().addNotification({
          title: 'Trade Executed Successfully',
          message: `Swapped ${receipt.amountInFormatted} ${receipt.tokenIn.symbol} for ${receipt.amountOutFormatted} ${receipt.tokenOut.symbol}`,
          type: 'SUCCESS',
          txHash: receipt.txHash,
          chainId: receipt.sourceChain.id
        });
      } catch (err: any) {
        set({ isConfirmSheetOpen: false });
        get().addNotification({
          title: 'Execution Failed',
          message: err.message || 'Transaction could not be executed',
          type: 'ERROR'
        });
      }
    },

    addNotification: (notif) => {
      const item: ZenithNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        isRead: false,
        ...notif
      };
      set((state) => ({ notifications: [item, ...state.notifications] }));
    },

    markNotificationsAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
      }));
    }
  };
});
