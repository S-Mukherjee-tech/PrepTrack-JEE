/**
 * Simple client-side Rate Limiter utility to throttle high-frequency save or update actions,
 * mitigating local storage/IndexedDB quota write saturation and preventing DoS-like browser freezes.
 */
export class RateLimiter {
  private lastCall = 0;
  private minDelay: number;

  constructor(minDelayMs = 1000) {
    this.minDelay = minDelayMs;
  }

  /**
   * Throttles the execution of a function. If called within the `minDelay` window,
   * it skips executing the function and returns null, protecting resources.
   */
  async throttle<T>(fn: () => Promise<T> | T): Promise<T | null> {
    const now = Date.now();
    if (now - this.lastCall < this.minDelay) {
      console.warn('Rate limit exceeded, skipping save operation to avoid storage saturation');
      return null;
    }
    this.lastCall = now;
    return fn();
  }
}
