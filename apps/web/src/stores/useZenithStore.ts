import { create } from 'zustand';
import { BrowserProvider, JsonRpcSigner, JsonRpcProvider, Contract, formatEther, formatUnits, Provider } from 'ethers';
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
import { DEFAULT_TOKENS, defaultTokenService, defaultMarketDataService, LiveMarketData, MarketStatus } from '@zenith/tokens';
import { defaultZenithRouter, validateAndSanitizeAmount } from '@zenith/routing';
import { defaultExecutionCoordinator, ExecutionStateMachine } from '@zenith/execution';
import { defaultThemeManager } from '@zenith/ui';
import { connectToWalletProvider, formatAddress } from '../utils/walletDetector';

const THEME_STORAGE_KEY = 'zenith-theme';

export const getStoredTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (e) {

    }
  }
  return 'dark';
};

export const applyThemeToDom = (theme: 'dark' | 'light'): void => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      if (document.body) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      if (document.body) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {}
  }

  defaultThemeManager.setTheme(theme);
};

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
  isBalanceLoading: boolean;

  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  chainId: number | null;
  isWrongNetwork: boolean;
  walletError: string | null;

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

  marketData: Record<string, LiveMarketData>;
  isMarketsLoading: boolean;
  marketsError: string | null;
  lastMarketUpdate: number | null;
  marketDataStatus: MarketStatus;

  setActiveTab: (tab: ZenithState['activeTab']) => void;
  setProMode: (pro: boolean) => void;
  toggleTheme: () => void;
  updateSingleTokenMarketData: (chainId: string, address: string, data: LiveMarketData) => void;
  fetchMarketData: () => Promise<void>;
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
  refreshBalance: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
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

let activeInjectedProvider: any = null;
let activeAccountsChangedListener: ((accounts: string[]) => void) | null = null;
let activeChainChangedListener: ((hexChainId: string) => void) | null = null;
let isMarketStoreListenerRegistered = false;
let quoteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeQuoteRequestId = 0;

const cleanupWalletListeners = () => {
  if (activeInjectedProvider) {
    if (activeAccountsChangedListener && typeof activeInjectedProvider.removeListener === 'function') {
      activeInjectedProvider.removeListener('accountsChanged', activeAccountsChangedListener);
    }
    if (activeChainChangedListener && typeof activeInjectedProvider.removeListener === 'function') {
      activeInjectedProvider.removeListener('chainChanged', activeChainChangedListener);
    }
  }
  activeInjectedProvider = null;
  activeAccountsChangedListener = null;
  activeChainChangedListener = null;
};

const getChainRpcProvider = (
  chainIdStr: string,
  activeChainId: number | null,
  injectedProvider: BrowserProvider | null
): Provider => {
  const chain = defaultChainRegistry.getChain(chainIdStr);
  if (!chain) {
    return injectedProvider || new JsonRpcProvider('https://eth.llamarpc.com');
  }

  if (injectedProvider && activeChainId !== null && chain.chainId === activeChainId) {
    return injectedProvider;
  }

  try {
    const rpcUrl = defaultChainRegistry.getHealthyRPC(chain.id);
    return new JsonRpcProvider(rpcUrl, chain.chainId ? { chainId: chain.chainId, name: chain.id } : undefined);
  } catch (err) {
    console.warn(`[useZenithStore] Fallback to default RPC for ${chainIdStr}:`, err);
    return injectedProvider || new JsonRpcProvider('https://eth.llamarpc.com');
  }
};

