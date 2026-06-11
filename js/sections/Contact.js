/**
 * Contact.js — Contact form interactions for Sri Vardhan's portfolio
 * 
 * Features:
 *   - Form field focus animations (label slides up, border glows)
 *   - Submit button loading state with spinner
 *   - Form submission handling with success message animation
 *   - Social links staggered entrance on section scroll
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class Contact {
  constructor() {
    /** @private Form reference */
    this._form = null;

    /** @private Submit button reference */
    this._submitBtn = null;
  }

  /**
   * Initialize contact section animations and interactions.
   */
  init() {
    this._setupSectionEntrance();
    this._setupFormFieldAnimations();
    this._setupFormSubmission();
    this._setupSocialLinks();
  }

  /**
   * Animate section headings on entrance.
   * @private
   */
  _setupSectionEntrance() {
    const headings = document.querySelectorAll('#contact .section-label, #contact .section-title');
    if (headings.length === 0) return;

    gsap.set(headings, { opacity: 0, y: 20 });

    ScrollTrigger.create({
      trigger: '#contact',
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
   * Set up form field focus/blur animations.
   * Labels slide up and borders glow on focus.
   * @private
   */
  _setupFormFieldAnimations() {
    const formGroups = document.querySelectorAll('.form-group');

    formGroups.forEach((group) => {
      const input = group.querySelector('input, textarea');
      const label = group.querySelector('label');

      if (!input) return;

      // Check if field already has value (e.g., autofilled)
      const checkValue = () => {
        if (input.value.trim() !== '') {
          group.classList.add('has-value');
        } else {
          group.classList.remove('has-value');
        }
      };

      // ── Focus: label slides up, border glows ─────────────────────────────
      input.addEventListener('focus', () => {
        group.classList.add('focused');

        if (label) {
          gsap.to(label, {
            y: -24,
            scale: 0.85,
            color: 'var(--accent-primary)',
            duration: 0.3,
            ease: 'power2.out',
          });
        }

        // Border glow effect
        gsap.to(input, {
          borderColor: 'var(--accent-primary)',
          boxShadow: '0 0 20px var(--accent-glow)',
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      // ── Blur: reset if empty ─────────────────────────────────────────────
      input.addEventListener('blur', () => {
        group.classList.remove('focused');
        checkValue();

        if (label && input.value.trim() === '') {
          gsap.to(label, {
            y: 0,
            scale: 1,
            color: 'var(--text-secondary)',
            duration: 0.3,
            ease: 'power2.out',
          });
        }

        // Remove border glow
        gsap.to(input, {
          borderColor: 'var(--glass-border)',
          boxShadow: 'none',
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      // ── Input: check for value ───────────────────────────────────────────
      input.addEventListener('input', checkValue);

      // Initial check for autofilled values
      checkValue();
    });

    // Stagger form groups entrance
    if (formGroups.length > 0) {
      gsap.set(formGroups, { opacity: 0, y: 25 });

      ScrollTrigger.create({
        trigger: '#contact',
        start: 'top 65%',
        once: true,
        onEnter: () => {
          gsap.to(formGroups, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
          });
        },
      });
    }
  }

  /**
   * Handle form submission with loading state and success message.
   * @private
   */
  _setupFormSubmission() {
    this._form = document.querySelector('.contact-form, #contact-form');
    this._submitBtn = this._form?.querySelector('button[type="submit"], .submit-btn');

    if (!this._form) return;

    this._form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Don't allow double-submission
      if (this._submitBtn?.classList.contains('loading')) return;

      const nameInput = this._form.querySelector('#name');
      const emailInput = this._form.querySelector('#email');
      const messageInput = this._form.querySelector('#message');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      this._showLoadingState();

      // We use FormSubmit.co (100% free, unlimited, works perfectly on GitHub Pages)
      const targetEmail = 'svardhan1007@gmail.com';

      fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Name: name,
          Email: email,
          Message: message
        })
      })
      .then(response => response.json())
      .then(data => {
        this._hideLoadingState();
        if (data.success === 'true' || data.success === true) {
          this._showSuccessMessage();
          this._form.reset();

          // Reset form group states
          const groups = this._form.querySelectorAll('.form-group');
          groups.forEach((g) => {
            g.classList.remove('has-value', 'focused');
            const label = g.querySelector('label');
            if (label) {
              gsap.set(label, { y: 0, scale: 1, color: 'var(--text-secondary)' });
            }
          });
        } else {
          alert(data.message || 'Submission failed. Please try again or email directly to svardhan1007@gmail.com');
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        this._hideLoadingState();
        alert('Could not submit form. Please check your network connection or email directly.');
      });
    });
  }

  /**
   * Show loading state on submit button.
   * @private
   */
  _showLoadingState() {
    if (!this._submitBtn) return;

    this._submitBtn.classList.add('loading');
    const originalText = this._submitBtn.textContent;
    this._submitBtn.dataset.originalText = originalText;

    gsap.to(this._submitBtn, {
      scale: 0.97,
      duration: 0.2,
      ease: 'power2.out',
    });

    // Replace text with loading indicator
    this._submitBtn.innerHTML = `
      <span class="btn-loader">
        <span class="btn-loader-dot"></span>
        <span class="btn-loader-dot"></span>
        <span class="btn-loader-dot"></span>
      </span>
    `;

    // Animate the dots
    const dots = this._submitBtn.querySelectorAll('.btn-loader-dot');
    gsap.fromTo(
      dots,
      { opacity: 0.3 },
      {
        opacity: 1,
        duration: 0.4,
        stagger: { each: 0.15, repeat: -1, yoyo: true },
        ease: 'power1.inOut',
      }
    );
  }

  /**
   * Hide loading state on submit button.
   * @private
   */
  _hideLoadingState() {
    if (!this._submitBtn) return;

    this._submitBtn.classList.remove('loading');
    this._submitBtn.textContent = this._submitBtn.dataset.originalText || 'Send Message';

    gsap.to(this._submitBtn, {
      scale: 1,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)',
    });
  }

  /**
   * Display a success message with GSAP animation.
   * @private
   */
  _showSuccessMessage() {
    // Check if a success message element already exists
    let successEl = document.querySelector('.form-success-message');

    if (!successEl) {
      // Create one dynamically
      successEl = document.createElement('div');
      successEl.classList.add('form-success-message');
      successEl.innerHTML = `
        <span class="success-icon">✓</span>
        <span class="success-text">メッセージ送信完了！ — Message sent successfully!</span>
      `;

      // Style it
      successEl.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background: rgba(74, 222, 128, 0.1);
        border: 1px solid rgba(74, 222, 128, 0.3);
        border-radius: 8px;
        color: #4ADE80;
        font-size: 0.95rem;
        margin-top: 16px;
      `;

      this._form.parentNode.insertBefore(successEl, this._form.nextSibling);
    }

    // Animate in
    gsap.fromTo(
      successEl,
      { opacity: 0, y: 15, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(1.5)',
      }
    );

    // Auto-hide after 5 seconds
    gsap.to(successEl, {
      opacity: 0,
      y: -10,
      duration: 0.4,
      delay: 5,
      ease: 'power2.in',
      onComplete: () => {
        if (successEl.parentNode) {
          successEl.parentNode.removeChild(successEl);
        }
      },
    });
  }

  /**
   * Stagger-animate social links when contact section enters viewport.
   * @private
   */
  _setupSocialLinks() {
    const socialLinks = document.querySelectorAll('.social-link, .contact-social a');
    if (socialLinks.length === 0) return;

    gsap.set(socialLinks, {
      opacity: 0,
      y: 20,
      scale: 0.8,
    });

    ScrollTrigger.create({
      trigger: '#contact',
      start: 'top 60%',
      once: true,
      onEnter: () => {
        gsap.to(socialLinks, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(2)',
        });
      },
    });
  }
}
