/**
 * Hero.js — Cinematic Entrance, Multiplane Mouse Parallax,
 * Floating Manga Graphic Stickers & Ambient Stardust for the Editorial Hero Section.
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
    this._parallaxItems = [];
    this._rafId = null;

    // Character lerp values
    this._charPos = { currentX: 0, currentY: 0, targetX: 0, targetY: 0 };

    // Canvas particle engine
    this._canvas = null;
    this._ctx = null;
    this._particles = [];
    this._canvasRafId = null;
  }

  /**
   * Initialize hero animations, parallax, and particle effects.
   */
  init() {
    this._setupEntranceAnimation();
    this._setupScrollIndicator();
    this._setupParallaxAndStickers();
    this._setupFlameParticles();
  }

  /**
   * Cinematic entrance animation matching high-fashion manga editorial layouts.
   * @private
   */
  _setupEntranceAnimation() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    // Select elements
    const kanjiCols = heroSection.querySelectorAll('.hero__text-col');
    const socials = heroSection.querySelectorAll('.hero__social-link');
    const greeting = heroSection.querySelector('.hero__greeting');
    const nameSpans = heroSection.querySelectorAll('.hero__name span');
    const tagline = heroSection.querySelector('.hero__tagline');
    const ctaButtons = heroSection.querySelectorAll('.hero__cta .magnetic-btn');
    const stats = heroSection.querySelector('.hero__stats');
    const character = heroSection.querySelector('.character-wrapper');
    const stickers = heroSection.querySelectorAll('.graphic-sticker');
    const badge = heroSection.querySelector('.creative-badge');
    const lensFlare = heroSection.querySelector('.sunglass-lens-reflection');
    const scrollIndicator = heroSection.querySelector('.hero__scroll-indicator');
    const watermark = heroSection.querySelector('.hero__bg-watermark');

    // ── Initial States ──
    gsap.set(kanjiCols, { opacity: 0, y: 40 });
    gsap.set(socials, { opacity: 0, x: -30 });
    gsap.set(watermark, { opacity: 0, scale: 0.95 });
    gsap.set(greeting, { opacity: 0, y: 20 });
    gsap.set(nameSpans, { opacity: 0, y: 35 });
    gsap.set(tagline, { opacity: 0, y: 20 });
    gsap.set(ctaButtons, { opacity: 0, y: 20 });
    gsap.set(stats, { opacity: 0, y: 20 });
    gsap.set(character, { opacity: 0, x: 60, scale: 0.92 });
    gsap.set(stickers, { opacity: 0, scale: 0 });
    gsap.set(badge, { opacity: 0, y: -20 });
    gsap.set(lensFlare, { opacity: 0, scale: 0 });
    gsap.set(scrollIndicator, { opacity: 0, y: 20 });

    // ── Timeline ──
    this._entranceTl = gsap.timeline({ delay: 0.2 });

    this._entranceTl
      // 1. Watermark & Kanji Columns fade in
      .to(watermark, { opacity: 0.08, scale: 1, duration: 1.2, ease: 'power2.out' })
      .to(kanjiCols, {
        opacity: (i) => [0.16, 0.12, 0.22, 0.10, 0.18][i % 5],
        y: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: 'power3.out'
      }, '-=1.0')
      // 2. Social rail slides in from left
      .to(socials, {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'back.out(1.4)'
      }, '-=0.7')
      // 3. Typographic Greeting ("I am") and Name ("Sri Vardhan")
      .to(greeting, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out'
      }, '-=0.5')
      .to(nameSpans, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.03,
        ease: 'back.out(1.4)'
      }, '-=0.4')
      // 4. Tagline & CTA buttons
      .to(tagline, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.3')
      .to(ctaButtons, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.1,
        ease: 'power2.out'
      }, '-=0.3')
      // 5. Character cutout slides in confidently from right
      .to(character, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.95,
        ease: 'power3.out'
      }, '-=0.7')
      // 6. Pop in graphic stickers, creative badge & lens reflection
      .to(badge, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'back.out(1.4)'
      }, '-=0.4')
      .to(stickers, {
        opacity: (i) => [0.55, 0.45, 0.6, 0.45, 0.75][i % 5],
        scale: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: 'back.out(1.8)'
      }, '-=0.4')
      .to(lensFlare, {
        opacity: 0.85,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.3')
      // 7. Bottom stats & scroll indicator
      .to(stats, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3')
      .to(scrollIndicator, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3');
  }

  /**
   * Fade scroll indicator when scrolling past hero.
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
   * Multiplane mouse parallax for character cutout, graphic stickers, and badge.
   * @private
   */
  _setupParallaxAndStickers() {
    if (isTouchDevice()) return;

    const heroSection = document.getElementById('hero');
    const character = document.querySelector('.character-wrapper');
    const stickers = document.querySelectorAll('.graphic-sticker');
    const badge = document.querySelector('.creative-badge');
    const watermark = document.querySelector('.hero__bg-watermark');
    if (!heroSection || !character) return;

    const onMouseMove = (e) => {
      this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this._mouse.y = (e.clientY / window.innerHeight) * 2 - 1;

      this._charPos.targetX = this._mouse.x * 18;
      this._charPos.targetY = this._mouse.y * 12;
    };

    window.addEventListener('mousemove', onMouseMove);

    const lerpFactor = 0.08;

    const updateParallax = () => {
      // Lerp character position
      this._charPos.currentX += (this._charPos.targetX - this._charPos.currentX) * lerpFactor;
      this._charPos.currentY += (this._charPos.targetY - this._charPos.currentY) * lerpFactor;

      character.style.transform = `translate(${this._charPos.currentX.toFixed(2)}px, ${this._charPos.currentY.toFixed(2)}px)`;

      // Parallax shift stickers at varying depths
      stickers.forEach((sticker) => {
        const depth = parseFloat(sticker.getAttribute('data-depth')) || 0.2;
        const shiftX = this._mouse.x * 35 * depth;
        const shiftY = this._mouse.y * 25 * depth;
        sticker.style.transform = `translate(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px)`;
      });

      // Parallax shift badge
      if (badge) {
        const shiftX = this._mouse.x * -16;
        const shiftY = this._mouse.y * -12;
        badge.style.transform = `translate(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px)`;
      }

      // Parallax watermark
      if (watermark) {
        const shiftX = this._mouse.x * -10;
        watermark.style.transform = `translateX(${shiftX.toFixed(1)}px)`;
      }

      this._rafId = requestAnimationFrame(updateParallax);
    };

    updateParallax();
  }

  /**
   * Ambient stardust and glowing embers canvas engine.
   * Renders gentle white, warm golden, and cyan light sparks floating across the scene.
   * @private
   */
  _setupFlameParticles() {
    this._canvas = document.getElementById('flame-particles-canvas');
    if (!this._canvas) return;

    this._ctx = this._canvas.getContext('2d');

    const resizeCanvas = () => {
      const parent = this._canvas.parentNode;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      this._canvas.width = rect.width;
      this._canvas.height = rect.height;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['#ffffff', '#ffeb99', '#00ffd5', '#ffd700'];

    const createParticle = () => {
      return {
        x: Math.random() * this._canvas.width,
        y: this._canvas.height * (0.3 + Math.random() * 0.7),
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.4 - Math.random() * 1.6,
        radius: 1.0 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.65,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 80 + Math.random() * 100,
        wiggleSpeed: 0.02 + Math.random() * 0.03,
        wiggleWidth: 0.3 + Math.random() * 0.8
      };
    };

    for (let i = 0; i < 45; i++) {
      this._particles.push(createParticle());
      const p = this._particles[i];
      p.life = Math.floor(Math.random() * p.maxLife);
      p.y -= (p.life / p.maxLife) * (this._canvas.height * 0.5);
    }

    const animateParticles = () => {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      if (this._particles.length < 65) {
        this._particles.push(createParticle());
      }

      this._particles.forEach((p, idx) => {
        p.life++;

        p.x += p.vx + Math.sin(p.life * p.wiggleSpeed) * p.wiggleWidth;
        p.y += p.vy;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - lifeRatio);

        this._ctx.beginPath();
        this._ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        this._ctx.fillStyle = p.color;
        this._ctx.globalAlpha = Math.max(0, currentAlpha);
        this._ctx.shadowColor = p.color;
        this._ctx.shadowBlur = 8;
        this._ctx.fill();

        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > this._canvas.width + 10) {
          this._particles[idx] = createParticle();
        }
      });

      this._ctx.shadowBlur = 0;
      this._ctx.globalAlpha = 1.0;
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
