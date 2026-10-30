/**
 * GrievEase Money Utility
 *
 * RULE: All monetary amounts stored as integer paise (BIGINT). Never use floats.
 * ROUNDING: round-half-up to the nearest paisa (0.5 rounds UP, symmetric towards +∞).
 *           e.g. 0.5p → 1p, -0.5p → 0p (not -1p).
 * FORMATTING: Indian digit grouping (1,23,456.00) for EN/HI locales.
 * RECEIPTS: English amount-in-words only (e.g. "Rupees Five Hundred Twenty-Three and 50 paise Only").
 */

// ─── Types ─────────────────────────────────────────────────────────────────
/** Integer paise — the only unit allowed at rest and in transit */
export type Paise = number;

// ─── Rounding ───────────────────────────────────────────────────────────────
/**
 * Round-half-up: 0.5 always rounds towards positive infinity.
 * Use when converting fractional paise from rate × qty calculations.
 */
export function roundHalfUp(value: number): Paise {
  return Math.floor(value + 0.5);
}

// ─── Arithmetic helpers ─────────────────────────────────────────────────────
/** Multiply rate_paise × qty and round. Rate is already in paise. */
export function multiplyPaise(ratePaise: Paise, qty: number): Paise {
  return roundHalfUp(ratePaise * qty);
}

/** Per-sqft calc: ratePaisePerSqft × areaSqft */
export function perSqft(ratePaisePerSqft: Paise, areaSqft: number): Paise {
  return roundHalfUp(ratePaisePerSqft * areaSqft);
}

/** Apply a percentage (e.g. tax 18%) to an amount in paise. */
export function applyPercent(amountPaise: Paise, percent: number): Paise {
  return roundHalfUp(amountPaise * (percent / 100));
}

/** Cancellation fee: percent of deposit_paise. */
export function cancellationFee(depositPaise: Paise, percentRetained: number): Paise {
  return roundHalfUp(depositPaise * (percentRetained / 100));
}

// ─── Formatting ─────────────────────────────────────────────────────────────
/**
 * Format paise as Indian rupee string with Indian digit grouping.
 * 12345600 → "1,23,456.00"
 * Works for EN and HI (same digit grouping).
 */
export function formatPaise(paise: Paise, currencySymbol = '₹'): string {
  if (!Number.isInteger(paise)) {
    throw new TypeError(`formatPaise: expected integer paise, got ${paise}`);
  }
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const paiseRem = absPaise % 100;

  // Indian grouping: last 3 digits, then pairs
  const rupeesStr = String(rupees);
  let grouped: string;
  if (rupeesStr.length <= 3) {
    grouped = rupeesStr;
  } else {
    const last3 = rupeesStr.slice(-3);
    const rest = rupeesStr.slice(0, -3);
    const pairs = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = `${pairs},${last3}`;
  }

  const pStr = paiseRem.toString().padStart(2, '0');
  const formatted = `${currencySymbol}${grouped}.${pStr}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Raw Indian grouping without symbol (for exports and calculations).
 * 12345600 → "1,23,456.00"
 */
export function formatPaiseRaw(paise: Paise): string {
  return formatPaise(paise, '').trim();
}

/** Parse "₹1,23,456.00" → 12345600 paise (throws on invalid). */
export function parsePaiseFromString(str: string): Paise {
  const cleaned = str.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) throw new Error(`parsePaiseFromString: cannot parse "${str}"`);
  return roundHalfUp(num * 100);
}

// ─── Amount-in-words (English only, for receipts) ───────────────────────────
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function wordsUnder1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n]!;
  if (n < 100) return tens[Math.floor(n / 10)]! + (n % 10 !== 0 ? '-' + ones[n % 10]! : '');
  return ones[Math.floor(n / 100)]! + ' Hundred' + (n % 100 !== 0 ? ' ' + wordsUnder1000(n % 100) : '');
}

function rupeesToWords(n: number): string {
  if (n === 0) return 'Zero';
  let result = '';
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) result += wordsUnder1000(crore) + ' Crore ';
  if (lakh > 0) result += wordsUnder1000(lakh) + ' Lakh ';
  if (thousand > 0) result += wordsUnder1000(thousand) + ' Thousand ';
  if (n > 0) result += wordsUnder1000(n);

  return result.trim();
}

/**
 * Convert paise to English amount-in-words for receipts.
 * 12345678 → "Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and 78 Paise Only"
 */
export function amountInWords(paise: Paise): string {
  if (!Number.isInteger(paise) || paise < 0) {
    throw new TypeError(`amountInWords: expected non-negative integer paise, got ${paise}`);
  }
  const rupees = Math.floor(paise / 100);
  const paiseRem = paise % 100;

  const rupeePart = rupees === 0 ? 'Zero Rupees' : `Rupees ${rupeesToWords(rupees)}`;
  const paisePart = paiseRem > 0 ? ` and ${paiseRem} Paise` : '';
  return `${rupeePart}${paisePart} Only`;
}

// ─── Financial year helpers ─────────────────────────────────────────────────
/**
 * Given a date and the financial-year start month (1=Jan, 4=Apr default),
 * return the financial year label, e.g. "2026-27".
 */
export function financialYearLabel(date: Date, fyStartMonth: number = 4): string {
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();
  if (month >= fyStartMonth) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

/**
 * Financial year start and end dates for a given date.
 */
export function financialYearBounds(
  date: Date,
  fyStartMonth: number = 4,
): { start: Date; end: Date } {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= fyStartMonth ? year : year - 1;
  const endYear = startYear + 1;
  return {
    start: new Date(startYear, fyStartMonth - 1, 1),
    end: new Date(endYear, fyStartMonth - 1, 0, 23, 59, 59, 999),
  };
}

// ─── Receipt / Bill number formatting ───────────────────────────────────────
/**
 * Format a gapless sequence number as a receipt number.
 * RC/2026-27/000123
 */
export function formatReceiptNo(
  seq: number,
  fyLabel: string,
  prefix: string = 'RC',
  padLength: number = 6,
): string {
  return `${prefix}/${fyLabel}/${String(seq).padStart(padLength, '0')}`;
}

/**
 * Format a gapless bill number.
 * BILL/2026-27/000001
 */
export function formatBillNo(seq: number, fyLabel: string): string {
  return formatReceiptNo(seq, fyLabel, 'BILL', 6);
}
