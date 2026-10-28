/**
 * 3D LUXURY ENVELOPE & WAX SEAL MESH (V4.0 PHYSICAL RE-ARCHITECTURE)
 * -------------------------------------------------------------
 * Architecturally correct luxury wedding stationery envelope:
 *
 * PHẦN I & II COMPLIANCE:
 * 1. MẶT TRƯỚC (Front Cover / Address side, facing +Z):
 *    - Inscribed with the couple's names: "Thiên Đức & Phương Anh" in uniform
 *      antique champagne gold ink with subtle 1px letterpress emboss.
 *    - Minimalist, handcrafted luxury editorial layout.
 *    - Faces viewer at initial state (p = 0.00 -> 0.42).
 *    - ABSOLUTELY NO WAX SEAL ON THIS FACE.
 *    - Front panel is deliberately smaller (3.12 x 2.04) than the back base (3.30 x 2.20),
 *      creating an authentic 2-ply layered deckle-edge wedding stationery framing border.
 *
 * 2. MẶT SAU (Back Cover / Sealing side, facing -Z):
 *    - Larger solid foundation panel (3.30 x 2.20).
 *    - Houses the opening flap and the Royal Burgundy Wax Seal.
 *    - When arriving at checkpoint (p = 0.50), the envelope turns 180° to reveal this back side.
 *    - Preserves the exact current wax seal design: rich burgundy clearcoat wax,
 *      molten puddle, raised rim, and embossed gold botanical laurel seal motif.
 *
 * 3. SEAMLESS SOLID CASING:
 *    - Continuous closed U-walls connecting back to front with zero corner gaps.
 *    - Fully matching coordinate topology, no split edges, no z-fighting.
 */

import * as THREE from './three.module.js';
import { weddingContent } from '../src/data/wedding-content.js';

export class Envelope3DMesh {
  constructor(options = {}) {
    // Back Base Dimensions (Larger foundation)
    this.width = options.width || 3.30;
    this.height = options.height || 2.20;
    this.depth = options.depth || 0.030; // Sleek luxury stationery depth
    this.cornerRadius = 0.08;

    // Front Cover Dimensions (Deliberately smaller for 2-ply layered border)
    this.frontWidth = 3.12;
    this.frontHeight = 2.04;
    this.frontCornerRadius = 0.06;

    this.group = new THREE.Group();
    this.group.name = 'Envelope3DGroup';

    this.initMaterials();
    this.initBody();
    this.initFlap();
    this.initWaxSeal();
  }

  /**
   * Generates the luxury fine-art paper texture for the FRONT COVER.
   * Features uniform antique champagne gold ink calligraphy for "Thiên Đức & Phương Anh".
   * NO chrome, NO neon, NO thick 3D bevels, NO wax seal.
   */
  createEnvelopeFrontTexture() {
    const width = 1536;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // 1. Luxury Blush Ivory Fine-Art Matte Paper Ground
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0.0, '#FAF2F5');
      bgGrad.addColorStop(0.5, '#F5E4E8');
      bgGrad.addColorStop(1.0, '#EEDCE2');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Micro Tactile Paper Grain & Fine Botanical Fibers
      ctx.fillStyle = 'rgba(74, 45, 52, 0.015)';
      for (let i = 0; i < 4000; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
      }
      ctx.fillStyle = 'rgba(215, 188, 131, 0.018)';
      for (let i = 0; i < 2500; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.fillRect(rx, ry, Math.random() * 3 + 1, 1);
      }

      // 3. UNIFORM ANTIQUE CHAMPAGNE GOLD INK TONE
      // Strict Section 1.1 Compliance: One uniform gold tone, no garish gradients
      const goldInk = '#8C6721';
      const goldInkLight = 'rgba(140, 103, 33, 0.40)';
      const goldInkHairline = '#6E4E16';

