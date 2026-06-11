/**
 * Loader.js — Cinematic loading screen for Sri Vardhan's portfolio
 * 
 * Animates a progress bar from 0% to 100% over ~2.5 seconds,
 * updating Japanese loading text, then elegantly fades out
 * to reveal the hero section.
 */

import gsap from 'gsap';

export class Loader {
  constructor() {
    /** @private DOM references */
    this._loader = null;
    this._progressBar = null;
    this._progressText = null;
    this._loadingText = null;
  }

  /**
   * Simulate the loading sequence and call onComplete when done.
   * @param {Function} onComplete - Callback fired after loader fades out
   */
  simulateLoading(onComplete) {
    this._loader = document.getElementById('loader');

    if (!this._loader) {
      console.warn('Loader: #loader element not found');
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    this._progressBar = this._loader.querySelector('.loader__progress-bar');
    this._progressText = this._loader.querySelector('.loader__progress-text');
    this._loadingText = this._loader.querySelector('.loader__text');

    // Ensure loader is visible
    this._loader.style.display = 'flex';
    this._loader.style.opacity = '1';

    // Progress state
    const state = { progress: 0 };

    // ── Animate progress from 0 to 100 ─────────────────────────────────────
    const tl = gsap.timeline({
      onComplete: () => {
        this._onLoadingComplete(onComplete);
      },
    });

    tl.to(state, {
      progress: 100,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = Math.round(state.progress);

        // Update progress bar width
        if (this._progressBar) {
          this._progressBar.style.width = `${p}%`;
        }

        // Update progress percentage text
        if (this._progressText) {
          this._progressText.textContent = `${p}%`;
        }

        // Update loading text at milestones
        if (this._loadingText) {
          if (p < 30) {
            this._loadingText.textContent = '読み込み中...'; // Loading...
          } else if (p < 60) {
            this._loadingText.textContent = '世界を構築中...'; // Building world...
          } else if (p < 90) {
            this._loadingText.textContent = 'もうすぐ...'; // Almost...
          } else {
            this._loadingText.textContent = '準備完了'; // Ready
          }
        }
      },
    });

    return tl;
  }

  /**
   * Handle loading completion — fade out loader, then clean up.
   * @private
   * @param {Function} onComplete
   */
  _onLoadingComplete(onComplete) {
    // Brief pause at 100% for dramatic effect
    gsap.delayedCall(0.3, () => {
      // Fade out the loader
      gsap.to(this._loader, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          // Remove from flow
          this._loader.style.display = 'none';
          this._loader.style.pointerEvents = 'none';

          // Fire the completion callback
          if (typeof onComplete === 'function') {
            onComplete();
          }
        },
      });
    });
  }
}
