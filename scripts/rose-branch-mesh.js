/**
 * 3D ROSE BRANCH MESH (AAA GAME RENDER BOTANICAL ASSET & TRANSLUCENT WASHI TAPE)
 * -------------------------------------------------------------
 * Ultra-realistic 3D botanical embellishment mounted to the Wedding Invitation Card:
 * - Volumetric 3D blooming cabbage rose with layered curved petals (real thickness & bevels)
 * - Sculpted secondary rosebud with sepals
 * - Curving botanical stem with 3D creased sage green leaves
 * - Delicate champagne gold metallic wire accents
 * - Realistic Japanese translucent washi tape strip arching over the stem and
 *   adhering flat to the card surface
 * 
 * Tangible from every perspective as the card flips and tilts in 3D space!
 */

import * as THREE from './three.module.js';

function createCurvedPetalGeom(w, h, depth = 0.005, curlAmount = 0.35) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-w * 0.65, h * 0.35, -w * 0.60, h * 0.85, 0, h);
  shape.bezierCurveTo(w * 0.60, h * 0.85, w * 0.65, h * 0.35, 0, 0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.0018,
    bevelSize: 0.0018,
    bevelSegments: 2,
    curveSegments: 12,
  });

  // Apply natural botanical cup curvature to vertices
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const ny = Math.max(0, Math.min(1, y / h));
    // Curvature: cups forward in the belly, rolls back gently at the tip
    const zOffset = Math.sin(ny * Math.PI) * (w * curlAmount) - (ny > 0.75 ? Math.pow(ny - 0.75, 2) * w * 0.4 : 0);
    pos.setZ(i, pos.getZ(i) + zOffset);
  }
  geom.computeVertexNormals();
  return geom;
}

function createCreasedLeafGeom(w, h, depth = 0.004) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(-w * 0.55, h * 0.45, 0, h);
  shape.quadraticCurveTo(w * 0.55, h * 0.45, 0, 0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 12,
  });

  // Crease leaf along central spine (V-profile)
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const distFromSpine = Math.abs(x) / (w * 0.55);
    const zOffset = distFromSpine * 0.015;
    pos.setZ(i, pos.getZ(i) + zOffset);
  }
  geom.computeVertexNormals();
  return geom;
}

export class RoseBranchMesh {
  constructor(options = {}) {
    this.scale = options.scale || 1.0;
    this.group = new THREE.Group();
    this.group.name = 'RoseBranchGroup';

    this.initMaterials();
    this.initStem();
    this.initLeaves();
    this.initMainRose();
    this.initRoseBud();
    this.initGoldWire();
    this.initWashiTape();

    this.group.scale.setScalar(this.scale);
  }

