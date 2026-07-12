/**
 * Secure PrepTrack Utility functions for performance, XSS mitigation,
 * Prototype Pollution protection, and Denial of Service defenses.
 */

/**
 * Escapes HTML special characters and strips out dangerous script tag injections,
 * javascript: protocols, and event handlers to mitigate Cross-Site Scripting (XSS).
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return input ? String(input) : '';
  }

  // 1. Strip valid HTML tags completely while preserving mathematical inequality operators (e.g., < or >)
  let clean = input.replace(/<[a-zA-Z\/][^>]*>/g, '');

  // 2. Remove common malicious XSS patterns and script references
  clean = clean.replace(/javascript\s*:/gi, '[safe-protocol]:');
  clean = clean.replace(/onload\s*=/gi, 'x-onload=');
  clean = clean.replace(/onerror\s*=/gi, 'x-onerror=');
  clean = clean.replace(/onclick\s*=/gi, 'x-onclick=');
  clean = clean.replace(/onmouseover\s*=/gi, 'x-onmouseover=');

  return clean;
}

/**
 * Recursively removes proto pollution keys (__proto__, constructor, prototype)
 * from objects to secure the applet from malicious client state injections.
 */
export function cleanObjectPrototype<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectPrototype(item)) as unknown as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop prototype pollution vectors immediately
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (value && typeof value === 'object') {
      cleaned[key] = cleanObjectPrototype(value);
    } else if (typeof value === 'string') {
      cleaned[key] = sanitizeInput(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}

/**
 * Secure alternative to JSON.parse that protects against Prototype Pollution attacks
 * and safely falls back to a default value rather than crashing the interface.
 */
export function secureJsonParse<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) return defaultValue;

  try {
    const parsed = JSON.parse(jsonStr);
    return cleanObjectPrototype(parsed) as T;
  } catch (err) {
    console.error('Secure JSON parsing failure intercepted:', err);
    return defaultValue;
  }
}

/**
 * Limits input size to prevent memory-bloat or LocalStorage exhaustion.
 * Prevents clients from saving massive payload blocks that could trigger browser crashes.
 */
export function limitStringLength(input: string, maxLen = 10000): string {
  if (!input) return '';
  if (input.length <= maxLen) return input;
  return input.substring(0, maxLen) + '... [truncated for storage protection]';
}

/**
 * Safely runs a function inside a requestIdleCallback or falls back to setTimeout
 * to ensure that lightweight background operations do not impact main thread scroll smoothness.
 */
export function runLowPriorityTask(callback: () => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => callback(), { timeout: 2000 });
  } else {
    setTimeout(callback, 50);
  }
}
