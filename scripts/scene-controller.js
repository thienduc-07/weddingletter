/**
 * SCENE CONTROLLER — THE UNFOLDING LETTER (V3.0 PHYSICAL INTEGRITY & STORYTELLING)
 * -------------------------------------------------------------
 * Master 3D Scene Controller & Choreographed State Machine:
 * 
 * 1. SCROLL DRAFT & 3D AERIAL FLIGHT (p = 0.00 -> 0.28):
 *    Stationery sweeps from top-right, performing continuous multi-axis 3D
 *    barrel rolls and banking flips across the warm European ballroom.
 * 2. CENTERING & DOCKING (p = 0.28):
 *    Decelerates smoothly into exact center, perfectly upright.
 * 3. WAX SEAL PRESS-AND-HOLD (p = 0.28 checkpoint):
 *    Interactive prompt over 3D gold wax seal (no letters, embossed laurel motif).
 *    Holds >= 850ms. Flap rotates open 155°, seal breaks, letter & ribbon peek 8%.
 *    Strict checkpoint: User cannot bypass hold-to-open.
 * 4. EXTRACTING LETTER (p = 0.28 -> 0.58):
 *    Scroll pulls rolled letter upward out of envelope pocket.
 *    Satin ribbon is physically tied to the letter roll, rises with it,
 *    and unties gracefully.
 * 5. UNFOLDING IN 3D SPACE (p = 0.58 -> 0.88):
 *    Envelope recedes into atmospheric ballroom background.
 *    Paper coils unroll downward into 3D space, revealing wedding copy.
 *    3D Rose branch embellishes the card with delicate floral depth.
 * 6. LETTER REVEALED (p = 0.88 -> 1.00):
 *    Completely planar, centered, upright, perfectly legible with ample margins.
 * 
 * Continuous reversibility across the entire journey with zero frame jumps.
 */

import * as THREE from './three.module.js';
import { weddingContent } from '../src/data/wedding-content.js';
import { createLetterTextures } from './letter-canvas-texture.js';
import { Envelope3DMesh } from './envelope-3d-mesh.js';
import { WeddingCard3DMesh } from './wedding-card-mesh.js';
import { LetterScrollMesh } from './letter-scroll-mesh.js';
import { RibbonBowMesh } from './ribbon-bow-mesh.js';
import { RoseBranchMesh } from './rose-branch-mesh.js';
import { GoldenSparkSystem } from './golden-spark-system.js';
import { getChapterState } from './scramble-text.js';

