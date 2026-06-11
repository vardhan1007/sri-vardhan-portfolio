/**
 * Experience.js — Timeline animations for Sri Vardhan's portfolio
 * 
 * Features:
 *   - Vertical timeline line draws from top to bottom as user scrolls (scrub)
 *   - Each timeline item fades in when the drawn line reaches its node
 *   - Node circles pulse briefly when first activated
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class Experience {
  constructor() {
    /** @private ScrollTrigger instance for the line */
    this._lineTrigger = null;
  }

  /**
   * Initialize experience timeline animations.
   */
  init() {
    this._setupSectionEntrance();
    this._setupTimelineLine();
    this._setupTimelineItems();
  }

  /**
   * Animate section headings on entrance.
   * @private
   */
  _setupSectionEntrance() {
    const headings = document.querySelectorAll('#experience .section-label, #experience .section-title');
    if (headings.length === 0) return;

    gsap.set(headings, { opacity: 0, y: 20 });

    ScrollTrigger.create({
      trigger: '#experience',
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

  /**
   * Animate the vertical timeline line drawing from top to bottom
   * as the user scrolls through the experience section.
   * @private
   */
  _setupTimelineLine() {
    const timelineLine = document.querySelector('.timeline-line, .experience-timeline-line');
    if (!timelineLine) return;

    // Set initial state: line has 0 height (drawn via scaleY or height)
    gsap.set(timelineLine, {
      scaleY: 0,
      transformOrigin: 'top center',
    });

    // Scrub the line drawing as user scrolls through the section
    this._lineTrigger = gsap.to(timelineLine, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#experience',
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 0.5, // Smooth scrub with slight delay
      },
    });
  }

  /**
   * Fade in each timeline item when the line reaches its position,
   * and pulse the node circle on activation.
   * @private
   */
  _setupTimelineItems() {
    const items = document.querySelectorAll('.timeline-item, .experience-item');
    if (items.length === 0) return;

    items.forEach((item, index) => {
      // Determine which side the item enters from (alternating left/right)
      const isLeft = index % 2 === 0;
      const xOffset = isLeft ? -40 : 40;

      // Set initial state
      gsap.set(item, {
        opacity: 0,
        x: xOffset,
        y: 20,
      });

      // Find the node/dot element within this item
      const node = item.querySelector('.timeline-node, .timeline-dot, .experience-dot');

      if (node) {
        gsap.set(node, { scale: 0 });
      }

      // Trigger when item enters viewport
      ScrollTrigger.create({
        trigger: item,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          // Fade and slide the item in
          gsap.to(item, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
          });

          // Pulse the node circle
          if (node) {
            gsap.to(node, {
              scale: 1,
              duration: 0.4,
              ease: 'back.out(2)',
              onComplete: () => {
                // Brief pulse effect after appearing
                gsap.fromTo(
                  node,
                  { boxShadow: '0 0 0 0 var(--accent-primary)' },
                  {
                    boxShadow: '0 0 0 15px transparent',
                    duration: 0.8,
                    ease: 'power2.out',
                  }
                );
              },
            });
          }
        },
      });
    });
  }
}
