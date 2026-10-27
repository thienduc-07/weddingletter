/**
 * AMBIENT BACKGROUND — EUROPEAN WEDDING RECEPTION WITH MOUSE PARALLAX (V2.1)
 * -------------------------------------------------------------
 * Cinematic European luxury wedding reception ballroom:
 * - High-end banquet tables with ivory linens, candelabras, crystal chandeliers
 * - Soft depth-of-field blur and atmospheric warmth
 * - Controlled contrast and soft vignette so 3D stationery remains the sharp focus
 * - Multi-layer mouse parallax with gentle easing (lerp)
 * - 40 floating golden dust particles with organic twinkle
 */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class AmbientBackground {
  constructor(canvasElement) {
    this.canvas = typeof canvasElement === 'string'
      ? document.querySelector(canvasElement)
      : canvasElement;

    if (!this.canvas) {
      console.warn('Canvas element not found for AmbientBackground');
      return;
    }

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.bgImage = new Image();
    this.imageLoaded = false;
    this.bgImage.onload = () => {
      this.imageLoaded = true;
    };
    this.bgImage.src = 'assets/garden_wedding_bg.jpg';

    this.time = 0;
    this.progress = 0;
    this.targetProgress = 0;

    this.initParticles();
    this.initListeners();
    this.onResize();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setScrollProgress(p) {
    this.targetProgress = Math.max(0, Math.min(1, p));
  }

  initParticles() {
    const count = window.innerWidth < 768 ? 22 : 38;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.6 + 0.7,
        baseAlpha: Math.random() * 0.32 + 0.12,
        speedX: (Math.random() - 0.5) * 0.16,
        speedY: -Math.random() * 0.22 - 0.06, // Slow upward drift
        depth: Math.random() * 0.85 + 0.15,
        phase: Math.random() * Math.PI * 2,
        isGold: Math.random() > 0.4,
      });
    }
  }

  initListeners() {
    window.addEventListener('resize', () => this.onResize(), { passive: true });

    if (!this.isTouch && !this.isReducedMotion) {
      window.addEventListener('pointermove', (e) => {
        this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        this.mouse.targetX = 0;
        this.mouse.targetY = 0;
      });
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Smooth mouse parallax interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    // Smooth scroll progress interpolation
    this.progress += (this.targetProgress - this.progress) * 0.08;

    this.time += 0.007;

    this.render();
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const mx = this.mouse.x;
    const my = this.mouse.y;
    const t = this.time;
    const p = this.progress;

    // -------------------------------------------------------------------------
    // LAYER 1: Dynamic Continuous Outdoor Garden Wedding Scene (Scroll Descent)
    // -------------------------------------------------------------------------
    if (this.imageLoaded) {
      const natW = this.bgImage.naturalWidth || 768;
      const natH = this.bgImage.naturalHeight || 1376;
      const screenAspect = w / h;

      // Calculate source crop window to fill viewport seamlessly
      let sw = natW;
      let sh = natW / screenAspect;

      if (sh > natH) {
        sh = natH;
        sw = natH * screenAspect;
      }

      // Maximum vertical camera travel in the vertical panorama
      const maxScrollY = Math.max(0, natH - sh);
      const maxScrollX = Math.max(0, natW - sw);

      // Continuous vertical pan: p = 0.0 (top sky & villa) -> p = 0.54 (banquet table)
      const panT = Math.min(1.0, Math.max(0.0, p / 0.54));
      // Smooth cubic easing for continuous scene transition
      const easePan = panT < 0.5 ? 4 * panT * panT * panT : 1 - Math.pow(-2 * panT + 2, 3) / 2;

      let sy = easePan * maxScrollY - my * 16;
      let sx = (maxScrollX / 2) - mx * 18;

      sx = Math.max(0, Math.min(maxScrollX, sx));
      sy = Math.max(0, Math.min(maxScrollY, sy));

      // Dynamic depth-of-field blur:
      // In sky/flight: subtle 1.5px blur so sunset & landscape are atmospheric
      // On banquet table: 3.5px soft optical bokeh so 3D card/letter has maximum clarity
      const blurPx = lerp(1.5, 3.8, Math.min(1.0, p / 0.60));
      const bright = lerp(1.06, 1.02, Math.min(1.0, p / 0.60));

      ctx.save();
      ctx.filter = `blur(${blurPx.toFixed(1)}px) brightness(${bright.toFixed(2)})`;
      ctx.drawImage(this.bgImage, sx, sy, sw, sh, 0, 0, w, h);
      ctx.restore();

      // Atmospheric veil: warm golden sunset tint filtering through olive trees
      const scrim = ctx.createLinearGradient(0, 0, w, h);
      scrim.addColorStop(0, 'rgba(255, 250, 240, 0.12)');
      scrim.addColorStop(0.45, 'rgba(255, 245, 235, 0.08)');
      scrim.addColorStop(1, 'rgba(248, 236, 230, 0.16)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, w, h);

    } else {
      // Fallback breathing gradient while image loads
      const gradCenterX = w * 0.5 + mx * 18;
      const gradCenterY = h * 0.45 + my * 14;
      const maxRadius = Math.max(w, h) * 0.85;

      const baseGrad = ctx.createRadialGradient(
        gradCenterX, gradCenterY, maxRadius * 0.05,
        gradCenterX, gradCenterY, maxRadius
      );
      baseGrad.addColorStop(0, '#FFFDFB');
      baseGrad.addColorStop(0.5, '#FFF7F7');
      baseGrad.addColorStop(1, '#F5E4E8');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // -------------------------------------------------------------------------
    // LAYER 2: Warm Afternoon Sunrays & Banquet Table Candlelight Pools
    // -------------------------------------------------------------------------
    // Golden sun glow: strongest in sky during arrival flight (p in [0, 0.40])
    const sunIntensity = Math.max(0.12, 0.35 * (1 - Math.min(1.0, p / 0.70)));
    const sunX = w * 0.82 + Math.sin(t * 0.3) * 25 + mx * 20;
    const sunY = h * 0.10 + my * 12;
    const sunR = Math.min(w, h) * 0.75;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
    sunGrad.addColorStop(0, `rgba(255, 240, 200, ${sunIntensity.toFixed(3)})`);
    sunGrad.addColorStop(0.4, `rgba(255, 230, 180, ${(sunIntensity * 0.45).toFixed(3)})`);
    sunGrad.addColorStop(1, 'rgba(255, 230, 180, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Banquet table candle glow: intensifies as stationery lands on table (p > 0.36)
    if (p > 0.25) {
      const candleAlpha = Math.min(1.0, (p - 0.25) / 0.30) * 0.22;
      const candle1X = w * 0.22 + mx * 24;
      const candle1Y = h * 0.76 + my * 16;
      const c1Grad = ctx.createRadialGradient(candle1X, candle1Y, 0, candle1X, candle1Y, w * 0.28);
      c1Grad.addColorStop(0, `rgba(255, 220, 160, ${candleAlpha.toFixed(3)})`);
      c1Grad.addColorStop(1, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = c1Grad;
      ctx.fillRect(0, 0, w, h);

      const candle2X = w * 0.78 + mx * 24;
      const candle2Y = h * 0.76 + my * 16;
      const c2Grad = ctx.createRadialGradient(candle2X, candle2Y, 0, candle2X, candle2Y, w * 0.28);
      c2Grad.addColorStop(0, `rgba(255, 220, 160, ${candleAlpha.toFixed(3)})`);
      c2Grad.addColorStop(1, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = c2Grad;
      ctx.fillRect(0, 0, w, h);
    }

    // -------------------------------------------------------------------------
    // LAYER 3: Soft Atmospheric Depth Vignette
    // -------------------------------------------------------------------------
    const vigGrad = ctx.createRadialGradient(
      w * 0.5, h * 0.5, Math.min(w, h) * 0.35,
      w * 0.5, h * 0.5, Math.max(w, h) * 0.85
    );
    vigGrad.addColorStop(0, 'rgba(89, 68, 73, 0)');
    vigGrad.addColorStop(1, 'rgba(89, 68, 73, 0.10)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // -------------------------------------------------------------------------
    // LAYER 4: Floating Golden Dust Particles (Depth-sorted Parallax)
    // -------------------------------------------------------------------------
    const pCount = this.particles.length;
    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];

      p.y += p.speedY;
      p.x += p.speedX + Math.sin(t + p.phase) * 0.12;

      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const px = p.x + mx * p.depth * 38;
      const py = p.y + my * p.depth * 28;
      const alpha = p.baseAlpha * (0.75 + Math.sin(t * 2 + p.phase) * 0.25);

      ctx.beginPath();
      ctx.arc(px, py, p.radius * (0.8 + p.depth * 0.4), 0, Math.PI * 2);

      if (p.isGold) {
        ctx.fillStyle = `rgba(215, 188, 131, ${alpha.toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(255, 253, 249, ${(alpha * 1.2).toFixed(3)})`;
      }
      ctx.fill();
    }
  }
}