  initMaterials() {
    // 1. Dusty Rose Velvet Petal Material (outer blooming petals)
    this.petalOuterMat = new THREE.MeshStandardMaterial({
      color: 0xE29CA8,
      roughness: 0.38,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // 2. Deeper Burgundy-Rose Core Material (inner swirl)
    this.petalCoreMat = new THREE.MeshStandardMaterial({
      color: 0xD07A8A,
      roughness: 0.34,
      metalness: 0.10,
      side: THREE.DoubleSide,
    });

    // 3. Delicate Sage Green Leaf Material
    this.leafMat = new THREE.MeshStandardMaterial({
      color: 0x7E9478,
      roughness: 0.52,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });

    // 4. Botanical Stem Material (wood / green sap)
    this.stemMat = new THREE.MeshStandardMaterial({
      color: 0x687D62,
      roughness: 0.58,
      metalness: 0.04,
    });

    // 5. Metallic Champagne Gold Fine Thread
    this.goldWireMat = new THREE.MeshStandardMaterial({
      color: 0xD7BC83,
      roughness: 0.22,
      metalness: 0.88,
    });

    // 6. Translucent Japanese Washi Tape with real fiber grain
    const tapeCanvas = document.createElement('canvas');
    tapeCanvas.width = 512;
    tapeCanvas.height = 256;
    const tCtx = tapeCanvas.getContext('2d');
    
    // Soft frosted ivory base
    tCtx.fillStyle = 'rgba(255, 252, 245, 0.92)';
    tCtx.fillRect(0, 0, 512, 256);

    // Natural mulberry paper fibers
    tCtx.fillStyle = 'rgba(215, 188, 131, 0.16)';
    for (let i = 0; i < 400; i++) {
      const fx = Math.random() * 512;
      const fy = Math.random() * 256;
      tCtx.fillRect(fx, fy, Math.random() * 20 + 4, 1.2);
    }
    tCtx.fillStyle = 'rgba(180, 150, 120, 0.08)';
    for (let i = 0; i < 300; i++) {
      const fx = Math.random() * 512;
      const fy = Math.random() * 256;
      tCtx.fillRect(fx, fy, 1.5, Math.random() * 8 + 2);
    }

    const tapeTex = new THREE.CanvasTexture(tapeCanvas);
    tapeTex.colorSpace = THREE.SRGBColorSpace;

    this.washiTapeMat = new THREE.MeshStandardMaterial({
      map: tapeTex,
      color: 0xFFFAF2,
      roughness: 0.50,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
  }

  initStem() {
    // Elegant, natural 3D curving stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, -0.45, 0.012),
      new THREE.Vector3(-0.22, -0.20, 0.022),
      new THREE.Vector3(-0.08, 0.05, 0.035),
      new THREE.Vector3(0.05, 0.28, 0.042),
      new THREE.Vector3(0.12, 0.42, 0.030),
    ]);

    const stemGeom = new THREE.TubeGeometry(stemCurve, 36, 0.016, 10, false);
    this.stemMesh = new THREE.Mesh(stemGeom, this.stemMat);
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = true;
    this.group.add(this.stemMesh);
  }

  initLeaves() {
    // Leaf 1: Lower left branching off stem
    const leaf1Geom = createCreasedLeafGeom(0.14, 0.28);
    const leaf1 = new THREE.Mesh(leaf1Geom, this.leafMat);
    leaf1.position.set(-0.23, -0.18, 0.022);
    leaf1.rotation.set(0.15, 0.20, Math.PI * 0.72);
    leaf1.castShadow = true;
    this.group.add(leaf1);

    // Leaf 2: Middle right branching off stem
    const leaf2Geom = createCreasedLeafGeom(0.13, 0.25);
    const leaf2 = new THREE.Mesh(leaf2Geom, this.leafMat);
    leaf2.position.set(-0.06, 0.08, 0.032);
    leaf2.rotation.set(-0.12, -0.22, -Math.PI * 0.28);
    leaf2.castShadow = true;
    this.group.add(leaf2);

    // Leaf 3: Upper left near main flower head
    const leaf3Geom = createCreasedLeafGeom(0.11, 0.22);
    const leaf3 = new THREE.Mesh(leaf3Geom, this.leafMat);
    leaf3.position.set(0.04, 0.25, 0.038);
    leaf3.rotation.set(0.18, 0.25, Math.PI * 0.58);
    leaf3.castShadow = true;
    this.group.add(leaf3);
  }

  initMainRose() {
    // -------------------------------------------------------------------------
    // VOLUMETRIC 3D BLOOMING ROSE (Authentic Game Render Quality)
    // Multiple concentric layers of curved, beveled 3D petals with real volume!
    // -------------------------------------------------------------------------
    this.roseHead = new THREE.Group();
    this.roseHead.position.set(-0.08, 0.06, 0.055);

    // 1. Central spiraling bud core
    const coreGeom = new THREE.SphereGeometry(0.07, 18, 18);
    coreGeom.scale(1.0, 0.90, 0.65);
    const coreMesh = new THREE.Mesh(coreGeom, this.petalCoreMat);
    coreMesh.castShadow = true;
    this.roseHead.add(coreMesh);

    // 2. Layer 1: Inner Swirl (tightly cupped)
    const l1Count = 4;
    const l1Radius = 0.07;
    for (let i = 0; i < l1Count; i++) {
      const angle = (i / l1Count) * Math.PI * 2 + 0.2;
      const geom = createCurvedPetalGeom(0.10, 0.13, 0.005, 0.45);
      const mesh = new THREE.Mesh(geom, this.petalCoreMat);
      mesh.position.set(Math.cos(angle) * l1Radius, Math.sin(angle) * l1Radius, 0.04);
      mesh.rotation.set(0.35, 0, angle - Math.PI / 2);
      mesh.castShadow = true;
      this.roseHead.add(mesh);
    }

    // 3. Layer 2: Intermediate Petals
    const l2Count = 5;
    const l2Radius = 0.12;
    for (let i = 0; i < l2Count; i++) {
      const angle = (i / l2Count) * Math.PI * 2 + 0.6;
      const geom = createCurvedPetalGeom(0.14, 0.17, 0.006, 0.38);
      const mesh = new THREE.Mesh(geom, this.petalOuterMat);
      mesh.position.set(Math.cos(angle) * l2Radius, Math.sin(angle) * l2Radius, 0.025);
      mesh.rotation.set(0.48, 0, angle - Math.PI / 2);
      mesh.castShadow = true;
      this.roseHead.add(mesh);
    }

    // 4. Layer 3: Outer Blooming Petals (expansive & reflexed)
    const l3Count = 6;
    const l3Radius = 0.17;
    for (let i = 0; i < l3Count; i++) {
      const angle = (i / l3Count) * Math.PI * 2 + 1.1;
      const geom = createCurvedPetalGeom(0.18, 0.22, 0.006, 0.30);
      const mesh = new THREE.Mesh(geom, this.petalOuterMat);
      mesh.position.set(Math.cos(angle) * l3Radius, Math.sin(angle) * l3Radius, 0.010);
      mesh.rotation.set(0.62, 0, angle - Math.PI / 2);
      mesh.castShadow = true;
      this.roseHead.add(mesh);
    }

    this.group.add(this.roseHead);
  }

  initRoseBud() {
    this.budGroup = new THREE.Group();
    this.budGroup.position.set(0.13, 0.44, 0.042);

    const budGeom = new THREE.SphereGeometry(0.048, 14, 14);
    budGeom.scale(0.8, 1.45, 0.7);
    const budMesh = new THREE.Mesh(budGeom, this.petalCoreMat);
    budMesh.castShadow = true;
    this.budGroup.add(budMesh);

    // Green sepals embracing bud
    const sepalGeom = createCreasedLeafGeom(0.04, 0.11, 0.002);
    const sepal1 = new THREE.Mesh(sepalGeom, this.leafMat);
    sepal1.position.set(-0.018, -0.02, 0.012);
    sepal1.rotation.set(0.1, 0, 0.32);
    this.budGroup.add(sepal1);

    const sepal2 = new THREE.Mesh(sepalGeom, this.leafMat);
    sepal2.position.set(0.018, -0.02, 0.012);
    sepal2.rotation.set(0.1, 0, -0.32);
    this.budGroup.add(sepal2);

    this.group.add(this.budGroup);
  }

  initGoldWire() {
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.30, -0.40, 0.018),
      new THREE.Vector3(-0.15, -0.15, 0.032),
      new THREE.Vector3(0.02, 0.12, 0.052),
      new THREE.Vector3(-0.02, 0.26, 0.042),
      new THREE.Vector3(0.18, 0.48, 0.056),
    ]);

