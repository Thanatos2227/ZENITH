export type ExecutionEnvironment =
  | 'EVM'
  | 'SOLANA'
  | 'BITCOIN'
  | 'TVM'
  | 'COSMOS'
  | 'MOVE'
  | 'NEAR'
  | 'TON'
  | 'SUBSTRATE'
  | 'XRPL'
  | 'STELLAR'
  | 'UTXO'
  | 'ICP';

export type NetworkSupportTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

export type OperationalStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'MAINTENANCE'
  | 'PARTIALLY_AVAILABLE'
  | 'PAUSED'
  | 'DISABLED';

export type NetworkCategory =
  | 'LAYER_1'
  | 'OPTIMISTIC_ROLLUP'
  | 'ZK_ROLLUP'
  | 'ORBIT_RWA'
  | 'PAYMENTS_NETWORK'
  | 'HIGH_THROUGHPUT_L1';

export interface ChainRPCConfig {
  url: string;
  isPrivate?: boolean;
  priority: number;
  weight?: number;
  supportsSimulation?: boolean;
  latencyMs?: number;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
}

export interface ChainExplorerConfig {
  name: string;
  baseUrl: string;
  txPath: string;
  addressPath: string;
  tokenPath: string;
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export interface FinalityConfig {
  reorgSafetyBlocks: number;
  instantFinality: boolean;
  typicalBlockTimeSec: number;
  safeFinalityTimeSec: number;
}

export interface ChainCapabilities {
  wallet: boolean;
  tokenDiscovery: boolean;
  tokenRisk: boolean;
  priceData: boolean;
  liquidityDiscovery: boolean;
  swap: boolean;
  smartRouting: boolean;
  simulation: boolean;
  portfolio: boolean;
  history: boolean;
  mevProtection: boolean;
  crossChain: boolean;
  zenithLiquidity: boolean;
  api: boolean;
  sdk: boolean;
  supportsEIP1559?: boolean;
  supportsPermit2?: boolean;
  supportsFlashbots?: boolean;
  supportsSimulation?: boolean;
  supportsBatchTransactions?: boolean;
  hasSubSecondBlocks?: boolean;
  requiresSpecificGasPriceOracle?: boolean;
}

export interface RegulatoryScopeFlags {
  jurisdictionGated: boolean;
  blockedRegions?: string[];
  tokenizedSecuritiesPresent?: boolean;
  requiresAccreditationNotice?: boolean;
}

export interface ChainConfig {
  id: string;
  chainId?: number;
  canonicalName: string;
  shortName: string;
  executionEnvironment: ExecutionEnvironment;
  category: NetworkCategory;
  tier: NetworkSupportTier;
  operationalStatus: OperationalStatus;
  supportedStandards: string[];
  nativeCurrency: NativeCurrency;
  rpcEndpoints: ChainRPCConfig[];
  explorer: ChainExplorerConfig;
  finality: FinalityConfig;
  capabilities: ChainCapabilities;
  regulatoryScope: RegulatoryScopeFlags;
  liquidityMaturity: 'DEEP' | 'GROWING' | 'EMERGING' | 'EXPERIMENTAL';
  productionStatus: 'ACTIVE' | 'BETA' | 'MAINTENANCE' | 'PLANNED';
  color: string;
  iconURI: string;
  defaultTokens?: Token[];
}

export type VerificationTier = 'VERIFIED_CANONICAL' | 'COMMUNITY_VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS';

export interface TokenSecurityProfile {
  isHoneypot: boolean;
  buyTaxPercent: number;
  sellTaxPercent: number;
  transferTaxPercent: number;
  canBlacklist: boolean;
  canMintArbitrary: boolean;
  isProxy: boolean;
  liquidityLockedPercent: number;
  holderConcentrationTop10Percent: number;
  hasMaliciousPatterns: boolean;
  riskScore: number;
  warnings: string[];
}

export interface Token {
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  wrappedAddress?: string;
  enabled?: boolean;
  priceUSD?: number;
  change24hUSD?: number;
  volume24hUSD?: number;
  verificationTier: VerificationTier;
  securityProfile?: TokenSecurityProfile;
  isNative?: boolean;
  tags?: string[];
}

export interface UnsupportedTokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
  supportedNetworks: string[];
  reason: string;
}

