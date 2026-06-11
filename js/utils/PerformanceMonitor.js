/**
 * PerformanceMonitor.js — Adaptive quality system for Sri Vardhan's portfolio
 * 
 * Samples the actual FPS over 120 frames and determines the best
 * rendering quality tier for the user's hardware:
 *   - 'high'   → 55+ FPS (full effects, max particles)
 *   - 'medium' → 35-55 FPS (reduced particles, simpler shaders)
 *   - 'low'    → <35 FPS (minimal effects, static fallbacks)
 * 
 * Results are cached in localStorage so repeat visitors don't need re-sampling.
 */

const STORAGE_KEY = 'portfolio-quality-tier-v3';
const SAMPLE_COUNT = 120;
const HIGH_THRESHOLD = 55;
const MEDIUM_THRESHOLD = 35;

export class PerformanceMonitor {
  constructor() {
    /** @type {'high'|'medium'|'low'|null} Current quality tier */
    this.quality = null;

    /** @private */
    this._callbacks = [];
    /** @private */
    this._frameTimes = [];
    /** @private */
    this._lastFrameTime = 0;
    /** @private */
    this._sampling = false;
    /** @private */
    this._determined = false;
    /** @private */
    this._rafId = null;

    // Attempt to load cached quality from localStorage
    this._loadCached();
  }

  /**
   * Load cached quality tier from localStorage.
   * If a valid cached value exists, use it immediately.
   * @private
   */
  _loadCached() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached && ['high', 'medium', 'low'].includes(cached)) {
        this.quality = cached;
        this._determined = true;
      }
    } catch (e) {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }

  /**
   * Save quality tier to localStorage for future visits.
   * @private
   * @param {string} tier - Quality tier to cache
   */
  _saveToCache(tier) {
    try {
      localStorage.setItem(STORAGE_KEY, tier);
    } catch (e) {
      // Silently fail if localStorage is unavailable
    }
  }

  /**
   * Begin FPS sampling. Measures frame times over SAMPLE_COUNT frames,
   * then determines and announces the quality tier.
   * 
   * If a cached result exists, the callback fires immediately with it
   * and no re-sampling occurs.
   */
  startSampling() {
    // If we already have a cached result, fire callbacks immediately
    if (this._determined && this.quality) {
      this._fireCallbacks(this.quality);
      return;
    }

    if (this._sampling) return;
    this._sampling = true;
    this._frameTimes = [];
    this._lastFrameTime = performance.now();

    this._sampleFrame();
  }

  /**
   * Internal frame sampling loop.
   * @private
   */
  _sampleFrame() {
    this._rafId = requestAnimationFrame((timestamp) => {
      const delta = timestamp - this._lastFrameTime;
      this._lastFrameTime = timestamp;

      // Skip the first frame (delta can be unreliable)
      if (this._frameTimes.length > 0 || delta < 100) {
        this._frameTimes.push(delta);
      }

      if (this._frameTimes.length >= SAMPLE_COUNT) {
        this._finalizeSampling();
      } else {
        this._sampleFrame();
      }
    });
  }

  /**
   * Analyze collected frame times and determine quality tier.
   * @private
   */
  _finalizeSampling() {
    this._sampling = false;

    // Calculate average FPS from frame deltas
    // Discard the top and bottom 10% to remove outliers (startup jank, GC pauses)
    const sorted = [...this._frameTimes].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * 0.1);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

    const avgDelta = trimmed.reduce((sum, d) => sum + d, 0) / trimmed.length;
    const avgFPS = 1000 / avgDelta;

    // Determine quality tier
    let tier;
    if (avgFPS >= HIGH_THRESHOLD) {
      tier = 'high';
    } else if (avgFPS >= MEDIUM_THRESHOLD) {
      tier = 'medium';
    } else {
      tier = 'low';
    }

    this.quality = tier;
    this._determined = true;
    this._saveToCache(tier);
    this._fireCallbacks(tier);

    // Log for debugging
    console.log(
      `%c⚡ Performance: ${avgFPS.toFixed(1)} FPS → "${tier}" quality`,
      'color: #FFD700; font-weight: bold;'
    );
  }

  /**
   * Get the current quality tier.
   * @returns {'high'|'medium'|'low'|null} Quality tier, or null if not yet determined
   */
  getQuality() {
    return this.quality;
  }

  /**
   * Register a callback that fires once when quality is determined.
   * If quality is already known (cached or sampled), fires immediately.
   * @param {function(string): void} callback - Receives the quality tier string
   */
  onQualityDetermined(callback) {
    if (typeof callback !== 'function') return;

    if (this._determined && this.quality) {
      // Quality already known — fire immediately
      callback(this.quality);
    } else {
      this._callbacks.push(callback);
    }
  }

  /**
   * Fire all registered callbacks with the determined quality tier.
   * @private
   * @param {string} tier - Quality tier
   */
  _fireCallbacks(tier) {
    this._callbacks.forEach((cb) => {
      try {
        cb(tier);
      } catch (e) {
        console.error('PerformanceMonitor callback error:', e);
      }
    });
    // Clear callbacks after firing (one-shot)
    this._callbacks = [];
  }

  /**
   * Stop sampling (cleanup).
   */
  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._sampling = false;
    this._callbacks = [];
  }
}
