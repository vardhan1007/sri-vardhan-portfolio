/**
 * CustomCursor.js — Premium custom cursor for Sri Vardhan's portfolio
 * 
 * Features:
 *   - A small dot that follows the mouse at high speed (lerp 0.8)
 *   - A larger ring that trails behind with smooth elastic motion (lerp 0.15)
 *   - Interactive hover states on links, buttons, project cards, and manga panels
 *   - Click feedback with scale animation
 *   - Automatic fallback: no custom cursor on touch devices
 */

import { lerp, isTouchDevice } from '../utils/helpers.js';

export class CustomCursor {
  constructor() {
    /** @private DOM elements */
    this._dot = null;
    this._ring = null;

    /** @private Current rendered positions */
    this._dotPos = { x: 0, y: 0 };
    this._ringPos = { x: 0, y: 0 };

    /** @private Target (actual mouse) position */
    this._targetPos = { x: 0, y: 0 };

    /** @private Lerp factors for smooth following */
    this._dotSpeed = 0.8;
    this._ringSpeed = 0.15;

    /** @private Animation frame ID */
    this._rafId = null;

    /** @private Whether cursor is active */
    this._active = false;

    /** @private Bound event handlers for cleanup */
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onMouseEnterInteractive = this._handleEnterInteractive.bind(this);
    this._onMouseLeaveInteractive = this._handleLeaveInteractive.bind(this);
  }

  /**
   * Initialize the custom cursor.
   * On touch devices, adds 'touch-device' class and skips setup.
   */
  init() {
    // Touch device check — gracefully degrade
    if (isTouchDevice()) {
      document.body.classList.add('touch-device');
      return;
    }

    this._dot = document.querySelector('.cursor-dot');
    this._ring = document.querySelector('.cursor-ring');

    if (!this._dot || !this._ring) {
      console.warn('CustomCursor: .cursor-dot or .cursor-ring not found in DOM');
      return;
    }

    this._active = true;

    // Hide the default cursor
    document.body.style.cursor = 'none';

    // Initially hide until first mouse move
    this._dot.style.opacity = '0';
    this._ring.style.opacity = '0';

    // ── Event listeners ────────────────────────────────────────────────────
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);

    // Set up hover listeners on interactive elements
    this._setupInteractiveListeners();

    // Observe DOM for dynamically added interactive elements
    this._setupMutationObserver();

    // Start the animation loop
    this._animate();
  }

  /**
   * Handle mouse movement — update target position.
   * @private
   * @param {MouseEvent} e
   */
  _handleMouseMove(e) {
    this._targetPos.x = e.clientX;
    this._targetPos.y = e.clientY;

    // Show cursor on first move
    if (this._dot.style.opacity === '0') {
      this._dot.style.opacity = '1';
      this._ring.style.opacity = '1';
      // Jump to position immediately on first move
      this._dotPos.x = e.clientX;
      this._dotPos.y = e.clientY;
      this._ringPos.x = e.clientX;
      this._ringPos.y = e.clientY;
    }
  }

  /**
   * Handle mouse down — scale dot for click feedback.
   * @private
   */
  _handleMouseDown() {
    if (this._dot) {
      this._dot.style.transform = `translate(-50%, -50%) scale(0.5)`;
    }
    if (this._ring) {
      this._ring.classList.add('clicking');
    }
  }

  /**
   * Handle mouse up — restore dot scale.
   * @private
   */
  _handleMouseUp() {
    if (this._dot) {
      this._dot.style.transform = `translate(-50%, -50%) scale(1)`;
    }
    if (this._ring) {
      this._ring.classList.remove('clicking');
    }
  }

  /**
   * Handle entering an interactive element — add hover class.
   * @private
   */
  _handleEnterInteractive() {
    if (this._ring) {
      this._ring.classList.add('hover');
    }
    if (this._dot) {
      this._dot.classList.add('hover');
    }
  }

  /**
   * Handle leaving an interactive element — remove hover class.
   * @private
   */
  _handleLeaveInteractive() {
    if (this._ring) {
      this._ring.classList.remove('hover');
    }
    if (this._dot) {
      this._dot.classList.remove('hover');
    }
  }

  /**
   * Set up hover listeners on all current interactive elements.
   * @private
   */
  _setupInteractiveListeners() {
    const interactiveSelectors = 'a, button, .project-card, .manga-panel, .magnetic-btn, .theme-option, .theme-switcher-toggle, input, textarea, [role="button"]';
    const elements = document.querySelectorAll(interactiveSelectors);

    elements.forEach((el) => {
      el.addEventListener('mouseenter', this._onMouseEnterInteractive);
      el.addEventListener('mouseleave', this._onMouseLeaveInteractive);
    });
  }

  /**
   * Watch for new interactive elements added to the DOM.
   * @private
   */
  _setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node itself is interactive
            if (node.matches && node.matches('a, button, .project-card, .manga-panel')) {
              node.addEventListener('mouseenter', this._onMouseEnterInteractive);
              node.addEventListener('mouseleave', this._onMouseLeaveInteractive);
            }
            // Check children
            const children = node.querySelectorAll?.('a, button, .project-card, .manga-panel');
            children?.forEach((child) => {
              child.addEventListener('mouseenter', this._onMouseEnterInteractive);
              child.addEventListener('mouseleave', this._onMouseLeaveInteractive);
            });
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Animation loop — lerp cursor positions for buttery smooth movement.
   * @private
   */
  _animate() {
    if (!this._active) return;

    // Lerp dot position (fast following)
    this._dotPos.x = lerp(this._dotPos.x, this._targetPos.x, this._dotSpeed);
    this._dotPos.y = lerp(this._dotPos.y, this._targetPos.y, this._dotSpeed);

    // Lerp ring position (slow, trailing)
    this._ringPos.x = lerp(this._ringPos.x, this._targetPos.x, this._ringSpeed);
    this._ringPos.y = lerp(this._ringPos.y, this._targetPos.y, this._ringSpeed);

    // Apply positions using translate for GPU acceleration
    if (this._dot) {
      this._dot.style.left = `${this._dotPos.x}px`;
      this._dot.style.top = `${this._dotPos.y}px`;
    }

    if (this._ring) {
      this._ring.style.left = `${this._ringPos.x}px`;
      this._ring.style.top = `${this._ringPos.y}px`;
    }

    this._rafId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Clean up all listeners and stop animation.
   */
  destroy() {
    this._active = false;

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);

    // Restore default cursor
    document.body.style.cursor = '';
  }
}
