/**
 * 3D RIBBON & SATIN BOW MESH
 * -------------------------------------------------------------
 * Ultra-luxury blush pink satin ribbon tied around the rolled wedding letter.
 * Features 3D volumetric loops, central knot, draped tails, and physics-driven
 * untying dynamics as the letter is extracted and unrolled.
 */

import * as THREE from './three.module.js';

export class RibbonBowMesh {
  constructor(options = {}) {
    this.rollRadius = options.rollRadius || 0.22;
    this.rollWidth = options.rollWidth || 2.4;
    this.group = new THREE.Group();
    this.group.name = 'RibbonBowGroup';

    this.initMaterial();
    this.initBand();
    this.initKnot();
    this.initLoops();
    this.initTails();
  }

  initMaterial() {
    // Luxury dusty rose / blush pink satin
    this.satinMat = new THREE.MeshStandardMaterial({
      color: 0xE8A5B2,
      roughness: 0.32,
      metalness: 0.14,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
    });

    // Slightly deeper tone for knot creasing
    this.satinDeepMat = new THREE.MeshStandardMaterial({
      color: 0xD895A2,
      roughness: 0.38,
      metalness: 0.12,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
    });
  }

  initBand() {
    // Ribbon band wrapping around the cylinder of the rolled paper
    // Radius slightly larger than the paper roll so it sits on the surface
    const r = this.rollRadius + 0.015;
    const bandWidth = 0.16;

    const bandGeom = new THREE.CylinderGeometry(r, r, bandWidth, 36, 1, true);
    // Orient cylinder horizontally along X axis
    bandGeom.rotateZ(Math.PI / 2);

    this.bandMesh = new THREE.Mesh(bandGeom, this.satinMat);
    this.bandMesh.castShadow = true;
    this.bandMesh.receiveShadow = true;
    this.group.add(this.bandMesh);
  }

  initKnot() {
    // Central satin knot (rounded cushion)
    const knotGeom = new THREE.SphereGeometry(0.09, 16, 16);
    knotGeom.scale(1.1, 0.85, 0.65);

    this.knotMesh = new THREE.Mesh(knotGeom, this.satinDeepMat);
    // Position knot safely in front of roll apex
    this.knotMesh.position.set(0, 0, this.rollRadius + 0.055);
    this.knotMesh.castShadow = true;
    this.group.add(this.knotMesh);
  }