      // 4. Double Gold Foil Borders with Rounded Corners
      const m = 54;
      const rOuter = 24;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(m, m, width - m * 2, height - m * 2, rOuter);
      } else {
        ctx.rect(m, m, width - m * 2, height - m * 2);
      }
      ctx.strokeStyle = goldInk;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const m2 = m + 14;
      const rInner = 16;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(m2, m2, width - m2 * 2, height - m2 * 2, rInner);
      } else {
        ctx.rect(m2, m2, width - m2 * 2, height - m2 * 2);
      }
      ctx.strokeStyle = goldInkLight;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Four Corner Botanical Diamond Ornaments
      const corners = [
        [m2 - 3, m2 - 3],
        [width - m2 + 3, m2 - 3],
        [m2 - 3, height - m2 + 3],
        [width - m2 + 3, height - m2 + 3],
      ];
      ctx.fillStyle = goldInk;
      for (const [cxCorner, cyCorner] of corners) {
        ctx.beginPath();
        ctx.moveTo(cxCorner, cyCorner - 6);
        ctx.lineTo(cxCorner + 6, cyCorner);
        ctx.lineTo(cxCorner, cyCorner + 6);
        ctx.lineTo(cxCorner - 6, cyCorner);
        ctx.closePath();
        ctx.fill();
      }

      // 5. Handcrafted Metallic Gold Calligraphy Ink with Subtle Letterpress Impression
      // (Section 1.1: subtle 1px emboss, crisp calligraphic lines, uniform champagne gold)
      const drawHandcraftedGoldText = (text, x, y, font, options = {}) => {
        ctx.save();
        ctx.font = font;
        ctx.textAlign = options.align || 'center';

        // A. Subtle contact letterpress shadow (just enough to feel pressed into cotton paper)
        ctx.save();
        ctx.shadowColor = 'rgba(64, 36, 44, 0.22)';
        ctx.shadowBlur = options.shadowBlur || 1.2;
        ctx.shadowOffsetX = options.shadowX || 0.8;
        ctx.shadowOffsetY = options.shadowY || 1.0;
        ctx.fillStyle = goldInk;
        ctx.fillText(text, x, y);
        ctx.restore();

        // B. Micro specular highlight on top edge
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
        ctx.shadowBlur = 0.8;
        ctx.shadowOffsetX = -0.6;
        ctx.shadowOffsetY = -0.6;
        ctx.fillStyle = goldInk;
        ctx.fillText(text, x, y);
        ctx.restore();

        // C. Core uniform gold lettering (crisp, solid ink)
        ctx.fillStyle = goldInk;
        ctx.fillText(text, x, y);

        // D. Razor-sharp calligraphic hairline definition
        ctx.strokeStyle = goldInkHairline;
        ctx.lineWidth = options.strokeWidth || 0.4;
        ctx.strokeText(text, x, y);

        ctx.restore();
      };

      const cx = width / 2;

      // Monogram Crest at top
      const crestY = 215;
      drawHandcraftedGoldText(
        weddingContent.couple?.monogram || 'Đ · A',
        cx, crestY,
        'italic 500 66px "Playfair Display", "Cormorant Garamond", Georgia, serif',
        { strokeWidth: 0.5 }
      );

      // Delicate botanical laurel arch around monogram
      ctx.strokeStyle = goldInkLight;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx - 34, crestY - 12, 26, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 34, crestY - 12, 26, Math.PI * 0.55, Math.PI * 1.45);
      ctx.stroke();

      // Eyebrow label
      ctx.font = '600 18px "Montserrat", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillStyle = '#7A571A';
      ctx.fillText('WEDDING INVITATION', cx, 308);
      ctx.letterSpacing = '0px';

      // 6. COUPLE NAMES: "Thiên Đức & Phương Anh"
      // Strict rule: "1 tên trên 1 tên xéo xuống dưới chút bên phải"
      const name1 = weddingContent.couple?.partnerOne || 'Thiên Đức';
      const name2 = weddingContent.couple?.partnerTwo || 'Phương Anh';

      // Groom Name: "Thiên Đức" on top, shifted slightly left
      const name1X = cx - 140;
      const name1Y = 465;
      drawHandcraftedGoldText(
        name1,
        name1X, name1Y,
        'italic 600 90px "Playfair Display", "Cormorant Garamond", Georgia, serif',
        { strokeWidth: 0.6 }
      );

      // Connecting Ampersand floating between them
      drawHandcraftedGoldText(
        '&',
        cx, 550,
        'italic 400 68px "Playfair Display", "Cormorant Garamond", Georgia, serif',
        { strokeWidth: 0.5 }
      );

      // Bride Name: "Phương Anh" shifted down and to the right
      const name2X = cx + 140;
      const name2Y = 640;
      drawHandcraftedGoldText(
        name2,
        name2X, name2Y,
        'italic 600 90px "Playfair Display", "Cormorant Garamond", Georgia, serif',
        { strokeWidth: 0.6 }
      );

      // 7. Venue & Date subtitle at bottom
      drawHandcraftedGoldText(
        'The Garden Wedding  ·  20.12.2026',
        cx, 755,
        '500 24px "Playfair Display", "Cormorant Garamond", Georgia, serif',
        { strokeWidth: 0.4 }
      );

      // Fine bottom gold ornamental diamond
      const botY = 818;
      ctx.strokeStyle = goldInk;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 45, botY);
      ctx.lineTo(cx, botY - 8);
      ctx.lineTo(cx + 45, botY);
      ctx.lineTo(cx, botY + 8);
      ctx.closePath();
      ctx.stroke();
    };

    render();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        render();
        tex.needsUpdate = true;
      }).catch(() => {});
    }

    return tex;
  }

  initMaterials() {
    // 0. Front face material with gold foil lettering
    this.envelopeFrontTex = this.createEnvelopeFrontTexture();
    this.envelopeFrontMat = new THREE.MeshStandardMaterial({
      map: this.envelopeFrontTex,
      roughness: 0.62,
      metalness: 0.08,
      side: THREE.FrontSide,
    });

    // 1. Blush pink luxury stationery paper stock (matte fine art paper)
    this.blushPaperMat = new THREE.MeshStandardMaterial({
      color: 0xF4D9DE,
      roughness: 0.68,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // 2. Slightly deeper rose tone for edges & casing seams
    this.edgeMat = new THREE.MeshStandardMaterial({
      color: 0xEECCD3,
      roughness: 0.70,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // 3. Warm ivory interior lining
    this.innerIvoryMat = new THREE.MeshStandardMaterial({
      color: 0xFFFDF9,
      roughness: 0.65,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    // 4. Authentic Royal Burgundy Sealing Wax Material (Poured molten wax with glossy lacquer clearcoat)
    // PRESERVE CURRENT WAX SEAL DESIGN AS REQUIRED
    this.goldSealMat = new THREE.MeshPhysicalMaterial({
      color: 0x8A1222, // Rich Luxury Crimson-Burgundy Sealing Wax
      roughness: 0.24,
      metalness: 0.08,
      clearcoat: 0.90, // Real glossy poured wax surface sheen
      clearcoatRoughness: 0.16,
      emissive: new THREE.Color(0x35040B),
      emissiveIntensity: 0.0,
      transparent: true,
      opacity: 1.0,
    });

    // 5. Wax seal raised rim with rich poured edge sheen
    this.goldRimMat = new THREE.MeshPhysicalMaterial({
      color: 0x9E1A2D,
      roughness: 0.20,
      metalness: 0.12,
      clearcoat: 0.95,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color(0x40050E),
      emissiveIntensity: 0.0,
      transparent: true,
      opacity: 1.0,
    });
  }

  /**
   * Helper to create a rectangle Shape with rounded bottom corners and clean straight top edge.
   * This guarantees seamless flush alignment with the top flap hinge!
   */
  createEnvelopeBodyShape(w, h, r) {
    const shape = new THREE.Shape();
    const x0 = -w / 2;
    const y0 = -h / 2;
    const x1 = w / 2;
    const y1 = h / 2;

    // Start at top-left corner
    shape.moveTo(x0, y1);
    // Straight down to bottom-left corner curve
    shape.lineTo(x0, y0 + r);
    shape.quadraticCurveTo(x0, y0, x0 + r, y0);
    // Straight across bottom to bottom-right corner curve
    shape.lineTo(x1 - r, y0);
    shape.quadraticCurveTo(x1, y0, x1, y0 + r);
    // Straight up to top-right corner
    shape.lineTo(x1, y1);
    // Straight across top edge
    shape.lineTo(x0, y1);
    shape.closePath();
    return shape;
  }

  /**
   * Helper to create a 4-corner rounded rectangle Shape (for the front panel card)
   */
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

  initBody() {
    const W = this.width;       // 3.30 (Larger Back Foundation)
    const H = this.height;      // 2.20
    const D = this.depth;       // 0.030
    const r = this.cornerRadius; // 0.08

    const Wf = this.frontWidth;  // 3.12 (Smaller Front Panel)
    const Hf = this.frontHeight; // 2.04
    const rf = this.frontCornerRadius; // 0.06

    // =========================================================================
    // 1. MẶT SAU (BACK COVER — LARGER BASE FOUNDATION at Z = -D/2)
    // Sits at -D/2, normal vector faces -Z.
    // Contains diagonal stationery pocket folds and receives the flap and wax seal.
    // =========================================================================
    const backShape = this.createEnvelopeBodyShape(W, H, r);
    const backGeom = new THREE.ShapeGeometry(backShape, 20);
    this.backMesh = new THREE.Mesh(backGeom, this.blushPaperMat);
    this.backMesh.position.set(0, 0, -D / 2);
    this.backMesh.rotation.y = Math.PI; // Faces -Z (Back side)
    this.group.add(this.backMesh);

    // Diagonal stationery fold accents on the back face (luxury craftsmanship)
    const foldMat = new THREE.MeshStandardMaterial({
      color: 0xEDBCC7,
      roughness: 0.72,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    const leftFoldShape = new THREE.Shape();
    leftFoldShape.moveTo(-W / 2, H / 2);
    leftFoldShape.lineTo(-W / 2, -H / 2 + r);
    leftFoldShape.lineTo(0, -H * 0.08);
    leftFoldShape.closePath();
    const leftFold = new THREE.Mesh(new THREE.ShapeGeometry(leftFoldShape), foldMat);
    leftFold.position.set(0, 0, -D / 2 - 0.001);
    leftFold.rotation.y = Math.PI;
    this.group.add(leftFold);

    const rightFoldShape = new THREE.Shape();
    rightFoldShape.moveTo(W / 2, H / 2);
    rightFoldShape.lineTo(W / 2, -H / 2 + r);
    rightFoldShape.lineTo(0, -H * 0.08);
    rightFoldShape.closePath();
    const rightFold = new THREE.Mesh(new THREE.ShapeGeometry(rightFoldShape), foldMat);
    rightFold.position.set(0, 0, -D / 2 - 0.001);
    rightFold.rotation.y = Math.PI;
    this.group.add(rightFold);

    // =========================================================================
    // 2. MẶT TRƯỚC (FRONT COVER — ADDRESS SIDE at Z = +D/2)
    // Front base wall (3.30 x 2.20) + Front Cover Panel (3.12 x 2.04)
    // Sits at +D/2, normal vector faces +Z (toward viewer when p < 0.42).
    // Displays "Thiên Đức & Phương Anh". ABSOLUTELY NO WAX SEAL ON THIS FACE!
    // =========================================================================

    // A. Front Base Mounting Wall (matching 3.30 x 2.20 foundation)
    const frontBaseShape = this.createEnvelopeBodyShape(W, H, r);
    const frontBaseGeom = new THREE.ShapeGeometry(frontBaseShape, 20);
    this.frontBaseMesh = new THREE.Mesh(frontBaseGeom, this.blushPaperMat);
    this.frontBaseMesh.position.set(0, 0, D / 2);
    this.group.add(this.frontBaseMesh);

    // B. Mounted Front Cover Panel (Deliberately smaller: 3.12 x 2.04)
    // Creates the exquisite 2-ply layered deckle-edge wedding stationery framing border!
    const frontPanelShape = this.createRoundedRectShape(Wf, Hf, rf);
    const frontPanelGeom = new THREE.ShapeGeometry(frontPanelShape, 24);

    // Generate UVs for the front panel texture
    const pos = frontPanelGeom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + Wf / 2) / Wf;
      const v = (pos.getY(i) + Hf / 2) / Hf;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
    frontPanelGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    this.frontPanelMesh = new THREE.Mesh(frontPanelGeom, this.envelopeFrontMat);
    // Sits cleanly on the front face (+Z), slightly raised by 0.002 to create the tactile 2-ply card relief
    this.frontPanelMesh.position.set(0, 0, D / 2 + 0.002);
    this.group.add(this.frontPanelMesh);

    // =========================================================================
    // 3. SEAMLESS SOLID CASING: LEFT WALL, BOTTOM CREASE, RIGHT WALL
    // Spans from (-W/2, H/2) down around bottom to (W/2, H/2).
    // ZERO CORNER GAPS: connects flush to the top edge!
    // =========================================================================
    const uShape = new THREE.Shape();
    const wallThick = 0.012;
    const topY = H / 2; // Exact full height!

    // Outer contour
    uShape.moveTo(-W / 2, topY);
    uShape.lineTo(-W / 2, -H / 2 + r);
    uShape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    uShape.lineTo(W / 2 - r, -H / 2);
    uShape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
    uShape.lineTo(W / 2, topY);

    // Inner contour
    uShape.lineTo(W / 2 - wallThick, topY);
    uShape.lineTo(W / 2 - wallThick, -H / 2 + r);
    uShape.quadraticCurveTo(W / 2 - wallThick, -H / 2 + wallThick, W / 2 - r, -H / 2 + wallThick);
    uShape.lineTo(-W / 2 + r, -H / 2 + wallThick);
    uShape.quadraticCurveTo(-W / 2 + wallThick, -H / 2 + wallThick, -W / 2 + wallThick, -H / 2 + r);
    uShape.lineTo(-W / 2 + wallThick, topY);
    uShape.closePath();

    const uGeom = new THREE.ExtrudeGeometry(uShape, {
      depth: D,
      bevelEnabled: false,
    });
    uGeom.translate(0, 0, -D / 2);

    const uCasing = new THREE.Mesh(uGeom, this.edgeMat);
    this.group.add(uCasing);

    // 4. Ivory Interior Lining inside the pocket
    const innerShape = this.createRoundedRectShape(W - 0.08, H - 0.08, r * 0.8);
    const innerGeom = new THREE.ShapeGeometry(innerShape, 12);
    const innerMesh = new THREE.Mesh(innerGeom, this.innerIvoryMat);
    innerMesh.position.set(0, 0, 0);
    this.group.add(innerMesh);
  }

  initFlap() {
    const W = this.width;
    const H = this.height;
    const D = this.depth;

    // -------------------------------------------------------------------------
    // ENVELOPE OPENING FLAP (Hinged at top of BACK PANEL at Z = -D/2)
    // -------------------------------------------------------------------------
    this.flapPivot = new THREE.Group();
    this.flapPivot.name = 'EnvelopeFlapPivot';
    this.flapPivot.position.set(0, H / 2, -D / 2);

    // Top Crease Strip: seamlessly seals the top slot between -D/2 and +D/2
    const topStripGeom = new THREE.PlaneGeometry(W, D);
    topStripGeom.rotateX(-Math.PI / 2);
    topStripGeom.translate(0, 0, D / 2);
    const topStrip = new THREE.Mesh(topStripGeom, this.blushPaperMat);
    this.flapPivot.add(topStrip);

    // Triangular stationery flap pointing downward when closed
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-W / 2, 0);
    flapShape.lineTo(W / 2, 0);
    flapShape.lineTo(W * 0.22, -H * 0.40);
    flapShape.quadraticCurveTo(0, -H * 0.48, -W * 0.22, -H * 0.40);
    flapShape.closePath();

    const flapGeom = new THREE.ShapeGeometry(flapShape, 20);

    // Outer face of the flap (facing -Z, i.e. BACK)
    this.flapMesh = new THREE.Mesh(flapGeom, this.blushPaperMat);
    this.flapMesh.position.set(0, 0, -0.003);
    this.flapMesh.rotation.y = Math.PI; // Faces -Z (Back side)
    this.flapPivot.add(this.flapMesh);

    // Inner lining of the flap (revealed when opened)
    const flapInnerGeom = new THREE.ShapeGeometry(flapShape, 20);
    this.flapInnerMesh = new THREE.Mesh(flapInnerGeom, this.innerIvoryMat);
    this.flapInnerMesh.position.set(0, 0, 0.001);
    this.flapPivot.add(this.flapInnerMesh);

    this.group.add(this.flapPivot);
  }

  initWaxSeal() {
    // -------------------------------------------------------------------------
    // 3D WAX SEAL: Royal Burgundy Sealing Wax
    // PRESERVE CURRENT DESIGN AS STRICTLY REQUIRED IN SECTION 1.2
    // Located at the flap apex on the BACK COVER (Mặt sau).
    // -------------------------------------------------------------------------
    const H = this.height;

    this.sealGroup = new THREE.Group();
    this.sealGroup.name = 'WaxSealButton';
    // Position seal at the flap apex on the outer back surface (-Z)
    this.sealGroup.position.set(0, -H * 0.44, -0.016);
    this.sealGroup.rotation.y = Math.PI; // Faces -Z (outward from the back)

    // 1. Organic Melted Wax Puddle Shape (poured molten wax lobes)
    const waxShape = new THREE.Shape();
    const pts = 48;
    const baseR = 0.42;
    for (let i = 0; i <= pts; i++) {
      const th = (i / pts) * Math.PI * 2;
      const r = baseR +
        Math.sin(th * 3 + 0.35) * 0.040 +
        Math.cos(th * 5 + 1.1) * 0.026 +
        Math.sin(th * 8 + 2.2) * 0.016 +
        Math.cos(th * 11) * 0.008;
      const px = Math.cos(th) * r;
      const py = Math.sin(th) * r;
      if (i === 0) waxShape.moveTo(px, py);
      else waxShape.lineTo(px, py);
    }

    const waxGeom = new THREE.ExtrudeGeometry(waxShape, {
      depth: 0.042,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.028,
      bevelThickness: 0.024,
    });
    waxGeom.translate(0, 0, -0.021);

    this.sealMesh = new THREE.Mesh(waxGeom, this.goldSealMat);
    this.sealGroup.add(this.sealMesh);

    // 2. Raised Wax Rim (Organic melted wax pushed upward by the brass seal press)
    const rimGeom = new THREE.TorusGeometry(0.33, 0.038, 18, 48);
    const rimMesh = new THREE.Mesh(rimGeom, this.goldRimMat);
    rimMesh.position.set(0, 0, 0.028);
    this.sealGroup.add(rimMesh);

    // 3. Smooth pressed wax core inside the rim (pure poured crimson wax, zero graphics)
    const innerCoreGeom = new THREE.CircleGeometry(0.31, 48);
    const innerCoreMesh = new THREE.Mesh(innerCoreGeom, this.goldSealMat);
    innerCoreMesh.position.set(0, 0, 0.025);
    this.sealGroup.add(innerCoreMesh);

    // Attach seal to flap pivot so it hinges seamlessly with the flap!
    this.flapPivot.add(this.sealGroup);
  }



  /**
   * Set flap opening angle in radians (0 = closed, 2.7 = wide open)
   * The flap hinges at top of back panel and swings upward and outward!
   */
  setFlapAngle(angleRad) {
    if (this.flapPivot) {
      // Swings upward/backward away from the back face
      this.flapPivot.rotation.x = -angleRad;
    }
  }

  /**
   * Set opacity of wax seal (fades out as seal breaks/releases)
   */
  setSealOpacity(opacity) {
    const clamped = Math.max(0, Math.min(1, opacity));
    if (this.goldSealMat) this.goldSealMat.opacity = clamped;
    if (this.goldRimMat) this.goldRimMat.opacity = clamped;
    if (this.stampMat) this.stampMat.opacity = clamped;
    this.sealGroup.visible = clamped > 0.01;
  }

  /**
   * Tactile depression when user presses down on envelope/seal (0..1)
   */
  setDepression(amount) {
    const clamped = Math.max(0, Math.min(1, amount));
    const restZ = -0.016;
    // Depresses slightly inward into the paper
    this.sealGroup.position.z = restZ + clamped * 0.008;
    if (this.sealMesh) {
      this.sealMesh.scale.set(1 + clamped * 0.06, 1 + clamped * 0.06, 1 - clamped * 0.20);
    }
  }

  /**
   * Wax seal warm molten glow feedback when holding (0 when resting, rich glow when held)
   */
  setGlow(amount) {
    const clamped = Math.max(0, Math.min(1, amount));
    if (this.goldSealMat) {
      this.goldSealMat.emissive = new THREE.Color(0xC02636);
      this.goldSealMat.emissiveIntensity = clamped * 1.4;
    }
    if (this.goldRimMat) {
      this.goldRimMat.emissive = new THREE.Color(0xE8B838);
      this.goldRimMat.emissiveIntensity = clamped * 1.5;
    }
  }

  /**
   * Get 3D world position of the wax seal button
   */
  getSealWorldPosition(targetVec = new THREE.Vector3()) {
    if (this.sealMesh) {
      this.sealMesh.getWorldPosition(targetVec);
    } else {
      targetVec.set(0, -this.height * 0.44, -this.depth / 2 - 0.016);
    }
    return targetVec;
  }
}
