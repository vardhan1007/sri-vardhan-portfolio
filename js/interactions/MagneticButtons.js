/**
 * MagneticButtons.js — Magnetic pull effect for buttons
 * 
 * When the user hovers over a .magnetic-btn element, the button
 * subtly gravitates toward the cursor position, creating a premium
 * interactive feel. On mouse leave, the button springs back with
 * an elastic ease.
 */

import gsap from 'gsap';
import { lerp, isTouchDevice } from '../utils/helpers.js';

/** Maximum pull distance in pixels */
const MAX_PULL = 10;

/** Lerp factor for smooth magnetic pull */
const PULL_SPEED = 0.2;

export class MagneticButtons {
  constructor() {
    /** @private Array of managed button instances */
    this._buttons = [];

    /** @private Animation frame ID */
    this._rafId = null;

    /** @private Whether the system is active */
    this._active = false;
  }

  /**
   * Initialize magnetic buttons.
   * Finds all .magnetic-btn elements and attaches hover tracking.
   * Skips initialization on touch devices.
   */
  init() {
    if (isTouchDevice()) return;

    const elements = document.querySelectorAll('.magnetic-btn');
    if (elements.length === 0) return;

    this._active = true;

    elements.forEach((el) => {
      const instance = {
        el,
        // Current rendered offset
        currentX: 0,
        currentY: 0,
        // Target offset (set on mousemove, reset on leave)
        targetX: 0,
        targetY: 0,
        // Whether mouse is hovering
        hovering: false,
      };

      // ── Mouse enter: start tracking ──────────────────────────────────────
      el.addEventListener('mouseenter', () => {
        instance.hovering = true;
      });

      // ── Mouse move: calculate pull offset ────────────────────────────────
      el.addEventListener('mousemove', (e) => {
        if (!instance.hovering) return;

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate offset from center, normalized to -1...1
        const offsetX = (e.clientX - centerX) / (rect.width / 2);
        const offsetY = (e.clientY - centerY) / (rect.height / 2);

        // Scale to max pull distance
        instance.targetX = offsetX * MAX_PULL;
        instance.targetY = offsetY * MAX_PULL;
      });

      // ── Mouse leave: spring back with elastic ease ───────────────────────
      el.addEventListener('mouseleave', () => {
        instance.hovering = false;
        instance.targetX = 0;
        instance.targetY = 0;

        // Animate back with GSAP elastic for a premium snap-back
        gsap.to(instance, {
          currentX: 0,
          currentY: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.3)',
          onUpdate: () => {
            el.style.transform = `translate(${instance.currentX}px, ${instance.currentY}px)`;
          },
        });
      });

      this._buttons.push(instance);
    });

    // Start the animation loop for smooth lerp
    this._animate();
  }

  /**
   * Animation loop — lerp button positions toward target.
   * @private
   */
  _animate() {
    if (!this._active) return;

    this._buttons.forEach((instance) => {
      if (!instance.hovering) return;

      // Smooth lerp toward target offset
      instance.currentX = lerp(instance.currentX, instance.targetX, PULL_SPEED);
      instance.currentY = lerp(instance.currentY, instance.targetY, PULL_SPEED);

      // Apply transform
      instance.el.style.transform = `translate(${instance.currentX}px, ${instance.currentY}px)`;
    });

    this._rafId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Clean up listeners and stop animation.
   */
  destroy() {
    this._active = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // Reset transforms
    this._buttons.forEach((instance) => {
      instance.el.style.transform = '';
    });
    this._buttons = [];
  }
}