    const wireGeom = new THREE.TubeGeometry(wireCurve, 32, 0.005, 8, false);
    const wireMesh = new THREE.Mesh(wireGeom, this.goldWireMat);
    this.group.add(wireMesh);
  }

  initWashiTape() {
    // -------------------------------------------------------------------------
    // 3D TRANSLUCENT WASHI TAPE STRIP ARCHING OVER THE ROSE STEM
    // The tape bridges across the stem:
    // - Center arches over stem at z = 0.034
    // - Left & Right wings adhere flat to the card at z = 0.004
    // -------------------------------------------------------------------------
    const tapeShape = new THREE.Shape();
    const halfW = 0.15;
    const halfH = 0.048;

    // Deckled / torn serrated edges on both sides
    tapeShape.moveTo(-halfW, -halfH);
    tapeShape.lineTo(halfW, -halfH);
    // Serrated right edge
    tapeShape.lineTo(halfW - 0.007, -halfH * 0.3);
    tapeShape.lineTo(halfW + 0.005, 0);
    tapeShape.lineTo(halfW - 0.005, halfH * 0.4);
    tapeShape.lineTo(halfW, halfH);
    tapeShape.lineTo(-halfW, halfH);
    // Serrated left edge
    tapeShape.lineTo(-halfW + 0.005, halfH * 0.5);
    tapeShape.lineTo(-halfW - 0.007, 0);
    tapeShape.lineTo(-halfW + 0.005, -halfH * 0.4);
    tapeShape.closePath();

    const tapeGeom = new THREE.ExtrudeGeometry(tapeShape, {
      depth: 0.003,
      bevelEnabled: false,
    });

    // Arch vertices over the stem in the center
    const pos = tapeGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Bell curve bump over stem in center
      const arch = Math.exp(-Math.pow(x / 0.06, 2)) * 0.016;
      pos.setZ(i, pos.getZ(i) + arch);
    }
    tapeGeom.computeVertexNormals();

    this.washiTapeMesh = new THREE.Mesh(tapeGeom, this.washiTapeMat);
    // Angle tape diagonally across the lower stem of the flower
    this.washiTapeMesh.position.set(-0.21, -0.22, 0.016);
    this.washiTapeMesh.rotation.set(0, 0, 0.28);
    this.washiTapeMesh.castShadow = true;
    this.washiTapeMesh.receiveShadow = true;
    this.group.add(this.washiTapeMesh);
  }
}
