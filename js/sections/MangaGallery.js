/**
 * MangaGallery.js — Manga-style gallery for Sri Vardhan's portfolio
 * 
 * Features:
 *   - Filter buttons toggle active class and filter manga panels by category
 *   - Panels stagger in with dramatic entrance when section enters viewport
 *   - Click on panel: scale-up attention animation
 *   - Ink splash pseudo-element effect on hover
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class MangaGallery {
  constructor() {
    /** @private Currently active filter category */
    this._activeFilter = 'all';
  }

  /**
   * Initialize manga gallery interactions and animations.
   */
  init() {
    this._setupFilterButtons();
    this._setupPanelEntrance();
    this._setupPanelClick();
    this._setupInkSplashHover();
  }

  /**
   * Set up filter button click handlers.
   * Each button has a data-filter attribute matching panel data-category values.
   * @private
   */
  _setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.manga-filter-btn, .filter-btn');
    const panels = document.querySelectorAll('.manga-panel');

    if (filterButtons.length === 0) return;

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';

        // Skip if already active
        if (filter === this._activeFilter) return;

        this._activeFilter = filter;

        // Update button active states
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter panels with animation
        this._filterPanels(panels, filter);
      });
    });
  }

  /**
   * Filter manga panels by category with animated show/hide.
   * @private
   * @param {NodeList} panels - All manga panel elements
   * @param {string} filter - Category to filter by, or 'all'
   */
  _filterPanels(panels, filter) {
    panels.forEach((panel) => {
      const category = panel.dataset.category || '';
      const shouldShow = filter === 'all' || category === filter;

      if (shouldShow) {
        // Show panel with scale + fade animation
        panel.style.display = '';
        gsap.fromTo(
          panel,
          { opacity: 0, scale: 0.8, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.5)',
          }
        );
      } else {
        // Hide panel with animation
        gsap.to(panel, {
          opacity: 0,
          scale: 0.8,
          y: -10,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            panel.style.display = 'none';
          },
        });
      }
    });
  }

  /**
   * Stagger-animate panels on section entrance.
   * @private
   */
  _setupPanelEntrance() {
    const panels = document.querySelectorAll('.manga-panel');
    if (panels.length === 0) return;

    // Set initial state
    gsap.set(panels, {
      opacity: 0,
      y: 50,
      scale: 0.9,
    });

    // Section headings
    const headings = document.querySelectorAll('#manga .section-label, #manga .section-title');
    if (headings.length > 0) {
      gsap.set(headings, { opacity: 0, y: 20 });

      ScrollTrigger.create({
        trigger: '#manga',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(headings, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
          });
        },
      });
    }

    ScrollTrigger.create({
      trigger: '#manga',
      start: 'top 65%',
      once: true,
      onEnter: () => {
        gsap.to(panels, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: {
            each: 0.1,
            grid: 'auto',
            from: 'start',
          },
          ease: 'back.out(1.3)',
        });
      },
    });
  }

  /**
   * Set up click handlers on manga panels.
   * Provides a scale-pop attention animation.
   * @private
   */
  _setupPanelClick() {
    const panels = document.querySelectorAll('.manga-panel');

    panels.forEach((panel) => {
      panel.addEventListener('click', () => {
        const title = panel.dataset.title || panel.querySelector('.manga-panel-title')?.textContent || 'Panel';

        console.log(
          `%c📖 Manga panel clicked: ${title}`,
          'color: #8F9E5B; font-weight: bold;'
        );

        // Scale-pop animation for feedback
        gsap.fromTo(
          panel,
          { scale: 0.95 },
          {
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)',
          }
        );
      });
    });
  }

  /**
   * Set up ink splash effect on panel hover.
   * Uses CSS class toggling — the actual splash is done via CSS ::after.
   * @private
   */
  _setupInkSplashHover() {
    const panels = document.querySelectorAll('.manga-panel');

    panels.forEach((panel) => {
      panel.addEventListener('mouseenter', () => {
        panel.classList.add('ink-splash');

        // Subtle lift + shadow enhancement
        gsap.to(panel, {
          y: -5,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      panel.addEventListener('mouseleave', () => {
        panel.classList.remove('ink-splash');

        gsap.to(panel, {
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      });
    });
  }
}
