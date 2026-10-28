// Money utilities – all amounts stored as integer minor units (cents)
// Only converted to string with 2 decimals at display / PayPal boundary

/**
 * Format minor units to display string
 * e.g., 12599 → "$125.99"
 */
export function formatMoney(amountMinor: number, currency: string = 'USD'): string {
  const major = Math.abs(amountMinor) / 100;
  const sign = amountMinor < 0 ? '-' : '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return sign + formatter.format(major);
}

/**
 * Format minor units to PayPal-compatible string (no currency symbol)
 * e.g., 12599 → "125.99"
 */
export function toPayPalAmount(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

/**
 * Parse a dollar string to minor units
 * e.g., "125.99" → 12599
 */
export function parseToCents(dollarString: string): number {
  const cleaned = dollarString.replace(/[^0-9.-]/g, '');
  return Math.round(parseFloat(cleaned) * 100);
}

/**
 * Format a compact money amount for chips
 * e.g., 1500000 → "$15K"
 */
export function formatMoneyCompact(amountMinor: number, currency: string = 'USD'): string {
  const major = amountMinor / 100;
  
  if (major >= 1_000_000) {
    return `$${(major / 1_000_000).toFixed(1)}M`;
  }
  if (major >= 1_000) {
    return `$${(major / 1_000).toFixed(major % 1000 === 0 ? 0 : 1)}K`;
  }
  return formatMoney(amountMinor, currency);
}

/**
 * Calculate percentage of pool
 */
export function percentOfPool(amountMinor: number, poolMinor: number): string {
  if (poolMinor === 0) return '0%';
  return ((amountMinor / poolMinor) * 100).toFixed(1) + '%';
}