export type DEXProtocol =
  | 'UNISWAP_V2'
  | 'UNISWAP_V3'
  | 'UNISWAP_V4'
  | 'ZENITH_V4_CONCENTRATED'
  | 'ZENITH_DUTCH_INTENT'
  | 'CURVE'
  | 'BALANCER_V2'
  | 'AERODROME'
  | 'VELODROME'
  | 'CAMELOT'
  | 'QUICKSWAP'
  | 'PANCAKESWAP'
  | 'TRADER_JOE'
  | 'RAYDIUM'
  | 'ORCA_WHIRLPOOL'
  | 'METEORA'
  | 'ZENITH_INTERNAL_RFIS';

export type BridgeProtocol =
  | 'STARGATE'
  | 'ACROSS'
  | 'LIFI'
  | 'SOCKET'
  | 'CHAINLINK_CCIP'
  | 'DEBRIDGE_DLN'
  | 'WORMHOLE';

export interface RouteHop {
  dexProtocol: DEXProtocol;
  poolAddress: string;
  tokenIn: Token;
  tokenOut: Token;
  feeTierBps?: number;
  proportionPercent: number;
  estimatedGas: bigint | number;
}

export interface BridgeStep {
  bridgeProtocol: BridgeProtocol;
  sourceChainId: string;
  destinationChainId: string;
  tokenIn: Token;
  tokenOut: Token;
  estimatedTransferTimeSec: number;
  bridgeFeeUSD: number;
  securityRating: 'A+' | 'A' | 'B' | 'EXPERIMENTAL';
  relayerFee: string;
}

export interface SwapRoute {
  id: string;
  routeType: 'DIRECT' | 'MULTI_HOP' | 'SPLIT_ROUTE' | 'CROSS_CHAIN';
  hops: RouteHop[];
  bridgeStep?: BridgeStep;
  gasCostUSD: number;
  estimatedGasUnits: bigint | number;
}

export interface PriceImpact {
  percentage: number;
  level: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warningMessage?: string;
}

export interface ProtocolFee {
  feeBps: number;
  feeAmountRaw: string;
  feeAmountFormatted: string;
  feeUSD: number;
  treasuryRecipient: string;
}

export interface SwapFee {
  feeBps: number;
  feeAmountRaw: string;
  feeAmountFormatted: string;
  feeUSD: number;
}

export type TradeType = 'EXACT_INPUT' | 'EXACT_OUTPUT';

export interface ConstantProductPoolState {
  address: string;
  token0: Token;
  token1: Token;
  reserve0Raw: string;
  reserve1Raw: string;
  feeBps: number;
}

export interface ConcentratedPoolState {
  address: string;
  token0: Token;
  token1: Token;
  sqrtPriceX96Raw: string;
  currentTick: number;
  tickSpacing: number;
  liquidityRaw: string;
  feeTierBps: number;
}

export type SettlementState =
  | 'CREATED'
  | 'SIGNED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'FULFILLING'
  | 'DESTINATION_FILLED'
  | 'VERIFIED'
  | 'SETTLING'
  | 'SETTLED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface CrossChainIntent {
  orderId: string;
  sourceChainId: string;
  destinationChainId: string;
  sourceToken: Token;
  destinationToken: Token;
  sourceAmountRaw: string;
  minDestinationAmountRaw: string;
  recipient: string;
  deadline: number;
  nonce: number;
  userSignature?: string;
  status: SettlementState;
  solverId?: string;
  txHashSource?: string;
  txHashDestination?: string;
  createdAt: number;
}

