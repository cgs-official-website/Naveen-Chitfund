/**
 * ChitTech Integer-Paise Precision Financial Math Utilities
 *
 * In accordance with financial software standards and ROSCA double-entry
 * bookkeeping, all monetary amounts are stored and calculated in integer paise
 * (1 Rupee = 100 Paise) to eliminate IEEE 754 floating-point drift.
 */

/**
 * Converts a Rupee amount (number or string representation) to integer paise.
 * Throws if the input is invalid or negative (unless allowNegative is true).
 *
 * @param {number|string} rupees
 * @param {boolean} [allowNegative=false]
 * @returns {number} Integer paise
 */
export function toPaise(rupees, allowNegative = false) {
  if (rupees === null || rupees === undefined || rupees === '') {
    throw new TypeError('Cannot convert null, undefined, or empty value to paise');
  }

  const num = Number(rupees);
  if (!Number.isFinite(num)) {
    throw new TypeError(`Invalid monetary value: "${rupees}" is not a finite number`);
  }

  if (!allowNegative && num < 0) {
    throw new RangeError(`Monetary value cannot be negative: ${num}`);
  }

  // Math.round eliminates binary floating-point representation artifacts (e.g. 19.99 * 100 = 1998.9999999999998)
  return Math.round(num * 100);
}

/**
 * Converts integer paise back to a 2-decimal formatted Rupee string.
 *
 * @param {number|bigint} paise
 * @returns {string} E.g., "1250.00"
 */
export function toRupees(paise) {
  if (paise === null || paise === undefined) {
    throw new TypeError('Cannot convert null or undefined paise to rupees');
  }

  const num = Number(paise);
  if (!Number.isSafeInteger(num)) {
    throw new TypeError(`Paise value must be a safe integer, got: ${paise}`);
  }

  return (num / 100).toFixed(2);
}

/**
 * Formats integer paise into Indian Numbering System currency representation (₹).
 * E.g., 50000000 paise -> "₹5,00,000.00"
 *
 * @param {number|bigint} paise
 * @param {boolean} [includeDecimals=true]
 * @returns {string}
 */
export function formatPaiseToINR(paise, includeDecimals = true) {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Deterministic integer division with remainder tracking.
 * Distributes an aggregate paise amount equally among N recipients,
 * allocating any leftover remainder paise to the final recipient.
 *
 * @param {number} totalPaise Total pool to divide
 * @param {number} count Number of recipients
 * @returns {{ baseSharePaise: number, remainderPaise: number, shares: number[] }}
 */
export function distributeIntegerPaise(totalPaise, count) {
  if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) {
    throw new RangeError(`totalPaise must be a non-negative integer, got ${totalPaise}`);
  }
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new RangeError(`count must be a positive integer, got ${count}`);
  }

  const baseSharePaise = Math.floor(totalPaise / count);
  const remainderPaise = totalPaise % count;

  const shares = new Array(count).fill(baseSharePaise);
  if (remainderPaise > 0) {
    // Statutary standard: remainder paise is assigned to the last ticket
    shares[count - 1] += remainderPaise;
  }

  // Verification invariant: sum of shares must strictly equal totalPaise
  const sum = shares.reduce((acc, v) => acc + v, 0);
  if (sum !== totalPaise) {
    throw new Error(`Integrity invariant failed: sum(${sum}) !== totalPaise(${totalPaise})`);
  }

  return { baseSharePaise, remainderPaise, shares };
}
