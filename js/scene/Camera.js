/**
 * Camera.js
 * =========
 * Scroll-driven cinematic camera system.
 *
 * Defines a spline-like keyframe path through the 3D zen garden scene.
 * As the user scrolls, `updateFromScroll(progress)` interpolates between
 * keyframes with cubic easing for buttery-smooth transitions.
 *
 * Mouse parallax adds a subtle organic feel — the camera sways ±0.5 units
 * based on pointer position.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Camera path keyframes                                              */
/* ------------------------------------------------------------------ */

/**
 * Each keyframe defines a scroll percentage, camera position, and lookAt target.
 * The camera smoothly interpolates between consecutive keyframes.
 */
const KEYFRAMES = [
  { t: 0.00, pos: new THREE.Vector3(0,  30,  50),  look: new THREE.Vector3(0,  0,    0)  },  // High overview
  { t: 0.15, pos: new THREE.Vector3(0,  15,  35),  look: new THREE.Vector3(0,  5,    0)  },  // Descending
  { t: 0.30, pos: new THREE.Vector3(-10, 8,  20),  look: new THREE.Vector3(0,  5,   -5)  },  // Near lantern
  { t: 0.45, pos: new THREE.Vector3(0,   5,   5),  look: new THREE.Vector3(0,  5,  -15)  },  // Through torii
  { t: 0.60, pos: new THREE.Vector3(5,  10, -10),  look: new THREE.Vector3(0,  8,  -20)  },  // Floating stones
  { t: 0.75, pos: new THREE.Vector3(-5,  6, -25),  look: new THREE.Vector3(0,  4,  -35)  },  // Ink/manga
  { t: 0.85, pos: new THREE.Vector3(0,   8, -35),  look: new THREE.Vector3(0,  5,  -45)  },  // Timeline
  { t: 1.00, pos: new THREE.Vector3(0,   3, -45),  look: new THREE.Vector3(0,  2,  -55)  },  // Serene pond
];

/* ------------------------------------------------------------------ */
/*  Easing helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Cubic ease-in-out for smoother keyframe transitions.
 * Maps [0,1] → [0,1] with gentle acceleration and deceleration.
 */
function cubicEaseInOut(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ------------------------------------------------------------------ */
/*  Camera class                                                       */
/* ------------------------------------------------------------------ */

export class Camera {
  /**
   * @param {number} [aspect=16/9] - Initial aspect ratio
   */
  constructor(aspect = 16 / 9) {
    // --- Create the perspective camera ---
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);

    // Set initial position to first keyframe
    this.camera.position.copy(KEYFRAMES[0].pos);
    this.camera.lookAt(KEYFRAMES[0].look);

    // --- Parallax state ---
    this._parallaxOffset = new THREE.Vector3();
    this._targetParallaxOffset = new THREE.Vector3();
    this._parallaxStrength = 0.5; // Max ±0.5 units

    // --- Interpolation temporaries (avoid per-frame allocation) ---
    this._interpPos = new THREE.Vector3();
    this._interpLook = new THREE.Vector3();

    // --- Current scroll progress ---
    this._scrollProgress = 0;
  }

  /* ---------------------------------------------------------------- */
  /*  Scroll-driven update                                             */
  /* ---------------------------------------------------------------- */

  /**
   * Interpolate camera position and lookAt target based on scroll progress.
   *
   * @param {number} progress - Normalised scroll progress in [0, 1]
   */
  updateFromScroll(progress) {
    // Clamp progress
    this._scrollProgress = Math.max(0, Math.min(1, progress));

    // --- Find surrounding keyframes ---
    let startIdx = 0;
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (this._scrollProgress >= KEYFRAMES[i].t && this._scrollProgress <= KEYFRAMES[i + 1].t) {
        startIdx = i;
        break;
      }
      // Handle reaching the very end
      if (i === KEYFRAMES.length - 2) {
        startIdx = i;
      }
    }

    const kfA = KEYFRAMES[startIdx];
    const kfB = KEYFRAMES[startIdx + 1];

    // --- Calculate local progress between the two keyframes ---
    const segmentLength = kfB.t - kfA.t;
    const localT = segmentLength > 0
      ? (this._scrollProgress - kfA.t) / segmentLength
      : 0;

    // Apply cubic easing for smooth, cinematic feel
    const easedT = cubicEaseInOut(Math.max(0, Math.min(1, localT)));

    // --- Interpolate position & lookAt ---
    this._interpPos.lerpVectors(kfA.pos, kfB.pos, easedT);
    this._interpLook.lerpVectors(kfA.look, kfB.look, easedT);

    // Apply parallax offset to position
    this.camera.position.copy(this._interpPos).add(this._parallaxOffset);
    this.camera.lookAt(this._interpLook);
  }

  /* ---------------------------------------------------------------- */
  /*  Mouse parallax                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Apply a subtle camera offset based on mouse/pointer position.
   * Call this every frame with normalised mouse coords (-1 to 1).
   *
   * @param {number} mouseX - Normalised X in [-1, 1] (left to right)
   * @param {number} mouseY - Normalised Y in [-1, 1] (top to bottom)
   */
  addMouseParallax(mouseX, mouseY) {
    // Target offset — note Y is inverted for natural feel
    this._targetParallaxOffset.set(
      mouseX * this._parallaxStrength,
      -mouseY * this._parallaxStrength * 0.5, // Reduce vertical parallax
      0
    );

    // Smooth lerp toward target (damping for organic motion)
    this._parallaxOffset.lerp(this._targetParallaxOffset, 0.05);

    // Re-apply scroll position with updated parallax
    this.updateFromScroll(this._scrollProgress);
  }

  /* ---------------------------------------------------------------- */
  /*  Resize                                                           */
  /* ---------------------------------------------------------------- */

  /**
   * Update aspect ratio when viewport changes.
   * @param {number} aspect - New aspect ratio (width / height)
   */
  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------------- */
  /*  Utilities                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Get the current scroll progress.
   * @returns {number}
   */
  getProgress() {
    return this._scrollProgress;
  }

  /**
   * Get a copy of the current interpolated lookAt target.
   * Useful for other systems that need to know where the camera is aiming.
   * @returns {THREE.Vector3}
   */
  /**
   * Get the camera path position at a specific progress.
   * @param {number} progress - Normalized progress [0, 1]
   * @returns {THREE.Vector3} Interpolated position
   */
  getPositionAt(progress) {
    const p = Math.max(0, Math.min(1, progress));
    let startIdx = 0;
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (p >= KEYFRAMES[i].t && p <= KEYFRAMES[i + 1].t) {
        startIdx = i;
        break;
      }
      if (i === KEYFRAMES.length - 2) {
        startIdx = i;
      }
    }

    const kfA = KEYFRAMES[startIdx];
    const kfB = KEYFRAMES[startIdx + 1];

    const segmentLength = kfB.t - kfA.t;
    const localT = segmentLength > 0 ? (p - kfA.t) / segmentLength : 0;
    const easedT = cubicEaseInOut(Math.max(0, Math.min(1, localT)));

    const pos = new THREE.Vector3();
    pos.lerpVectors(kfA.pos, kfB.pos, easedT);
    return pos;
  }
}