export interface SolverFillQuote {
  solverId: string;
  solverName: string;
  destinationAmountRaw: string;
  destinationAmountFormatted: string;
  estimatedTimeSec: number;
  executionCostUSD: number;
  solverReputationScore: number;
  isGuaranteed: boolean;
}

export interface QuoteRequest {
  sourceChainId: string;
  destinationChainId: string;
  tokenIn: Token;
  tokenOut: Token;
  amountInRaw: string;
  amountOutRaw?: string;
  tradeType?: TradeType;
  slippageTolerancePercent: number;
  userWalletAddress?: string;
  recipientAddress?: string;
  mevProtectionEnabled?: boolean;
  gasPreset?: GasPreset;
  deadlineSeconds?: number;
}

export interface QuoteResponse {
  requestId: string;
  request: QuoteRequest;
  tradeType: TradeType;
  routes: SwapRoute[];
  bestRoute: SwapRoute;
  amountInRaw: string;
  amountInFormatted: string;
  amountOutRaw: string;
  amountOutFormatted: string;
  minimumReceivedRaw: string;
  minimumReceivedFormatted: string;
  maximumInputRaw?: string;
  maximumInputFormatted?: string;
  executionPrice: number;
  referencePrice?: number;
  priceImpact: PriceImpact;
  protocolFee: ProtocolFee;
  swapFee?: SwapFee;
  effectiveExecutionScore: number;
  quoteTimestamp: number;
  expiresAt: number;
  deadline: number;
  freshnessSeconds: number;
  simulationPreview?: SimulationResult;
  intent?: CrossChainIntent;
}

export interface TokenBalanceDelta {
  token: Token;
  deltaRaw: string;
  deltaFormatted: string;
  deltaUSD?: number;
  isIncoming: boolean;
}

export interface SimulationStateOverride {
  address: string;
  balanceOverride?: string;
  stateDiff?: Record<string, string>;
}

export interface SimulationRequest {
  chainId: string;
  fromAddress: string;
  toAddress: string;
  calldata: string;
  valueWei: string;
  stateOverrides?: SimulationStateOverride[];
}

export interface SimulationResult {
  isSuccess: boolean;
  gasUsed: number;
  revertReason?: string;
  balanceDeltas: TokenBalanceDelta[];
  approvalRequired: boolean;
  approvalTokenAddress?: string;
  approvalSpenderAddress?: string;
  approvalAmountRaw?: string;
  warnings: string[];
  simulationSource: 'NODE_ETH_CALL' | 'TENDERLY' | 'ALCHEMY' | 'LOCAL_OVERRIDE';
}

export type TransactionStatus =
  | 'IDLE'
  | 'QUOTE_REQUESTED'
  | 'QUOTED'
  | 'SIMULATING'
  | 'SIMULATED'
  | 'APPROVAL_NEEDED'
  | 'APPROVING'
  | 'APPROVED'
  | 'SIGNING'
  | 'SUBMITTING'
  | 'BROADCASTED'
  | 'CONFIRMING'
  | 'COMPLETED'
  | 'BRIDGE_SOURCE_CONFIRMED'
  | 'BRIDGE_IN_FLIGHT'
  | 'BRIDGE_DESTINATION_CONFIRMED'
  | 'FAILED'
  | 'REVERTED'
  | 'CANCELLED';

export interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'ACTIVE' | 'SUCCESS' | 'ERROR';
  txHash?: string;
  explorerUrl?: string;
  timestamp?: number;
  error?: string;
}

export interface ReceiptView {
  txHash: string;
  sourceChain: ChainConfig;
  destinationChain: ChainConfig;
  tokenIn: Token;
  tokenOut: Token;
  amountInFormatted: string;
  amountOutFormatted: string;
  amountOutUSD?: number;
  realizedPriceImpactPercent: number;
  realizedSlippagePercent: number;
  gasPaidUSD: number;
  protocolFeePaidUSD: number;
  effectiveExecutionScore: number;
  timestamp: number;
  status: 'COMPLETED' | 'REVERTED' | 'FAILED';
  revertReason?: string;
  explorerUrl: string;
  routeSummary: string;
  bridgeDetails?: {
    bridgeName: string;
    sourceTxHash: string;
    destTxHash?: string;
    elapsedSec: number;
  };
}