// Cubic easing helpers
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class SceneController {
  constructor(canvasContainer) {
    this.container = typeof canvasContainer === 'string'
      ? document.querySelector(canvasContainer)
      : canvasContainer;

    if (!this.container) {
      console.warn('Canvas container not found for SceneController');
      return;
    }

    // State Machine
    // ARRIVING, SCROLL_DRAFT, CENTERING, CENTERED, HOLDING_SEAL, OPENING_ENVELOPE, ENVELOPE_OPEN, EXTRACTING_LETTER, UNFOLDING_LETTER, LETTER_REVEALED
    this.state = 'ARRIVING';
    this.envelopeOpened = false;
    this.isReloading = false;

    // Timeline variables
    this.scrollProgress = 0;       // 0 to 1 interpolated
    this.targetScrollProgress = 0; // 0 to 1 from scroll
    this.openingProgress = 0;      // 0 to 1 for flap opening
    this.holdProgress = 0;         // 0 to 1 for wax seal press
    this.holdStartTime = 0;
    this.holdDuration = 850;       // ms required to break seal

    // Mouse & Parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Raycaster for direct 3D seal mesh interaction
    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this._tmpVec = new THREE.Vector3();

    this.init();
  }

  init() {
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initCornerHUD();
    this.initMeshes();
    this.initInteractiveHoldTrigger();
    this.initListeners();
    this.onResize();
    this.initRomanticReveal();

    // Start single authoritative animation loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.renderer.domElement.id = 'webgl-stage';
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
    this.camera.position.set(0, 0, 7.5);
    this.scene.add(this.camera);
  }

  initLighting() {
    // 1. Soft Ambient Fill
    this.ambientLight = new THREE.AmbientLight(0xFFFBF8, 0.95);
    this.scene.add(this.ambientLight);

    // 2. Large Soft Key Light (Warm Champagne)
    this.keyLight = new THREE.DirectionalLight(0xFFF4E6, 2.3);
    this.keyLight.position.set(4.0, 5.5, 5.0);
    this.scene.add(this.keyLight);

    // 3. Delicate Blush Fill Light
    this.fillLight = new THREE.DirectionalLight(0xF8DDE2, 0.95);
    this.fillLight.position.set(-4.0, -2.2, 3.5);
    this.scene.add(this.fillLight);

    // 4. Warm Gold Rim Light for edge definition
    this.rimLight = new THREE.DirectionalLight(0xD7BC83, 1.4);
    this.rimLight.position.set(0, 4.5, -3.0);
    this.scene.add(this.rimLight);
  }

  initCornerHUD() {
    this.hud = {
      topLeft: document.getElementById('hud-top-left'),
      topCenter: document.getElementById('hud-top-center'),
      topRight: document.getElementById('hud-top-right'),
      midLeft: document.getElementById('hud-mid-left'),
      midRight: document.getElementById('hud-mid-right'),
      botLeft: document.getElementById('hud-bot-left-names'),
      botCenter: document.getElementById('scroll-hint-text'),
      botRight: document.getElementById('hud-bot-right'),
      progressFill: document.getElementById('hud-progress-fill'),
      scrollHint: document.getElementById('scrollHint'),
    };
  }

  initMeshes() {
    // 0. Hero Surface: 3D European Garden Banquet Table & Ivory Linen Runner
    this.initBanquetTable();

    // Master Stationery Group: contains envelope, invitation card, and letter scroll
    this.stationeryGroup = new THREE.Group();
    this.stationeryGroup.name = 'StationeryMasterGroup';
    this.scene.add(this.stationeryGroup);

    // Dedicated Sway & Settle Wrapper
    // Decouples scroll-driven transform (stationeryGroup) from the settling sway animation (swayGroup)!
    this.swayGroup = new THREE.Group();
    this.swayGroup.name = 'StationerySwayWrapper';
    this.stationeryGroup.add(this.swayGroup);

    // 1. 3D Blush Pink Envelope Mesh (Solid seamless box casing, rounded corners, slim depth)
    // Front face features metallic gold foil calligraphy: "Thiên Đức & Phương Anh"
    this.envelope = new Envelope3DMesh({
      width: 3.3,
      height: 2.2,
      depth: 0.028,
    });
    this.swayGroup.add(this.envelope.group);

    // 2. Dedicated 3D Letter Scroll (Cuộn Thư Cưới 3D)
    // Physical unrolling parchment with 3D Blush Satin Ribbon Bow & 3D Rose Branch
    this.scroll = new LetterScrollMesh({
      rollRadius: 0.16,
      rollWidth: 2.45,
      totalHeight: 3.65,
    });
    this.swayGroup.add(this.scroll.group);

    // Aliases for compatibility
    this.paper = this.scroll;
    this.roseBranch = this.scroll.roseBranch;
    this.ribbon = this.scroll.ribbon;

    // Initial state: sealed envelope (scroll hidden inside until wax seal breaks)
    this.envelope.setFlapAngle(0);
    this.envelope.setSealOpacity(1.0);

    this.scroll.group.position.set(0, -0.15, 0.025);
    this.scroll.group.visible = false;
    this.scroll.setUntying(0);
    this.scroll.setUnroll(0);

    // 5. Envelope Inner Warm Glow Light
    this.envelopeInnerLight = new THREE.PointLight(0xFFE5A3, 0, 4.5);
    this.envelopeInnerLight.position.set(0, 0, 0.08);
    this.swayGroup.add(this.envelopeInnerLight);

    // 6. Celebratory 3D Golden Particle Spark & Burst System
    this.sparks = new GoldenSparkSystem(this.scene);
  }

  initBanquetTable() {
    this.banquetTableGroup = new THREE.Group();
    this.banquetTableGroup.name = 'BanquetTableHeroSurface';

    // 1. Draped Ivory Linen Table Runner with feathered translucency
    // Adds tactile texture to the banquet table landing area
    const runnerGeom = new THREE.PlaneGeometry(6.2, 12);
    runnerGeom.rotateX(-Math.PI / 2);

    const linenCanvas = document.createElement('canvas');
    linenCanvas.width = 512;
    linenCanvas.height = 512;
    const lCtx = linenCanvas.getContext('2d');
    
    // Soft feathered ivory runner gradient
    const lGrad = lCtx.createRadialGradient(256, 256, 120, 256, 256, 256);
    lGrad.addColorStop(0, 'rgba(255, 253, 248, 0.40)');
    lGrad.addColorStop(0.65, 'rgba(255, 253, 248, 0.22)');
    lGrad.addColorStop(0.92, 'rgba(247, 241, 230, 0.06)');
    lGrad.addColorStop(1.0, 'rgba(247, 241, 230, 0.0)');
    lCtx.fillStyle = lGrad;
    lCtx.fillRect(0, 0, 512, 512);

    // Fine organic linen thread weft & warp
    lCtx.fillStyle = 'rgba(215, 188, 131, 0.05)';
    for (let x = 0; x < 512; x += 6) {
      lCtx.fillRect(x, 0, 1.2, 512);
    }
    for (let y = 0; y < 512; y += 6) {
      lCtx.fillRect(0, y, 512, 1.2);
    }
    const linenTex = new THREE.CanvasTexture(linenCanvas);

    const runnerMat = new THREE.MeshStandardMaterial({
      map: linenTex,
      transparent: true,
      opacity: 0.30,
      roughness: 0.85,
      metalness: 0.02,
      depthWrite: false,
    });
    this.runnerMesh = new THREE.Mesh(runnerGeom, runnerMat);
    this.runnerMesh.position.set(0, -1.346, 0);
    this.banquetTableGroup.add(this.runnerMesh);

    this.scene.add(this.banquetTableGroup);
  }

  initInteractiveHoldTrigger() {
    this.holdTrigger = document.getElementById('seal-hold-trigger');
    this.holdMeter = document.getElementById('hold-circle-meter');
    this.holdPrompt = document.getElementById('hold-prompt-text');

    if (!this.holdTrigger) return;

    // Circumference of r=42 circle is 2 * PI * 42 ≈ 263.89
    this.dashMax = 264;
    if (this.holdMeter) {
      this.holdMeter.style.strokeDasharray = `${this.dashMax}`;
      this.holdMeter.style.strokeDashoffset = `${this.dashMax}`;
    }

    const startHolding = (e) => {
      if (this.envelopeOpened) return;
      if (e) {
        if (e.cancelable) e.preventDefault();
        if (e.target && e.target.setPointerCapture && e.pointerId) {
          try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
        }
      }
      this.isPointerDown = true;
      this.state = 'HOLDING_SEAL';
      this.holdStartTime = performance.now();
      this.holdTrigger.classList.add('holding');
    };

    const stopHolding = () => {
      if (this.state === 'HOLDING_SEAL') {
        this.cancelHold();
      }
      this.isPointerDown = false;
    };

    // Listen on HTML trigger overlay with pointer events
    this.holdTrigger.addEventListener('pointerdown', startHolding);
    window.addEventListener('pointerup', stopHolding);
    window.addEventListener('pointercancel', stopHolding);

    // Direct Raycaster interaction on WebGL stage for 3D seal button click/touch
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.addEventListener('pointerdown', (e) => {
        if (this.envelopeOpened) return;
        this.pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);

        const checkObjects = [];
        if (this.envelope && this.envelope.sealGroup) checkObjects.push(...this.envelope.sealGroup.children);
        if (this.envelope && this.envelope.flapMesh) checkObjects.push(this.envelope.flapMesh);

        const intersects = this.raycaster.intersectObjects(checkObjects, true);
        if (intersects.length > 0) {
          startHolding(e);
        }
      });
    }
  }

  autoChargeToOpen() {
    this.isAutoCharging = true;
    this.state = 'HOLDING_SEAL';
    this.holdStartTime = performance.now() - (this.holdProgress * this.holdDuration);
  }

  cancelHold() {
    this.isAutoCharging = false;
    if (this.state === 'HOLDING_SEAL') {
      this.state = 'SETTLED';
      if (this.holdTrigger) this.holdTrigger.classList.remove('holding');
    }
  }

  triggerOpenEnvelope() {
    if (this.state === 'OPENING_ENVELOPE' || this.envelopeOpened) return;

    this.state = 'OPENING_ENVELOPE';
    this.openingStartTime = performance.now();
    this.openingProgress = 0;

    // Trigger celebratory golden particle spark explosion & shockwave!
    if (this.sparks && this.envelope) {
      const sealPos = new THREE.Vector3();
      this.envelope.getSealWorldPosition(sealPos);
      this.sparks.burst(sealPos);
      this.sparks.setMotesIntensity(0.70);
    }

    if (this.holdTrigger) {
      this.holdTrigger.classList.add('completed');
      setTimeout(() => {
        this.holdTrigger.style.display = 'none';
      }, 400);
    }
  }

  initListeners() {
    window.addEventListener('resize', () => this.onResize(), { passive: true });

    // Subtle pointer parallax
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

    // Native continuous scroll listener with strict checkpoint enforcement & reverse re-locking
    window.addEventListener('scroll', () => {
      if (this.isReloading) return;
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollMax > 0) {
        let rawP = Math.max(0, Math.min(1, window.scrollY / scrollMax));

        // Re-locking check: If user scrolled back past checkpoint (rawP < 0.48), re-lock envelope!
        if (rawP < 0.48) {
          if (this.envelopeOpened || this.state === 'OPENING_ENVELOPE' || this.state === 'HOLDING_SEAL' || this.openingProgress > 0) {
            this.envelopeOpened = false;
            this.openingProgress = 0.0;
            this.holdProgress = 0.0;
            if (this.envelope) {
              this.envelope.setFlapAngle(0.0);
              this.envelope.setSealOpacity(1.0);
              this.envelope.setDepression(0.0);
              this.envelope.setGlow(0.0);
            }
            if (this.holdMeter) {
              this.holdMeter.style.strokeDashoffset = `${this.dashMax}`;
            }
          }
          if (this.holdTrigger) {
            this.holdTrigger.style.display = '';
            this.holdTrigger.classList.remove('completed', 'holding', 'visible');
          }
        }

        // Strict Checkpoint: If envelope is not yet opened, progress cannot exceed 0.50!
        if (!this.envelopeOpened && rawP > 0.50) {
          rawP = 0.50;
          window.scrollTo(0, 0.50 * scrollMax);
        }

        this.targetScrollProgress = rawP;
      }
    }, { passive: true });

  }

  /**
   * PHẦN VII — Cinematic Romantic Page Reveal
   * Smooth, non-glare, peaceful luxury entrance for the wedding stationery
   */
  initRomanticReveal() {
    const veil = document.getElementById('romantic-page-veil');
    if (!veil) return;

    let dismissed = false;
    const dismissVeil = () => {
      if (dismissed) return;
      dismissed = true;
      veil.classList.add('revealed');
      setTimeout(() => {
        if (veil.parentNode) {
          veil.parentNode.removeChild(veil);
        }
      }, 950);
    };

    // Smooth quiet reveal: dissolve within 550ms guaranteed
    setTimeout(dismissVeil, 550);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTimeout(dismissVeil, 350)).catch(dismissVeil);
    }
  }

  getEnvelopeCameraZ() {
    const aspect = this.camera ? this.camera.aspect : (window.innerWidth / window.innerHeight);
    if (aspect < 0.75) {
      return 7.5 * (0.75 / aspect) * 0.92;
    } else if (aspect < 1.2) {
      return 8.0;
    } else {
      return 7.5;
    }
  }

  getCardTargetCameraZ() {
    const aspect = this.camera ? this.camera.aspect : (window.innerWidth / window.innerHeight);
    const fov = this.camera ? this.camera.fov : 38;
    const fovRad = fov * (Math.PI / 180);
    const tanHalfFov = Math.tan(fovRad / 2);

    const cardW = this.scroll ? this.scroll.rollWidth : 2.45;
    const cardH = this.scroll ? this.scroll.totalHeight : 3.65;

    // Generous coverage: 88% of screen height on desktop, 88% of screen width on mobile
    const coverage = 0.88;
    const reqH_fromH = cardH / coverage;
    const reqH_fromW = cardW / (coverage * aspect);
    const targetH_vis = Math.max(reqH_fromH, reqH_fromW);

    return targetH_vis / (2 * tanHalfFov);
  }

  /**
   * Serpentine 4-Sweep Gliding Descent & Settling Motion
   * (Chuyển động lượn sóng ziczac 4 nhịp rộng khắp màn hình khớp chính xác nét vẽ tham chiếu)
   * Nhịp 0 (u: 0.00 -> 0.12): Từ tâm lượn lên góc trên bên trái
   * Nhịp 1 (u: 0.12 -> 0.38): Đường vẽ 1: Từ mép trái lượn qua mép phải, hạ dần độ cao
   * Nhịp 2 (u: 0.38 -> 0.62): Đường vẽ 2: Từ mép phải vòng xuống lượn qua mép trái dưới sáp nến
   * Nhịp 3 (u: 0.62 -> 0.82): Đường vẽ 3: Từ mép trái vòng xuống lượn qua bên phải ngang hàng hoa
   * Nhịp 4 (u: 0.82 -> 1.00): Đường vẽ 4: Từ bên phải trượt êm vào tâm và đáp xuống mặt bàn tiệc
   */
  getSwayTransform(u) {
    if (u <= 0) return { x: 0.45, y: 0.35, z: -0.2, rotX: 0.15, rotY: 0.0, rotZ: 0.0, bgDescent: 0 };
    if (u >= 1) return { x: 0.0, y: -0.24, z: 0.0, rotX: 0.0, rotY: 0.0, rotZ: 0.0, bgDescent: 1 };

    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const scaleX = Math.min(1.0, Math.max(0.42, w / 1200));

    // Nhịp 0 (u: 0.00 -> 0.12): Lượn êm từ kết thúc Phase 2 (0.45, 0.35, -0.2) lên đỉnh góc trái (-3.4, 0.75) để bắt đầu đường vẽ 1
    if (u < 0.12) {
      const s = u / 0.12;
      const e = s * s * (3 - 2 * s);
      return {
        x: lerp(0.45, -3.4 * scaleX, e),
        y: lerp(0.35, 0.75, e),
        z: lerp(-0.2, -0.15, e),
        rotZ: lerp(0.0, 0.28, e),
        rotX: lerp(0.15, 0.08, e),
        rotY: lerp(0.0, -0.15, e),
        bgDescent: lerp(0.0, 0.08, e),
      };
    }

    // Nhịp 1 (Đường vẽ 1): Quét rộng từ mép trái sang mép phải qua thân thiệp
    if (u < 0.38) {
      const s = (u - 0.12) / 0.26;
      const e = s * s * (3 - 2 * s);
      const dip = Math.sin(s * Math.PI) * 0.28;
      return {
        x: lerp(-3.4 * scaleX, 3.5 * scaleX, e),
        y: lerp(0.75, 0.20, e) - dip,
        z: lerp(-0.15, -0.10, e),
        rotZ: lerp(0.28, -0.24, e),
        rotX: lerp(0.08, 0.06, e),
        rotY: lerp(-0.15, 0.18, e),
        bgDescent: lerp(0.08, 0.38, e), // Background đi xuống nấc 1
      };
    }

    // Nhịp 2 (Đường vẽ 2): Vòng từ mép phải quét chéo xuống mép trái dưới con dấu sáp
    if (u < 0.62) {
      const s = (u - 0.38) / 0.24;
      const e = s * s * (3 - 2 * s);
      const dip = Math.sin(s * Math.PI) * 0.20;
      return {
        x: lerp(3.5 * scaleX, -2.5 * scaleX, e),
        y: lerp(0.20, -0.20, e) - dip,
        z: lerp(-0.10, -0.06, e),
        rotZ: lerp(-0.24, 0.18, e),
        rotX: lerp(0.06, 0.04, e),
        rotY: lerp(0.18, -0.14, e),
        bgDescent: lerp(0.38, 0.70, e), // Background đi xuống nấc 2
      };
    }

    // Nhịp 3 (Đường vẽ 3): Vòng từ mép trái quét chéo xuống mép phải qua dải hoa tiệc
    if (u < 0.82) {
      const s = (u - 0.62) / 0.20;
      const e = s * s * (3 - 2 * s);
      const dip = Math.sin(s * Math.PI) * 0.14;
      return {
        x: lerp(-2.5 * scaleX, 2.2 * scaleX, e),
        y: lerp(-0.20, -0.32, e) - dip,
        z: lerp(-0.06, -0.02, e),
        rotZ: lerp(0.18, -0.10, e),
        rotX: lerp(0.04, 0.02, e),
        rotY: lerp(-0.14, 0.08, e),
        bgDescent: lerp(0.70, 0.90, e), // Background đi xuống nấc 3
      };
    }

    // Nhịp 4 (Đường vẽ 4): Từ bên phải trượt êm vào tâm và đáp xuống mặt bàn tiệc y = -0.24
    const s = (u - 0.82) / 0.18;
    const e = 1 - Math.pow(1 - s, 3);
    const dip = Math.sin(s * Math.PI) * 0.06;
    return {
      x: lerp(2.2 * scaleX, 0.0, e),
      y: lerp(-0.32, -0.24, e) - dip,
      z: lerp(-0.02, 0.0, e),
      rotZ: lerp(-0.10, 0.0, e),
      rotX: lerp(0.02, 0.0, e),
      rotY: lerp(0.08, 0.0, e),
      bgDescent: lerp(0.90, 1.00, e), // Background đi xuống nấc 4 và dừng hẳn
    };
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    this.camera.aspect = aspect;

    if (aspect < 0.75) {
      // Mobile portrait (320px - 430px)
      this.camera.fov = 44;
    } else if (aspect < 1.2) {
      // Tablet portrait
      this.camera.fov = 40;
    } else {
      // Desktop / Landscape
      this.camera.fov = 38;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * Keep HTML hold trigger exactly centered over the 3D wax seal button
   */
  updateSealTriggerPosition() {
    if (!this.holdTrigger || !this.envelope || !this.envelope.sealGroup) return;

    this.envelope.getSealWorldPosition(this._tmpVec);
    this.camera.updateMatrixWorld();
    this._tmpVec.project(this.camera);

    const screenX = (this._tmpVec.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(this._tmpVec.y * 0.5) + 0.5) * window.innerHeight;

    this.holdTrigger.style.left = `${screenX}px`;
    this.holdTrigger.style.top = `${screenY}px`;
  }

  /**
   * Programmatic progress setter for automated testing & verification
   */
  setProgress(p, immediate = false) {
    this.targetScrollProgress = Math.max(0, Math.min(1, p));
    if (immediate) {
      this.scrollProgress = this.targetScrollProgress;
      this.applyChoreography(this.scrollProgress);
    }
  }

  /**
   * Main Animation Loop (Single rAF)
   */
  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min(0.05, this.clock.getDelta());

    // 1. Mouse Parallax Smoothing (lerp)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 2. Continuous Scroll Progress Interpolation (lerp)
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.12;
    if (Math.abs(this.scrollProgress - this.targetScrollProgress) < 0.0002) {
      this.scrollProgress = this.targetScrollProgress;
    }

    // Sync ambient background dynamic descent
    if (window.ambientBackground) {
      window.ambientBackground.setScrollProgress(this.scrollProgress);
    }

    // Update celebratory 3D particles and dust motes
    if (this.sparks) {
      this.sparks.update(dt, now);
    }

    // 3. Update Choreography & State Machine (determines base camera coordinates & physical transforms)
    this.applyChoreography(this.scrollProgress, now, dt);

    // 4. Coordinated Camera Tracking with Damped Mouse Parallax (Section D3)
    const baseZ = this.baseCamZ || 7.5;
    const baseY = this.baseCamY || 0;
    const baseX = this.baseCamX || 0;
    const lookY = this.baseLookY || 0;

    if (!this.isReducedMotion) {
      this.camera.position.x = baseX + this.mouse.x * 0.08;
      this.camera.position.y = baseY + this.mouse.y * -0.05;
      this.camera.position.z = baseZ;
      this.camera.lookAt(0, lookY, 0);
    } else {
      this.camera.position.set(baseX, baseY, baseZ);
      this.camera.lookAt(0, lookY, 0);
    }

    // 5. Keep seal trigger in sync with 3D button position
    if (this.state === 'CENTERED' || this.state === 'HOLDING_SEAL' || this.state === 'SETTLED' || this.state === 'SETTLING_SWAY' || this.state === 'LANDING' || this.state === 'OPENING_ENVELOPE') {
      this.updateSealTriggerPosition();
    }

    // 6. Render WebGL Scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Master Choreography: maps continuous scroll progress p in [0, 1] across the 8 Cinematic Phases
   */
  applyChoreography(p, now = performance.now(), dt = 0.016) {
    p = Math.max(0, Math.min(1, p));

    // Strict Reverse Re-lock Guard: Whenever progress returns to p < 0.48, always reseal and re-lock!
    if (p < 0.48) {
      if (this.envelopeOpened || this.state === 'OPENING_ENVELOPE' || this.state === 'HOLDING_SEAL' || this.openingProgress > 0) {
        this.envelopeOpened = false;
        this.openingProgress = 0.0;
        this.holdProgress = 0.0;
        if (this.envelope) {
          this.envelope.setFlapAngle(0.0);
          this.envelope.setSealOpacity(1.0);
          this.envelope.setDepression(0.0);
          this.envelope.setGlow(0.0);
        }
        if (this.holdMeter) {
          this.holdMeter.style.strokeDashoffset = `${this.dashMax}`;
        }
      }
      if (this.holdTrigger) {
        this.holdTrigger.style.display = '';
        this.holdTrigger.classList.remove('completed', 'holding', 'visible');
      }
    }

    // Strict Checkpoint clamp: If envelope is not opened, cannot proceed past 0.50!
    if (!this.envelopeOpened && p > 0.50) {
      p = 0.50;
      this.targetScrollProgress = 0.50;
      this.scrollProgress = 0.50;
    }

    // Base camera framing defaults
    const envCamZ = this.getEnvelopeCameraZ();
    this.baseCamX = 0;
    this.baseCamY = 0;
    this.baseCamZ = envCamZ;
    this.baseLookY = 0;

    // =========================================================================
    // PHASE 1: THE ARRIVAL (p = 0.00 -> 0.14)
    // =========================================================================
    if (p < 0.14) {
      this.state = 'ARRIVING';
      const t = p / 0.14;
      const ease = easeInOutCubic(t);

      // Curved 3D flight trajectory from upper-right entering the European garden scene
      this.stationeryGroup.position.set(
        lerp(3.2, 1.8, ease),
        lerp(2.2, 1.1, ease),
        lerp(-1.2, -0.6, ease)
      );

      // Smooth, continuous initial tilt and banking
      this.stationeryGroup.rotation.set(
        lerp(0.40, 0.28, t) + Math.sin(t * Math.PI) * 0.15,
        lerp(-0.55, -0.35, t),
        lerp(0.22, 0.14, t) + Math.sin(t * Math.PI) * 0.10
      );

      // Sealed envelope state
      this.envelope.group.visible = true;
      this.envelope.group.position.set(0, 0, 0);
      this.envelope.group.rotation.set(0, 0, 0);
      this.envelope.setFlapAngle(0);
      this.envelope.setSealOpacity(1.0);

      // Scroll is sealed inside envelope (strictly hidden until seal is broken)
      this.scroll.group.visible = false;
      this.scroll.group.position.set(0, -0.15, 0.025);
      this.scroll.group.rotation.set(0, 0, 0);
      this.scroll.setUntying(0.0);
      this.scroll.setUnroll(0.0);

      // Hide interactive seal trigger during flight
      if (this.holdTrigger) this.holdTrigger.classList.remove('visible');

      this.updateCornerHUD(p);
      return;
    }

    // =========================================================================
    // PHASE 2: THE SPIN (p = 0.14 -> 0.36)
    // =========================================================================
    if (p < 0.36) {
      this.state = 'SCROLL_DRAFT';
      const t = (p - 0.14) / 0.22;
      const ease = easeInOutCubic(t);

      // Swoops along graceful flight path toward banquet foreground
      this.stationeryGroup.position.set(
        lerp(1.8, 0.45, ease) + Math.sin(t * Math.PI) * 0.35,
        lerp(1.1, 0.35, ease) - Math.sin(t * Math.PI) * 0.20,
        lerp(-0.6, -0.2, ease)
      );

      // Multi-axis 3D barrel rolls and banking rotations, landing cleanly facing forward
      this.stationeryGroup.rotation.set(
        lerp(0.28, 0.15, t) + Math.sin(t * Math.PI * 2) * 0.50,
        lerp(-0.35, 0.0, ease) + t * Math.PI * 4, // 2 complete 360° rolls arriving at 0.0
        lerp(0.14, 0.0, t) + Math.sin(t * Math.PI) * 0.25
      );

      // Sealed envelope state
      this.envelope.group.visible = true;
      this.envelope.group.position.set(0, 0, 0);
      this.envelope.group.rotation.set(0, 0, 0);
      this.envelope.setFlapAngle(0);
      this.envelope.setSealOpacity(1.0);

      // Scroll remains securely hidden inside sealed envelope
      this.scroll.group.visible = false;
      this.scroll.group.position.set(0, -0.15, 0.025);
      this.scroll.group.rotation.set(0, 0, 0);
      this.scroll.setUntying(0.0);
      this.scroll.setUnroll(0.0);

      if (this.holdTrigger) this.holdTrigger.classList.remove('visible');

      this.updateCornerHUD(p);
      return;
    }

    // =========================================================================
    // PHASE 3: SCROLL DRAFT SERPENTINE DESCENT (p = 0.36 -> 0.50)
    // =========================================================================
    if (p < 0.50) {
      this.state = 'SCROLL_DRAFT';
      const u = (p - 0.36) / 0.14;
      const sway = this.getSwayTransform(u);

      this.stationeryGroup.position.set(sway.x, sway.y, sway.z);
      this.stationeryGroup.rotation.set(sway.rotX, sway.rotY, sway.rotZ);

      if (this.swayGroup) {
        this.swayGroup.position.set(0, 0, 0);
        this.swayGroup.rotation.set(0, 0, 0);
      }

      // Camera gently tracks down toward banquet table
      this.baseCamY = lerp(0.0, -0.20, u);
      this.baseCamZ = lerp(envCamZ, envCamZ * (7.2 / 7.5), u);
      this.baseLookY = lerp(0.0, -0.20, u);

      // Advance background descent with each sway sweep driven strictly by scroll progress!
      if (window.ambientBackground) {
        window.ambientBackground.setSwayDescent(sway.bgDescent, sway.x / 3.5);
      }

      this.envelope.group.visible = true;
      this.envelope.group.position.set(0, 0, 0);
      // Smoothly rotate 180° around Y (0 -> Math.PI) as it lands to reveal MẶT SAU (BACK COVER) with wax seal!
      const flipEase = u > 0.15 ? easeInOutCubic((u - 0.15) / 0.85) : 0;
      this.envelope.group.rotation.set(0, flipEase * Math.PI, 0);
      this.envelope.setFlapAngle(0);
      this.envelope.setSealOpacity(1.0);

      // Strict reverse scroll re-lock: If user returns to p < 0.50, require hold again!
      if (this.envelopeOpened) {
        this.envelopeOpened = false;
        this.openingProgress = 0.0;
        this.holdProgress = 0.0;
        if (this.holdMeter) this.holdMeter.style.strokeDashoffset = `${this.dashMax}`;
        if (this.holdTrigger) {
          this.holdTrigger.classList.remove('completed', 'holding');
        }
      }

      // Scroll remains hidden inside sealed envelope while descending
      this.scroll.group.visible = false;
      this.scroll.group.position.set(0, -0.15, 0.025);
      this.scroll.group.rotation.set(0, 0, 0);
      this.scroll.setUntying(0.0);
      this.scroll.setUnroll(0.0);

      if (this.holdTrigger) this.holdTrigger.classList.remove('visible');

      this.updateCornerHUD(p);
      return;
    }

    // =========================================================================
    // PHASE 4: THE SEAL CHECKPOINT (p == 0.50, Envelope Landed on Banquet Table)
    // =========================================================================
    if (!this.envelopeOpened) {
      this.baseCamY = -0.20;
      this.baseCamZ = envCamZ * (7.2 / 7.5);
      this.baseLookY = -0.20;

      // Docked stably on the banquet table
      this.stationeryGroup.position.set(0, -0.24, 0);
      this.stationeryGroup.rotation.set(0, 0, 0);
      if (this.swayGroup) {
        this.swayGroup.position.set(0, 0, 0);
        this.swayGroup.rotation.set(0, 0, 0);
      }

      if (window.ambientBackground) {
        window.ambientBackground.setSwayDescent(1.0, 0);
      }

      this.envelope.group.visible = true;
      this.envelope.group.position.set(0, 0, 0);
      // Checkpoint: MẶT SAU (BACK COVER) with wax seal faces the viewer directly
      this.envelope.group.rotation.set(0, Math.PI, 0);

      this.scroll.group.visible = false;
      this.scroll.group.position.set(0, -0.15, 0.025);
      this.scroll.group.rotation.set(0, 0, 0);
      this.scroll.setUntying(0.0);
      this.scroll.setUnroll(0.0);

      // Handle press-and-hold interaction
      if (this.state === 'HOLDING_SEAL') {
        const elapsed = now - this.holdStartTime;
        this.holdProgress = Math.min(1.0, elapsed / this.holdDuration);

        // Tactile depression and golden glow feedback
        this.envelope.setDepression(this.holdProgress);
        this.envelope.setGlow(this.holdProgress);

        if (this.holdMeter) {
          const offset = this.dashMax * (1 - this.holdProgress);
          this.holdMeter.style.strokeDashoffset = `${offset}`;
        }

        if (this.holdProgress >= 1.0) {
          this.triggerOpenEnvelope();
        }
      } else if (this.state === 'OPENING_ENVELOPE') {
        this.openingProgress += dt * 1.15; // ~0.85s opening
        if (this.openingProgress >= 1.0) {
          this.openingProgress = 1.0;
          this.state = 'ENVELOPE_OPEN';
          this.envelopeOpened = true;
        }

        const ease = easeInOutCubic(this.openingProgress);

        // Flap swings open smoothly 0 -> 2.7 rad (155°)
        this.envelope.setFlapAngle(ease * 2.7);
        this.envelope.setSealOpacity(1.0 - ease * 1.2);

        // Warm golden light illuminates inner envelope pocket
        if (this.envelopeInnerLight) {
          this.envelopeInnerLight.intensity = Math.sin(ease * Math.PI) * 4.0;
        }

        // Scroll peeks up gracefully as flap opens!
        this.scroll.group.visible = true;
        this.scroll.group.position.set(0, lerp(-0.15, 0.22, ease), 0.025);

      } else {
        // Pre-hold stage: Landed at rest on table, prompt user to press and hold wax seal
        this.state = 'SETTLED';
        this.envelope.setFlapAngle(0);
        this.envelope.setSealOpacity(1.0);
        this.scroll.group.visible = false;

        // Smoothly decay hold progress back to 0 if released early
        this.holdProgress += (0 - this.holdProgress) * 0.15;
        this.envelope.setDepression(this.holdProgress);
        this.envelope.setGlow(this.holdProgress);
        if (this.holdMeter) {
          const offset = this.dashMax * (1 - this.holdProgress);
          this.holdMeter.style.strokeDashoffset = `${offset}`;
        }

        if (this.holdTrigger) {
          this.holdTrigger.style.display = '';
          this.holdTrigger.classList.remove('completed', 'holding');
          this.holdTrigger.classList.add('visible');
        }
      }

      this.updateCornerHUD(p);
      return;
    }

    // =========================================================================
    // ENVELOPE IS OPEN: SCROLL DRIVES EXTRACTION, RIBBON, & UNROLL (p > 0.50)
    // =========================================================================
    this.stationeryGroup.position.set(0, -0.24, 0);
    this.stationeryGroup.rotation.set(0, 0, 0);
    if (this.swayGroup) {
      this.swayGroup.position.set(0, 0, 0);
      this.swayGroup.rotation.set(0, 0, 0);
    }
    if (window.ambientBackground) {
      window.ambientBackground.setSwayDescent(1.0, 0);
    }

    // Keep envelope oriented showing its back with flap open
    this.envelope.group.rotation.set(0, Math.PI, 0);
    this.envelope.setFlapAngle(2.7);
    this.envelope.setSealOpacity(0);
    if (this.envelopeInnerLight) this.envelopeInnerLight.intensity = 0;
    if (this.holdTrigger) this.holdTrigger.classList.remove('visible');

    // -------------------------------------------------------------------------
    // PHASE 5: THE EXTRACTION (p = 0.50 -> 0.66)
    // -------------------------------------------------------------------------
    if (p <= 0.66) {
      this.state = p <= 0.52 ? 'ENVELOPE_OPEN' : 'EXTRACTING_LETTER';
      const t = (p - 0.50) / 0.16;
      const ease = easeInOutCubic(t);

      this.baseCamY = -0.20;
      this.baseCamZ = envCamZ * (7.2 / 7.5);
      this.baseLookY = -0.20;

      // Envelope rests on the table, moves back slightly
      this.envelope.group.visible = true;
      this.envelope.group.position.set(0, lerp(0.0, -0.10, ease), lerp(0.0, -0.25, ease));

      // Letter scroll slides smoothly upward out of the envelope pocket
      this.scroll.group.visible = true;
      const scrollY = lerp(0.22, 1.30, ease);
      this.scroll.group.position.set(0, scrollY, lerp(0.025, 0.18, ease));
      this.scroll.group.rotation.set(lerp(0.0, 0.08, ease), 0, 0);

      // SATIN RIBBON BOW STAYS FIRMLY TIED TO THE SCROLL THROUGHOUT EXTRACTION!
      this.scroll.setUntying(0.0);
      this.scroll.setUnroll(0.0);

      if (this.sparks) this.sparks.setMotesIntensity(lerp(0.4, 0.75, ease));

    // -------------------------------------------------------------------------
    // PHASE 6: THE RIBBON (p = 0.66 -> 0.76)
    // -------------------------------------------------------------------------
    } else if (p <= 0.76) {
      this.state = 'RELEASING_RIBBON';
      const t = (p - 0.66) / 0.10;

      this.baseCamY = -0.20;
      this.baseCamZ = envCamZ * (7.2 / 7.5);
      this.baseLookY = -0.20;

      // Envelope rests in midground
      this.envelope.group.visible = true;
      this.envelope.group.position.set(0, -0.10, -0.25);

      // Scroll holds extracted position at top
      this.scroll.group.visible = true;
      this.scroll.group.position.set(0, 1.30, 0.18);
      this.scroll.group.rotation.set(0.08, 0, 0);
      this.scroll.setUnroll(0.0);

      // Ribbon unties and physically slides off to the right (+X)
      this.scroll.setUntying(t);

      if (this.sparks) this.sparks.setMotesIntensity(0.60);

    // -------------------------------------------------------------------------
    // PHASE 7: THE CONTINUOUS PROGRESSIVE UNROLLING (p = 0.76 -> 0.94)
    // -------------------------------------------------------------------------
    } else if (p <= 0.94) {
      this.state = 'UNFOLDING_LETTER';
      const t = (p - 0.76) / 0.18;
      const ease = easeInOutCubic(t);

      // Envelope recedes into garden background and fades
      this.envelope.group.position.set(0, lerp(-0.10, -0.50, ease), lerp(-0.25, -3.5, ease));
      this.envelope.group.visible = (t < 0.65);

      // Letter scroll unrolls progressively downward into complete wedding invitation!
      // NO OVERLAYED IMAGE/CARD: The unrolling scroll itself is the sole wedding letter!
      this.scroll.group.visible = true;
      this.scroll.group.position.set(
        0,
        lerp(1.30, 0.0, ease),
        lerp(0.18, 0.0, ease)
      );
      this.scroll.group.rotation.set(
        lerp(0.08, 0.0, ease),
        0,
        0
      );
      this.scroll.setUntying(1.0);
      this.scroll.setUnroll(ease);

      // Camera gently centers to frame the full letter
      const targetCamZ = this.getCardTargetCameraZ();
      this.baseCamY = lerp(-0.20, 0.0, ease);
      this.baseCamZ = lerp(envCamZ * (7.2 / 7.5), targetCamZ, ease);
      this.baseLookY = lerp(-0.20, 0.0, ease);
      if (this.sparks) this.sparks.setMotesIntensity(Math.max(0, (1 - t) * 0.5));

    // -------------------------------------------------------------------------
    // PHASE 8: THE REVEAL (p = 0.94 -> 1.00)
    // -------------------------------------------------------------------------
    } else {
      this.state = 'LETTER_REVEALED';
      const t = (p - 0.94) / 0.06;

      this.baseCamY = 0.0;
      this.baseCamZ = this.getCardTargetCameraZ();
      this.baseLookY = 0.0;

      this.envelope.group.visible = false;

      // THE WEDDING LETTER is fully unrolled, planar, centered, upright, and legible!
      this.scroll.group.visible = true;
      this.scroll.group.position.set(0, 0, 0);
      this.scroll.group.rotation.set(0, 0, 0);
      this.scroll.setUntying(1.0);
      this.scroll.setUnroll(1.0);
      this.scroll.setRoseVisible(true);

      // Gentle keylight sweep across metallic gold foil
      this.keyLight.position.x = 4.5 + Math.sin(t * Math.PI) * 0.8;
      if (this.sparks) this.sparks.setMotesIntensity(0.15);
    }

    this.updateCornerHUD(p);
  }

  /**
   * Multi-Cluster Editorial Typography Synchronization (V3.1 Claude Code Aesthetic)
   */
  updateCornerHUD(p) {
    if (!this.hud.topLeft) return;

    // Dim HUD slightly when invitation is fully revealed so letter commands full attention
    const baseOpacity = p > 0.94 ? Math.max(0.40, 1 - (p - 0.94) * 4.5) : 1.0;

    // Get active storytelling chapter and unscrambled strings
    const chapterState = getChapterState(p, this.envelopeOpened);

    // 1. Top Left: Group A Wedding Editorial
    this.hud.topLeft.textContent = chapterState.title;
    this.hud.topLeft.style.opacity = (0.95 * baseOpacity).toFixed(3);

    // 2. Top Center: Atmospheric Inscription
    if (this.hud.topCenter) {
      this.hud.topCenter.textContent = p > 0.92 ? 'THIÊN ĐỨC & PHƯƠNG ANH' : chapterState.sub;
      this.hud.topCenter.style.opacity = (0.85 * baseOpacity).toFixed(3);
    }

    // 3. Top Right: Group B Chapter Markers
    this.hud.topRight.textContent = chapterState.chapter;
    this.hud.topRight.style.opacity = (0.90 * baseOpacity).toFixed(3);

    // 4. Side Margins
    if (this.hud.midLeft) {
      this.hud.midLeft.style.opacity = (0.55 * baseOpacity).toFixed(3);
    }
    if (this.hud.midRight) {
      this.hud.midRight.style.opacity = (0.55 * baseOpacity).toFixed(3);
    }

    // 5. Bottom Left: Couple Names & Continuous Progress Track
    if (this.hud.progressFill) {
      this.hud.progressFill.style.width = `${(p * 100).toFixed(1)}%`;
      this.hud.progressFill.style.opacity = baseOpacity.toFixed(3);
    }

    // 6. Bottom Center: Contextual Interaction Invitation Pill with Claude Code cursor
    if (this.hud.botCenter && this.hud.scrollHint) {
      let hintText = 'Cuộn trang để khám phá';
      if (this.state === 'LETTER_REVEALED') {
        hintText = 'Trân trọng kính mời quý khách';
      } else if (this.state === 'UNFOLDING_LETTER') {
        hintText = 'Cuộn xuống để mở toàn bộ lá thư';
      } else if (this.state === 'RELEASING_RIBBON') {
        hintText = 'Cuộn xuống để mở dải lụa hồng';
      } else if (this.state === 'EXTRACTING_LETTER') {
        hintText = 'Cuộn xuống để đón nhận cuộn thư';
      } else if (this.state === 'ENVELOPE_OPEN') {
        hintText = 'Cuộn xuống để rút cuộn thư ra';
      } else if (this.state === 'OPENING_ENVELOPE') {
        hintText = 'Đang mở con dấu sáp...';
      } else if (this.state === 'SETTLED' || this.state === 'CENTERED' || this.state === 'HOLDING_SEAL') {
        hintText = 'Chạm và giữ con dấu sáp để mở';
      } else if (this.state === 'LANDING') {
        hintText = 'Cuộn trang để đáp xuống bàn tiệc';
      } else if (this.state === 'ARRIVING' || this.state === 'SCROLL_DRAFT') {
        hintText = 'Cuộn trang để bay qua không gian tiệc cưới';
      }

      this.hud.botCenter.textContent = hintText;
      const isSealActiveOnMobile = window.innerWidth <= 480 && (this.state === 'SETTLED' || this.state === 'HOLDING_SEAL' || this.state === 'OPENING_ENVELOPE');
      if (p >= 0.98 || isSealActiveOnMobile) {
        this.hud.scrollHint.classList.add('hidden');
      } else {
        this.hud.scrollHint.classList.remove('hidden');
      }
    }

    // 7. Bottom Right: Group C Micro Typography
    this.hud.botRight.textContent = chapterState.micro;
    this.hud.botRight.style.opacity = (0.90 * baseOpacity).toFixed(3);
  }
}
