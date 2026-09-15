// SPDX-License-Identifier: MIT

export const ZENITH_TREASURY_ABI = [
  'function governance() external view returns (address)',
  'function pendingGovernance() external view returns (address)',
  'function isEmergencyPaused() external view returns (bool)',
  'function cumulativeFeesCollected(address token) external view returns (uint256)',
  'function getTreasuryBalance(address token) external view returns (uint256)',
  'function getCollectedFees(address token) external view returns (uint256)',
  'function depositFee(address token, uint256 amount) external',
  'function withdraw(address token, address payable recipient, uint256 amount) external',
  'function rescueToken(address token, address payable recipient, uint256 amount) external',
  'function setEmergencyPause(bool paused) external',
  'function transferGovernance(address newGovernance) external',
  'function acceptGovernance() external',
  'event FeeReceived(address indexed token, address indexed from, uint256 amount)',
  'event TreasuryWithdrawal(address indexed token, address indexed recipient, uint256 amount)'
];

export const ZENITH_FEE_CONTROLLER_ABI = [
  'function governance() external view returns (address)',
  'function treasury() external view returns (address)',
  'function protocolFeeBps() external view returns (uint256)',
  'function crossChainFeeBps() external view returns (uint256)',
  'function v1TotalFeeBps() external view returns (uint256)',
  'function isV2FeeTierAllowed(uint24 feeTierBps) external view returns (bool)',
  'function isV3FeeTierAllowed(uint24 feeTier) external view returns (bool)',
  'function v3TickSpacings(uint24 feeTier) external view returns (int24)',
  'function setProtocolFeeBps(uint256 newFeeBps) external',
  'function setCrossChainFeeBps(uint256 newFeeBps) external',
  'function setTreasury(address newTreasury) external',
  'function configureV2FeeTier(uint24 feeTierBps, bool allowed) external',
  'function configureV3FeeTier(uint24 feeTier, int24 tickSpacing, bool allowed) external',
  'function transferGovernance(address newGovernance) external',
  'function acceptGovernance() external'
];

export const ZENITH_FEE_CONTROLLERS: Record<number, string> = {
  1: '0x8000000000000000000000000000000000000001',
  10: '0x8000000000000000000000000000000000000010',
  56: '0x8000000000000000000000000000000000000056',
  137: '0x8000000000000000000000000000000000000137',
  8453: '0x8000000000000000000000000000000000008453',
  42161: '0x8000000000000000000000000000000000042161',
  43114: '0x8000000000000000000000000000000000043114'
};

export function getZenithFeeController(chainId: number): string | undefined {
  return ZENITH_FEE_CONTROLLERS[chainId];
}