export interface CircuitBreakerState {
  isEmergencyPaused: boolean;
  pausedChains: string[];
  priceDeviationCapPercent: number;
  lastPausedTimestamp?: number;
  pauseReason?: string;
  authorizedPauseSigner: string;
}

export type SlippagePreset = 'AUTO' | '0.1%' | '0.5%' | '1.0%' | 'CUSTOM';
export type GasPreset = 'STANDARD' | 'FAST' | 'INSTANT';
export type MEVProtectionLevel = 'NONE' | 'FLASHBOTS_PRIVATE' | 'RPC_STEALTH';

export type WalletType =
  | 'METAMASK'
  | 'PHANTOM'
  | 'COINBASE'
  | 'RABBY'
  | 'OKX'
  | 'RAINBOW'
  | 'WALLETCONNECT'
  | 'INJECTED';

export interface WalletOption {
  id: WalletType;
  name: string;
  icon: string;
  isDetected: boolean;
  environment: 'EVM' | 'SOLANA' | 'MULTI';
  downloadUrl: string;
}

export interface UserPreferences {
  isProMode: boolean;
  theme: 'dark' | 'light';
  slippageTolerancePercent: number;
  slippagePreset: SlippagePreset;
  gasPreset: GasPreset;
  mevProtection: MEVProtectionLevel;
  allowPartialFills: boolean;
  autoApprovePermit2: boolean;
  expertModeUnlocked: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export interface ZenithNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'BRIDGE_UPDATE';
  timestamp: number;
  isRead: boolean;
  txHash?: string;
  chainId?: string;
  actionUrl?: string;
}

export interface ZenithPool {
  id: string;
  poolAddress: string;
  chainId: string;
  token0: Token;
  token1: Token;
  feeBps: number;
  tickSpacing: number;
  sqrtPriceX96: string;
  currentTick: number;
  liquidity: string;
  tvlUSD: number;
  volume24hUSD: number;
  volume7dUSD: number;
  fees24hUSD: number;
  aprPercent: number;
  hookAddress?: string;
  hookName?: string;
  isDynamicFee?: boolean;
}

export interface LPPosition {
  tokenId: string;
  poolId: string;
  token0: Token;
  token1: Token;
  feeBps: number;
  tickLower: number;
  tickUpper: number;
  priceLower: number;
  priceUpper: number;
  currentPrice: number;
  isInRange: boolean;
  liquidityRaw: string;
  depositedAmount0: string;
  depositedAmount1: string;
  depositedUSD: number;
  unclaimedFee0: string;
  unclaimedFee1: string;
  unclaimedFeeUSD: number;
  earnedAprPercent: number;
  createdAt: number;
}

export interface ConcentratedRange {
  minPrice: number;
  maxPrice: number;
  tickLower: number;
  tickUpper: number;
  isFullRange: boolean;
}

export interface DutchAuctionOrderIntent {
  orderId: string;
  userAddress: string;
  inputToken: Token;
  outputToken: Token;
  inputAmountRaw: string;
  startOutputAmountRaw: string;
  endOutputAmountRaw: string;
  decayStartTime: number;
  decayEndTime: number;
  recipient: string;
  nonce: number;
  signature?: string;
  status: 'PENDING' | 'FILLING' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  fillerAddress?: string;
  fillTxHash?: string;
  filledOutputRaw?: string;
}

export interface ProtocolAnalytics {
  totalValueLockedUSD: number;
  totalVolume24hUSD: number;
  totalVolume7dUSD: number;
  totalFees24hUSD: number;
  totalTransactions24h: number;
  activeLPsCount: number;
  topPools: ZenithPool[];
  topTokens: Token[];
  historicalVolume: Array<{ timestamp: number; volumeUSD: number; tvlUSD: number }>;
}

