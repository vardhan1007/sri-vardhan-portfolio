/**
 * ThemeManager.js — Dynamic theme switching for Sri Vardhan's portfolio
 * 
 * Manages 7 visual themes: sakura, midnight, forest, golden, arctic, sumi, ember.
 * Themes change CSS custom properties (via data-theme on <html>),
 * and fire callbacks so the Three.js scene can adapt colors in real-time.
 */

import gsap from 'gsap';

const STORAGE_KEY = 'portfolio-theme';
const THEMES = ['sakura', 'midnight', 'forest', 'golden', 'arctic', 'sumi', 'ember'];

export class ThemeManager {
  constructor() {
    /** @type {string} Current active theme name */
    this.currentTheme = 'sakura';

    /** @private Registered theme change callbacks */
    this._callbacks = [];

    /** @private Whether the theme panel is currently open */
    this._panelOpen = false;

    /** @private DOM references */
    this._toggleBtn = null;
    this._panel = null;

    // Load saved theme from localStorage
    this._loadSavedTheme();
  }

  /**
   * Load saved theme from localStorage, falling back to 'sakura'.
   * @private
   */
  _loadSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.includes(saved)) {
        this.currentTheme = saved;
      }
    } catch (e) {
      // localStorage unavailable
    }

    // Apply immediately so there's no flash of wrong theme
    document.documentElement.dataset.theme = this.currentTheme;
  }

  /**
   * Initialize the theme manager — sets up all DOM listeners.
   * Call this after the DOM is ready.
   */
  init() {
    this._toggleBtn = document.querySelector('.theme-switcher__toggle');
    this._panel = document.querySelector('.theme-switcher__panel');

    if (!this._toggleBtn || !this._panel) {
      console.warn('ThemeManager: .theme-switcher__toggle or .theme-switcher__panel not found');
      return;
    }

    // ── Toggle button: open/close panel ────────────────────────────────────
    this._toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePanel();
    });

    // ── Theme option buttons ───────────────────────────────────────────────
    const themeOptions = this._panel.querySelectorAll('.theme-option');
    themeOptions.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeName = btn.dataset.theme;
        if (themeName && THEMES.includes(themeName)) {
          this.setTheme(themeName);
          this._updateActiveOption(themeName);
        }
      });
    });

    // Mark the current theme option as active
    this._updateActiveOption(this.currentTheme);

    // ── Close panel on outside click ───────────────────────────────────────
    document.addEventListener('click', (e) => {
      if (
        this._panelOpen &&
        !this._panel.contains(e.target) &&
        !this._toggleBtn.contains(e.target)
      ) {
        this._closePanel();
      }
    });

    // ── Keyboard shortcut: T to cycle themes ───────────────────────────────
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        this._cycleTheme();
      }
    });

    // ── Escape closes panel ────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._panelOpen) {
        this._closePanel();
      }
    });
  }

  /**
   * Set and apply a theme.
   * @param {string} themeName - Theme name to apply
   */
  setTheme(themeName) {
    if (!THEMES.includes(themeName)) {
      console.warn(`ThemeManager: Unknown theme "${themeName}"`);
      return;
    }

    if (themeName === this.currentTheme) return;

    this.currentTheme = themeName;

    // Apply to DOM
    document.documentElement.dataset.theme = themeName;

    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch (e) {
      // Silently fail
    }

    // Update active button styling
    this._updateActiveOption(themeName);

    // Fire callbacks
    this._callbacks.forEach((cb) => {
      try {
        cb(themeName);
      } catch (err) {
        console.error('ThemeManager callback error:', err);
      }
    });

    console.log(
      `%c🎨 Theme: ${themeName}`,
      'color: #FFD700; font-weight: bold;'
    );
  }

  /**
   * Register a callback for theme changes.
   * @param {function(string): void} callback - Receives the new theme name
   */
  onThemeChange(callback) {
    if (typeof callback === 'function') {
      this._callbacks.push(callback);
    }
  }

  /**
   * Get the current theme name.
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  /**
   * Toggle the theme panel open/closed.
   * @private
   */
  _togglePanel() {
    if (this._panelOpen) {
      this._closePanel();
    } else {
      this._openPanel();
    }
  }

  /**
   * Open the theme panel with animation.
   * @private
   */
  _openPanel() {
    if (this._panelOpen) return;
    this._panelOpen = true;

    this._panel.style.display = 'flex';
    this._panel.classList.add('active');

    gsap.fromTo(
      this._panel,
      {
        opacity: 0,
        scale: 0.85,
        y: -10,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: 'back.out(2)',
      }
    );

    // Animate each option in with stagger
    const options = this._panel.querySelectorAll('.theme-option');
    gsap.fromTo(
      options,
      { opacity: 0, scale: 0.5 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        stagger: 0.04,
        ease: 'back.out(1.5)',
        delay: 0.1,
      }
    );

    // Rotate toggle icon
    gsap.to(this._toggleBtn, {
      rotation: 180,
      duration: 0.35,
      ease: 'power2.out',
    });
  }

  /**
   * Close the theme panel with animation.
   * @private
   */
  _closePanel() {
    if (!this._panelOpen) return;
    this._panelOpen = false;

    gsap.to(this._panel, {
      opacity: 0,
      scale: 0.85,
      y: -10,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        this._panel.style.display = 'none';
        this._panel.classList.remove('active');
      },
    });

    // Rotate toggle icon back
    gsap.to(this._toggleBtn, {
      rotation: 0,
      duration: 0.35,
      ease: 'power2.out',
    });
  }

  /**
   * Cycle to the next theme in the list.
   * @private
   */
  _cycleTheme() {
    const currentIndex = THEMES.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    this.setTheme(THEMES[nextIndex]);
  }

  /**
   * Update visual active state on theme option buttons.
   * @private
   * @param {string} themeName - Active theme name
   */
  _updateActiveOption(themeName) {
    if (!this._panel) return;

    const options = this._panel.querySelectorAll('.theme-option');
    options.forEach((btn) => {
      if (btn.dataset.theme === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}
