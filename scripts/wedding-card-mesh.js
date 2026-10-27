/**
 * WEDDING INVITATION CARD 3D MESH (AWARD-WINNING LUXURY STATIONERY)
 * -------------------------------------------------------------
 * Represents the bespoke Wedding Invitation Card (Tấm Thiệp Cưới 3D)
 * for Thiên Đức & Phương Anh.
 * 
 * Architecture & Craftsmanship:
 * - Dedicated physical 3D paperboard object (separate from letter scroll & envelope).
 * - Ultra-sleek, tangible 2-3mm paperboard slab with die-cut rounded corners.
 * - Gilded Edge: Perimeter is sealed with a metallic champagne gold foil beveled casing.
 * - Front Face: High-resolution cotton paperboard texture, gold foil filigree border,
 *   monogram crest, and crystal-clear Vietnamese ceremony typography.
 * - Back Face: Soft blush-ivory backing with watermark monogram.
 * - 3D ROSE BRANCH & TRANSLUCENT WASHI TAPE: Mounted directly to the front face
 *   of THIS invitation card in the lower-right margin!
 */

import * as THREE from './three.module.js';
import { RoseBranchMesh } from './rose-branch-mesh.js';

export class WeddingCard3DMesh {
  constructor(options = {}) {
    this.width = options.width || 2.35;
    this.height = options.height || 3.48;
    this.thickness = options.thickness || 0.008; // Thin, sleek luxury paperboard
    this.cornerRadius = options.cornerRadius || 0.09;

    this.group = new THREE.Group();
    this.group.name = 'WeddingInvitationCard3D';

    this.initMaterials(options.frontTex, options.backTex);
    this.initCardBody();
    this.initGildedEdge();
    this.initRoseBranch();
  }

  initMaterials(frontTex, backTex) {
    // 1. Front Face Material (Fine-art cotton paperboard with gold foil details)
    this.frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.58,
      metalness: 0.12,
      side: THREE.FrontSide,
      shadowSide: THREE.DoubleSide,
    });

    // 2. Back Face Material (Blush-ivory backing with watermark)
    this.backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.68,
      metalness: 0.06,
      side: THREE.FrontSide,
      shadowSide: THREE.DoubleSide,
    });

    // 3. Gilded Gold Edge Material (Champagne gold foil leaf)
    this.goldEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xD7BC83,
      roughness: 0.22,
      metalness: 0.88,
      side: THREE.DoubleSide,
    });
  }

  createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x0 = -w / 2;
    const y0 = -h / 2;
    const x1 = w / 2;
    const y1 = h / 2;

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
    return shape;
  }

  initCardBody() {
    const W = this.width;
    const H = this.height;
    const halfThick = this.thickness / 2;

    // Front Plane Geometry (with rounded corners)
    const shape = this.createRoundedRectShape(W, H, this.cornerRadius);
    const frontGeom = new THREE.ShapeGeometry(shape, 32);

    // Generate UVs for the front plane
    const pos = frontGeom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + W / 2) / W;
      const v = (pos.getY(i) + H / 2) / H;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
    frontGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    this.frontMesh = new THREE.Mesh(frontGeom, this.frontMat);
    this.frontMesh.position.z = halfThick;
    this.frontMesh.castShadow = true;
    this.frontMesh.receiveShadow = true;
    this.group.add(this.frontMesh);

    // Back Plane Geometry
    const backGeom = frontGeom.clone();
    // Invert U coordinate for back plane so texture isn't mirrored
    const backUvs = backGeom.attributes.uv.array;
    for (let i = 0; i < backUvs.length; i += 2) {
      backUvs[i] = 1.0 - backUvs[i];
    }
    backGeom.attributes.uv.needsUpdate = true;

    this.backMesh = new THREE.Mesh(backGeom, this.backMat);
    this.backMesh.position.z = -halfThick;
    this.backMesh.rotation.y = Math.PI;
    this.backMesh.castShadow = true;
    this.backMesh.receiveShadow = true;
    this.group.add(this.backMesh);
  }

  initGildedEdge() {
    const W = this.width;
    const H = this.height;
    const r = this.cornerRadius;
    const thickness = this.thickness;

    // Extruded border casing sealing the perimeter
    const outerShape = this.createRoundedRectShape(W, H, r);
    const innerHole = new THREE.Path();
    const offset = 0.015;
    const iw = W - offset * 2;
    const ih = H - offset * 2;
    const ir = Math.max(0.01, r - offset);

    const x0 = -iw / 2;
    const y0 = -ih / 2;
    const x1 = iw / 2;
    const y1 = ih / 2;

    innerHole.moveTo(x0 + ir, y0);
    innerHole.lineTo(x1 - ir, y0);
    innerHole.quadraticCurveTo(x1, y0, x1, y0 + ir);
    innerHole.lineTo(x1, y1 - ir);
    innerHole.quadraticCurveTo(x1, y1, x1 - ir, y1);
    innerHole.lineTo(x0 + ir, y1);
    innerHole.quadraticCurveTo(x0, y1, x0, y1 - ir);
    innerHole.lineTo(x0, y0 + ir);
    innerHole.quadraticCurveTo(x0, y0, x0 + ir, y0);
    innerHole.closePath();
    outerShape.holes.push(innerHole);

    const edgeGeom = new THREE.ExtrudeGeometry(outerShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.002,
      bevelSegments: 2,
      curveSegments: 32,
    });
    edgeGeom.translate(0, 0, -thickness / 2);

    this.edgeMesh = new THREE.Mesh(edgeGeom, this.goldEdgeMat);
    this.edgeMesh.castShadow = true;
    this.edgeMesh.receiveShadow = true;
    this.group.add(this.edgeMesh);
  }

  initRoseBranch() {
    // -------------------------------------------------------------------------
    // 3D ROSE BRANCH & TRANSLUCENT WASHI TAPE
    // Strictly attached to THIS Wedding Invitation Card!
    // -------------------------------------------------------------------------
    this.roseBranch = new RoseBranchMesh({ scale: 0.75 });
    // Position comfortably in the bottom-right corner margin of the card
    this.roseBranch.group.position.set(0.68, -1.02, this.thickness / 2 + 0.006);
    this.group.add(this.roseBranch.group);
  }

  setRoseVisible(visible) {
    if (this.roseBranch && this.roseBranch.group) {
      this.roseBranch.group.visible = visible;
    }
  }
}
