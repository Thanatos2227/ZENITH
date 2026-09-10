import { Token } from '@zenith/types';

export const DEFAULT_TOKENS: Token[] = [
  // ==========================================
  // BITCOIN (UTXO Network)
  // ==========================================
  {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    isNative: true,
    priceUSD: 78247.22,
    change24hUSD: -0.28,
    volume24hUSD: 1113291568,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    securityProfile: {
      isHoneypot: false,
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      transferTaxPercent: 0,
      canBlacklist: false,
      canMintArbitrary: false,
      isProxy: false,
      liquidityLockedPercent: 100,
      holderConcentrationTop10Percent: 8.2,
      hasMaliciousPatterns: false,
      riskScore: 0,
      warnings: []
    }
  },
  {
    address: 'ord:ordi',
    chainId: 'bitcoin',
    name: 'Ordinals',
    symbol: 'ORDI',
    decimals: 8,
    priceUSD: 4.078,
    change24hUSD: -5.47,
    volume24hUSD: 3000190,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/30162/small/ordi.png'
  },
  {
    address: 'ord:sats',
    chainId: 'bitcoin',
    name: '1000SATS',
    symbol: 'SATS',
    decimals: 8,
    priceUSD: 0.00000001,
    change24hUSD: -4.74,
    volume24hUSD: 25225,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/33054/small/sats.png'
  },
  {
    address: 'rune:dog_go_to_the_moon',
    chainId: 'bitcoin',
    name: 'DOG•GO•TO•THE•MOON',
    symbol: 'DOG',
    decimals: 8,
    priceUSD: 0.0011286,
    change24hUSD: 1.27,
    volume24hUSD: 219999,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/37326/small/dog.png'
  },
  {
    address: 'rune:pups_world_peace',
    chainId: 'bitcoin',
    name: 'PUPS World Peace',
    symbol: 'PUPS',
    decimals: 8,
    priceUSD: 0.0041,
    change24hUSD: -4.2,
    volume24hUSD: 4500000,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/34320/small/pups.png'
  },

  // ==========================================
  // TRON (TVM Network)
  // ==========================================
  {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 'tron',
    name: 'Tron',
    symbol: 'TRX',
    decimals: 6,
    isNative: true,
    priceUSD: 0.3385,
    change24hUSD: -0.12,
    volume24hUSD: 26078115,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
    securityProfile: {
      isHoneypot: false,
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      transferTaxPercent: 0,
      canBlacklist: false,
      canMintArbitrary: false,
      isProxy: false,
      liquidityLockedPercent: 100,
      holderConcentrationTop10Percent: 22.1,
      hasMaliciousPatterns: false,
      riskScore: 0,
      warnings: []
    }
  },
  {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    chainId: 'tron',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    securityProfile: {
      isHoneypot: false,
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      transferTaxPercent: 0,
      canBlacklist: true,
      canMintArbitrary: true,
      isProxy: false,
      liquidityLockedPercent: 100,
      holderConcentrationTop10Percent: 18.4,
      hasMaliciousPatterns: false,
      riskScore: 5,
      warnings: []
    }
  },
  {
    address: 'TPYmHEhy5nFA6nhXuDRRZm8HwY5N1FxgeK',
    chainId: 'tron',
    name: 'Decentralized USD',
    symbol: 'USDD',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 313626,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/25380/small/UUSD.jpg'
  },
  {
    address: 'TAFjULxiVgT4qWk6UZAMCnhPXGazYke3PF',
    chainId: 'tron',
    name: 'BitTorrent',
    symbol: 'BTT',
    decimals: 18,
    priceUSD: 0.00000032,
    change24hUSD: 3.2,
    volume24hUSD: 281646,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/22457/small/btt_logo.png'
  },
  {
    address: 'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S',
    chainId: 'tron',
    name: 'Sun Token',
    symbol: 'SUN',
    decimals: 18,
    priceUSD: 0.01684,
    change24hUSD: -0.35,
    volume24hUSD: 554608,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12389/small/sun.png'
  },
  {
    address: 'TCFLLCrdoUzAcTXkp1D4pcmC6LmmCxpmG4',
    chainId: 'tron',
    name: 'JUST',
    symbol: 'JST',
    decimals: 18,
    priceUSD: 0.10511,
    change24hUSD: 0.63,
    volume24hUSD: 2590779,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/11095/small/JUST.jpg'
  },

  // ==========================================
  // 1. ETHEREUM (Canonical L1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'ethereum',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    securityProfile: {
      isHoneypot: false,
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      transferTaxPercent: 0,
      canBlacklist: false,
      canMintArbitrary: false,
      isProxy: false,
      liquidityLockedPercent: 100,
      holderConcentrationTop10Percent: 12.4,
      hasMaliciousPatterns: false,
      riskScore: 0,
      warnings: []
    }
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chainId: 'ethereum',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    chainId: 'ethereum',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    priceUSD: 78247.22,
    change24hUSD: -0.28,
    volume24hUSD: 1113291568,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: 'ethereum',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    securityProfile: {
      isHoneypot: false,
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      transferTaxPercent: 0,
      canBlacklist: true,
      canMintArbitrary: true,
      isProxy: true,
      liquidityLockedPercent: 100,
      holderConcentrationTop10Percent: 28.5,
      hasMaliciousPatterns: false,
      riskScore: 5,
      warnings: []
    }
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chainId: 'ethereum',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    chainId: 'ethereum',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png'
  },
  {
    address: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',
    chainId: 'ethereum',
    name: 'PayPal USD',
    symbol: 'PYUSD',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 6981,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/31212/small/pyusd.png'
  },
  {
    address: '0xdC035D45d973E3EC169d2276DDab1CEF12B266fe',
    chainId: 'ethereum',
    name: 'Sky Dollar',
    symbol: 'USDS',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 140795,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/39943/small/usds.png'
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    chainId: 'ethereum',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    priceUSD: 6.198,
    change24hUSD: -8.01,
    volume24hUSD: 53654995,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
  },
  {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    chainId: 'ethereum',
    name: 'Chainlink',
    symbol: 'LINK',
    decimals: 18,
    priceUSD: 11.786,
    change24hUSD: -5.92,
    volume24hUSD: 44491086,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    chainId: 'ethereum',
    name: 'Aave',
    symbol: 'AAVE',
    decimals: 18,
    priceUSD: 125.5,
    change24hUSD: -2.54,
    volume24hUSD: 10581546,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png'
  },
  {
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    chainId: 'ethereum',
    name: 'Maker',
    symbol: 'MKR',
    decimals: 18,
    priceUSD: 1813.70,
    change24hUSD: 0.76,
    volume24hUSD: 440709,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png'
  },
  {
    address: '0x5A98FcBEA516Cf06857215779Fd812CA9Bef1B32',
    chainId: 'ethereum',
    name: 'Lido DAO',
    symbol: 'LDO',
    decimals: 18,
    priceUSD: 0.3727,
    change24hUSD: -3.57,
    volume24hUSD: 4224876,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png'
  },
  {
    address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    chainId: 'ethereum',
    name: 'Wrapped Lido Staked ETH',
    symbol: 'wstETH',
    decimals: 18,
    priceUSD: 2922.06,
    change24hUSD: 2.85,
    volume24hUSD: 310000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/18834/small/wstETH.png'
  },
  {
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    chainId: 'ethereum',
    name: 'Pepe',
    symbol: 'PEPE',
    decimals: 18,
    priceUSD: 0.00000347,
    change24hUSD: -5.19,
    volume24hUSD: 31579223,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.png'
  },
  {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    chainId: 'ethereum',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    decimals: 18,
    priceUSD: 0.00000525,
    change24hUSD: -3.14,
    volume24hUSD: 4562554,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png'
  },
  {
    address: '0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3',
    chainId: 'ethereum',
    name: 'Ondo Finance',
    symbol: 'ONDO',
    decimals: 18,
    priceUSD: 0.3594,
    change24hUSD: -4.11,
    volume24hUSD: 13494232,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/34633/small/ondo.png'
  },
  {
    address: '0x455e53C3640fD1f044e5522f9611D1a7E02a3a0e',
    chainId: 'ethereum',
    name: 'Polygon Ecosystem Token (ERC-20)',
    symbol: 'POL',
    decimals: 18,
    isNative: false,
    priceUSD: 0.0972,
    change24hUSD: 1.8,
    volume24hUSD: 11783024,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png'
  },

  // ==========================================
  // 2. BASE (Coinbase Optimistic Rollup L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'base',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x4200000000000000000000000000000000000006',
    chainId: 'base',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    chainId: 'base',
    name: 'Coinbase Wrapped BTC',
    symbol: 'cbBTC',
    decimals: 8,
    priceUSD: 78247.22,
    change24hUSD: 4.12,
    volume24hUSD: 180000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/39945/small/cbbtc.webp'
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chainId: 'base',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    chainId: 'base',
    name: 'Aerodrome Finance',
    symbol: 'AERO',
    decimals: 18,
    priceUSD: 0.5495,
    change24hUSD: -10.4,
    volume24hUSD: 5315559,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/31732/small/Aero.png'
  },
  {
    address: '0x4ed4E862860be51a747027084693a100E916B2D2',
    chainId: 'base',
    name: 'Degen',
    symbol: 'DEGEN',
    decimals: 18,
    priceUSD: 0.0010806,
    change24hUSD: 3.46,
    volume24hUSD: 24062,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/34515/small/degen.png'
  },
  {
    address: '0x532f27101965dd16442E59d40670FaF5eBB142E4',
    chainId: 'base',
    name: 'Brett',
    symbol: 'BRETT',
    decimals: 18,
    priceUSD: 0.004985,
    change24hUSD: -6.27,
    volume24hUSD: 121688,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/35552/small/brett.png'
  },
  {
    address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
    chainId: 'base',
    name: 'Toshi',
    symbol: 'TOSHI',
    decimals: 18,
    priceUSD: 0.00011506,
    change24hUSD: -5.75,
    volume24hUSD: 126269,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/31326/small/toshi.png'
  },
  {
    address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b',
    chainId: 'base',
    name: 'Virtuals Protocol',
    symbol: 'VIRTUAL',
    decimals: 18,
    priceUSD: 0.6575,
    change24hUSD: -7.5,
    volume24hUSD: 7668633,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/38605/small/virtual.png'
  },

  // ==========================================
  // 3. ARBITRUM ONE (Nitro L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'arbitrum',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    chainId: 'arbitrum',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    chainId: 'arbitrum',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    chainId: 'arbitrum',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    chainId: 'arbitrum',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    priceUSD: 78247.22,
    change24hUSD: -0.28,
    volume24hUSD: 1113291568,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
  },
  {
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    chainId: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARB',
    decimals: 18,
    priceUSD: 0.1533,
    change24hUSD: -7.15,
    volume24hUSD: 53168891,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/16547/small/arbitrum.png'
  },
  {
    address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
    chainId: 'arbitrum',
    name: 'GMX',
    symbol: 'GMX',
    decimals: 18,
    priceUSD: 7.58,
    change24hUSD: -8.79,
    volume24hUSD: 349160,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/18323/small/arbit.png'
  },
  {
    address: '0x0c880f67ed5009C07d380B4306812053D4b74644',
    chainId: 'arbitrum',
    name: 'Pendle',
    symbol: 'PENDLE',
    decimals: 18,
    priceUSD: 1.998,
    change24hUSD: -6.15,
    volume24hUSD: 3320489,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/15069/small/pendle.png'
  },

  // ==========================================
  // 4. SOLANA (High Throughput SVM L1)
  // ==========================================
  {
    address: '11111111111111111111111111111111',
    chainId: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    isNative: true,
    priceUSD: 101.67,
    change24hUSD: -1.65,
    volume24hUSD: 220439069,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    securityProfile: {
      isHoneypot: false,
      buyTaxPercent: 0,
      sellTaxPercent: 0,
      transferTaxPercent: 0,
      canBlacklist: false,
      canMintArbitrary: false,
      isProxy: false,
      liquidityLockedPercent: 100,
      holderConcentrationTop10Percent: 9.8,
      hasMaliciousPatterns: false,
      riskScore: 0,
      warnings: []
    }
  },
  {
    address: 'So11111111111111111111111111111111111111112',
    chainId: 'solana',
    name: 'Wrapped SOL',
    symbol: 'WSOL',
    decimals: 9,
    priceUSD: 101.67,
    change24hUSD: -1.65,
    volume24hUSD: 220439069,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 'solana',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    chainId: 'solana',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    chainId: 'solana',
    name: 'Jupiter',
    symbol: 'JUP',
    decimals: 6,
    priceUSD: 0.233,
    change24hUSD: -3.12,
    volume24hUSD: 8091896,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/34188/small/jup.png'
  },
  {
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    chainId: 'solana',
    name: 'Raydium',
    symbol: 'RAY',
    decimals: 6,
    priceUSD: 1.243,
    change24hUSD: 1.47,
    volume24hUSD: 26197550,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/13928/small/PSigc4ie_400x400.jpg'
  },
  {
    address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    chainId: 'solana',
    name: 'Pyth Network',
    symbol: 'PYTH',
    decimals: 6,
    priceUSD: 0.05211,
    change24hUSD: -2.6,
    volume24hUSD: 4949883,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/33058/small/pyth.png'
  },
  {
    address: 'J1toso1uCk3RKmjehLLmJaNMuUmZE5CQNJbZPumuzSf',
    chainId: 'solana',
    name: 'Jito Staked SOL',
    symbol: 'JitoSOL',
    decimals: 9,
    priceUSD: 114.28,
    change24hUSD: 6.3,
    volume24hUSD: 95000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/28046/small/jitosol.png'
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    chainId: 'solana',
    name: 'Bonk',
    symbol: 'BONK',
    decimals: 5,
    priceUSD: 0.00000287,
    change24hUSD: -5.9,
    volume24hUSD: 4070462,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg'
  },
  {
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    chainId: 'solana',
    name: 'Dogwifhat',
    symbol: 'WIF',
    decimals: 6,
    priceUSD: 0.2045,
    change24hUSD: -3.67,
    volume24hUSD: 2553721,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg'
  },
  {
    address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    chainId: 'solana',
    name: 'Popcat',
    symbol: 'POPCAT',
    decimals: 9,
    priceUSD: 0.04923,
    change24hUSD: -4.86,
    volume24hUSD: 63997,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/33760/small/popcat.jpg'
  },

  // ==========================================
  // 5. ROBINHOOD CHAIN (Arbitrum Orbit RWA)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'robinhood',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x1111111111111111111111111111111111111111',
    chainId: 'robinhood',
    name: 'Tokenized US Treasury Fund',
    symbol: 'rUSTB',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 12000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/31388/small/base.png',
    tags: ['RWA', 'TREASURY', 'ACCREDITED']
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    chainId: 'robinhood',
    name: 'Tokenized Apple Inc.',
    symbol: 'rAAPL',
    decimals: 18,
    priceUSD: 228.4,
    change24hUSD: 1.15,
    volume24hUSD: 28000000,
    verificationTier: 'VERIFIED_CANONICAL',
    tags: ['RWA', 'EQUITY', 'ACCREDITED']
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    chainId: 'robinhood',
    name: 'Tokenized Nvidia Corp.',
    symbol: 'rNVDA',
    decimals: 18,
    priceUSD: 118.25,
    change24hUSD: 2.45,
    volume24hUSD: 45000000,
    verificationTier: 'VERIFIED_CANONICAL',
    tags: ['RWA', 'EQUITY', 'ACCREDITED']
  },
  {
    address: '0x4444444444444444444444444444444444444444',
    chainId: 'robinhood',
    name: 'Tokenized Microsoft Corp.',
    symbol: 'rMSFT',
    decimals: 18,
    priceUSD: 415.8,
    change24hUSD: 0.85,
    volume24hUSD: 31000000,
    verificationTier: 'VERIFIED_CANONICAL',
    tags: ['RWA', 'EQUITY', 'ACCREDITED']
  },
  {
    address: '0x7777777777777777777777777777777777777777',
    chainId: 'robinhood',
    name: 'Tokenized S&P 500 ETF',
    symbol: 'rSPY',
    decimals: 18,
    priceUSD: 560.5,
    change24hUSD: 0.65,
    volume24hUSD: 52000000,
    verificationTier: 'VERIFIED_CANONICAL',
    tags: ['RWA', 'INDEX', 'ACCREDITED']
  },
  {
    address: '0x9999999999999999999999999999999999999999',
    chainId: 'robinhood',
    name: 'Tokenized Gold Bullion',
    symbol: 'rGOLD',
    decimals: 18,
    priceUSD: 2885.00,
    change24hUSD: 0.42,
    volume24hUSD: 18000000,
    verificationTier: 'VERIFIED_CANONICAL',
    tags: ['RWA', 'COMMODITY', 'ACCREDITED']
  },

  // ==========================================
  // 6. UNICHAIN (Uniswap Rollup L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'unichain',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x0000000000000000000000000000000000000001',
    chainId: 'unichain',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    priceUSD: 6.198,
    change24hUSD: -8.01,
    volume24hUSD: 53654995,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    chainId: 'unichain',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000003',
    chainId: 'unichain',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x0000000000000000000000000000000000000004',
    chainId: 'unichain',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    priceUSD: 78247.22,
    change24hUSD: -0.28,
    volume24hUSD: 1113291568,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
  },

  // ==========================================
  // 7. TEMPO (Payments L1/L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'tempo',
    name: 'Tempo',
    symbol: 'TEMPO',
    decimals: 18,
    isNative: true,
    priceUSD: 0.85,
    change24hUSD: 5.4,
    volume24hUSD: 35000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://tempo.network/favicon.ico'
  },
  {
    address: '0x0000000000000000000000000000000000000010',
    chainId: 'tempo',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000012',
    chainId: 'tempo',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x0000000000000000000000000000000000000014',
    chainId: 'tempo',
    name: 'Tempo Pay Utility',
    symbol: 'PAY',
    decimals: 18,
    priceUSD: 0.15,
    change24hUSD: 8.1,
    volume24hUSD: 18000000,
    verificationTier: 'VERIFIED_CANONICAL'
  },

  // ==========================================
  // 8. MONAD (Parallel EVM High-Throughput L1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'monad',
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
    isNative: true,
    priceUSD: 1.25,
    change24hUSD: -2.79,
    volume24hUSD: 364324,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://monad.xyz/favicon.ico'
  },
  {
    address: '0x0000000000000000000000000000000000000020',
    chainId: 'monad',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000024',
    chainId: 'monad',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0x0000000000000000000000000000000000000021',
    chainId: 'monad',
    name: 'Chog',
    symbol: 'CHOG',
    decimals: 18,
    priceUSD: 0.045,
    change24hUSD: 18.5,
    volume24hUSD: 24000000,
    verificationTier: 'COMMUNITY_VERIFIED'
  },
  {
    address: '0x0000000000000000000000000000000000000026',
    chainId: 'monad',
    name: 'Moyaki',
    symbol: 'MOYAKI',
    decimals: 18,
    priceUSD: 0.012,
    change24hUSD: 22.1,
    volume24hUSD: 15000000,
    verificationTier: 'COMMUNITY_VERIFIED'
  },

  // ==========================================
  // 9. POLYGON POS (EVM L1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'polygon',
    name: 'Polygon Ecosystem Token',
    symbol: 'POL',
    decimals: 18,
    isNative: true,
    priceUSD: 0.0972,
    change24hUSD: 1.8,
    volume24hUSD: 11783024,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png'
  },
  {
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    chainId: 'polygon',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    chainId: 'polygon',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    chainId: 'polygon',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    chainId: 'polygon',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    priceUSD: 78247.22,
    change24hUSD: -0.28,
    volume24hUSD: 1113291568,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
  },
  {
    address: '0xB5C064F955D8e7F38fE0460C556a72987494eE17',
    chainId: 'polygon',
    name: 'QuickSwap',
    symbol: 'QUICK',
    decimals: 18,
    priceUSD: 0.00924,
    change24hUSD: -0.22,
    volume24hUSD: 79099,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/13970/small/quick.png'
  },

  // ==========================================
  // 10. X LAYER (OKX ZK L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'xlayer',
    name: 'OKB',
    symbol: 'OKB',
    decimals: 18,
    isNative: true,
    priceUSD: 112.78,
    change24hUSD: -1,
    volume24hUSD: 2202881,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/4463/small/okb_token.png'
  },
  {
    address: '0x0000000000000000000000000000000000000030',
    chainId: 'xlayer',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000032',
    chainId: 'xlayer',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x0000000000000000000000000000000000000033',
    chainId: 'xlayer',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },

  // ==========================================
  // 11. OPTIMISM (Optimism L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'optimism',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x4200000000000000000000000000000000000042',
    chainId: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    decimals: 18,
    priceUSD: 0.0996,
    change24hUSD: -5.59,
    volume24hUSD: 5571353,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png'
  },
  {
    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    chainId: 'optimism',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    chainId: 'optimism',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db',
    chainId: 'optimism',
    name: 'Velodrome Finance',
    symbol: 'VELO',
    decimals: 18,
    priceUSD: 0.005135,
    change24hUSD: -1.55,
    volume24hUSD: 123868,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/25783/small/velo.png'
  },

  // ==========================================
  // 12. BNB CHAIN (BNB Smart Chain EVM)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
    isNative: true,
    priceUSD: 722.29,
    change24hUSD: -3.98,
    volume24hUSD: 129428437,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
  },
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    chainId: 'bnb',
    name: 'Wrapped BNB',
    symbol: 'WBNB',
    decimals: 18,
    priceUSD: 722.29,
    change24hUSD: -3.98,
    volume24hUSD: 129428437,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
  },
  {
    address: '0x55d398326f99059fF775485246999027B3197955',
    chainId: 'bnb',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    chainId: 'bnb',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    chainId: 'bnb',
    name: 'Binance-Peg BTC',
    symbol: 'BTCB',
    decimals: 18,
    priceUSD: 78247.22,
    change24hUSD: 4.12,
    volume24hUSD: 420000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png'
  },
  {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    chainId: 'bnb',
    name: 'PancakeSwap',
    symbol: 'CAKE',
    decimals: 18,
    priceUSD: 2.24,
    change24hUSD: -1.1,
    volume24hUSD: 7238750,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo_animated.png'
  },
  {
    address: '0xfb5B838b6cfEEdC2873aB27866079AC55363D37E',
    chainId: 'bnb',
    name: 'Floki',
    symbol: 'FLOKI',
    decimals: 9,
    priceUSD: 0.00002481,
    change24hUSD: -5.45,
    volume24hUSD: 2231298,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png'
  },

  // ==========================================
  // 13. AVALANCHE C-CHAIN (EVM Subnet)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
    isNative: true,
    priceUSD: 7.786,
    change24hUSD: -2.75,
    volume24hUSD: 22466386,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png'
  },
  {
    address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    chainId: 'avalanche',
    name: 'Wrapped AVAX',
    symbol: 'WAVAX',
    decimals: 18,
    priceUSD: 7.786,
    change24hUSD: -2.75,
    volume24hUSD: 22466386,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png'
  },
  {
    address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    chainId: 'avalanche',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    chainId: 'avalanche',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x152b9d0FdC40C096757F570A51E494ba4b945398',
    chainId: 'avalanche',
    name: 'Avalanche Bridged BTC',
    symbol: 'BTC.b',
    decimals: 8,
    priceUSD: 78247.22,
    change24hUSD: 4.12,
    volume24hUSD: 95000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/26115/small/btcb.png'
  },
  {
    address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd',
    chainId: 'avalanche',
    name: 'Trader Joe',
    symbol: 'JOE',
    decimals: 18,
    priceUSD: 0.0309,
    change24hUSD: -4.04,
    volume24hUSD: 190731,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/17569/small/joe_200x200.png'
  },

  // ==========================================
  // 14. LINEA (ConsenSys ZK L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'linea',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    chainId: 'linea',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
    chainId: 'linea',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    chainId: 'linea',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x5FBDF89403270a1846F5ae7D113A989F850d1566',
    chainId: 'linea',
    name: 'Foxy',
    symbol: 'FOXY',
    decimals: 18,
    priceUSD: 0.00010979,
    change24hUSD: -5.29,
    volume24hUSD: 3066,
    verificationTier: 'COMMUNITY_VERIFIED',
    logoURI: 'https://assets.coingecko.com/coins/images/36888/small/foxy.png'
  },

  // ==========================================
  // 15. WORLD CHAIN (Optimistic L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'worldchain',
    name: 'Worldcoin',
    symbol: 'WLD',
    decimals: 18,
    isNative: true,
    priceUSD: 0.4136,
    change24hUSD: -8.96,
    volume24hUSD: 33562904,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/31062/small/worldcoin.png'
  },
  {
    address: '0x0000000000000000000000000000000000000050',
    chainId: 'worldchain',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x0000000000000000000000000000000000000051',
    chainId: 'worldchain',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000052',
    chainId: 'worldchain',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },

  // ==========================================
  // 16. ZKSYNC ERA (ZK L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'zksync',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x5A7d6b2F92C77FAD6CCaBd10A50d6141a0eef307',
    chainId: 'zksync',
    name: 'ZKsync',
    symbol: 'ZK',
    decimals: 18,
    priceUSD: 0.00999,
    change24hUSD: -3.01,
    volume24hUSD: 2306362,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/38604/small/zksync.png'
  },
  {
    address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
    chainId: 'zksync',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
    chainId: 'zksync',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0xed4040fD47629e7c8FBA7DA76bb50D3e7695F0f2',
    chainId: 'zksync',
    name: 'Holdstation',
    symbol: 'HOLD',
    decimals: 18,
    priceUSD: 0.00000541,
    change24hUSD: -5,
    volume24hUSD: 543,
    verificationTier: 'COMMUNITY_VERIFIED'
  },

  // ==========================================
  // 17. MEGAETH (Real-Time Sub-millisecond L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'megaeth',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x0000000000000000000000000000000000000070',
    chainId: 'megaeth',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000072',
    chainId: 'megaeth',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x0000000000000000000000000000000000000073',
    chainId: 'megaeth',
    name: 'MegaETH Governance',
    symbol: 'MEGA',
    decimals: 18,
    priceUSD: 0.03932,
    change24hUSD: -6.93,
    volume24hUSD: 3684838,
    verificationTier: 'VERIFIED_CANONICAL'
  },

  // ==========================================
  // 18. SONEIUM (Sony Optimistic L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'soneium',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x0000000000000000000000000000000000000080',
    chainId: 'soneium',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x0000000000000000000000000000000000000081',
    chainId: 'soneium',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },
  {
    address: '0x0000000000000000000000000000000000000082',
    chainId: 'soneium',
    name: 'Sony Ecosystem Token',
    symbol: 'SONY',
    decimals: 18,
    priceUSD: 0.35,
    change24hUSD: 8.9,
    volume24hUSD: 65000000,
    verificationTier: 'VERIFIED_CANONICAL'
  },
  {
    address: '0x0000000000000000000000000000000000000083',
    chainId: 'soneium',
    name: 'Astar Network',
    symbol: 'ASTR',
    decimals: 18,
    priceUSD: 0.005994,
    change24hUSD: -3.1,
    volume24hUSD: 349531,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/22617/small/astr.png'
  },

  // ==========================================
  // 19. ZORA NETWORK (Creator L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'zora',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0xa6B280B42CB0b7c4a4F789eC2eCdF7e2cd0da650',
    chainId: 'zora',
    name: 'Enjoy',
    symbol: 'ENJOY',
    decimals: 18,
    priceUSD: 0.000085,
    change24hUSD: 14.2,
    volume24hUSD: 18000000,
    verificationTier: 'COMMUNITY_VERIFIED'
  },
  {
    address: '0x0000000000000000000000000000000000000091',
    chainId: 'zora',
    name: 'Imagine',
    symbol: 'IMAGINE',
    decimals: 18,
    priceUSD: 0.0014,
    change24hUSD: 9.5,
    volume24hUSD: 8500000,
    verificationTier: 'COMMUNITY_VERIFIED'
  },
  {
    address: '0x0000000000000000000000000000000000000093',
    chainId: 'zora',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },

  // ==========================================
  // 20. CELO (Mobile-First Carbon-Negative L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'celo',
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
    isNative: true,
    priceUSD: 0.07666,
    change24hUSD: -1.93,
    volume24hUSD: 780488,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/11090/small/InjXBNx9_400x400.jpg'
  },
  {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    chainId: 'celo',
    name: 'Celo Dollar',
    symbol: 'cUSD',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 626,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/11090/small/InjXBNx9_400x400.jpg'
  },
  {
    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    chainId: 'celo',
    name: 'Celo Euro',
    symbol: 'cEUR',
    decimals: 18,
    priceUSD: 1.08,
    change24hUSD: -0.15,
    volume24hUSD: 45000000,
    verificationTier: 'VERIFIED_CANONICAL'
  },
  {
    address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
    chainId: 'celo',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    chainId: 'celo',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },

  // ==========================================
  // 21. BLAST (Native Yield L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'blast',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x4300000000000000000000000000000000000004',
    chainId: 'blast',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  {
    address: '0x4300000000000000000000000000000000000003',
    chainId: 'blast',
    name: 'USDB (Native Yield Stablecoin)',
    symbol: 'USDB',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/35544/small/usdb.png'
  },
  {
    address: '0xb1a5700fA2358173Fe465e6eA4Ff52E36e88E2ad',
    chainId: 'blast',
    name: 'Blast',
    symbol: 'BLAST',
    decimals: 18,
    priceUSD: 0.0003063,
    change24hUSD: -4.01,
    volume24hUSD: 55303,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/38698/small/blast.png'
  },
  {
    address: '0x00000000000000000000000000000000000000A1',
    chainId: 'blast',
    name: 'Pacman Finance',
    symbol: 'PAC',
    decimals: 18,
    priceUSD: 0.00012,
    change24hUSD: 11.2,
    volume24hUSD: 28000000,
    verificationTier: 'COMMUNITY_VERIFIED'
  },

  // ==========================================
  // SCROLL (ZK Rollup L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'scroll',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    priceUSD: 2465.87,
    change24hUSD: -0.77,
    volume24hUSD: 750047156,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    chainId: 'scroll',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0xd29687c813D741E2F938F4aC3771298148A15B70',
    chainId: 'scroll',
    name: 'Scroll',
    symbol: 'SCR',
    decimals: 18,
    priceUSD: 0.02021,
    change24hUSD: -4.98,
    volume24hUSD: 1596657,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/32280/small/scroll.png'
  },

  // ==========================================
  // MANTLE (Optimistic L2)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'mantle',
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
    isNative: true,
    priceUSD: 0.6008,
    change24hUSD: -5.07,
    volume24hUSD: 249465,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/30980/small/mantle.png'
  },
  {
    address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
    chainId: 'mantle',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },

  // ==========================================
  // GNOSIS (Layer 1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'gnosis',
    name: 'xDAI',
    symbol: 'xDAI',
    decimals: 18,
    isNative: true,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/11062/small/xdai.png'
  },
  {
    address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
    chainId: 'gnosis',
    name: 'Gnosis',
    symbol: 'GNO',
    decimals: 18,
    priceUSD: 115.77,
    change24hUSD: -1.2,
    volume24hUSD: 150671,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/662/small/gnosis_logo.png'
  },

  // ==========================================
  // SONIC (Layer 1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'sonic',
    name: 'Sonic',
    symbol: 'S',
    decimals: 18,
    isNative: true,
    priceUSD: 0.02833,
    change24hUSD: -4.52,
    volume24hUSD: 1006117,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/38108/small/sonic.png'
  },
  {
    address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
    chainId: 'sonic',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },

  // ==========================================
  // BERACHAIN (Layer 1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'berachain',
    name: 'Bera',
    symbol: 'BERA',
    decimals: 18,
    isNative: true,
    priceUSD: 0.1803,
    change24hUSD: -2.96,
    volume24hUSD: 855455,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/29729/small/berachain.png'
  },
  {
    address: '0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03',
    chainId: 'berachain',
    name: 'Honey Stablecoin',
    symbol: 'HONEY',
    decimals: 18,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 10042,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/29729/small/berachain.png'
  },

  // ==========================================
  // CRONOS (Layer 1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'cronos',
    name: 'Cronos',
    symbol: 'CRO',
    decimals: 18,
    isNative: true,
    priceUSD: 0.05857,
    change24hUSD: -0.47,
    volume24hUSD: 1091748,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/7310/small/cro_token_logo.png'
  },

  // ==========================================
  // SEI (Parallel EVM Layer 1)
  // ==========================================
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 'sei',
    name: 'Sei',
    symbol: 'SEI',
    decimals: 18,
    isNative: true,
    priceUSD: 0.04742,
    change24hUSD: -4.18,
    volume24hUSD: 6611329,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png'
  },

  // ==========================================
  // SUI (Move Layer 1)
  // ==========================================
  {
    address: '0x0000000000000000000000000000000000000002',
    chainId: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    decimals: 9,
    isNative: true,
    priceUSD: 0.7721,
    change24hUSD: -4.8,
    volume24hUSD: 65970470,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png'
  },
  {
    address: '0x5d4b302506645c37ff133b98c4b50a5aeC4f9e63',
    chainId: 'sui',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 3077491461,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },

  // ==========================================
  // APTOS (Move Layer 1)
  // ==========================================
  {
    address: '0x1::aptos_coin::AptosCoin',
    chainId: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    decimals: 8,
    isNative: true,
    priceUSD: 0.628,
    change24hUSD: -3.24,
    volume24hUSD: 10991965,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png'
  },

  // ==========================================
  // NEAR (Layer 1)
  // ==========================================
  {
    address: 'wrap.near',
    chainId: 'near',
    name: 'NEAR Protocol',
    symbol: 'NEAR',
    decimals: 24,
    isNative: true,
    priceUSD: 2.482,
    change24hUSD: 7.4,
    volume24hUSD: 111587440,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/10365/small/near.png'
  },

  // ==========================================
  // COSMOS HUB (Layer 1)
  // ==========================================
  {
    address: 'uatom',
    chainId: 'cosmoshub',
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    decimals: 6,
    isNative: true,
    priceUSD: 1.855,
    change24hUSD: 0.16,
    volume24hUSD: 8735473,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png'
  },

  // ==========================================
  // OSMOSIS (Layer 1)
  // ==========================================
  {
    address: 'uosmo',
    chainId: 'osmosis',
    name: 'Osmosis',
    symbol: 'OSMO',
    decimals: 6,
    isNative: true,
    priceUSD: 0.0341,
    change24hUSD: -4.21,
    volume24hUSD: 1417849,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/16724/small/osmo.png'
  },

  // ==========================================
  // INJECTIVE (Layer 1)
  // ==========================================
  {
    address: 'inj',
    chainId: 'injective',
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
    isNative: true,
    priceUSD: 6.129,
    change24hUSD: -4.37,
    volume24hUSD: 11372852,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12882/small/injective_logo.png'
  },

  // ==========================================
  // TON (Layer 1)
  // ==========================================
  {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    isNative: true,
    priceUSD: 1.6,
    change24hUSD: 0.95,
    volume24hUSD: 7717352,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png'
  },
  {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    chainId: 'ton',
    name: 'Tether USD (TON)',
    symbol: 'USDT',
    decimals: 6,
    priceUSD: 1,
    change24hUSD: 0.01,
    volume24hUSD: 1500000000,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
  },

  // ==========================================
  // HEDERA (Layer 1)
  // ==========================================
  {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 'hedera',
    name: 'Hedera',
    symbol: 'HBAR',
    decimals: 8,
    isNative: true,
    priceUSD: 0.07656,
    change24hUSD: -3.46,
    volume24hUSD: 9110820,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/3688/small/hbar.png'
  },

  // ==========================================
  // ALGORAND (Layer 1)
  // ==========================================
  {
    address: '0',
    chainId: 'algorand',
    name: 'Algorand',
    symbol: 'ALGO',
    decimals: 6,
    isNative: true,
    priceUSD: 0.0998,
    change24hUSD: -0.3,
    volume24hUSD: 3136909,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/4380/small/download.png'
  },

  // ==========================================
  // STELLAR (Payments Network)
  // ==========================================
  {
    address: 'native',
    chainId: 'stellar',
    name: 'Stellar Lumens',
    symbol: 'XLM',
    decimals: 7,
    isNative: true,
    priceUSD: 0.1812,
    change24hUSD: -3.51,
    volume24hUSD: 17139229,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png'
  },

  // ==========================================
  // XRP LEDGER (Payments Network)
  // ==========================================
  {
    address: 'XRP',
    chainId: 'xrpl',
    name: 'XRP',
    symbol: 'XRP',
    decimals: 6,
    isNative: true,
    priceUSD: 1.3938,
    change24hUSD: -1.6,
    volume24hUSD: 199989970,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
  },

  // ==========================================
  // CARDANO (Layer 1)
  // ==========================================
  {
    address: 'lovelace',
    chainId: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    decimals: 6,
    isNative: true,
    priceUSD: 0.2117,
    change24hUSD: -3.64,
    volume24hUSD: 39946293,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/975/small/cardano.png'
  },

  // ==========================================
  // POLKADOT (Substrate Layer 1)
  // ==========================================
  {
    address: 'DOT',
    chainId: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 10,
    isNative: true,
    priceUSD: 1.122,
    change24hUSD: -9.88,
    volume24hUSD: 21775064,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png'
  },

  // ==========================================
  // INTERNET COMPUTER (ICP Layer 1)
  // ==========================================
  {
    address: 'icp-ledger',
    chainId: 'icp',
    name: 'Internet Computer',
    symbol: 'ICP',
    decimals: 8,
    isNative: true,
    priceUSD: 2.774,
    change24hUSD: -5.81,
    volume24hUSD: 7726567,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png'
  },

  // ==========================================
  // DOGECOIN (Layer 1)
  // ==========================================
  {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    decimals: 8,
    isNative: true,
    priceUSD: 0.08613,
    change24hUSD: -4.3,
    volume24hUSD: 76759744,
    verificationTier: 'VERIFIED_CANONICAL',
    logoURI: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png'
  }
];

