import { WalletOption, WalletType } from '@zenith/types';

export const formatAddress = (address: string, prefixLen = 6, suffixLen = 4): string => {
  if (!address) return '';
  if (address.length <= prefixLen + suffixLen) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
};

export const getInjectedEthereumProvider = (walletType: WalletType): any => {
  if (typeof window === 'undefined') return null;

  const anyWin = window as any;
  const eth = anyWin.ethereum;

  if (walletType === 'COINBASE') {
    if (anyWin.coinbaseWalletExtension) return anyWin.coinbaseWalletExtension;
    if (eth?.providers?.length) {
      const p = eth.providers.find((item: any) => item.isCoinbaseWallet);
      if (p) return p;
    }
    if (eth?.isCoinbaseWallet) return eth;
  }

  if (walletType === 'RABBY') {
    if (anyWin.rabby) return anyWin.rabby;
    if (eth?.providers?.length) {
      const p = eth.providers.find((item: any) => item.isRabby);
      if (p) return p;
    }
    if (eth?.isRabby) return eth;
  }

  if (walletType === 'OKX') {
    if (anyWin.okxwallet) return anyWin.okxwallet;
    if (eth?.providers?.length) {
      const p = eth.providers.find((item: any) => item.isOKXWallet);
      if (p) return p;
    }
    if (eth?.isOKXWallet) return eth;
  }

  if (walletType === 'RAINBOW') {
    if (eth?.providers?.length) {
      const p = eth.providers.find((item: any) => item.isRainbow);
      if (p) return p;
    }
    if (eth?.isRainbow) return eth;
  }

  if (walletType === 'METAMASK') {
    if (eth?.providers?.length) {
      const p = eth.providers.find((item: any) => item.isMetaMask && !item.isRabby && !item.isRainbow && !item.isOKXWallet);
      if (p) return p;
    }
    if (eth?.isMetaMask && !eth?.isRabby && !eth?.isRainbow && !eth?.isOKXWallet) return eth;
  }

  // Fallback to primary window.ethereum
  return eth || null;
};

export const detectInstalledWallets = (): WalletOption[] => {
  const isClient = typeof window !== 'undefined';

  const hasEthereum = isClient && typeof (window as any).ethereum !== 'undefined';
  const eth = hasEthereum ? (window as any).ethereum : null;

  const isMetaMask = !!(eth && (eth.isMetaMask && !eth.isRabby && !eth.isRainbow && !eth.isOKXWallet));
  const isPhantom = isClient && !!((window as any).phantom?.solana || (window as any).solana?.isPhantom);
  const isCoinbase = isClient && !!(eth?.isCoinbaseWallet || (window as any).coinbaseWalletExtension);
  const isRabby = isClient && !!(eth?.isRabby || (window as any).rabby);
  const isOKX = isClient && !!((window as any).okxwallet || eth?.isOKXWallet);
  const isRainbow = isClient && !!eth?.isRainbow;

  return [
    {
      id: 'METAMASK',
      name: 'MetaMask',
      icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
      isDetected: isMetaMask,
      environment: 'EVM',
      downloadUrl: 'https://metamask.io/download/'
    },
    {
      id: 'PHANTOM',
      name: 'Phantom',
      icon: 'https://phantom.app/img/phantom-logo.svg',
      isDetected: isPhantom,
      environment: 'SOLANA',
      downloadUrl: 'https://phantom.app/download'
    },
    {
      id: 'COINBASE',
      name: 'Coinbase Wallet',
      icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isDetected: isCoinbase,
      environment: 'EVM',
      downloadUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'RABBY',
      name: 'Rabby Wallet',
      icon: 'https://rabby.io/assets/images/logo.svg',
      isDetected: isRabby,
      environment: 'EVM',
      downloadUrl: 'https://rabby.io'
    },
    {
      id: 'OKX',
      name: 'OKX Wallet',
      icon: 'https://www.okx.com/favicon.ico',
      isDetected: isOKX,
      environment: 'MULTI',
      downloadUrl: 'https://www.okx.com/web3'
    },
    {
      id: 'RAINBOW',
      name: 'Rainbow',
      icon: 'https://rainbow.me/favicon.ico',
      isDetected: isRainbow,
      environment: 'EVM',
      downloadUrl: 'https://rainbow.me'
    },
    {
      id: 'WALLETCONNECT',
      name: 'WalletConnect',
      icon: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg',
      isDetected: false,
      environment: 'MULTI',
      downloadUrl: 'https://walletconnect.com'
    }
  ];
};

export interface WalletConnectionResult {
  address: string;
  walletName: string;
  rawProvider: any;
  chainId?: number;
}

export const connectToWalletProvider = async (
  walletType: WalletType
): Promise<WalletConnectionResult> => {
  const isClient = typeof window !== 'undefined';
  if (!isClient) {
    throw new Error('Window is undefined (SSR environment)');
  }

  if (walletType === 'PHANTOM') {
    const solana = (window as any).phantom?.solana || (window as any).solana;
    if (!solana) {
      throw new Error('Phantom wallet extension is not installed. Please install it to proceed.');
    }
    const resp = await solana.connect();
    const pubkey = resp.publicKey ? resp.publicKey.toString() : '';
    if (!pubkey) {
      throw new Error('Phantom wallet returned an empty public key.');
    }
    return {
      address: pubkey,
      walletName: 'Phantom',
      rawProvider: solana
    };
  }

  const rawProvider = getInjectedEthereumProvider(walletType);
  if (!rawProvider || typeof rawProvider.request !== 'function') {
    throw new Error(`${walletType} wallet provider was not detected. Please make sure the browser extension is installed and unlocked.`);
  }

  // Request accounts via EIP-1193
  const accounts: string[] = await rawProvider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0 || !accounts[0]) {
    throw new Error('No accounts authorized or returned by the wallet provider.');
  }

  const fullAddress = accounts[0];

  // Request initial chainId
  let chainId: number | undefined;
  try {
    const hexChainId = await rawProvider.request({ method: 'eth_chainId' });
    if (hexChainId) {
      chainId = parseInt(hexChainId, 16);
    }
  } catch (err) {
    console.warn('[WalletDetector] Could not fetch chainId on initial connect', err);
  }

  const walletNameMap: Record<WalletType, string> = {
    METAMASK: 'MetaMask',
    COINBASE: 'Coinbase Wallet',
    RABBY: 'Rabby Wallet',
    OKX: 'OKX Wallet',
    RAINBOW: 'Rainbow',
    WALLETCONNECT: 'WalletConnect',
    PHANTOM: 'Phantom',
    INJECTED: 'Injected Web3'
  };

  return {
    address: fullAddress,
    walletName: walletNameMap[walletType] || walletType,
    rawProvider,
    chainId
  };
};