  initLoops() {
    this.loopsGroup = new THREE.Group();
    this.loopsGroup.position.set(0, 0, this.rollRadius + 0.055);

    // Left volumetric satin loop
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.25, 0.14, 0.08),
      new THREE.Vector3(-0.48, 0.08, 0.12),
      new THREE.Vector3(-0.38, -0.08, 0.06),
      new THREE.Vector3(0, 0, 0),
    ]);
    const leftLoopGeom = new THREE.TubeGeometry(leftCurve, 32, 0.038, 12, true);
    this.leftLoop = new THREE.Mesh(leftLoopGeom, this.satinMat);
    this.leftLoop.castShadow = true;
    this.loopsGroup.add(this.leftLoop);

    // Right volumetric satin loop
    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.25, 0.14, 0.08),
      new THREE.Vector3(0.48, 0.08, 0.12),
      new THREE.Vector3(0.38, -0.08, 0.06),
      new THREE.Vector3(0, 0, 0),
    ]);
    const rightLoopGeom = new THREE.TubeGeometry(rightCurve, 32, 0.038, 12, true);
    this.rightLoop = new THREE.Mesh(rightLoopGeom, this.satinMat);
    this.rightLoop.castShadow = true;
    this.loopsGroup.add(this.rightLoop);

    this.group.add(this.loopsGroup);
  }

  initTails() {
    this.tailsGroup = new THREE.Group();
    this.tailsGroup.position.set(0, 0, this.rollRadius + 0.050);

    // Left draped tail - curves gracefully forward and downward
    const leftTailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0, 0.02),
      new THREE.Vector3(-0.10, -0.22, 0.06),
      new THREE.Vector3(-0.20, -0.45, 0.08),
      new THREE.Vector3(-0.16, -0.68, 0.04),
    ]);
    const leftTailGeom = new THREE.TubeGeometry(leftTailCurve, 24, 0.032, 10, false);
    this.leftTail = new THREE.Mesh(leftTailGeom, this.satinMat);
    this.leftTail.castShadow = true;
    this.tailsGroup.add(this.leftTail);

    // Right draped tail - curves gracefully forward and downward
    const rightTailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0, 0.02),
      new THREE.Vector3(0.12, -0.20, 0.06),
      new THREE.Vector3(0.22, -0.42, 0.07),
      new THREE.Vector3(0.28, -0.62, 0.04),
    ]);
    const rightTailGeom = new THREE.TubeGeometry(rightTailCurve, 24, 0.032, 10, false);
    this.rightTail = new THREE.Mesh(rightTailGeom, this.satinMat);
    this.rightTail.castShadow = true;
    this.tailsGroup.add(this.rightTail);

    this.group.add(this.tailsGroup);
  }

  /**
   * Untying & Slide-Off-Right Dynamics:
   * 1. Knot loosens and loops expand.
   * 2. Ribbon band releases from cylinder.
   * 3. Ribbon assembly slides smoothly to the right (+X) and off the card.
   * Fully reversible on reverse scroll.
   * @param {number} t - 0 = tied tightly, 1 = slid completely off to the right
   */
  setUntying(t) {
    t = Math.max(0, Math.min(1, t));

    if (t <= 0.001) {
      this.group.visible = true;
      this.group.position.x = 0;
      this.group.position.y = 0;
      this.group.position.z = 0.02;
      this.group.rotation.z = 0;
      this.bandMesh.scale.set(1, 1, 1);
      this.loopsGroup.scale.set(1, 1, 1);
      this.loopsGroup.position.set(0, 0, this.rollRadius + 0.04);
      this.tailsGroup.position.set(0, 0, this.rollRadius + 0.035);
      this.knotMesh.position.set(0, 0, this.rollRadius + 0.04);
      this.leftLoop.rotation.z = 0;
      this.rightLoop.rotation.z = 0;
      this.leftTail.rotation.z = 0;
      this.rightTail.rotation.z = 0;
      this.satinMat.opacity = 1.0;
      this.satinDeepMat.opacity = 1.0;
      return;
    }

    // Only hide after ribbon has physically glided completely beyond viewport (+X > 4.0)
    if (t >= 0.999) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    // Physical bounds of letter scroll cylinder:
    // Cylinder is centered at X = 0, spanning from -rollWidth/2 to +rollWidth/2
    const rollHalfWidth = this.rollWidth / 2; // e.g. 2.35 / 2 = 1.175
    // Clearance safety boundary: knot must travel past rollHalfWidth + leftLoopWidth (0.45) = 1.625
    const clearX = rollHalfWidth + 0.55; // ~1.725 (completely clear of roll cylinder)

    // =========================================================================
    // GIAI ĐOẠN A: LOOSENING & HORIZONTAL SLIDE (t: 0.0 -> 0.55)
    // NƠ CHỈ DI CHUYỂN HOÀN TOÀN THEO CHIỀU NGANG (+X) TRÊN TRỤC CUỘN GIẤY.
    // TUYỆT ĐỐI KHÔNG BẮT ĐẦU CHUYỂN ĐỘNG CHÉO (Y = 0.0).
    // =========================================================================
    if (t <= 0.55) {
      const u = t / 0.55; // 0.0 -> 1.0
      // Smooth horizontal sliding ease
      const easeU = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

      // 1. Knot loosens and loops relax slightly during initial movement
      const unbindT = Math.min(1.0, u / 0.40);
      const bandExpand = 1 + unbindT * 0.35;
      this.bandMesh.scale.set(bandExpand, 1, bandExpand);
      this.leftLoop.rotation.z = -unbindT * 0.25;
      this.rightLoop.rotation.z = unbindT * 0.30;

      // 2. Strict Horizontal Movement: X moves from 0 to clearX, Y is strictly 0.0!
      this.group.position.x = easeU * clearX;
      this.group.position.y = 0.0; // STRICTLY HORIZONTAL! Zero downward dip while on roll!
      this.group.position.z = 0.02 + easeU * 0.035; // Slight forward clearance over roll surface
      this.group.rotation.z = -easeU * 0.05; // Minimal tilt while on cylinder

      // Tails stream backwards horizontally
      this.leftTail.rotation.z = easeU * 0.30;
      this.rightTail.rotation.z = easeU * 0.40;

      this.satinMat.opacity = 1.0;
      this.satinDeepMat.opacity = 1.0;
      return;
    }

    // =========================================================================
    // GIAI ĐOẠN B: VERIFY HORIZONTAL COMPLETION
    // Condition verified: At t > 0.55, the bow's position X is at or beyond clearX,
    // meaning the entire bow assembly is 100% physically clear of the paper roll cylinder!
    // =========================================================================

    // =========================================================================
    // GIAI ĐOẠN C: DIAGONAL DOWNWARD GLIDE & DEPARTURE (t: 0.55 -> 1.0)
    // CHỈ BẮT ĐẦU DI CHUYỂN CHÉO SAU KHI ĐÃ HOÀN TẤT GIAI ĐOẠN NGANG!
    // Since X >= clearX > rollHalfWidth, this diagonal flight NEVER intersects the roll!
    // =========================================================================
    const v = (t - 0.55) / 0.45; // 0.0 -> 1.0
    const easeV = v * v; // Natural gravitational acceleration

    this.bandMesh.scale.set(1.35, 1, 1.35);
    this.leftLoop.rotation.z = -0.25 - v * 0.20;
    this.rightLoop.rotation.z = 0.30 + v * 0.25;

    // Diagonal trajectory: continuing rightward (+X) while gently falling downward (-Y)
    this.group.position.x = clearX + easeV * 2.80; // 1.725 -> 4.525
    this.group.position.y = -easeV * 1.85; // 0.0 -> -1.85
    this.group.position.z = 0.055 + easeV * 0.25;
    this.group.rotation.z = -0.05 - easeV * 0.65; // Natural aerodynamic tumbling rotation

    // Dynamic fluttering tails
    this.leftTail.rotation.z = 0.30 + easeV * 0.65;
    this.rightTail.rotation.z = 0.40 + easeV * 0.80;

    // Giai đoạn D: Smooth opacity dissipation at the outer boundary of screen
    const op = Math.max(0, Math.min(1.0, (1.0 - v) * 2.5));
    this.satinMat.opacity = op;
    this.satinDeepMat.opacity = op;
  }
}
