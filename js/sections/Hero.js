/**
 * Hero.js — Cinematic entrance, multilayer parallax, and canvas flames
 * for the dynamic anime-inspired hero section.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isTouchDevice } from '../utils/helpers.js';

gsap.registerPlugin(ScrollTrigger);

export class Hero {
  constructor() {
    /** @private GSAP timeline for entrance sequence */
    this._entranceTl = null;

    /** @private Mouse coordinates for parallax */
    this._mouse = { x: 0, y: 0 };
    this._parallaxLayers = [];
    this._rafId = null;
    
    // Lerp values for each layer to make animation smooth
    this._layerPositions = []; 

    // Canvas particle engine properties
    this._canvas = null;
    this._ctx = null;
    this._particles = [];
    this._canvasRafId = null;
  }

  /**
   * Initialize hero section animations and particle loops.
   */
  init() {
    this._setupEntranceAnimation();
    this._setupScrollIndicator();
    this._setupMultilayerParallax();
    this._setupFlameParticles();
  }

  /**
   * Entrance animations for the new split-panel hero.
   * @private
   */
  _setupEntranceAnimation() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    // Select elements
    const leftPanel = heroSection.querySelector('.hero__left-panel');
    const rightPanel = heroSection.querySelector('.hero__right-panel');
    const logo = heroSection.querySelector('.hero__jp-logo');
    const titleLines = heroSection.querySelectorAll('.hero__bold-title span');
    const tagline = heroSection.querySelector('.hero__jp-tagline');
    const subtext = heroSection.querySelector('.hero__quote-subtext');
    const ctaButtons = heroSection.querySelectorAll('.hero__cta .magnetic-btn');
    const scrollIndicator = heroSection.querySelector('.hero__scroll-indicator');
    const character = heroSection.querySelector('.layer-character');
    const flames = heroSection.querySelector('.layer-fg-flames');

    // ── Set Initial States ──
    gsap.set(leftPanel, { xPercent: -100 });
    gsap.set(rightPanel, { opacity: 0 });
    gsap.set(logo, { opacity: 0, y: -20 });
    gsap.set(titleLines, { opacity: 0, x: -40 });
    gsap.set(tagline, { opacity: 0, y: 20 });
    gsap.set(subtext, { opacity: 0 });
    gsap.set(ctaButtons, { opacity: 0, y: 20 });
    gsap.set(scrollIndicator, { opacity: 0, y: 20 });
    gsap.set(character, { opacity: 0, scale: 0.9, x: 50 });
    gsap.set(flames, { opacity: 0 });

    // ── Entrance Timeline ──
    this._entranceTl = gsap.timeline({ delay: 0.3 });

    this._entranceTl
      // 1. Slide in the solid violet left panel
      .to(leftPanel, {
        xPercent: 0,
        duration: 0.85,
        ease: 'power3.out'
      })
      // 2. Fade in the right dark gradient panel
      .to(rightPanel, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
      }, '-=0.4')
      // 3. Stagger-in title lines & logo
      .to(logo, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.3')
      .to(titleLines, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out'
      }, '-=0.2')
      // 4. Slide up Japanese tagline
      .to(tagline, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.3')
      // 5. Stagger buttons & quotes
      .to(subtext, {
        opacity: 1,
        duration: 0.5
      }, '-=0.2')
      .to(ctaButtons, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      }, '-=0.3')
      // 6. Reveal character image & glow flames in right panel
      .to(character, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.9,
        ease: 'back.out(1.1)'
      }, '-=0.7')
      .to(flames, {
        opacity: 1,
        duration: 0.8,
        ease: 'power1.out'
      }, '-=0.5')
      // 7. Show scroll hint
      .to(scrollIndicator, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3');
  }

  /**
   * Connect scroll progression to fading the scroll indicator.
   * @private
   */
  _setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.hero__scroll-indicator');
    if (!scrollIndicator) return;

    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: '20% top',
      onUpdate: (self) => {
        gsap.set(scrollIndicator, {
          opacity: 1 - self.progress * 3.5
        });
      }
    });
  }

  /**
   * Multi-layer parallax effect driven by mouse position.
   * Each layer translates according to its data-depth factor.
   * @private
   */
  _setupMultilayerParallax() {
    if (isTouchDevice()) return;

    const container = document.getElementById('hero-parallax-container');
    if (!container) return;

    this._parallaxLayers = Array.from(container.querySelectorAll('.parallax-layer'));
    
    // Initialize coordinate positions for easing interpolation (lerping)
    this._layerPositions = this._parallaxLayers.map(() => ({ currentX: 0, currentY: 0 }));

    const onMouseMove = (e) => {
      // Normalize mouse coordinates to -1 ... 1
      this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    const maxShiftX = 25; // max translation pixels
    const maxShiftY = 20;
    const lerpFactor = 0.08;

    const updateParallax = () => {
      this._parallaxLayers.forEach((layer, index) => {
        const depth = parseFloat(layer.getAttribute('data-depth')) || 0.2;
        const pos = this._layerPositions[index];

        const targetX = this._mouse.x * maxShiftX * depth;
        const targetY = this._mouse.y * maxShiftY * depth;

        // Apply linear interpolation (lerping) for ultra smooth movement
        pos.currentX += (targetX - pos.currentX) * lerpFactor;
        pos.currentY += (targetY - pos.currentY) * lerpFactor;

        // Translate layer position
        layer.style.transform = `translate(${pos.currentX}px, ${pos.currentY}px)`;
      });

      this._rafId = requestAnimationFrame(updateParallax);
    };

    updateParallax();
  }

  /**
   * High-performance Canvas particle sparks loop.
   * Renders glowing teal and blue energy sparks floating up from behind the character.
   * @private
   */
  _setupFlameParticles() {
    this._canvas = document.getElementById('flame-particles-canvas');
    if (!this._canvas) return;

    this._ctx = this._canvas.getContext('2d');
    
    // Fit canvas bounds
    const resizeCanvas = () => {
      const rect = this._canvas.parentNode.getBoundingClientRect();
      this._canvas.width = rect.width;
      this._canvas.height = rect.height;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle color choices matching the flame lighting theme
    const colors = ['#00ffd5', '#00d4ff', '#8b5cf6'];

    const createParticle = () => {
      // Spawn points prioritized around center-right (near character's hand pose)
      const spawnX = this._canvas.width * (0.45 + Math.random() * 0.4);
      const spawnY = this._canvas.height * (0.5 + Math.random() * 0.45);

      return {
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.6) * 1.5,
        vy: -0.5 - Math.random() * 2.0,
        radius: 1.5 + Math.random() * 3.5,
        alpha: 0.3 + Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 80 + Math.random() * 120,
        wiggleSpeed: 0.02 + Math.random() * 0.05,
        wiggleWidth: 0.3 + Math.random() * 0.8
      };
    };

    // Pre-populate particles
    for (let i = 0; i < 40; i++) {
      this._particles.push(createParticle());
      // Advance coordinates randomly
      const p = this._particles[i];
      p.life = Math.floor(Math.random() * p.maxLife);
      p.y -= (p.life / p.maxLife) * (this._canvas.height * 0.4);
    }

    const animateParticles = () => {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      // Spawn new particles to maintain intensity
      if (this._particles.length < 80) {
        this._particles.push(createParticle());
      }

      this._particles.forEach((p, idx) => {
        p.life++;
        
        // Rise up and wiggle left/right
        p.x += p.vx + Math.sin(p.life * p.wiggleSpeed) * p.wiggleWidth;
        p.y += p.vy;

        // Draw glowing particle circles
        this._ctx.beginPath();
        this._ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        // Radial color fill with glow
        this._ctx.fillStyle = p.color;
        this._ctx.globalAlpha = p.alpha * (1 - (p.life / p.maxLife));
        this._ctx.fill();

        // Recycle dead particles
        if (p.life >= p.maxLife || p.y < 0 || p.x < 0 || p.x > this._canvas.width) {
          this._particles[idx] = createParticle();
        }
      });

      this._ctx.globalAlpha = 1.0; // reset alpha
      this._canvasRafId = requestAnimationFrame(animateParticles);
    };

    animateParticles();
  }

  /**
   * Cleanup animation loops and observers.
   */
  dispose() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    if (this._canvasRafId) {
      cancelAnimationFrame(this._canvasRafId);
    }
  }
}