export const resolveTokenLivePrice = (token: Token, marketDataRecord: Record<string, LiveMarketData>): number => {
  if (!token) return 0;
  const tokenKey = `${token.chainId.toLowerCase()}:${token.address.toLowerCase()}`;
  const symKey = token.symbol.toLowerCase();
  const cached = defaultMarketDataService.getCachedMarketData(token.chainId, token.address);
  return (
    marketDataRecord[tokenKey]?.priceUSD ||
    marketDataRecord[symKey]?.priceUSD ||
    cached?.priceUSD ||
    token.priceUSD ||
    0
  );
};

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
    theme: getStoredTheme(),

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
    walletBalances: {},
    isBalanceLoading: false,

    provider: null,
    signer: null,
    chainId: null,
    isWrongNetwork: false,
    walletError: null,

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
        message: 'Connected to 52 target chains with MEV protection & simulation enabled.',
        type: 'INFO',
        timestamp: Date.now() - 1000 * 60 * 5,
        isRead: false
      }
    ],

    marketData: {},
    isMarketsLoading: false,
    marketsError: null,
    lastMarketUpdate: null,
    marketDataStatus: 'UNAVAILABLE',

    setActiveTab: (tab) => set({ activeTab: tab }),
    setProMode: (isProMode) => set({ isProMode }),
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      applyThemeToDom(nextTheme);
      set({ theme: nextTheme });
    },

    setSourceChain: (chain) => {
      const prevSource = get().sourceChain;
      const prevDest = get().destChain;
      const isSameChainTrade = prevSource.id === prevDest.id;

      const sourceTokens = defaultTokenService.getTokensForChain(chain.id);
      let rawIn = defaultTokenService.getNativeToken(chain.id) || sourceTokens[0] || get().tokenIn;

      const livePriceIn = resolveTokenLivePrice(rawIn, get().marketData);
      const newIn = livePriceIn ? { ...rawIn, priceUSD: livePriceIn } : rawIn;

      let nextDest = prevDest;
      let nextOut = get().tokenOut;

      if (isSameChainTrade) {
        nextDest = chain;
        const destTokens = defaultTokenService.getTokensForChain(chain.id);
        const stable = destTokens.find(
          (t) => (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI') && t.address.toLowerCase() !== newIn.address.toLowerCase()
        );
        let rawOut =
          stable ||
          destTokens.find((t) => t.address.toLowerCase() !== newIn.address.toLowerCase()) ||
          destTokens[1] ||
          destTokens[0] ||
          newIn;

        const livePriceOut = resolveTokenLivePrice(rawOut, get().marketData);
        nextOut = livePriceOut ? { ...rawOut, priceUSD: livePriceOut } : rawOut;
      } else {
        if (nextOut.chainId !== nextDest.id) {
          const destTokens = defaultTokenService.getTokensForChain(nextDest.id);
          const stable = destTokens.find((t) => t.symbol === 'USDC' || t.symbol === 'USDT');
          let rawOut = stable || destTokens[0] || nextOut;

          const livePriceOut = resolveTokenLivePrice(rawOut, get().marketData);
          nextOut = livePriceOut ? { ...rawOut, priceUSD: livePriceOut } : rawOut;
        }
      }

      const isWrongNetwork = get().chainId !== null && chain.chainId !== undefined && get().chainId !== chain.chainId;

      set({
        sourceChain: chain,
        tokenIn: newIn,
        destChain: nextDest,
        tokenOut: nextOut,
        isWrongNetwork
      });

      get().fetchQuote();
      get().refreshBalance();
    },

    setDestChain: (chain) => {
      const currentIn = get().tokenIn;
      const isSameChain = get().sourceChain.id === chain.id;
      const destTokens = defaultTokenService.getTokensForChain(chain.id);

      let rawOut = destTokens.find(
        (t) =>
          (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI') &&
          (!isSameChain || t.address.toLowerCase() !== currentIn.address.toLowerCase())
      );

      if (!rawOut) {
        rawOut =
          destTokens.find((t) => !isSameChain || t.address.toLowerCase() !== currentIn.address.toLowerCase()) ||
          destTokens[1] ||
          destTokens[0] ||
          get().tokenOut;
      }

      const livePriceOut = resolveTokenLivePrice(rawOut, get().marketData);
      const newOut = livePriceOut ? { ...rawOut, priceUSD: livePriceOut } : rawOut;

      set({ destChain: chain, tokenOut: newOut });
      get().fetchQuote();
    },

    setTokenIn: (token) => {
      const chain = defaultChainRegistry.getChain(token.chainId);
      const prevSource = get().sourceChain;
      const prevDest = get().destChain;
      const isSameChainTrade = prevSource.id === prevDest.id;

      const livePriceIn = resolveTokenLivePrice(token, get().marketData);
      const effectiveToken = livePriceIn ? { ...token, priceUSD: livePriceIn } : token;

      let nextSource = chain || prevSource;
      let nextDest = prevDest;
      let nextOut = get().tokenOut;

      if (chain && chain.id !== prevSource.id) {
        nextSource = chain;
        if (isSameChainTrade) {
          nextDest = chain;
          const destTokens = defaultTokenService.getTokensForChain(chain.id);
          const stable = destTokens.find(
            (t) => (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI') && t.address.toLowerCase() !== effectiveToken.address.toLowerCase()
          );
          let rawOut =
            stable ||
            destTokens.find((t) => t.address.toLowerCase() !== effectiveToken.address.toLowerCase()) ||
            destTokens[1] ||
            destTokens[0] ||
            effectiveToken;

          const livePriceOut = resolveTokenLivePrice(rawOut, get().marketData);
          nextOut = livePriceOut ? { ...rawOut, priceUSD: livePriceOut } : rawOut;
        }
      } else if (isSameChainTrade && effectiveToken.address.toLowerCase() === nextOut.address.toLowerCase()) {
        const destTokens = defaultTokenService.getTokensForChain(effectiveToken.chainId);
        const alt = destTokens.find((t) => t.address.toLowerCase() !== effectiveToken.address.toLowerCase());
        if (alt) {
          const livePriceOut = resolveTokenLivePrice(alt, get().marketData);
          nextOut = livePriceOut ? { ...alt, priceUSD: livePriceOut } : alt;
        }
      }

      const isWrongNetwork = get().chainId !== null && nextSource.chainId !== undefined && get().chainId !== nextSource.chainId;

      set({
        sourceChain: nextSource,
        destChain: nextDest,
        tokenIn: effectiveToken,
        tokenOut: nextOut,
        isWrongNetwork
      });

      get().fetchQuote();
      get().refreshBalance();
    },

    setTokenOut: (token) => {
      const chain = defaultChainRegistry.getChain(token.chainId);
      const isSameChain = get().sourceChain.id === (chain ? chain.id : get().destChain.id);
      let nextIn = get().tokenIn;

      const livePriceOut = resolveTokenLivePrice(token, get().marketData);
      const effectiveToken = livePriceOut ? { ...token, priceUSD: livePriceOut } : token;

      if (isSameChain && effectiveToken.address.toLowerCase() === nextIn.address.toLowerCase()) {
        const sourceTokens = defaultTokenService.getTokensForChain(effectiveToken.chainId);
        const alt = sourceTokens.find((t) => t.address.toLowerCase() !== effectiveToken.address.toLowerCase());
        if (alt) {
          const livePriceIn = resolveTokenLivePrice(alt, get().marketData);
          nextIn = livePriceIn ? { ...alt, priceUSD: livePriceIn } : alt;
        }
      }

      if (chain && chain.id !== get().destChain.id) {
        set({ destChain: chain, tokenOut: effectiveToken, tokenIn: nextIn });
      } else {
        set({ tokenOut: effectiveToken, tokenIn: nextIn });
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
      get().refreshBalance();
    },

    setAmountIn: (rawAmountIn) => {
      const validation = validateAndSanitizeAmount(rawAmountIn);
      if (!validation.isValid) {
        // Reject amounts exceeding 9,999,999.999 or invalid numeric inputs
        return;
      }
      set({ amountIn: validation.sanitized });

      // Clear any pending debounce timer
      if (quoteDebounceTimer) {
        clearTimeout(quoteDebounceTimer);
        quoteDebounceTimer = null;
      }

      if (validation.numericValue <= 0) {
        set({ quote: null, isQuoteLoading: false, quoteError: null });
        return;
      }

      // 350ms debounce so rapid typing does not trigger network requests on every keystroke
      quoteDebounceTimer = setTimeout(() => {
        get().fetchQuote();
      }, 350);
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
      set({ isWalletConnecting: true, walletError: null });
      cleanupWalletListeners();

      try {
        const { address, walletName, rawProvider, chainId: initialChainId } = await connectToWalletProvider(walletType);

        let provider: BrowserProvider | null = null;
        let signer: JsonRpcSigner | null = null;
        let connectedChainId: number | null = initialChainId ?? null;
        let isWrongNetwork = false;
        let matchedChain: ChainConfig | undefined;

        let initialTokenIn = get().tokenIn;
        let initialTokenOut = get().tokenOut;
        let initialDestChain = get().destChain;

        if (walletType !== 'PHANTOM') {

          provider = new BrowserProvider(rawProvider, 'any');
          try {
            signer = await provider.getSigner();
          } catch (signerErr) {
            console.warn('[useZenithStore] Could not obtain signer on connection:', signerErr);
          }

          try {
            const network = await provider.getNetwork();
            connectedChainId = Number(network.chainId);
          } catch {
            if (typeof rawProvider.request === 'function') {
              const hexId = await rawProvider.request({ method: 'eth_chainId' }).catch(() => null);
              if (hexId) connectedChainId = parseInt(hexId, 16);
            }
          }

          if (connectedChainId !== null) {
            const allChains = defaultChainRegistry.getAllChains();
            matchedChain = allChains.find((c) => c.chainId === connectedChainId);
            if (matchedChain) {
              const native = defaultTokenService.getNativeToken(matchedChain.id);
              if (native) initialTokenIn = native;
              const destToks = defaultTokenService.getTokensForChain(matchedChain.id);
              const stable = destToks.find((t) => (t.symbol === 'USDC' || t.symbol === 'USDT') && t.address.toLowerCase() !== initialTokenIn.address.toLowerCase());
              if (stable) initialTokenOut = stable;
              initialDestChain = matchedChain;
              isWrongNetwork = false;
            } else {
              isWrongNetwork = true;
            }
          }
        }

        set({
          isWalletConnected: true,
          isWalletConnecting: false,
          walletAddress: address,
          connectedWalletName: walletName,
          provider,
          signer,
          chainId: connectedChainId,
          isWrongNetwork,
          walletBalances: {},
          walletError: null,
          isWalletModalOpen: false,
          ...(matchedChain ? {
            sourceChain: matchedChain,
            destChain: initialDestChain,
            tokenIn: initialTokenIn,
            tokenOut: initialTokenOut
          } : {})
        });

        get().addNotification({
          title: 'Wallet Connected',
          message: `Connected ${walletName} (${formatAddress(address)})`,
          type: 'SUCCESS'
        });

        if (isWrongNetwork && connectedChainId !== null) {
          get().addNotification({
            title: 'Unsupported Network',
            message: `Connected to chain ID ${connectedChainId}. Please switch to a supported network (Polygon, Ethereum, Arbitrum, Base, Optimism, etc.).`,
            type: 'WARNING'
          });
        }

        await get().refreshBalance();
        get().fetchQuote();

        if (rawProvider && typeof rawProvider.on === 'function') {
          activeInjectedProvider = rawProvider;

          activeAccountsChangedListener = async (accounts: string[]) => {
            console.log('[Zenith Web3] accountsChanged:', accounts);
            if (!accounts || accounts.length === 0) {
              get().disconnectWallet();
              return;
            }

            const newAddress = accounts[0];
            const currentProvider = get().provider;
            let newSigner = get().signer;
            if (currentProvider) {
              newSigner = await currentProvider.getSigner().catch(() => null);
            }

            set({
              walletAddress: newAddress,
              signer: newSigner,
              walletBalances: {}
            });

            await get().refreshBalance();
            get().addNotification({
              title: 'Account Changed',
              message: `Active account switched to ${formatAddress(newAddress)}`,
              type: 'INFO'
            });
            get().fetchQuote();
          };

          activeChainChangedListener = async (hexChainId: string) => {
            const newChainId = typeof hexChainId === 'string' && hexChainId.startsWith('0x')
              ? parseInt(hexChainId, 16)
              : Number(hexChainId);
            console.log('[Zenith Web3] chainChanged:', newChainId);

            const allChains = defaultChainRegistry.getAllChains();
            const chainMatch = allChains.find((c) => c.chainId === newChainId);
            const wrongNet = !chainMatch;

            const newProvider = new BrowserProvider(rawProvider, 'any');
            const newSigner = await newProvider.getSigner().catch(() => null);

            let newIn = get().tokenIn;
            let newOut = get().tokenOut;
            let newDest = get().destChain;

            if (chainMatch) {
              const native = defaultTokenService.getNativeToken(chainMatch.id);
              if (native) newIn = native;
              const destToks = defaultTokenService.getTokensForChain(chainMatch.id);
              const stable = destToks.find((t) => (t.symbol === 'USDC' || t.symbol === 'USDT') && t.address.toLowerCase() !== newIn.address.toLowerCase());
              if (stable) newOut = stable;
              newDest = chainMatch;
            }

            set({
              chainId: newChainId,
              isWrongNetwork: wrongNet,
              provider: newProvider,
              signer: newSigner,
              walletBalances: {},
              ...(chainMatch ? {
                sourceChain: chainMatch,
                destChain: newDest,
                tokenIn: newIn,
                tokenOut: newOut
              } : {})
            });

            if (wrongNet) {
              get().addNotification({
                title: 'Wrong Network',
                message: `Switched to unsupported network (Chain ID: ${newChainId}). Please select a supported chain.`,
                type: 'WARNING'
              });
            } else if (chainMatch) {
              await get().refreshBalance();
              get().addNotification({
                title: 'Network Updated',
                message: `Network switched to ${chainMatch.canonicalName}`,
                type: 'INFO'
              });
              get().fetchQuote();
            }
          };

          rawProvider.on('accountsChanged', activeAccountsChangedListener);
          rawProvider.on('chainChanged', activeChainChangedListener);
        }
      } catch (err: any) {
        set({
          isWalletConnecting: false,
          walletError: err.message || 'Could not connect to wallet'
        });
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
      cleanupWalletListeners();
      set({
        isWalletConnected: false,
        isWalletConnecting: false,
        walletAddress: '',
        connectedWalletName: '',
        provider: null,
        signer: null,
        chainId: null,
        isWrongNetwork: false,
        walletBalances: {},
        isBalanceLoading: false,
        walletError: null
      });
      get().addNotification({
        title: 'Wallet Disconnected',
        message: 'Wallet session ended',
        type: 'INFO'
      });
    },

    refreshBalance: async () => {
      const { provider, walletAddress, sourceChain, isWalletConnected, chainId } = get();
      if (!isWalletConnected || !walletAddress) {
        set({ walletBalances: {}, isBalanceLoading: false });
        return;
      }

      set({ isBalanceLoading: true });
      const newBalances: Record<string, string> = { ...get().walletBalances };

      try {

        const chainProvider = getChainRpcProvider(sourceChain.id, chainId, provider);

        const nativeToken = defaultTokenService.getNativeToken(sourceChain.id);
        if (nativeToken) {
          try {
            const balWei = await chainProvider.getBalance(walletAddress);
            const formatted = formatEther(balWei);
            const num = parseFloat(formatted);
            const valStr = isNaN(num) ? '0.00' : (num === 0 ? '0.00' : formatted);
            newBalances[`${sourceChain.id}:${nativeToken.address}`] = valStr;
            newBalances[`${sourceChain.id}:${nativeToken.address.toLowerCase()}`] = valStr;
          } catch (nativeErr) {
            console.warn(`[useZenithStore] Native balance fetch failed for ${sourceChain.id}:`, nativeErr);
          }
        }

        const chainTokens = defaultTokenService.getTokensForChain(sourceChain.id);
        const erc20Tokens = chainTokens.filter(
          (t) => !t.isNative && t.address.startsWith('0x') && t.address.length === 42
        );

        const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
        await Promise.allSettled(
          erc20Tokens.map(async (tok) => {
            try {
              const contract = new Contract(tok.address, erc20Abi, chainProvider);
              const rawBal = await contract.balanceOf(walletAddress);
              const formatted = formatUnits(rawBal, tok.decimals || 18);
              const n = parseFloat(formatted);
              const valStr = isNaN(n) ? '0.00' : (n === 0 ? '0.00' : formatted);
              newBalances[`${sourceChain.id}:${tok.address}`] = valStr;
              newBalances[`${sourceChain.id}:${tok.address.toLowerCase()}`] = valStr;
            } catch {
              newBalances[`${sourceChain.id}:${tok.address}`] = '0.00';
              newBalances[`${sourceChain.id}:${tok.address.toLowerCase()}`] = '0.00';
            }
          })
        );

        set({
          walletBalances: newBalances,
          isBalanceLoading: false
        });
      } catch (err) {
        console.warn('[useZenithStore] refreshBalance failed:', err);
        set({ isBalanceLoading: false });
      }
    },

    switchNetwork: async (targetChainId: number) => {
      if (!activeInjectedProvider || typeof activeInjectedProvider.request !== 'function') {
        throw new Error('No active Web3 provider available to switch networks');
      }

      const hexChainId = `0x${targetChainId.toString(16)}`;
      try {
        await activeInjectedProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }]
        });
      } catch (switchErr: any) {

        if (switchErr.code === 4902 || switchErr?.data?.originalError?.code === 4902) {
          const chain = defaultChainRegistry.getAllChains().find((c) => c.chainId === targetChainId);
          if (chain && chain.rpcEndpoints.length > 0) {
            await activeInjectedProvider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: hexChainId,
                  chainName: chain.canonicalName,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcEndpoints.map((r) => r.url),
                  blockExplorerUrls: chain.explorer ? [chain.explorer.baseUrl] : []
                }
              ]
            });
          } else {
            throw switchErr;
          }
        } else {
          throw switchErr;
        }
      }
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
      // Clear pending debounce timer if fetchQuote is invoked explicitly (e.g. token switch, network change, manual refresh)
      if (quoteDebounceTimer) {
        clearTimeout(quoteDebounceTimer);
        quoteDebounceTimer = null;
      }

      const { sourceChain, destChain, tokenIn, tokenOut, amountIn, slippageTolerancePercent, walletAddress, gasPreset } = get();
      
      const validation = validateAndSanitizeAmount(amountIn);
      if (!validation.isValid || validation.numericValue <= 0) {
        set({ quote: null, quoteError: null, isQuoteLoading: false });
        return;
      }

      const cleanAmount = validation.sanitized;
      // Increment quote request sequence counter to discard stale responses
      const currentRequestId = ++activeQuoteRequestId;

      set({ isQuoteLoading: true, quoteError: null });

      try {
        const decimals = tokenIn.decimals || 18;
        const [wholePart = '0', fracPart = ''] = cleanAmount.split('.');
        const truncatedFrac = fracPart.slice(0, 3);
        const paddedFrac = truncatedFrac.padEnd(decimals, '0').slice(0, decimals);
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

        // Stale response guard: discard if a newer quote request was initiated
        if (currentRequestId !== activeQuoteRequestId) {
          return;
        }

        set({
          quote,
          isQuoteLoading: false,
          quoteCountdown: quote.freshnessSeconds,
          quoteError: null
        });
      } catch (err: any) {
        // Stale response guard
        if (currentRequestId !== activeQuoteRequestId) {
          return;
        }

        set({
          quote: null,
          isQuoteLoading: false,
          quoteError: err.message || 'Failed to fetch executable quote'
        });
      }
    },

    executeTrade: async () => {
      const { quote, walletAddress, isWalletConnected, openWalletModal, signer, provider, sourceChain, chainId, isWrongNetwork, walletBalances } = get();
      if (!quote) return;

      if (!isWalletConnected || !walletAddress || !signer) {
        openWalletModal();
        return;
      }

      if (isWrongNetwork) {
        get().addNotification({
          title: 'Wrong Network',
          message: 'Please switch your wallet network to match the source chain before swapping.',
          type: 'WARNING'
        });
        return;
      }

      if (chainId !== null && sourceChain.chainId !== chainId) {
        get().addNotification({
          title: 'Network Mismatch',
          message: `Your wallet is on Chain ID ${chainId}, but the swap source is ${sourceChain.canonicalName} (Chain ID: ${sourceChain.chainId}). Please switch networks.`,
          type: 'WARNING'
        });
        return;
      }

      const tokenInKey = `${sourceChain.id}:${quote.request.tokenIn.address}`;
      const userBalanceStr = walletBalances[tokenInKey] || '0';
      const userBalanceNum = parseFloat(userBalanceStr);
      const amountInNum = parseFloat(quote.amountInFormatted.replace(/,/g, ''));

      if (userBalanceNum < amountInNum) {
        get().addNotification({
          title: 'Insufficient Balance',
          message: `You have ${userBalanceStr} ${quote.request.tokenIn.symbol}, but trying to swap ${quote.amountInFormatted} ${quote.request.tokenIn.symbol}.`,
          type: 'ERROR'
        });
        return;
      }

      try {
        const receipt = await defaultExecutionCoordinator.executeTrade({
          quote,
          userAddress: walletAddress,
          stateMachine: executionSM,
          signer,
          provider
        });

        set((state) => ({
          isConfirmSheetOpen: false,
          lastReceipt: receipt,
          isReceiptOpen: true,
          transactionHistory: [receipt, ...state.transactionHistory]
        }));

        await get().refreshBalance();

        get().addNotification({
          title: 'Trade Executed Successfully',
          message: `Swapped ${receipt.amountInFormatted} ${receipt.tokenIn.symbol} for ${receipt.amountOutFormatted} ${receipt.tokenOut.symbol}`,
          type: 'SUCCESS',
          txHash: receipt.txHash,
          chainId: receipt.sourceChain.id
        });
      } catch (err: any) {
        set({ isConfirmSheetOpen: false });

        const errMsg = err?.message || String(err);
        const isUserRejected =
          err?.code === 4001 ||
          err?.code === 'ACTION_REJECTED' ||
          errMsg.includes('rejected') ||
          errMsg.includes('denied') ||
          errMsg.includes('User rejected');

        if (isUserRejected) {
          get().addNotification({
            title: 'Transaction Cancelled',
            message: 'You rejected the transaction in MetaMask.',
            type: 'INFO'
          });
        } else {
          get().addNotification({
            title: 'Execution Failed',
            message: errMsg || 'Transaction could not be executed on-chain.',
            type: 'ERROR'
          });
        }
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
    },

    updateSingleTokenMarketData: (chainId: string, address: string, data: LiveMarketData) => {
      const key = `${chainId.toLowerCase()}:${address.toLowerCase()}`;
      const currentTokenIn = get().tokenIn;
      const currentTokenOut = get().tokenOut;

      let updatedTokenIn = currentTokenIn;
      let updatedTokenOut = currentTokenOut;

      const targetSym = data.symbol ? defaultMarketDataService.resolveSymbol(data.symbol) : undefined;
      const inSym = defaultMarketDataService.resolveSymbol(currentTokenIn.symbol);
      const outSym = defaultMarketDataService.resolveSymbol(currentTokenOut.symbol);

      if (
        (targetSym && inSym === targetSym) ||
        (currentTokenIn.chainId.toLowerCase() === chainId.toLowerCase() && currentTokenIn.address.toLowerCase() === address.toLowerCase())
      ) {
        updatedTokenIn = { ...currentTokenIn, priceUSD: data.priceUSD ?? undefined };
      }
      if (
        (targetSym && outSym === targetSym) ||
        (currentTokenOut.chainId.toLowerCase() === chainId.toLowerCase() && currentTokenOut.address.toLowerCase() === address.toLowerCase())
      ) {
        updatedTokenOut = { ...currentTokenOut, priceUSD: data.priceUSD ?? undefined };
      }

      const symKey = data.symbol?.toLowerCase();

      set((state) => ({
        marketData: {
          ...state.marketData,
          [key]: data,
          ...(symKey ? { [symKey]: data } : {})
        },
        tokenIn: updatedTokenIn,
        tokenOut: updatedTokenOut,
        lastMarketUpdate: Date.now(),
        marketDataStatus: data.isLive ? 'LIVE' : defaultMarketDataService.getOverallStatus()
      }));
    },

    fetchMarketData: async () => {
      set({ isMarketsLoading: true, marketsError: null });
      try {
        const dataMap = await defaultMarketDataService.fetchMarketData(DEFAULT_TOKENS);
        const record: Record<string, LiveMarketData> = {};
        dataMap.forEach((val, key) => {
          record[key] = val;
        });

        if (!isMarketStoreListenerRegistered) {
          isMarketStoreListenerRegistered = true;
          defaultMarketDataService.addStoreTickListener((chainId, address, data) => {
            get().updateSingleTokenMarketData(chainId, address, data);
          });
        }

        const currentTokenIn = get().tokenIn;
        const currentTokenOut = get().tokenOut;
        const livePriceIn = resolveTokenLivePrice(currentTokenIn, record);
        const livePriceOut = resolveTokenLivePrice(currentTokenOut, record);

        set({
          marketData: record,
          tokenIn: livePriceIn ? { ...currentTokenIn, priceUSD: livePriceIn } : currentTokenIn,
          tokenOut: livePriceOut ? { ...currentTokenOut, priceUSD: livePriceOut } : currentTokenOut,
          isMarketsLoading: false,
          marketsError: defaultMarketDataService.getLastError(),
          lastMarketUpdate: defaultMarketDataService.getLastUpdated() || Date.now(),
          marketDataStatus: defaultMarketDataService.getOverallStatus()
        });

        // Refresh quote with live market prices
        get().fetchQuote();
      } catch (err: any) {
        set({
          isMarketsLoading: false,
          marketsError: err.message || 'Failed to fetch live market data',
          marketDataStatus: defaultMarketDataService.getOverallStatus()
        });
      }
    }
  };
});

if (typeof window !== 'undefined') {
  applyThemeToDom(getStoredTheme());

  window.addEventListener('offline', () => {
    useZenithStore.setState({ marketDataStatus: 'OFFLINE' });
  });

  window.addEventListener('online', () => {
    useZenithStore.getState().fetchMarketData();
  });
}
