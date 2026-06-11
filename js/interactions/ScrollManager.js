/**
 * ScrollManager.js — Master scroll orchestration for Sri Vardhan's portfolio
 * 
 * Coordinates all scroll-driven behavior:
 *   - Global scroll progress (0→1) with registered callbacks
 *   - ScrollTrigger-based reveal animations for .reveal elements
 *   - Navigation active state highlighting
 *   - Smooth scroll for nav link clicks
 *   - Top-of-page progress indicator bar
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/** Section IDs in page order */
const SECTION_IDS = ['hero', 'about', 'projects', 'skills', 'manga', 'experience', 'contact'];

export class ScrollManager {
  constructor() {
    /** @private Overall scroll progress 0-1 */
    this._progress = 0;

    /** @private Registered progress callbacks */
    this._progressCallbacks = [];

    /** @private Progress bar element */
    this._progressBar = null;

    /** @private Nav element reference */
    this._nav = null;
  }

  /**
   * Initialize scroll management. Call after DOM is ready.
   */
  init() {
    this._nav = document.querySelector('.nav');

    // Create the progress indicator bar if it doesn't exist
    this._createProgressBar();

    // Set up global scroll progress tracking
    this._setupProgressTracking();

    // Set up reveal animations
    this._setupRevealAnimations();

    // Set up nav highlighting
    this._setupNavHighlight();

    // Set up nav scrolled state
    this._setupNavScrolledState();

    // Set up smooth scrolling for nav links
    this._setupSmoothScroll();

    // Refresh ScrollTrigger after everything is set up
    // Use a slight delay to ensure all DOM elements are measured correctly
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }

  /**
   * Get current scroll progress (0 at top, 1 at bottom of page).
   * @returns {number} Scroll progress
   */
  getProgress() {
    return this._progress;
  }

  /**
   * Register a callback that fires on scroll with the current progress.
   * @param {function(number): void} callback - Receives scroll progress 0-1
   */
  onProgress(callback) {
    if (typeof callback === 'function') {
      this._progressCallbacks.push(callback);
    }
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  /**
   * Create the thin progress indicator at the top of the page.
   * @private
   */
  _createProgressBar() {
    // Check if it already exists
    this._progressBar = document.querySelector('.scroll-progress-bar');

    if (!this._progressBar) {
      this._progressBar = document.createElement('div');
      this._progressBar.classList.add('scroll-progress-bar');
      this._progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        width: 0%;
        background: var(--accent-primary);
        z-index: 10000;
        pointer-events: none;
        transition: none;
        will-change: width;
        box-shadow: 0 0 10px var(--accent-glow, var(--accent-primary));
      `;
      document.body.appendChild(this._progressBar);
    }
  }

  /**
   * Set up the master scroll progress tracker.
   * @private
   */
  _setupProgressTracking() {
    ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        this._progress = self.progress;

        // Update progress bar width
        if (this._progressBar) {
          this._progressBar.style.width = `${self.progress * 100}%`;
        }

        // Fire registered callbacks
        this._progressCallbacks.forEach((cb) => {
          try {
            cb(self.progress);
          } catch (e) {
            console.error('ScrollManager progress callback error:', e);
          }
        });
      },
    });
  }

  /**
   * Set up scroll-triggered reveal animations for .reveal elements.
   * Supports stagger groups via .stagger-1, .stagger-2, etc.
   * @private
   */
  _setupRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');

    revealElements.forEach((el) => {
      // Determine stagger delay from class
      let delay = 0;
      const classList = el.classList;
      for (let i = 0; i < classList.length; i++) {
        const match = classList[i].match(/^stagger-(\d+)$/);
        if (match) {
          delay = parseInt(match[1], 10) * 0.1; // Each stagger level = 100ms
          break;
        }
      }

      // Set initial state
      gsap.set(el, {
        opacity: 0,
        y: 40,
      });

      // Create ScrollTrigger for each reveal element
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',     // Trigger when element is 85% from top of viewport
        end: 'top 20%',
        once: true,            // Only trigger once
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: delay,
            ease: 'power3.out',
          });
        },
      });
    });
  }

  /**
   * Highlight the active nav link based on which section is in view.
   * @private
   */
  _setupNavHighlight() {
    SECTION_IDS.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 40%',
        end: 'bottom 40%',
        onEnter: () => this._setActiveNavLink(sectionId),
        onEnterBack: () => this._setActiveNavLink(sectionId),
      });
    });
  }

  /**
   * Update the active class on nav links.
   * @private
   * @param {string} sectionId - Active section ID
   */
  _setActiveNavLink(sectionId) {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${sectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Add .nav--scrolled class when scrolled past 100px.
   * @private
   */
  _setupNavScrolledState() {
    if (!this._nav) return;

    ScrollTrigger.create({
      trigger: document.body,
      start: '100px top',
      onEnter: () => this._nav.classList.add('nav--scrolled'),
      onLeaveBack: () => this._nav.classList.remove('nav--scrolled'),
    });
  }

  /**
   * Set up smooth scrolling for nav link clicks.
   * @private
   */
  _setupSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav__link, a[href^="#"]');

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          e.preventDefault();

          // Use GSAP to smoothly scroll to the section
          gsap.to(window, {
            duration: 1.2,
            scrollTo: {
              y: targetSection,
              offsetY: 80, // Account for fixed nav height
            },
            ease: 'power3.inOut',
          });
        }
      });
    });
  }

  /**
   * Clean up all ScrollTrigger instances.
   */
  destroy() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    this._progressCallbacks = [];

    if (this._progressBar && this._progressBar.parentNode) {
      this._progressBar.parentNode.removeChild(this._progressBar);
    }
  }
}
