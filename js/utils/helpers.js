/**
 * helpers.js — Core utility functions for Sri Vardhan's portfolio
 * 
 * Provides math helpers, event helpers, device detection,
 * and theme color mappings for Three.js scenes.
 */

// ─── Math Utilities ────────────────────────────────────────────────────────────

/**
 * Linear interpolation between two values.
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} factor - Interpolation factor (0 = start, 1 = end)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Clamp a value between a minimum and maximum.
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another.
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value in the output range
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  // Normalize the value from input range to 0-1, then scale to output range
  const normalized = (value - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

// ─── Event Utilities ───────────────────────────────────────────────────────────

/**
 * Debounce a function — delays execution until after `delay` ms of inactivity.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(null, args);
      timeoutId = null;
    }, delay);
  };

  // Allow manual cancellation
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle a function — ensures it fires at most once every `limit` ms.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum interval between calls in ms
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;

  return (...args) => {
    if (!inThrottle) {
      fn.apply(null, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        // Fire with the most recent arguments if any were queued
        if (lastArgs !== null) {
          fn.apply(null, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      // Store the latest call arguments so we don't miss the final invocation
      lastArgs = args;
    }
  };
}

// ─── Mouse / Input Utilities ───────────────────────────────────────────────────

/**
 * Get normalized mouse position from an event.
 * Returns values from -1 to 1 (center of viewport = 0,0).
 * @param {MouseEvent} event - Mouse event
 * @returns {{ x: number, y: number }} Normalized coordinates
 */
export function getMousePosition(event) {
  return {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1, // Inverted Y for Three.js convention
  };
}

// ─── Device Detection ──────────────────────────────────────────────────────────

/**
 * Detect if the current device supports touch input.
 * @returns {boolean} True if touch device
 */
export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

// ─── Theme Color Mappings ──────────────────────────────────────────────────────

/**
 * Theme color palettes for Three.js scenes.
 * Each color is a hex number (e.g. 0xFFB7C5) directly usable
 * with THREE.Color or as material/fog colors.
 */
