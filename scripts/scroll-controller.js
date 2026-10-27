/**
 * SCROLL CONTROLLER: 3D Envelope Rotation & Timeline Orchestration
 * -------------------------------------------------------------
 * Maps scroll progress to continuous 3D rotation, pitch, and depth.
 * Provides subtle pointer-following tilt on desktop when stationary.
 */

import { weddingContent } from '../src/data/wedding-content.js';

export class Envelope3DController {
  constructor(options = {}) {
    this.actEl = document.querySelector('[data-envelope-act]');
    this.envelope3d = document.querySelector('.envelope-3d');
    this.stageEl = document.querySelector('.envelope-stage');
    this.shadowEl = document.querySelector('.envelope-floor-shadow');

    this.p = 0; // Normalized progress 0..1
    this.currentRotY = -10;
    this.currentRotX = 6;
    this.currentTransY = 0;
    this.targetRotY = -10;
    this.targetRotX = 6;
    this.targetTransY = 0;

    this.pointerX = 0; // -1 .. 1
    this.pointerY = 0; // -1 .. 1
    this.enablePointerTilt = weddingContent.interaction?.enablePointerTilt ?? true;

    this.rafId = null;
    this.init();
  }

  init() {
    if (!this.envelope3d || !this.actEl) return;

    // Listen to scroll
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    window.addEventListener('resize', () => this.handleScroll(), { passive: true });

    // Pointer move for desktop parallax tilt
    if (this.enablePointerTilt && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    }

    // Start render loop
    this.handleScroll();
    this.renderLoop();
  }

  handleScroll() {
    if (!this.actEl) return;
    const rect = this.actEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollTravel = Math.max(1, this.actEl.offsetHeight - vh);
    const scrolled = -rect.top;

    // Normalized progress p through the pinned envelope act
    let p = scrolled / scrollTravel;
    p = Math.max(0, Math.min(1, p));
    this.p = p;

    // Map progress p (0..1) to 3D rotation:
    // At p = 0: front view, resting tilt (rotateY = -10, rotateX = 6)
    // At p = 0.5: side edge passing by (rotateY = 90)
    // At p = 0.9+: back view completely upright and centered (rotateY = 180, rotateX = 0)
    const baseRotY = -10 + p * 190; // -10 to 180
    const baseRotX = (1 - p) * 6;   // 6 to 0

    // Arc lift during rotation
    const lift = Math.sin(p * Math.PI) * -24;

    this.targetRotY = baseRotY;
    this.targetRotX = baseRotX;
    this.targetTransY = lift;

    // Adjust shadow size and opacity with rotation & lift
    if (this.shadowEl) {
      const shadowScale = 1 - Math.abs(Math.sin(p * Math.PI)) * 0.15;
      const shadowOpacity = 0.28 - Math.abs(Math.sin(p * Math.PI)) * 0.1;
      this.shadowEl.style.transform = `translateX(-50%) rotateX(85deg) scale(${shadowScale})`;
      this.shadowEl.style.opacity = shadowOpacity.toFixed(2);
    }
  }

  handleMouseMove(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Normalized between -1 and 1
    this.pointerX = (e.clientX / w) * 2 - 1;
    this.pointerY = (e.clientY / h) * 2 - 1;
  }

  renderLoop() {
    // Smooth lerp toward target
    const tiltX = this.pointerY * -3.5;
    const tiltY = this.pointerX * 5.5;

    // Smooth dampening
    this.currentRotY += (this.targetRotY + tiltY - this.currentRotY) * 0.12;
    this.currentRotX += (this.targetRotX + tiltX - this.currentRotX) * 0.12;
    this.currentTransY += (this.targetTransY - this.currentTransY) * 0.12;

    if (this.envelope3d) {
      this.envelope3d.style.transform = 
        `translate3d(0, ${this.currentTransY.toFixed(2)}px, 0) ` +
        `rotateX(${this.currentRotX.toFixed(2)}deg) ` +
        `rotateY(${this.currentRotY.toFixed(2)}deg)`;

      // Cleanly toggle front vs back face visibility to prevent any reverse bleed-through
      const frontEl = this.envelope3d.querySelector('.envelope-front');
      const backEl = this.envelope3d.querySelector('.envelope-back');
      if (frontEl && backEl) {
        const normRotY = ((this.currentRotY % 360) + 360) % 360;
        const isFrontFacing = (normRotY <= 85 || normRotY >= 275);
        const isBackFacing = (normRotY >= 95 && normRotY <= 265);

        if (isFrontFacing && !isBackFacing) {
          frontEl.style.visibility = 'visible';
          backEl.style.visibility = 'hidden';
        } else if (isBackFacing && !isFrontFacing) {
          frontEl.style.visibility = 'hidden';
          backEl.style.visibility = 'visible';
        } else {
          // Transition / side-edge angle
          frontEl.style.visibility = 'visible';
          backEl.style.visibility = 'visible';
        }
      }
    }

    this.rafId = requestAnimationFrame(() => this.renderLoop());
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
