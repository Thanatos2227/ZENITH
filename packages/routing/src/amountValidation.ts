/**
 * ZENITH — Universal Multi-Chain DEX & Execution Platform
 * Amount Validation & Truncation Module
 *
 * Enforces strict input validation, truncation (no rounding), and safety limits
 * across swap amount fields and execution calculations.
 */

export const MAX_SWAP_AMOUNT_STR = '9999999.999';
export const MAX_SWAP_AMOUNT_NUM = 9999999.999;
export const MAX_DECIMAL_PLACES = 3;
export const MAX_INTEGER_DIGITS = 7; // Maximum integer portion: 9,999,999 (7 digits)

export interface AmountValidationResult {
  isValid: boolean;
  sanitized: string;
  numericValue: number;
  error?: string;
  isTruncated: boolean;
}

/**
 * Validates and sanitizes a swap amount input string according to strict Zenith rules:
 * 1. Maximum allowed amount: 9,999,999.999
 * 2. Maximum decimal precision: 3 decimal places
 * 3. Decimal handling MUST TRUNCATE, NOT ROUND (e.g. 1.1119 -> 1.111)
 * 4. Integer portion exceeding 9,999,999 is rejected (e.g. 10000000 -> reject)
 * 5. Preserves normal typing states (empty, trailing dot "1.", leading dot ".")
 * 6. Uses string-based manipulation to eliminate floating-point precision loss.
 */
export function validateAndSanitizeAmount(rawInput: string): AmountValidationResult {
  if (rawInput === undefined || rawInput === null) {
    return { isValid: true, sanitized: '', numericValue: 0, isTruncated: false };
  }

  const trimmed = rawInput.trim();
  if (trimmed === '') {
    return { isValid: true, sanitized: '', numericValue: 0, isTruncated: false };
  }

  // Remove digit-grouping commas (e.g. 9,999,999.999 -> 9999999.999)
  const withoutCommas = trimmed.replace(/,/g, '');

  // Reject scientific notation, negative numbers, or invalid signs
  if (/[eE+-]/.test(withoutCommas)) {
    return {
      isValid: false,
      sanitized: '',
      numericValue: 0,
      error: 'Invalid characters in amount',
      isTruncated: false
    };
  }

  // Reject multiple decimal points
  const dotCount = (withoutCommas.match(/\./g) || []).length;
  if (dotCount > 1) {
    return {
      isValid: false,
      sanitized: '',
      numericValue: 0,
      error: 'Multiple decimal points are not allowed',
      isTruncated: false
    };
  }

  // Handle single dot during typing ("." -> "0.")
  let working = withoutCommas;
  if (working === '.') {
    return {
      isValid: true,
      sanitized: '0.',
      numericValue: 0,
      isTruncated: false
    };
  }

  if (working.startsWith('.')) {
    working = '0' + working;
  }

  // Must only contain digits and optionally one decimal point
  if (!/^\d+(\.\d*)?$/.test(working)) {
    return {
      isValid: false,
      sanitized: '',
      numericValue: 0,
      error: 'Invalid numeric format',
      isTruncated: false
    };
  }

  const hasTrailingDot = working.endsWith('.');
  const [rawInteger, rawFractional] = working.split('.');

  // Normalize integer portion (strip redundant leading zeros, keeping "0" if zero)
  const normalizedInteger = rawInteger.replace(/^0+/, '') || '0';

  // Rule 4: If the integer portion exceeds 9,999,999 (7 digits), REJECT
  // e.g. 10000000 (8 digits) -> reject, 99999999 (8 digits) -> reject
  if (normalizedInteger.length > MAX_INTEGER_DIGITS) {
    return {
      isValid: false,
      sanitized: '',
      numericValue: 0,
      error: 'Amount exceeds maximum allowed limit of 9,999,999.999',
      isTruncated: false
    };
  }

  if (BigInt(normalizedInteger) > 9999999n) {
    return {
      isValid: false,
      sanitized: '',
      numericValue: 0,
      error: 'Amount exceeds maximum allowed limit of 9,999,999.999',
      isTruncated: false
    };
  }

  let isTruncated = false;
  let sanitizedFractional: string | undefined = undefined;

  if (rawFractional !== undefined) {
    // Rule 3: Truncate fractional portion to at most 3 digits. NEVER ROUND.
    if (rawFractional.length > MAX_DECIMAL_PLACES) {
      sanitizedFractional = rawFractional.slice(0, MAX_DECIMAL_PLACES);
      isTruncated = true;
    } else {
      sanitizedFractional = rawFractional;
    }
  }

  // Construct sanitized string representation
  let sanitized = normalizedInteger;
  if (hasTrailingDot && (sanitizedFractional === undefined || sanitizedFractional === '')) {
    sanitized += '.';
  } else if (sanitizedFractional !== undefined && sanitizedFractional !== '') {
    sanitized += '.' + sanitizedFractional;
  }

  const numericValue = parseFloat(sanitized) || 0;

  // Rule 5: Maximum valid value is exactly 9999999.999
  if (numericValue > MAX_SWAP_AMOUNT_NUM) {
    return {
      isValid: false,
      sanitized: '',
      numericValue: 0,
      error: 'Amount exceeds maximum allowed limit of 9,999,999.999',
      isTruncated: false
    };
  }

  return {
    isValid: true,
    sanitized,
    numericValue,
    isTruncated
  };
}

/**
 * Truncates a number or string representation to at most 3 decimal places without rounding.
 * Caps at MAX_SWAP_AMOUNT_NUM (9999999.999).
 */
export function truncateToThreeDecimals(val: number | string): string {
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return '0.0';
    if (val > MAX_SWAP_AMOUNT_NUM) return MAX_SWAP_AMOUNT_STR;
    // Format without scientific notation for standard numbers
    const fixedStr = val.toFixed(8);
    const [whole = '0', frac = ''] = fixedStr.split('.');
    const truncatedFrac = frac.slice(0, MAX_DECIMAL_PLACES);
    return truncatedFrac ? `${whole}.${truncatedFrac}` : whole;
  }

  const [whole = '0', frac = ''] = val.trim().replace(/,/g, '').split('.');
  if (BigInt(whole.replace(/^0+/, '') || '0') > 9999999n) {
    return MAX_SWAP_AMOUNT_STR;
  }
  if (!frac) return whole;
  const truncatedFrac = frac.slice(0, MAX_DECIMAL_PLACES);
  return truncatedFrac ? `${whole}.${truncatedFrac}` : whole;
}
