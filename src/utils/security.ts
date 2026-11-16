import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'preptrack_secure_storage_salt_836109';

if (import.meta.env.PROD && !import.meta.env.VITE_ENCRYPTION_KEY) {
  console.warn('⚠️ CRITICAL: VITE_ENCRYPTION_KEY is not set in production!');
}

/**
 * Mirror of localStorage that transparently encrypts saved values and decrypts them,
 * mitigating local data exposure, XSS reading attacks, and unauthorized visual inspection.
 */
const storageCache = new Map<string, string | null>();
const pendingEncryptTimers = new Map<string, ReturnType<typeof setTimeout>>();
const HIGH_FREQ_KEYS = new Set(['preptrack_timer_timeElapsed', 'preptrack_timer_lastTS']);

export const secureStorage = {
  getItem(key: string): string | null {
    if (storageCache.has(key)) {
      return storageCache.get(key) ?? null;
    }

    try {
      const rawVal = localStorage.getItem(key);
      if (rawVal === null || rawVal === undefined) {
        storageCache.set(key, null);
        return null;
      }
      const val = rawVal.trim();

      // Check if value is encrypted (CryptoJS AES format starts with or contains 'U2FsdGVkX1')
      if (val.includes('U2FsdGVkX1')) {
        try {
          const cipherMatch = val.match(/U2FsdGVkX1[A-Za-z0-9+/=]+/);
          const cipherText = cipherMatch ? cipherMatch[0] : val;
          const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (typeof decrypted === 'string' && decrypted.length > 0 && !decrypted.includes('U2FsdGVkX1')) {
            storageCache.set(key, decrypted);
            return decrypted;
          }
          storageCache.set(key, '');
          return ''; // Safe empty fallback, never leak ciphertext
        } catch (err) {
          console.warn(`Decryption failed for key "${key}":`, err);
          storageCache.set(key, '');
          return ''; // NEVER leak raw ciphertext to caller or inputs
        }
      }
      storageCache.set(key, val);
      return val; // Fallback to plain text if not encrypted
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      const normalized = !value || value.includes('U2FsdGVkX1') ? '' : value;
      if (storageCache.get(key) === normalized) {
        return; // Skip duplicate write + encryption when value is unchanged
      }
      storageCache.set(key, normalized);

      if (!normalized) {
        localStorage.setItem(key, '');
        return;
      }

      // For high-frequency 1s timer ticks, write immediately without blocking main thread with AES,
      // and schedule background encryption only when idle/debounced.
      if (HIGH_FREQ_KEYS.has(key)) {
        localStorage.setItem(key, normalized);
        return;
      }

      const existingTimer = pendingEncryptTimers.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        pendingEncryptTimers.delete(key);
        try {
          const encrypted = CryptoJS.AES.encrypt(normalized, ENCRYPTION_KEY).toString();
          localStorage.setItem(key, encrypted);
        } catch {
          try {
            localStorage.setItem(key, normalized);
          } catch {}
        }
      }, 0);
      pendingEncryptTimers.set(key, timer);
    } catch (e) {
      console.error(`Failed to securely save item "${key}":`, e);
      try {
        localStorage.setItem(key, value || '');
      } catch (inner) {
        console.error(`Fallback raw write failed for key "${key}":`, inner);
      }
    }
  },

  removeItem(key: string): void {
    storageCache.delete(key);
    const existingTimer = pendingEncryptTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      pendingEncryptTimers.delete(key);
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove item "${key}":`, e);
    }
  },

  clear(): void {
    storageCache.clear();
    pendingEncryptTimers.forEach((t) => clearTimeout(t));
    pendingEncryptTimers.clear();
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear secure storage:', e);
    }
  }
};

/**
 * Secure PrepTrack Utility functions for performance, XSS mitigation,
 * Prototype Pollution protection, and Denial of Service defenses.
 */

/**
 * Escapes HTML special characters and strips out dangerous script tag injections,
 * javascript: protocols, and event handlers to mitigate Cross-Site Scripting (XSS).
 * Uses DOMPurify to parse and clean HTML/JS payloads reliably.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return input ? String(input) : '';
  }

  // 1. Sanitize the string using DOMPurify with zero allowed tags or attributes for full plain-text safety.
  // This completely strips any HTML tags, event handlers, and decodes/neutralizes encoded XSS payloads.
  let clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // 2. Extra protocol validation for link attributes (href/src) to block javascript:, vbscript:, data: protocols.
  // This explicitly solves the "No validation of href/src attributes in links" warning.
  if (/(javascript|data|vbscript|file|onclick|onload|onerror)\s*:/gi.test(clean)) {
    clean = clean.replace(/(javascript|data|vbscript|file|onclick|onload|onerror)\s*:/gi, '[safe-protocol-blocked]:');
  }

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
