/**
 * AMBIENT ENVIRONMENT: Drifting Rose Petals Canvas
 * -------------------------------------------------------------
 * Ultra-smooth, lightweight atmospheric rose petals drifting softly
 * across foreground and background depth layers.
 */

import { weddingContent } from '../src/data/wedding-content.js';

export class AmbientPetals {
  constructor(canvasId = 'ambientCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    if (!weddingContent.interaction?.enableAmbientPetals) {
      this.canvas.style.display = 'none';
      return;
    }

    // Honor prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.canvas.style.display = 'none';
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isPaused = false;
    this.rafId = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
      this.isPaused = document.hidden;
      if (!this.isPaused) this.render();
    });

    const isMobile = this.width < 768;
    const count = isMobile ? 14 : 24;

    for (let i = 0; i < count; i++) {
      this.petals.push(this.createPetal(true));
    }

    this.render();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createPetal(randomY = false) {
    const depth = 0.5 + Math.random() * 0.8; // 0.5 (distant/small) to 1.3 (foreground)
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -30,
      size: (12 + Math.random() * 12) * depth,
      vx: (Math.random() - 0.45) * 0.7 * depth,
      vy: (0.6 + Math.random() * 0.9) * depth,
      rotation: Math.random() * Math.PI * 2,
      vRotation: (Math.random() - 0.5) * 0.02,
      wobble: Math.random() * Math.PI * 2,
      vWobble: 0.015 + Math.random() * 0.02,
      depth: depth,
      color: Math.random() > 0.4 ? '#F5DADD' : (Math.random() > 0.5 ? '#FCEDEF' : '#EABFC7'),
      opacity: 0.35 + Math.random() * 0.4,
    };
  }

  render() {
    if (this.isPaused) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];

      p.y += p.vy;
      p.x += p.vx + Math.sin(p.wobble) * 0.5;
      p.rotation += p.vRotation;
      p.wobble += p.vWobble;

      // Wrap around
      if (p.y > this.height + 40) {
        this.petals[i] = this.createPetal(false);
      }
      if (p.x < -40) p.x = this.width + 40;
      if (p.x > this.width + 40) p.x = -40;

      // Draw single organic rose petal
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.scale(Math.cos(p.wobble * 0.7), 1); // 3D flip illusion

      this.ctx.beginPath();
      this.ctx.moveTo(0, -p.size * 0.5);
      this.ctx.bezierCurveTo(
        p.size * 0.6, -p.size * 0.3,
        p.size * 0.5, p.size * 0.5,
        0, p.size * 0.6
      );
      this.ctx.bezierCurveTo(
        -p.size * 0.5, p.size * 0.5,
        -p.size * 0.6, -p.size * 0.3,
        0, -p.size * 0.5
      );
      this.ctx.closePath();

      // Soft petal gradient with translucent edge
      const grad = this.ctx.createRadialGradient(0, -p.size * 0.1, 1, 0, 0, p.size * 0.6);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, '#D99EAD');

      this.ctx.fillStyle = grad;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();

      this.ctx.restore();
    }

    this.rafId = requestAnimationFrame(() => this.render());
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