const THEME_COLORS = {
  sakura: {
    fogColor:         0xF8F9F4,  // Light sage-white (matches --bg-primary)
    ambientColor:     0xEFF2E1,  // Soft olive ambient light
    directionalColor: 0xFFFFF5,  // Warm pale green-yellow sunlight
    accentColor:      0x8F9E5B,  // Moss green accent

    particleColor1:   0x8F9E5B,  // Olive green leaves/petals
    particleColor2:   0xA2B276,  // Sage green leaves/petals
    particleColor3:   0xCCD5AE,  // Pale green highlights

    waterColor:       0xEFF2E1,  // Sage green reflective pond
    groundColor:      0xF8F9F4,  // Light sage sand
    mountainColor:    0xE2E8C5,  // Moss mountains
    stoneColor:       0xCCD5AE,  // Mossy stones
  },

  midnight: {
    fogColor:         0x0A0A1A,  // Deep navy
    ambientColor:     0x2233AA,  // Royal blue
    directionalColor: 0xCCDDFF,  // Cool blue-white
    accentColor:      0x6C63FF,  // Electric indigo

    particleColor1:   0x6C63FF,  // Indigo
    particleColor2:   0x00D4FF,  // Cyan
    particleColor3:   0xA855F7,  // Purple

    waterColor:       0x0D0D2B,  // Midnight blue
    groundColor:      0x0A0A18,  // Near-black navy
    mountainColor:    0x151535,  // Dark indigo
    stoneColor:       0x1E1E40,  // Muted navy
  },

  forest: {
    fogColor:         0x0A140A,  // Deep forest black
    ambientColor:     0x2D5A3D,  // Forest green
    directionalColor: 0xE8F5E0,  // Soft green-white
    accentColor:      0x4ADE80,  // Emerald green

    particleColor1:   0x4ADE80,  // Bright green
    particleColor2:   0x22C55E,  // Medium green
    particleColor3:   0xBBF7D0,  // Mint

    waterColor:       0x0D2818,  // Dark swamp
    groundColor:      0x0F1A0F,  // Dark moss
    mountainColor:    0x1A3D20,  // Deep forest
    stoneColor:       0x2D4A33,  // Mossy stone
  },

  golden: {
    fogColor:         0x14100A,  // Warm dark brown
    ambientColor:     0x8B6914,  // Old gold
    directionalColor: 0xFFF8E1,  // Warm cream
    accentColor:      0xFFD700,  // Pure gold

    particleColor1:   0xFFD700,  // Gold
    particleColor2:   0xFFA500,  // Orange
    particleColor3:   0xFFF8DC,  // Cornsilk

    waterColor:       0x1A1508,  // Dark amber
    groundColor:      0x14100A,  // Dark bronze
    mountainColor:    0x2D2510,  // Bronze mountain
    stoneColor:       0x3D3318,  // Sandy stone
  },

  arctic: {
    fogColor:         0x0A1420,  // Icy dark blue
    ambientColor:     0x4A7A8A,  // Frosty teal
    directionalColor: 0xF0F8FF,  // Alice blue
    accentColor:      0x7DD3FC,  // Sky blue

    particleColor1:   0x7DD3FC,  // Light blue
    particleColor2:   0xE0F2FE,  // Ice white-blue
    particleColor3:   0xBAE6FD,  // Powder blue

    waterColor:       0x0C1825,  // Arctic deep
    groundColor:      0x1A2535,  // Frozen ground
    mountainColor:    0x2A3A50,  // Ice mountain
    stoneColor:       0x3A4A60,  // Glacier stone
  },

  sumi: {
    fogColor:         0x0A0A0A,  // Pure near-black
    ambientColor:     0x3A3A3A,  // Charcoal
    directionalColor: 0xE8E8E8,  // Off-white
    accentColor:      0xD4D4D4,  // Silver

    particleColor1:   0xD4D4D4,  // Light grey
    particleColor2:   0x888888,  // Medium grey
    particleColor3:   0xF5F5F5,  // Near-white

    waterColor:       0x111111,  // Ink black
    groundColor:      0x0D0D0D,  // Carbon
    mountainColor:    0x1A1A1A,  // Dark charcoal
    stoneColor:       0x2A2A2A,  // Graphite
  },

  ember: {
    fogColor:         0x140A0A,  // Dark ember
    ambientColor:     0x8B2500,  // Deep red
    directionalColor: 0xFFE0D0,  // Warm peach
    accentColor:      0xFF6B35,  // Burning orange

    particleColor1:   0xFF6B35,  // Orange flame
    particleColor2:   0xFF4444,  // Red ember
    particleColor3:   0xFFAA55,  // Amber glow

    waterColor:       0x1A0808,  // Dark lava
    groundColor:      0x140A08,  // Charred earth
    mountainColor:    0x2D1510,  // Volcanic rock
    stoneColor:       0x3D2018,  // Basalt
  },
};

/**
 * Get Three.js-compatible color values for a given theme.
 * Returns both the canonical keys (e.g. particleColor1) AND short aliases
 * (e.g. particle1) used by various 3D objects.
 *
 * @param {string} themeName - One of: sakura, midnight, forest, golden, arctic, sumi, ember
 * @returns {object} Color map with hex number values, or sakura as fallback
 */
export function getThemeColors(themeName) {
  const base = THEME_COLORS[themeName] || THEME_COLORS.sakura;

  // Provide short-form aliases expected by 3D object updateTheme() methods
  return {
    ...base,
    // Shorthand aliases
    particle1: base.particleColor1,
    particle2: base.particleColor2,
    particle3: base.particleColor3,
    water:     base.waterColor,
    ground:    base.groundColor,
    mountain:  base.mountainColor,
    stone:     base.stoneColor,
    accent:    base.accentColor,
    fog:       base.fogColor,
    mist:      base.particleColor2,  // Mist uses particle2 as fallback
  };
}
