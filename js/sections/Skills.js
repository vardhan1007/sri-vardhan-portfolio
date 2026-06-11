/**
 * Skills.js — 3D Curved Circular Slideshow (Coverflow) for Tech Stack
 * 
 * Features:
 *   - 3D revolving Coverflow layout where inactive cards tilt towards the center
 *   - Auto-rotation timer which loops every 5 seconds (pauses on user interaction)
 *   - Click interaction: click tabs or cards directly to spin them to the front
 *   - Dynamic scale, opacity, and z-index offsets based on orbital position
 *   - Active card progress line fill animations
 *   - Active card 3D layered mouse-parallax hover tilt
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class Skills {
  constructor() {
    this.activeIndex = 0;
    this.autoRotateTimer = null;
    this.idleTimer = null;
    this._initialized = false;
  }

  /**
   * Initialize skills carousel animations.
   */
  init() {
    this.container = document.querySelector('.skills-carousel-container');
    this.track = document.querySelector('.carousel-track');
    this.cards = document.querySelectorAll('.carousel-card');
    this.tabs = document.querySelectorAll('.deck-tab');

    if (!this.container || !this.track || this.cards.length === 0) return;

    this._setupCarouselPositioning();
    this._setupEventListeners();
    this._setupScrollTrigger();
    this._setupCard3DTilt();

    this._initialized = true;
  }

  /**
   * Position cards initially on the 3D circular track and initialize line widths.
   * @private
   */
  _setupCarouselPositioning() {
    // Initialize cards to slide 0 positions
    this.goToSlide(0);
  }

  /**
   * Attach click event listeners to tabs and cards.
   * @private
   */
  _setupEventListeners() {
    // 1. Tab Navigation Clicks
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        this.goToSlide(index);
        this.resetAutoRotate();
      });
    });

    // 2. Direct Card Clicks (spin clicked card to front)
    this.cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        if (!card.classList.contains('active')) {
          this.goToSlide(index);
          this.resetAutoRotate();
        }
      });
    });

    // 3. Handle window resize to adjust 3D layout bounds dynamically
    window.addEventListener('resize', () => {
      this.goToSlide(this.activeIndex);
    });
  }

  /**
   * Sets up scroll-triggered animations to run active slide animations upon visibility.
   * @private
   */
  _setupScrollTrigger() {
    // Set initial container opacity
    gsap.set(this.container, { opacity: 0, y: 40 });

    ScrollTrigger.create({
      trigger: '#skills',
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(this.container, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          onComplete: () => {
            // Animate first card's progress bars when revealed
            this.animateSkillLines(this.cards[0]);
            // Kick off auto-rotation
            this.startAutoRotate();
          }
        });
      }
    });
  }

  /**
   * Rotate carousel to specific card index.
   * @param {number} index - target card index
   */
  goToSlide(index) {
    if (index === this.activeIndex && this._initialized) return;
    this.activeIndex = index;

    // 1. Toggle active classes on tabs
    this.tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    // 2. Determine layout parameters based on viewport width
    const isMobile = window.innerWidth <= 768;
    const xOffset = window.innerWidth <= 480 ? 75 : (isMobile ? 120 : 240);
    const zOffset = window.innerWidth <= 480 ? -100 : (isMobile ? -120 : -160);
    const sideScale = window.innerWidth <= 480 ? 0.7 : (isMobile ? 0.8 : 0.88);
    const sideOpacity = window.innerWidth <= 480 ? 0.2 : 0.55;

    // 3. Adjust scale, opacity, z-index, and animate/reset lines for cards
    this.cards.forEach((card, i) => {
      let offset = i - index;
      
      // Loop offset around for continuous circle rotation
      if (offset > 2) offset -= 4;
      if (offset < -2) offset += 4;

      const isActive = offset === 0;
      card.classList.toggle('active', isActive);

      let x = 0;
      let z = 0;
      let rotateY = 0;
      let scale = 1;
      let opacity = 1;
      let zIndex = 1;

      if (offset === 0) {
        // Center active card
        x = 0;
        z = 0;
        rotateY = 0;
        scale = 1;
        opacity = 1;
        zIndex = 10;
        this.animateSkillLines(card);
      } else if (offset === 1) {
        // Right card
        x = xOffset;
        z = zOffset;
        rotateY = -35;
        scale = sideScale;
        opacity = sideOpacity;
        zIndex = 5;
        // Reset progress lines
        gsap.set(card.querySelectorAll('.skill-line'), { width: '0%' });
      } else if (offset === -1) {
        // Left card
        x = -xOffset;
        z = zOffset;
        rotateY = 35;
        scale = sideScale;
        opacity = sideOpacity;
        zIndex = 5;
        // Reset progress lines
        gsap.set(card.querySelectorAll('.skill-line'), { width: '0%' });
      } else {
        // Back card (hidden/far back)
        x = 0;
        z = zOffset * 2;
        rotateY = offset * 45; // slight angle
        scale = sideScale * 0.8;
        opacity = 0;
        zIndex = 1;
        // Reset progress lines
        gsap.set(card.querySelectorAll('.skill-line'), { width: '0%' });
      }

      // Animate card to new orbital position
      gsap.to(card, {
        x: x,
        z: z,
        rotateY: rotateY,
        scale: scale,
        opacity: opacity,
        duration: 0.8,
        ease: 'power3.out',
        onStart: () => {
          card.style.zIndex = zIndex;
        }
      });
    });
  }

  /**
   * Animates skill progress lines in a card.
   * @param {Element} card - Card to animate
   */
  animateSkillLines(card) {
    const lines = card.querySelectorAll('.skill-line');
    lines.forEach((line) => {
      const level = line.style.getPropertyValue('--level') || '0%';
      // Reset width first
      gsap.set(line, { width: '0%' });
      // Animate width
      gsap.to(line, {
        width: level,
        duration: 1.0,
        ease: 'power2.out',
        delay: 0.2
      });
    });
  }

  /**
   * Gently spins the skills track automatically.
   */
  startAutoRotate() {
    this.stopAutoRotate();
    this.autoRotateTimer = setInterval(() => {
      const nextIndex = (this.activeIndex + 1) % this.cards.length;
      this.goToSlide(nextIndex);
    }, 5000);
  }

  /**
   * Pauses automatic rotation.
   */
  stopAutoRotate() {
    if (this.autoRotateTimer) {
      clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
  }

  /**
   * Resets the auto-rotation schedule (idle cooldown of 8 seconds on interaction).
   */
  resetAutoRotate() {
    this.stopAutoRotate();
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.startAutoRotate();
    }, 8000);
  }

  /**
   * Set up layered 3D parallax hover tilt on active card only.
   * @private
   */
  _setupCard3DTilt() {
    const isTouch = document.body.classList.contains('touch-device') || 
                    (window.matchMedia('(hover: none)').matches);
    if (isTouch) return;

    this.cards.forEach((card) => {
      const header = card.querySelector('.slide-header');
      const desc = card.querySelector('.slide-desc');
      const skills = card.querySelector('.slide-skills');

      card.addEventListener('mousemove', (e) => {
        // Only active front card is tiltable
        if (!card.classList.contains('active')) return;

        const rect = card.getBoundingClientRect();
        
        // Relative mouse coordinate values
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Normalize mouse coordinates (-0.5 to 0.5)
        const relX = (mouseX / rect.width) - 0.5;
        const relY = (mouseY / rect.height) - 0.5;

        // Maximum rotation parameters
        const maxRotation = 6;
        const rotX = -relY * maxRotation;
        const rotY = relX * maxRotation;

        // Apply 3D transform combining base active card position (0, 0, 0) + mouse tilt
        gsap.to(card, {
          rotateX: rotX,
          rotateY: rotY,
          x: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.out',
        });

        // Layered parallax offsets inside card content
        if (header) {
          gsap.to(header, {
            x: relX * 8,
            y: relY * 8,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
        if (desc) {
          gsap.to(desc, {
            x: relX * 5,
            y: relY * 5,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
        if (skills) {
          gsap.to(skills, {
            x: relX * 10,
            y: relY * 10,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('active')) return;

        // Reset to original resting position (0, 0, 0)
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          x: 0,
          z: 0,
          duration: 0.6,
          ease: 'power3.out',
        });

        // Reset internal layered offsets
        if (header) gsap.to(header, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        if (desc) gsap.to(desc, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        if (skills) gsap.to(skills, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  }

  /**
   * Destroys timelines and clears timers.
   */
  destroy() {
    this.stopAutoRotate();
    clearTimeout(this.idleTimer);
  }
}
