/**
 * Input sanitization helpers to guard against XSS, script injection, and header injection.
 */

/**
 * Strips HTML tags and script elements from a string.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validates and normalizes an email address.
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim().toLowerCase();
  // Standard RFC 5322 simplified email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleaned)) return null;
  return cleaned;
}

/**
 * Sanitizes alphanumeric identifiers (e.g. squad IDs, user IDs).
 */
export function sanitizeId(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

/**
 * Sanitizes numeric inputs safely.
 */
export function sanitizeNumber(input: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const num = Number(input);
  if (isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
}
