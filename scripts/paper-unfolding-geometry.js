/**
 * DEFORMABLE 3D PAPER MESH & UNROLLING PHYSICS (V2.1 REFINED)
 * -------------------------------------------------------------
 * Parametrically deformed 3D wedding stationery sheet with realistic
 * spiral curling, visible paper thickness, ivory paper texture mapping,
 * and continuous planar relaxation.
 */

import * as THREE from './three.module.js';

export class DeformablePaperMesh {
  constructor(options = {}) {
    this.width = options.width || 2.3;
    this.height = options.height || 3.45;
    this.segmentsX = options.segmentsX || 64;
    this.segmentsY = options.segmentsY || 128;
    this.rollRadius = 0.18; // Exposed for ribbon binding

    this.group = new THREE.Group();
    this.group.name = 'DeformablePaperGroup';

    this.initMeshes(options.frontTex, options.backTex);
  }

  initMeshes(frontTex, backTex) {
    // 1. Create Subdivided Plane Geometries
    this.frontGeom = new THREE.PlaneGeometry(this.width, this.height, this.segmentsX, this.segmentsY);
    this.backGeom = new THREE.PlaneGeometry(this.width, this.height, this.segmentsX, this.segmentsY);

    // Flip back geometry horizontally so texture is oriented correctly
    this.backGeom.rotateY(Math.PI);

    // Cache original planar vertex positions
    this.origPosFront = this.frontGeom.attributes.position.clone();
    this.origPosBack = this.backGeom.attributes.position.clone();

    // 2. High-Quality Double-Sided PBR Materials
    this.frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.62,
      metalness: 0.10,
      side: THREE.FrontSide,
      shadowSide: THREE.DoubleSide,
    });

    this.backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.72,
      metalness: 0.05,
      side: THREE.FrontSide,
      shadowSide: THREE.DoubleSide,
    });

    this.frontMesh = new THREE.Mesh(this.frontGeom, this.frontMat);
    this.backMesh = new THREE.Mesh(this.backGeom, this.backMat);

    this.frontMesh.castShadow = true;
    this.frontMesh.receiveShadow = true;
    this.backMesh.castShadow = true;
    this.backMesh.receiveShadow = true;

    this.group.add(this.frontMesh);
    this.group.add(this.backMesh);

    this.initCardEdgeMesh();
    this.initContactShadow();
  }

  initCardEdgeMesh() {
    const W = this.width;
    const H = this.height;
    const r = 0.08;
    const thickness = 0.005;

    // Thin luxury paperboard edge casing that seals the perimeter between front & back planes
    const shape = new THREE.Shape();
    const x0 = -W / 2;
    const y0 = -H / 2;
    const x1 = W / 2;
    const y1 = H / 2;

    shape.moveTo(x0 + r, y0);
    shape.lineTo(x1 - r, y0);
    shape.quadraticCurveTo(x1, y0, x1, y0 + r);
    shape.lineTo(x1, y1 - r);
    shape.quadraticCurveTo(x1, y1, x1 - r, y1);
    shape.lineTo(x0 + r, y1);
    shape.quadraticCurveTo(x0, y1, x0, y1 - r);
    shape.lineTo(x0, y0 + r);
    shape.quadraticCurveTo(x0, y0, x0 + r, y0);
    shape.closePath();

    const hole = new THREE.Path();
    const hr = r * 0.88;
    const offset = 0.012;
    const hx0 = -W / 2 + offset;
    const hy0 = -H / 2 + offset;
    const hx1 = W / 2 - offset;
    const hy1 = H / 2 - offset;

    hole.moveTo(hx0 + hr, hy0);
    hole.lineTo(hx1 - hr, hy0);
    hole.quadraticCurveTo(hx1, hy0, hx1, hy0 + hr);
    hole.lineTo(hx1, hy1 - hr);
    hole.quadraticCurveTo(hx1, hy1, hx1 - hr, hy1);
    hole.lineTo(hx0 + hr, hy1);
    hole.quadraticCurveTo(hx0, hy1, hx0, hy1 - hr);
    hole.lineTo(hx0, hy0 + hr);
    hole.quadraticCurveTo(hx0, hy0, hx0 + hr, hy0);
    hole.closePath();
    shape.holes.push(hole);

    const edgeGeom = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
    });
    edgeGeom.translate(0, 0, -thickness / 2);

    this.edgeMat = new THREE.MeshStandardMaterial({
      color: 0xFFFCF6,
      roughness: 0.68,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    this.edgeMesh = new THREE.Mesh(edgeGeom, this.edgeMat);
    this.edgeMesh.castShadow = true;
    this.edgeMesh.receiveShadow = true;
    this.edgeMesh.visible = false;
    this.group.add(this.edgeMesh);
  }

  initContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
    grad.addColorStop(0, 'rgba(89, 68, 73, 0.28)');
    grad.addColorStop(0.45, 'rgba(89, 68, 73, 0.08)');
    grad.addColorStop(1, 'rgba(89, 68, 73, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const contactTex = new THREE.CanvasTexture(canvas);
    const contactGeom = new THREE.PlaneGeometry(this.width * 1.3, this.height * 1.2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(contactGeom, contactMat);
    this.contactShadow.position.set(0.06, -0.12, -0.05);
    this.group.add(this.contactShadow);
  }

  /**
   * Update paper geometry vertices based on unroll progress (0..1)
   * @param {number} uProgress - 0 = tightly curled roll, 1 = completely flat sheet
   */
  updateDeformation(uProgress) {
    uProgress = Math.max(0, Math.min(1, uProgress));

    // Seamlessly toggle paperboard edge casing when planar
    if (this.edgeMesh) {
      this.edgeMesh.visible = uProgress >= 0.96;
    }

    // When fully unfurled (uProgress = 1), restore exact original planar geometry
    if (uProgress >= 0.999) {
      const posF = this.frontGeom.attributes.position;
      const posB = this.backGeom.attributes.position;
      const origF = this.origPosFront.array;
      const origB = this.origPosBack.array;

      for (let i = 0; i < posF.count * 3; i++) {
        posF.array[i] = origF[i];
        posB.array[i] = origB[i];
      }

      posF.needsUpdate = true;
      posB.needsUpdate = true;
      this.frontGeom.computeVertexNormals();
      this.backGeom.computeVertexNormals();

      if (this.contactShadow) this.contactShadow.material.opacity = 0.5;
      return;
    }

    const H = this.height;
    const W = this.width;

    // t_split is the normalized boundary where the paper transitions from flat to rolled
    // At uProgress = 0, t_split = 1 (entire sheet rolled)
    // At uProgress = 1, t_split = 0 (entire sheet flat)
    const tSplit = 1 - uProgress;
    const ySplit = (tSplit - 0.5) * H;

    // Spiral / roll radius: compact radius when coiled
    const baseR = 0.17 + (1 - uProgress) * 0.05;
    this.rollRadius = baseR;

    // Contact shadow opacity only when unrolled and in free space
    if (this.contactShadow) {
      this.contactShadow.material.opacity = uProgress > 0.4 ? (uProgress - 0.4) * 0.75 : 0;
    }

    // 1. Deform Front Plane (with tiny thickness offset +0.002)
    this.deformPlane(this.frontGeom, this.origPosFront, tSplit, ySplit, baseR, uProgress, 0.002);

    // 2. Deform Back Plane (with tiny thickness offset -0.002)
    this.deformPlane(this.backGeom, this.origPosBack, tSplit, ySplit, baseR, uProgress, -0.002, true);

    this.frontGeom.computeVertexNormals();
    this.backGeom.computeVertexNormals();
  }

  deformPlane(geom, origAttr, tSplit, ySplit, baseR, uProgress, zOffset, isBack = false) {
    const pos = geom.attributes.position.array;
    const orig = origAttr.array;
    const count = geom.attributes.position.count;
    const H = this.height;
    const W = this.width;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const origU = orig[idx];
      const origV = orig[idx + 1];

      // Normalized vertical coordinate t (0 = bottom, 1 = top)
      const t = (origV + H / 2) / H;

      if (t >= tSplit) {
        // FLAT PORTION: Top part of paper that has unrolled
        pos[idx] = origU;
        pos[idx + 1] = origV;
        // Subtle organic paper breathing
        const flexX = Math.sin((origU / (W / 2)) * Math.PI * 0.5);
        pos[idx + 2] = zOffset + flexX * 0.012 * (1 - uProgress);
      } else {
        // CURLED PORTION: Concentric spiral coiling around cylinder axis
        const s = (tSplit - t) * H; // Distance along coiled strip
        const R = baseR + s * 0.008; // Gentle logarithmic spiral expansion
        const theta = s / R; // Wrap angle in radians

        pos[idx] = origU;
        // Spiral trajectory in Y-Z plane
        pos[idx + 1] = ySplit - R * Math.sin(theta);
        // Roll inward (-Z) so it tucks inside the pocket, with outer wraps facing camera
        pos[idx + 2] = zOffset - R * (1 - Math.cos(theta));

        // Subtle cross-axis curvature along the curled roll
        const uRatio = origU / (W / 2);
        const transverseArch = (1 - uRatio * uRatio) * 0.025 * Math.sin(Math.min(Math.PI, theta));
        pos[idx + 2] -= transverseArch;
      }
    }

    geom.attributes.position.needsUpdate = true;
  }
}
