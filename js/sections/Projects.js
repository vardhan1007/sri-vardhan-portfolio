/**
 * Projects.js — Interactive project cards for Sri Vardhan's portfolio
 * 
 * Features:
 *   - 3D tilt effect: cards rotate in 3D based on mouse position within the card
 *   - Staggered entrance from below when section enters viewport
 *   - Subtle image zoom on card hover
 *   - Click handler for future detail expansion
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isTouchDevice } from '../utils/helpers.js';

gsap.registerPlugin(ScrollTrigger);

/** Maximum tilt angle in degrees */
const MAX_TILT = 5;

/** Perspective for the 3D tilt effect */
const PERSPECTIVE = 800;

export class Projects {
  constructor() {
    /** @private Array of card data for cleanup */
    this._cards = [];
  }

  /**
   * Initialize project section interactions and animations.
   */
  init() {
    this._setupCardEntrance();
    this._setupCardTilt();
    this._setupCardClick();
  }

  /**
   * Stagger-animate project cards from below when section enters viewport.
   * @private
   */
  _setupCardEntrance() {
    const cards = document.querySelectorAll('.project-card');
    if (cards.length === 0) return;

    // Set initial state
    gsap.set(cards, {
      opacity: 0,
      y: 60,
      scale: 0.95,
    });

    ScrollTrigger.create({
      trigger: '#projects',
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        });
      },
    });

    // Also animate section heading
    const headings = document.querySelectorAll('#projects .section-label, #projects .section-title');
    if (headings.length > 0) {
      gsap.set(headings, { opacity: 0, y: 20 });

      ScrollTrigger.create({
        trigger: '#projects',
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
  }

  /**
   * Set up 3D tilt effect on project cards (desktop only).
   * The card rotates based on the mouse position relative to its center.
   * @private
   */
  _setupCardTilt() {
    if (isTouchDevice()) return;

    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
      // Set perspective on the card's parent for 3D context
      card.style.transformStyle = 'preserve-3d';
      if (card.parentElement) {
        card.parentElement.style.perspective = `${PERSPECTIVE}px`;
      }

      const cardImage = card.querySelector('.project-image img, .project-image');

      // ── Mouse move: calculate tilt ───────────────────────────────────────
      const onMouseMove = (e) => {
        const rect = card.getBoundingClientRect();

        // Mouse position relative to card center (-0.5 to 0.5)
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;

        // Calculate rotation angles
        // Note: rotateX is controlled by Y position and vice versa
        const rotateX = -relY * MAX_TILT;
        const rotateY = relX * MAX_TILT;

        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          y: -10,
          duration: 0.4,
          ease: 'power2.out',
          transformPerspective: PERSPECTIVE,
        });

        // Subtle image zoom on hover
        if (cardImage) {
          gsap.to(cardImage, {
            scale: 1.05,
            duration: 0.4,
            ease: 'power2.out',
          });
        }
      };

      // ── Mouse leave: reset tilt ──────────────────────────────────────────
      const onMouseLeave = () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        });

        if (cardImage) {
          gsap.to(cardImage, {
            scale: 1,
            duration: 0.4,
            ease: 'power2.out',
          });
        }
      };

      // ── Mouse enter: add highlight ───────────────────────────────────────
      const onMouseEnter = () => {
        card.classList.add('is-hovering');
      };

      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);
      card.addEventListener('mouseenter', onMouseEnter);
      card.addEventListener('mouseleave', () => card.classList.remove('is-hovering'));

      // Store for cleanup
      this._cards.push({
        el: card,
        handlers: { onMouseMove, onMouseLeave, onMouseEnter },
      });
    });
  }

  /**
   * Set up click handlers on project cards.
   * Currently logs the click — can be expanded to open a detail modal.
   * @private
   */
  _setupCardClick() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const projectName = card.dataset.project || card.querySelector('.project-title')?.textContent || 'Unknown';

        console.log(
          `%c📂 Project clicked: ${projectName}`,
          'color: #4ADE80; font-weight: bold;'
        );

        // Subtle click feedback animation
        gsap.fromTo(
          card,
          { scale: 0.97 },
          {
            scale: 1,
            duration: 0.4,
            ease: 'elastic.out(1, 0.3)',
          }
        );
      });
    });
  }

  /**
   * Clean up event listeners.
   */
  destroy() {
    this._cards.forEach(({ el, handlers }) => {
      el.removeEventListener('mousemove', handlers.onMouseMove);
      el.removeEventListener('mouseleave', handlers.onMouseLeave);
      el.removeEventListener('mouseenter', handlers.onMouseEnter);
    });
    this._cards = [];
  }
}
