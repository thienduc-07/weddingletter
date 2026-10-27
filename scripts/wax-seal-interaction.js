/**
 * WAX SEAL INTERACTION: The Golden Seal Ritual
 * -------------------------------------------------------------
 * Manages the hold-to-open interaction on the wax seal.
 * Supports mouse, touch, keyboard, and accessible fallback button.
 */

import { weddingContent } from '../src/data/wedding-content.js';

export class WaxSealController {
  constructor(options = {}) {
    this.sealEl = document.querySelector('.wax-seal');
    this.containerEl = document.querySelector('.wax-seal-container');
    this.envelopeWrapper = document.querySelector('.envelope-wrapper');
    this.meterEl = document.querySelector('.seal-progress-meter');
    this.accessibleBtn = document.querySelector('.btn-open-accessible');
    this.sparklesEl = document.querySelector('.seal-sparkles');
    this.instructionWrap = document.querySelector('.seal-instruction-wrap');

    this.holdDuration = weddingContent.interaction?.sealHoldDuration || 1500;
    this.isOpened = false;
    this.isPressing = false;
    this.pressStartTime = 0;
    this.rafId = null;
    this.circumference = 226; // 2 * PI * r (r=36)

    this.onOpenedCallbacks = [];

    this.init();
  }

  init() {
    if (!this.sealEl) return;

    // Pointer events (handles both mouse and touch reliably)
    this.sealEl.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    window.addEventListener('pointerup', () => this.handlePointerUp());
    window.addEventListener('pointercancel', () => this.handlePointerUp());

    // Keyboard support (Space or Enter on focused seal)
    this.sealEl.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && !this.isOpened && !this.isPressing) {
        e.preventDefault();
        this.startHold();
      }
    });

    this.sealEl.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        this.cancelHold();
      }
    });

    // Accessible fallback button
    if (this.accessibleBtn) {
      this.accessibleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerOpen();
      });
    }
  }

  onOpened(callback) {
    if (typeof callback === 'function') {
      this.onOpenedCallbacks.push(callback);
    }
  }

  handlePointerDown(e) {
    if (this.isOpened) return;
    // Prevent accidental text selection during hold
    e.preventDefault();
    this.startHold();
  }

  handlePointerUp() {
    if (this.isPressing && !this.isOpened) {
      this.cancelHold();
    }
  }

  startHold() {
    if (this.isOpened || this.isPressing) return;
    this.isPressing = true;
    this.pressStartTime = performance.now();
    this.sealEl.classList.add('is-pressing');

    const tick = (now) => {
      if (!this.isPressing || this.isOpened) return;
      const elapsed = now - this.pressStartTime;
      const progress = Math.min(1, elapsed / this.holdDuration);

      if (this.meterEl) {
        const offset = this.circumference * (1 - progress);
        this.meterEl.style.strokeDashoffset = offset.toFixed(2);
      }

      if (progress >= 1) {
        this.triggerOpen();
      } else {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  cancelHold() {
    this.isPressing = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.sealEl.classList.remove('is-pressing');

    // Smoothly reset meter
    if (this.meterEl) {
      this.meterEl.style.transition = 'stroke-dashoffset 0.3s ease-out';
      this.meterEl.style.strokeDashoffset = this.circumference;
      setTimeout(() => {
        if (this.meterEl && !this.isPressing) {
          this.meterEl.style.transition = '';
        }
      }, 300);
    }
  }

  triggerOpen() {
    if (this.isOpened) return;
    this.isOpened = true;
    this.isPressing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);

    // Haptic feedback if supported on mobile
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 50, 40]); } catch (err) {}
    }

    // Sparkle burst
    if (this.sparklesEl) {
      this.sparklesEl.classList.add('is-bursting');
      setTimeout(() => this.sparklesEl.classList.remove('is-bursting'), 1000);
    }

    // Mark envelope opened
    if (this.envelopeWrapper) {
      this.envelopeWrapper.classList.add('is-opened');
    }

    // Hide instruction text
    if (this.instructionWrap) {
      this.instructionWrap.style.opacity = '0';
      this.instructionWrap.style.pointerEvents = 'none';
    }

    // Broadcast opened event to listeners
    this.onOpenedCallbacks.forEach((cb) => {
      try { cb(); } catch (err) { console.error('Error in onOpened callback:', err); }
    });
  }

  reset() {
    this.isOpened = false;
    this.isPressing = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);

    if (this.envelopeWrapper) {
      this.envelopeWrapper.classList.remove('is-opened');
    }
    if (this.meterEl) {
      this.meterEl.style.strokeDashoffset = this.circumference;
    }
    if (this.sealEl) {
      this.sealEl.classList.remove('is-pressing');
    }
    if (this.instructionWrap) {
      this.instructionWrap.style.opacity = '1';
      this.instructionWrap.style.pointerEvents = 'auto';
    }
  }
}
