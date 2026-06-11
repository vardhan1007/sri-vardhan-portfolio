/**
 * About.js — About section animations for Sri Vardhan's portfolio
 * 
 * Features:
 *   - Stats counter animation: numbers count up from 0 to target value
 *   - Staggered reveal for bio paragraphs
 *   - Profile image subtle parallax shift on scroll
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class About {
  constructor() {
    /** @private Whether animations have been triggered */
    this._initialized = false;
  }

  /**
   * Initialize about section animations.
   */
  init() {
    this._setupStatsAnimation();
    this._setupBioReveal();
    this._setupProfileParallax();

    this._initialized = true;
  }

  /**
   * Animate stat numbers from 0 to their target values.
   * Target value is read from data-target attribute or text content.
   * @private
   */
  _setupStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length === 0) return;

    // Set initial state
    gsap.set(statNumbers, { opacity: 0, y: 20 });

    statNumbers.forEach((statEl) => {
      // Read the target number from data-target attribute or text content
      const targetValue = parseInt(statEl.dataset.target || statEl.textContent, 10);
      const suffix = statEl.dataset.suffix || ''; // e.g., "+" or "%"

      if (isNaN(targetValue)) return;

      // Set initial display to 0
      statEl.textContent = `0${suffix}`;

      ScrollTrigger.create({
        trigger: statEl,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          // Fade in the element
          gsap.to(statEl, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
          });

          // Animate the number counting up
          const counter = { value: 0 };
          gsap.to(counter, {
            value: targetValue,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
              statEl.textContent = `${Math.round(counter.value)}${suffix}`;
            },
          });
        },
      });
    });
  }

  /**
   * Stagger-reveal bio paragraphs when the about section enters viewport.
   * @private
   */
  _setupBioReveal() {
    const bioParagraphs = document.querySelectorAll('.about-bio p, .about-description p');
    if (bioParagraphs.length === 0) return;

    // Set initial state
    gsap.set(bioParagraphs, { opacity: 0, y: 30 });

    ScrollTrigger.create({
      trigger: '#about',
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.to(bioParagraphs, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });
      },
    });

    // Also animate labels, headings within the about section
    const aboutHeadings = document.querySelectorAll('#about .section-label, #about .section-title');
    if (aboutHeadings.length > 0) {
      gsap.set(aboutHeadings, { opacity: 0, y: 20 });

      ScrollTrigger.create({
        trigger: '#about',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(aboutHeadings, {
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
   * Subtle parallax effect on the profile image as user scrolls.
   * @private
   */
  _setupProfileParallax() {
    const profileImage = document.querySelector('.about-image, .profile-image');
    if (!profileImage) return;

    // Set initial state
    gsap.set(profileImage, { opacity: 0, scale: 0.95 });

    // Fade in when section enters
    ScrollTrigger.create({
      trigger: profileImage,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(profileImage, {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
        });
      },
    });

    // Parallax shift on scroll
    gsap.to(profileImage, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '#about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5, // Smooth scrub
      },
    });
  }
}
