/**
 * Input validation utilities to secure forms and prevent database data pollution,
 * string buffer overflows, or numeric overflows.
 */

/**
 * Validates that a value is a number, clamping it within a safe range.
 * Defaults to a safe min of 0 and max of 10000 to prevent database overflow.
 */
export function validateNumber(value: any, min = 0, max = 10000): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

/**
 * Validates a string, trimming it and slicing it to a safe maximum length.
 */
export function validateString(value: any, maxLen = 5000): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLen).trim();
}

/**
 * Validates a date string against the standard YYYY-MM-DD pattern.
 * Falls back to the current date if invalid.
 */
export function validateDate(value: any): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date().toISOString().split('T')[0];
  }
  return value;
}
