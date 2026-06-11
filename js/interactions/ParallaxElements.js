/**
 * ParallaxElements.js — Mouse-driven parallax for decorative elements
 * 
 * Elements with the `data-parallax` attribute will gently shift
 * in response to mouse movement, creating depth. Each element can
 * specify its own `data-parallax-speed` multiplier:
 *   - 0.01 = barely perceptible
 *   - 0.02 = subtle (recommended for backgrounds)
 *   - 0.05 = moderate movement
 *   - 0.1  = dramatic shift
 */

import { lerp, isTouchDevice } from '../utils/helpers.js';

/** Default speed if data-parallax-speed is not specified */
const DEFAULT_SPEED = 0.02;

/** Lerp factor for smooth position updates */
const SMOOTH_FACTOR = 0.08;

export class ParallaxElements {
  constructor() {
    /** @private Array of tracked parallax elements and their state */
    this._elements = [];

    /** @private Normalized mouse position (-1 to 1) */
    this._mouseX = 0;
    this._mouseY = 0;

    /** @private Target mouse position (before lerp) */
    this._targetMouseX = 0;
    this._targetMouseY = 0;

    /** @private Whether the system is active */
    this._active = false;

    /** @private Bound handler for cleanup */
    this._onMouseMove = this._handleMouseMove.bind(this);
  }

  /**
   * Initialize parallax tracking.
   * Finds all [data-parallax] elements and begins mouse tracking.
   */
  init() {
    // Parallax is subtle enough that we can still enable it on touch via
    // device orientation, but for simplicity, only enable for mouse
    if (isTouchDevice()) return;

    const elements = document.querySelectorAll('[data-parallax]');
    if (elements.length === 0) return;

    this._active = true;

    elements.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed) || DEFAULT_SPEED;

      this._elements.push({
        el,
        speed,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
      });
    });

    // Listen for mouse movement
    document.addEventListener('mousemove', this._onMouseMove);

    // Start self-running animation loop
    this._animate();
  }

  /**
   * Internal animation loop using requestAnimationFrame.
   * @private
   */
  _animate() {
    if (!this._active) return;
    this.update();
    this._rafId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Handle mouse movement — update target positions for all elements.
   * @private
   * @param {MouseEvent} e
   */
  _handleMouseMove(e) {
    // Normalize mouse to -1...1 from center of viewport
    this._targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this._targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  /**
   * Update method — call this in your main animation loop (rAF).
   * Lerps all parallax elements toward their target positions.
   */
  update() {
    if (!this._active) return;

    // Smooth the mouse position itself for extra fluidity
    this._mouseX = lerp(this._mouseX, this._targetMouseX, SMOOTH_FACTOR);
    this._mouseY = lerp(this._mouseY, this._targetMouseY, SMOOTH_FACTOR);

    this._elements.forEach((item) => {
      // Calculate target offset based on mouse and speed multiplier
      // Multiply by viewport dimensions for pixel-based movement
      const maxOffset = Math.min(window.innerWidth, window.innerHeight);
      item.targetX = this._mouseX * item.speed * maxOffset;
      item.targetY = this._mouseY * item.speed * maxOffset;

      // Lerp current position toward target
      item.currentX = lerp(item.currentX, item.targetX, SMOOTH_FACTOR);
      item.currentY = lerp(item.currentY, item.targetY, SMOOTH_FACTOR);

      // Apply the transform (use translate3d for GPU compositing)
      item.el.style.transform = `translate3d(${item.currentX}px, ${item.currentY}px, 0)`;
    });
  }

  /**
   * Clean up listeners and reset transforms.
   */
  destroy() {
    this._active = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    document.removeEventListener('mousemove', this._onMouseMove);

    this._elements.forEach((item) => {
      item.el.style.transform = '';
    });
    this._elements = [];
  }
}
