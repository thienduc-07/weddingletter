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
    this.panRatio = 0;
    this.targetPanRatio = 0;
    this.swayShiftX = 0;
    this.targetSwayShiftX = 0;

    this.initParticles();
    this.initListeners();
    this.onResize();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setPanRatio(ratio, swayShiftX = 0) {
    this.targetPanRatio = Math.max(0, Math.min(1, ratio));
    this.targetSwayShiftX = swayShiftX;
  }

  setScrollProgress(p) {
    if (p < 0.14) {
      this.targetPanRatio = (p / 0.14) * 0.18;
    } else if (p < 0.36) {
      const t = (p - 0.14) / 0.22;
      this.targetPanRatio = lerp(0.18, 0.50, t * t * (3 - 2 * t));
    } else {
      this.targetPanRatio = lerp(0.50, 1.00, Math.min(1, (p - 0.36) / 0.14));
    }
  }

  setSwayDescent(descentProgress, swayNormalizedX = 0) {
    this.targetPanRatio = lerp(0.50, 1.00, Math.max(0, Math.min(1, descentProgress)));
    this.targetSwayShiftX = swayNormalizedX;
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

    // Follow pan ratio smoothly and responsively (no floaty lag!)
    this.panRatio += (this.targetPanRatio - this.panRatio) * 0.20;
    if (Math.abs(this.panRatio - this.targetPanRatio) < 0.0005) {
      this.panRatio = this.targetPanRatio;
    }

    this.swayShiftX += (this.targetSwayShiftX - this.swayShiftX) * 0.12;

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

      // Ensure vertical panorama travel exists across all devices (including tall portrait phones)
      const maxAllowedSh = natH * 0.72;
      if (sh > maxAllowedSh) {
        sh = maxAllowedSh;
        sw = sh * screenAspect;
      }

      // Maximum camera travel in image coordinates
      const maxScrollY = Math.max(0, natH - sh);
      const maxScrollX = Math.max(0, natW - sw);

      // Unified, smooth vertical descent:
      // panRatio 0.00: Top of panorama (sunset sky, olive canopy, fairy lights)
      // panRatio 0.50: Midground (lantern walkway, Tuscan arch, overview of table)
      // panRatio 1.00: Banquet table (ivory tablecloth, candles, rose centerpiece)
      let sy = this.panRatio * maxScrollY - my * 14;
      let sx = (maxScrollX / 2) - mx * 16 - this.swayShiftX * 18;

      sx = Math.max(0, Math.min(maxScrollX, sx));
      sy = Math.max(0, Math.min(maxScrollY, sy));

      // Dynamic depth-of-field blur:
      const blurPx = lerp(0.8, 2.6, this.panRatio);
      const bright = lerp(1.04, 1.01, this.panRatio);

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
    // Golden sun glow: strongest in sky during arrival flight
    const sunIntensity = Math.max(0.12, 0.35 * (1 - Math.min(1.0, this.panRatio * 1.2)));
    const sunX = w * 0.82 + Math.sin(t * 0.3) * 25 + mx * 20;
    const sunY = h * 0.10 + my * 12;
    const sunR = Math.min(w, h) * 0.75;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
    sunGrad.addColorStop(0, `rgba(255, 240, 200, ${sunIntensity.toFixed(3)})`);
    sunGrad.addColorStop(0.4, `rgba(255, 230, 180, ${(sunIntensity * 0.45).toFixed(3)})`);
    sunGrad.addColorStop(1, 'rgba(255, 230, 180, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Banquet table candle glow: intensifies as stationery lands on table
    if (this.panRatio > 0.40) {
      const candleAlpha = Math.min(1.0, (this.panRatio - 0.40) / 0.45) * 0.22;
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
