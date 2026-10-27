/**
 * 3D LETTER SCROLL MESH (CUỘN THƯ CƯỚI TỰ NHIÊN)
 * -------------------------------------------------------------
 * Represents the authentic rolled parchment letter scroll with
 * continuous scroll-driven physical unrolling dynamics:
 * 
 * Hierarchy & Physical Realism:
 * - Genuine cylindrical paper roll with spiral curl lips and visible paper thickness.
 * - Outer surface displays clean ivory parchment with central gold foil monogram crest (Đ · A).
 * - Blush Satin Ribbon Bow is bound directly around THIS letter scroll!
 * - When extracted, the scroll and bow move as one unified physical object.
 * - Untying slides the ribbon smoothly off to the right.
 * - PROGRESSIVE SCROLL UNROLLING:
 *   As user scrolls, the paper unrolls downward in 3D space with a rolling
 *   curling spiral front that travels down, continuously uncoiling into
 *   a flat planar letter sheet revealing the calligraphy wedding decree.
 */

import * as THREE from './three.module.js';
import { RibbonBowMesh } from './ribbon-bow-mesh.js';
import { RoseBranchMesh } from './rose-branch-mesh.js';
import { createScrollTextures } from './scroll-texture-generator.js';

export class LetterScrollMesh {
  constructor(options = {}) {
    this.rollRadius = options.rollRadius || 0.16;
    this.rollWidth = options.rollWidth || 2.45;
    this.totalHeight = options.totalHeight || 3.65;
    this.xSegments = 24;
    this.ySegments = 84; // Fine vertical subdivision for silky smooth spiral curl

    this.group = new THREE.Group();
    this.group.name = 'LetterScroll3D';

    const { outerTex, innerTex } = createScrollTextures();
    this.outerTex = outerTex;
    this.innerTex = innerTex;

    this.initMaterials();
    this.initCylinderRoll();
    this.initUnrollingPaper();
    this.initRibbon();
  }

  initMaterials() {
    // 1. Parchment Outer Material (Warm ivory cotton parchment with gold monogram)
    this.outerMat = new THREE.MeshStandardMaterial({
      map: this.outerTex,
      roughness: 0.62,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // 2. Parchment Inner Material (Calligraphy love letter) - FrontSide only so it NEVER bleeds through backwards!
    this.innerMat = new THREE.MeshStandardMaterial({
      map: this.innerTex,
      roughness: 0.58,
      metalness: 0.08,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.0,
    });

    // 3. Reverse Side Material (Warm ivory cotton paper) - BackSide only
    this.backMat = new THREE.MeshStandardMaterial({
      map: this.outerTex,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.0,
    });

    // 4. Gold Trim for paper edges
    this.goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xD7BC83,
      roughness: 0.28,
      metalness: 0.86,
    });
  }

  initCylinderRoll() {
    this.cylinderGroup = new THREE.Group();
    this.cylinderGroup.name = 'ScrollCylinderGroup';

    const R = this.rollRadius;
    const W = this.rollWidth;

    // Main parchment roll cylinder (rotated horizontally along X axis)
    const cylGeom = new THREE.CylinderGeometry(R, R, W, 48, 1, true);
    cylGeom.rotateZ(Math.PI / 2);

    this.rollMesh = new THREE.Mesh(cylGeom, this.outerMat);
    this.rollMesh.castShadow = true;
    this.rollMesh.receiveShadow = true;
    this.cylinderGroup.add(this.rollMesh);

    // Inner spiral curl layer (gives authentic coiled paper depth)
    const innerGeom = new THREE.CylinderGeometry(R * 0.88, R * 0.88, W * 0.998, 36, 1, true);
    innerGeom.rotateZ(Math.PI / 2);
    this.innerCurlMesh = new THREE.Mesh(innerGeom, this.outerMat);
    this.cylinderGroup.add(this.innerCurlMesh);

    // Gold foil rims on left and right circular ends of the roll
    for (const side of [-1, 1]) {
      const rimGeom = new THREE.TorusGeometry(R, 0.006, 8, 36);
      rimGeom.rotateY(Math.PI / 2);
      rimGeom.translate(side * (W / 2), 0, 0);
      const rimMesh = new THREE.Mesh(rimGeom, this.goldTrimMat);
      this.cylinderGroup.add(rimMesh);
    }

    this.group.add(this.cylinderGroup);
  }

  initUnrollingPaper() {
    this.paperGroup = new THREE.Group();
    this.paperGroup.name = 'UnrollingPaperGroup';

    const W = this.rollWidth;
    const H = this.totalHeight;
    const nx = this.xSegments;
    const ny = this.ySegments;

    // Custom subdivided parametric plane geometry for smooth progressive unrolling curl
    this.unrollGeom = new THREE.PlaneGeometry(W, H, nx, ny);
    this.unrollGeom.usage = THREE.DynamicDrawUsage;

    // Store base vertex positions
    this.posAttr = this.unrollGeom.attributes.position;
    this.origPositions = new Float32Array(this.posAttr.array);

    // Front Face (Calligraphy Wedding Decree - strictly FrontSide, never mirrored)
    this.unrollMesh = new THREE.Mesh(this.unrollGeom, this.innerMat);
    this.unrollMesh.castShadow = true;
    this.unrollMesh.receiveShadow = true;
    this.unrollMesh.visible = false;
    this.paperGroup.add(this.unrollMesh);

    // Reverse Face (Blank Warm Ivory Cotton Parchment - strictly BackSide)
    this.backUnrollMesh = new THREE.Mesh(this.unrollGeom, this.backMat);
    this.backUnrollMesh.castShadow = true;
    this.backUnrollMesh.receiveShadow = true;
    this.backUnrollMesh.visible = false;
    this.paperGroup.add(this.backUnrollMesh);

    // -------------------------------------------------------------------------
    // 3D ROSE BRANCH & WASHI TAPE
    // Mounted directly to THIS unrolling wedding invitation letter!
    // Positioned in the spacious lower-right margin.
    // -------------------------------------------------------------------------
    this.roseBranch = new RoseBranchMesh({ scale: 0.78 });
    this.roseBranch.group.position.set(0.68, -this.totalHeight * 0.77, 0.035);
    this.roseBranch.group.visible = false;
    this.paperGroup.add(this.roseBranch.group);

    this.group.add(this.paperGroup);
  }

