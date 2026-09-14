import { parseUnits, formatUnits } from 'ethers';

/**
 * Safely parses a human-readable token amount string or number into exact raw BigInt string
 * according to the token's decimal places, safely truncating excess fractional digits to prevent overflow.
 *
 * @param humanAmount - e.g. "1.0", "0.1", "2", 0.09784
 * @param decimals - Token decimal places, e.g. 18 for POL/ETH, 6 for USDT/USDC, 8 for WBTC
 * @returns Raw integer string, e.g. "1000000000000000000" for 1 POL (18 dec) or "1000000" for 1 USDT (6 dec)
 */
export function parseTokenUnits(humanAmount: string | number, decimals: number): string {
  if (humanAmount === undefined || humanAmount === null) return '0';
  
  const str = typeof humanAmount === 'number' ? humanAmount.toFixed(Math.min(decimals, 18)) : humanAmount.toString().trim();
  const clean = str.replace(/,/g, '');
  
  if (!clean || clean === '.' || clean === '0' || isNaN(Number(clean))) {
    return '0';
  }

  const [rawWhole = '0', rawFrac = ''] = clean.split('.');
  const whole = rawWhole === '' ? '0' : rawWhole.replace(/^0+(?=\d)/, '');
  const truncatedFrac = rawFrac.slice(0, decimals);
  const normalized = truncatedFrac.length > 0 ? `${whole}.${truncatedFrac}` : whole;

  try {
    return parseUnits(normalized, decimals).toString();
  } catch {
    // Safe integer fallback
    const paddedFrac = truncatedFrac.padEnd(decimals, '0');
    return (whole + paddedFrac).replace(/^0+/, '') || '0';
  }
}

/**
 * Safely formats a raw BigInt or integer string into a human-readable decimal string
 * according to the token's decimal places.
 *
 * @param rawAmount - Raw BigInt or string, e.g. "1000000" (for 6 dec) or 1000000000000000000n (for 18 dec)
 * @param decimals - Token decimal places (e.g. 6 or 18)
 * @returns Formatted human decimal string, e.g. "1.0" or "0.09784"
 */
export function formatTokenUnits(rawAmount: bigint | string | number, decimals: number): string {
  if (rawAmount === undefined || rawAmount === null) return '0.0';
  try {
    const rawBig = typeof rawAmount === 'bigint' ? rawAmount : BigInt(rawAmount.toString().split('.')[0] || '0');
    return formatUnits(rawBig, decimals);
  } catch {
    return '0.0';
  }
}

/**
 * Formats a human amount into an aesthetically clean, human-readable UI display string.
 */
export function formatDisplayAmount(amount: number, maxDecimals: number = 6): string {
  if (!amount || isNaN(amount) || amount <= 0) return '0.00';
  if (amount >= 1000) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (amount >= 1) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: Math.min(4, maxDecimals) });
  }
  if (amount >= 0.0001) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: maxDecimals });
  }
  return amount.toFixed(maxDecimals);
}
