import { ConfigurationError } from '../errors';

/**
 * ZENITH Treasury & Protocol Fee Recipient Registry
 *
 * HARD REQUIREMENT:
 * The project owner does NOT have deployed ZENITH treasury addresses.
 * All addresses remain strictly UNDEFINED.
 * Never invent, mock, or substitute zero/dead/random addresses.
 * Any operation requiring a treasury address must fail closed with ConfigurationError.
 */
export const ZENITH_TREASURY: Record<string | number, string | undefined> = {
  1: undefined,
  10: undefined,
  56: undefined,
  137: undefined,
  8453: undefined,
  42161: undefined,
  43114: undefined,
  solana: undefined
};

export const ZENITH_PROTOCOL_FEE_RECIPIENT: Record<string | number, string | undefined> = {
  1: undefined,
  10: undefined,
  56: undefined,
  137: undefined,
  8453: undefined,
  42161: undefined,
  43114: undefined,
  solana: undefined
};

export function getZenithTreasury(chainId: string | number): string {
  const address = ZENITH_TREASURY[chainId];
  if (!address) {
    throw new ConfigurationError(
      `ZENITH Treasury address is not configured for chain ${chainId}. Protocol fee collection cannot proceed.`,
      'ZENITH_TREASURY_NOT_CONFIGURED'
    );
  }
  return address;
}

export const getZenithTreasuryAddress = getZenithTreasury;


export function getZenithProtocolFeeRecipient(chainId: string | number): string {
  const address = ZENITH_PROTOCOL_FEE_RECIPIENT[chainId];
  if (!address) {
    throw new ConfigurationError(
      `ZENITH Protocol Fee Recipient is not configured for chain ${chainId}.`,
      'ZENITH_FEE_RECIPIENT_NOT_CONFIGURED'
    );
  }
  return address;
}

export function isZenithTreasuryConfigured(chainId: string | number): boolean {
  return Boolean(ZENITH_TREASURY[chainId]);
}
