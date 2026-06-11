/**
 * MobileHover.js — Touch-friendly hover interactions for Sri Vardhan's portfolio
 * 
 * Simulates hover states on touchscreen devices by toggling '.hover-active'
 * class on touchstart and removing it on touchmove/touchend/touchcancel.
 * This guarantees buttery-smooth, responsive visual feedback without "sticky" hover states.
 */

import { isTouchDevice } from '../utils/helpers.js';

export class MobileHover {
  constructor() {
    this._selector = 'a, button, .project-card, .manga-panel, .magnetic-btn, .theme-option, .social-link, .nav__link, .about__stat, .about__image .glass-panel, .manga__filter-btn, .deck-tab, .hero__social-link, .hero__name span, .hero-btn-primary, .hero-btn-secondary';
    this._observer = null;
  }

  /**
   * Initialize touch hover event listeners.
   */
  init() {
    // Only run on touch-enabled devices
    if (!isTouchDevice()) {
      return;
    }

    console.log('📱 Touch device detected. Activating MobileHover subsystem...');

    // Add listeners to existing elements
    this._addListenersToElements(document.querySelectorAll(this._selector));

    // Monitor DOM mutations for dynamic elements
    this._setupMutationObserver();
  }

  /**
   * Bind touch events to elements.
   * @private
   */
  _addListenersToElements(elements) {
    elements.forEach((el) => {
      // Prevent duplicate binding
      if (el.dataset.hasTouchHover) return;
      el.dataset.hasTouchHover = 'true';

      el.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: true });
      el.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: true });
      el.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: true });
      el.addEventListener('touchcancel', this._handleTouchCancel.bind(this), { passive: true });
    });
  }

  /**
   * Add hover-active class on touchstart.
   * @private
   */
  _handleTouchStart(e) {
    const target = e.currentTarget;
    if (target) {
      target.classList.add('hover-active');
    }
  }

  /**
   * Remove hover-active on move (scrolling / sliding away).
   * @private
   */
  _handleTouchMove(e) {
    const target = e.currentTarget;
    if (target) {
      target.classList.remove('hover-active');
    }
  }

  /**
   * Remove hover-active when finger lifted.
   * @private
   */
  _handleTouchEnd(e) {
    const target = e.currentTarget;
    if (target) {
      // Small timeout to let visual feedback register briefly
      setTimeout(() => {
        target.classList.remove('hover-active');
      }, 150);
    }
  }

  /**
   * Remove hover-active if touch canceled by system.
   * @private
   */
  _handleTouchCancel(e) {
    const target = e.currentTarget;
    if (target) {
      target.classList.remove('hover-active');
    }
  }

  /**
   * Monitor DOM mutations to automatically attach listeners to new elements.
   * @private
   */
  _setupMutationObserver() {
    this._observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if node itself matches
            if (node.matches(this._selector)) {
              this._addListenersToElements([node]);
            }
            // Check children
            const children = node.querySelectorAll(this._selector);
            if (children.length > 0) {
              this._addListenersToElements(children);
            }
          }
        });
      });
    });

    this._observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Cleanup event listeners and observers.
   */
  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }
}
