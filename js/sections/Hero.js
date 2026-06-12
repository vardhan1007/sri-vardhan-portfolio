/**
 * Hero.js — Cinematic entrance and parallax for the redesigned hero section
 *
 * Features:
 *   1. Each letter of "Sri Vardhan" staggers in with a 3D cascade
 *   2. Greeting, tagline, and CTA fade in sequentially
 *   3. Character image has mouse-driven parallax (shifts slightly with cursor)
 *   4. Scroll indicator pulses and fades on scroll
 *   5. Stats bar slides in from bottom
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isTouchDevice } from '../utils/helpers.js';

gsap.registerPlugin(ScrollTrigger);

export class Hero {
  constructor() {
    /** @private GSAP timeline for entrance sequence */
    this._entranceTl = null;

    /** @private GSAP timeline for mobile name animation loop */
    this._mobileLoopTl = null;

    /** @private Mouse position for character parallax */
    this._mouse = { x: 0, y: 0 };
    this._characterEl = null;
    this._rafId = null;
    this._currentX = 0;
    this._currentY = 0;
  }

  /**
   * Initialize hero section animations.
   * Call this after the loader has completed.
   */
  init() {
    this._setupEntranceAnimation();
    this._setupScrollIndicator();
    this._setupCharacterParallax();
    this._setupMobileNameAnimation();
  }

  /**
   * Set up the cinematic entrance animation timeline.
   * @private
   */
  _setupEntranceAnimation() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    // Collect all animatable elements with the new class names
    const greeting = heroSection.querySelector('.hero__greeting');
    const nameLetters = heroSection.querySelectorAll('.hero__name span');
    const tagline = heroSection.querySelector('.hero__tagline');
    const ctaButtons = heroSection.querySelectorAll('.hero__cta .magnetic-btn');
    const scrollIndicator = heroSection.querySelector('.hero__scroll-indicator');
    const character = heroSection.querySelector('.hero__character');
    const socials = heroSection.querySelectorAll('.hero__social-link');
    const stats = heroSection.querySelector('.hero__stats');

    // ── Set initial states (hidden) ──
    const fadeElements = [greeting, tagline, scrollIndicator, character, stats].filter(Boolean);
    gsap.set(fadeElements, { opacity: 0, y: 30 });
    gsap.set(nameLetters, { opacity: 0, y: 40, filter: 'blur(15px)' });
    gsap.set(ctaButtons, { opacity: 0, y: 20 });
    gsap.set(socials, { opacity: 0, x: -20 });

    // ── Build the entrance timeline ──
    this._entranceTl = gsap.timeline({
      delay: 0.3, // Small buffer after loader fades
    });

    // 1. Greeting ("I am") fades in
    if (greeting) {
      this._entranceTl.to(greeting, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    }

    // 2. Name letters cascade in with smooth blurred fade
    if (nameLetters.length > 0) {
      this._entranceTl.to(
        nameLetters,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          stagger: 0.05,
          ease: 'power4.out',
        },
        '-=0.3'
      );
    }

    // 3. Tagline slides in
    if (tagline) {
      this._entranceTl.to(
        tagline,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
        },
        '-=0.4'
      );
    }

    // 4. CTA buttons slide up
    if (ctaButtons.length > 0) {
      this._entranceTl.to(
        ctaButtons,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power3.out',
        },
        '-=0.2'
      );
    }

    // 5. Character image fades and slides in from right
    if (character) {
      this._entranceTl.to(
        character,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.6'
      );
    }

    // 6. Social links slide in from left
    if (socials.length > 0) {
      this._entranceTl.to(
        socials,
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'power3.out',
        },
        '-=0.5'
      );
    }

    // 7. Stats bar fades in
    if (stats) {
      this._entranceTl.to(
        stats,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.3'
      );
    }

    // 8. Scroll indicator last
    if (scrollIndicator) {
      this._entranceTl.to(
        scrollIndicator,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.2'
      );
    }
  }

  /**
   * Set up scroll indicator pulse and scroll-based fade out.
   * @private
   */
  _setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.hero__scroll-indicator');
    if (!scrollIndicator) return;

    // Fade out when user starts scrolling
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: '20% top',
      onUpdate: (self) => {
        const fadeProgress = self.progress;
        gsap.set(scrollIndicator, {
          opacity: 1 - fadeProgress * 3,
        });
      },
    });
  }

  /**
   * Set up mouse-driven parallax on the hero character image.
   * Subtle movement that follows cursor position.
   * @private
   */
  _setupCharacterParallax() {
    this._characterEl = document.getElementById('hero-character');
    if (!this._characterEl) return;

    // Listen for mouse movement
    const onMouseMove = (e) => {
      // Normalize to -1...1
      this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Smooth animation loop for parallax
    const maxShiftX = 20; // pixels
    const maxShiftY = 15; // pixels
    const lerp = 0.08;    // smoothing factor

    const animate = () => {
      // Target position based on mouse
      const targetX = this._mouse.x * maxShiftX;
      const targetY = this._mouse.y * maxShiftY;

      // Lerp toward target
      this._currentX += (targetX - this._currentX) * lerp;
      this._currentY += (targetY - this._currentY) * lerp;

      // Apply transform
      this._characterEl.style.transform =
        `translate(${this._currentX}px, ${this._currentY}px)`;

      this._rafId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Set up automated letter-by-letter hover animation loop for mobile touch devices.
   * @private
   */
  _setupMobileNameAnimation() {
    // Only run on touch devices where hover is not supported
    if (!isTouchDevice()) return;

    const nameLetters = document.querySelectorAll('.hero__name span');
    if (nameLetters.length === 0) return;

    // Create a repeating timeline for the automated mobile animation loop
    this._mobileLoopTl = gsap.timeline({
      repeat: -1,
      repeatDelay: 3.5, // Delay before restarting the loop
      delay: 2.5,       // Wait for the entrance animation to finish completely
    });

    // 1. Staggered letter-by-letter hover effect
    nameLetters.forEach((letter) => {
      // Skip whitespace
      if (letter.textContent.trim() === '') return;

      this._mobileLoopTl.to(letter, {
        color: 'var(--accent-primary)',
        textShadow: '0 4px 15px var(--accent-glow)',
        y: -8,
        scale: 1.1,
        duration: 0.35,
        ease: 'power2.out',
      })
      .to(letter, {
        color: 'var(--text-primary)',
        textShadow: 'none',
        y: 0,
        scale: 1.0,
        duration: 0.35,
        ease: 'power2.in',
      }, '-=0.18'); // overlapping transition for a wave effect
    });

    // 2. All letters scale and glow together after the last letter's cycle
    this._mobileLoopTl.to(nameLetters, {
      color: 'var(--accent-primary)',
      textShadow: '0 4px 15px var(--accent-glow)',
      y: -8,
      scale: 1.1,
      duration: 0.5,
      stagger: 0.02,
      ease: 'power2.out',
    }, '+=0.2')
    .to(nameLetters, {
      color: 'var(--text-primary)',
      textShadow: 'none',
      y: 0,
      scale: 1.0,
      duration: 0.5,
      stagger: 0.02,
      ease: 'power2.inOut',
    }, '+=1.0'); // Hold the full color glow for 1 second, then restore
  }

  /**
   * Cleanup — stop the parallax animation loop and clear timelines.
   */
  dispose() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    if (this._mobileLoopTl) {
      this._mobileLoopTl.kill();
    }
  }
}