  initRibbon() {
    // -------------------------------------------------------------------------
    // 3D BLUSH SATIN RIBBON & BOW
    // Wrapped snugly around the waist of THIS parchment scroll!
    // -------------------------------------------------------------------------
    this.ribbon = new RibbonBowMesh({
      rollRadius: this.rollRadius,
      rollWidth: this.rollWidth,
    });
    // Centered along the cylinder axis
    this.ribbon.group.position.set(0, 0, 0.015);
    this.group.add(this.ribbon.group);
  }

  setUntying(t) {
    if (this.ribbon) {
      this.ribbon.setUntying(t);
    }
  }

  setRoseVisible(visible) {
    if (this.roseBranch && this.roseBranch.group) {
      this.roseBranch.group.visible = visible;
    }
  }

  /**
   * Continuous Scroll-Driven Physical Unrolling
   * @param {number} t Progress from 0.0 (fully coiled roll) to 1.0 (fully flat paper)
   */
  setUnroll(t) {
    t = Math.max(0, Math.min(1, t));

    if (t <= 0.005) {
      this.cylinderGroup.visible = true;
      this.cylinderGroup.scale.set(1, 1, 1);
      this.paperGroup.visible = false;
      this.unrollMesh.visible = false;
      if (this.backUnrollMesh) this.backUnrollMesh.visible = false;
      this.innerMat.opacity = 0;
      if (this.backMat) this.backMat.opacity = 0;
      if (this.roseBranch) this.roseBranch.group.visible = false;
      return;
    }

    // Hide initial coiled cylinder and ribbon as soon as unroll begins
    this.cylinderGroup.visible = false;
    if (this.ribbon && this.ribbon.group) {
      this.ribbon.group.visible = false;
    }
    this.paperGroup.visible = true;
    this.unrollMesh.visible = true;
    if (this.backUnrollMesh) this.backUnrollMesh.visible = true;
    const op = Math.min(1.0, t * 2.5);
    this.innerMat.opacity = op;
    if (this.backMat) this.backMat.opacity = op;

    const H = this.totalHeight;
    const nx = this.xSegments;
    const ny = this.ySegments;
    const pos = this.posAttr.array;
    const orig = this.origPositions;

    // As user scrolls, paper unrolls downward:
    // L_flat extends from 0 to t * H
    const L_flat = t * H;
    // Spiral curl radius diminishes as paper leaves the roll
    const R_curl = Math.max(0.008, this.rollRadius * Math.sqrt(Math.max(0, 1.0 - t * 0.90)));

    // Center the unrolling paper smoothly in camera frame
    // When t = 1.0, paperGroup.position.y = H * 0.5, so the sheet (spanning 0 to -H) is centered around Y = 0
    this.paperGroup.position.y = t * (H * 0.5);

    // Update each vertex row along the paper length
    for (let iy = 0; iy <= ny; iy++) {
      // s is normalized length along paper from 0 (top) to 1 (bottom)
      const s = iy / ny;
      const sLen = s * H;

      let vy, vz;
      if (sLen <= L_flat) {
        // Vertex is on the flat unrolled sheet
        vy = -sLen;
        // Subtle organic paper breathing wave, strictly dampening to 0 at t = 1.0
        vz = Math.sin(s * Math.PI * 4) * 0.002 * Math.max(0, 1.0 - t);
      } else {
        // Natural circular roll curving backward/underneath so it never occludes text or overlaps
        const delta = sLen - L_flat;
        const phi = delta / R_curl;
        const r = R_curl * Math.max(0.70, 1.0 - (delta / H) * 0.25);
        vy = -L_flat - r * Math.sin(phi);
        vz = -r * (1.0 - Math.cos(phi));
      }

      // Apply to all x vertices in this row
      for (let ix = 0; ix <= nx; ix++) {
        const idx = (iy * (nx + 1) + ix) * 3;
        pos[idx] = orig[idx]; // Preserve X coordinate
        pos[idx + 1] = vy;
        pos[idx + 2] = vz;
      }
    }

    this.posAttr.needsUpdate = true;
    this.unrollGeom.computeVertexNormals();

    // Reveal 3D Rose Branch smoothly as bottom part of paper unrolls
    if (this.roseBranch) {
      if (t >= 0.68) {
        this.roseBranch.group.visible = true;
        const roseT = Math.min(1.0, (t - 0.68) / 0.20);
        // Smooth cubic ease for blossom scaling
        const roseScale = 0.75 * (1 - Math.pow(1 - roseT, 3));
        this.roseBranch.group.scale.set(roseScale, roseScale, roseScale);
      } else {
        this.roseBranch.group.visible = false;
      }
    }
  }
}
