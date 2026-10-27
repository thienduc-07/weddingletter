/**
 * SCROLL TEXTURE GENERATOR (PARCHMENT LOVE LETTER & BESPOKE WEDDING INVITATION)
 * -------------------------------------------------------------
 * Creates dedicated high-resolution canvas textures for the 3D Letter Scroll:
 * - outerTex: Elegant ivory parchment with gold foil trim and central monogram crest (Đ · A).
 * - innerTex: The ONE AND ONLY COMPLETE LUXURY WEDDING INVITATION LETTER!
 *   Featuring METALLIC GOLD FOIL CALLIGRAPHY for couple names:
 *   "Thiên Đức" on top, "Phương Anh" shifted down and to the right!
 *   (1 tên trên 1 tên xéo xuống dưới chút bên phải)
 */

import * as THREE from './three.module.js';
import { weddingContent } from '../src/data/wedding-content.js';

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  ctx.textAlign = align;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY;
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCornerDiamond(ctx, x, y, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x - 6, y);
  ctx.closePath();
  ctx.fill();
}

function drawMonogramCrest(ctx, cx, cy, monogram, goldGrad) {
  // Delicate concentric diamond crest
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.moveTo(cx, cy - 54);
  ctx.lineTo(cx + 48, cy);
  ctx.lineTo(cx, cy + 54);
  ctx.lineTo(cx - 48, cy);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - 62);
  ctx.lineTo(cx + 56, cy);
  ctx.lineTo(cx, cy + 62);
  ctx.lineTo(cx - 56, cy);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(215, 188, 131, 0.40)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Subtle laurel leaves
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx - 24, cy, 32, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 24, cy, 32, Math.PI * 0.55, Math.PI * 1.45);
  ctx.stroke();

  // Monogram Characters
  ctx.font = 'italic 500 52px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = goldGrad;
  ctx.textAlign = 'center';
  ctx.fillText(monogram, cx, cy + 16);
}

export function createScrollTextures() {
  const width = 1536;
  const heightOuter = 1536;
  const heightInner = 2288; // Full portrait proportion for the complete wedding invitation

  // 1. Outer Wrap Canvas (Visible when coiled in envelope / during flight)
  const outerCanvas = document.createElement('canvas');
  outerCanvas.width = width;
  outerCanvas.height = heightOuter;
  renderOuterWrap(outerCanvas.getContext('2d'), width, heightOuter);

  const outerTex = new THREE.CanvasTexture(outerCanvas);
  outerTex.colorSpace = THREE.SRGBColorSpace;
  outerTex.anisotropy = 8;

  // 2. Inner Letter Canvas (Revealed when parchment unrolls)
  const innerCanvas = document.createElement('canvas');
  innerCanvas.width = width;
  innerCanvas.height = heightInner;

  function renderInner() {
    renderInnerLetter(innerCanvas.getContext('2d'), width, heightInner);
    innerTex.needsUpdate = true;
  }

  const innerTex = new THREE.CanvasTexture(innerCanvas);
  innerTex.colorSpace = THREE.SRGBColorSpace;
  innerTex.anisotropy = 8;

  renderInner();

  // Re-render when external Google Fonts finish loading
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      renderOuterWrap(outerCanvas.getContext('2d'), width, heightOuter);
      renderInner();
      outerTex.needsUpdate = true;
    }).catch(() => {});
  }

  return { outerTex, innerTex, refresh: renderInner };
}

function renderOuterWrap(ctx, width, height) {
  // 1. Warm Ivory Parchment Ground
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, width, height);

  // 2. Parchment Fibers & Organic Texture
  ctx.fillStyle = 'rgba(74, 45, 52, 0.015)';
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
  }

  // 3. Metallic Gold Foil Gradients
  const goldGrad = ctx.createLinearGradient(width * 0.25, 0, width * 0.75, height);
  goldGrad.addColorStop(0.0, '#D7BC83');
  goldGrad.addColorStop(0.35, '#F5E5B8');
  goldGrad.addColorStop(0.65, '#987A46');
  goldGrad.addColorStop(1.0, '#D7BC83');

  // Double gold decorative trim at left & right paper scroll margins
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2.5;

  const m = 54;
  ctx.beginPath();
  ctx.moveTo(m, 40); ctx.lineTo(width - m, 40);
  ctx.moveTo(m, 50); ctx.lineTo(width - m, 50);
  ctx.moveTo(m, height - 40); ctx.lineTo(width - m, height - 40);
  ctx.moveTo(m, height - 50); ctx.lineTo(width - m, height - 50);
  ctx.stroke();

  // Central Gold Monogram Crest (Đ · A)
  ctx.textAlign = 'center';
  ctx.font = 'italic 500 84px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = goldGrad;
  ctx.fillText(weddingContent.couple?.monogram || 'Đ · A', width / 2, height / 2 - 25);

  // Decorative Botanical Diamond
  const midY = height / 2 + 35;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 40, midY);
  ctx.lineTo(width / 2, midY - 12);
  ctx.lineTo(width / 2 + 40, midY);
  ctx.lineTo(width / 2, midY + 12);
  ctx.closePath();
  ctx.stroke();

  ctx.font = '600 20px "Montserrat", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillStyle = '#987A46';
  ctx.fillText('WEDDING INVITATION', width / 2, height / 2 + 85);
  ctx.letterSpacing = '0px';
}

function drawEmbossedText(ctx, text, x, y, options = {}) {
  const {
    font,
    fillGrad,
    align = 'center',
    letterSpacing = '0px',
    isGold = true,
    shadowColor = 'rgba(54, 28, 34, 0.65)',
    highlightColor = 'rgba(255, 253, 245, 0.95)',
    embossOffset = 2.4,
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  if (ctx.letterSpacing !== undefined) {
    ctx.letterSpacing = letterSpacing;
  }

  // 1. Deep Cast Shadow Layer (tactile letterpress depth into paper: bottom-right)
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = embossOffset;
  ctx.shadowOffsetY = embossOffset + 0.6;
  ctx.fillStyle = 'rgba(55, 28, 35, 0.45)';
  ctx.fillText(text, x, y);
  ctx.restore();

  // 2. Specular Relief Highlight Layer (illuminated top-left paper crest)
  ctx.save();
  ctx.shadowColor = highlightColor;
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = -embossOffset * 0.6;
  ctx.shadowOffsetY = -embossOffset * 0.6;
  ctx.fillStyle = 'rgba(255, 255, 250, 0.85)';
  ctx.fillText(text, x, y);
  ctx.restore();

  // 3. Core Metallic Imperial Gold Fill
  ctx.save();
  ctx.fillStyle = fillGrad;
  ctx.fillText(text, x, y);
  ctx.restore();

  // 4. Ultra-Fine Metallic Gilded Lip for razor-sharp legibility
  if (isGold) {
    ctx.strokeStyle = '#6E4C12'; // Warm deep bronze-gold contour
    ctx.lineWidth = 0.8;
    ctx.strokeText(text, x, y);
  }

  ctx.restore();
}

function renderInnerLetter(ctx, width, height) {
  // 1. Warm Pearl-Ivory Cotton Paper Ground (#FAF7F2)
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, width, height);

  // 2. Micro Paper Fibers & Tactile Grain
  ctx.fillStyle = 'rgba(74, 45, 52, 0.012)';
  for (let i = 0; i < 5000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
  }
  ctx.fillStyle = 'rgba(215, 188, 131, 0.015)';
  for (let i = 0; i < 3000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() * 3 + 1, 1);
  }

  // 3. Metallic Champagne Gold Gradient (Rich 5-stop imperial gold)
  const goldGrad = ctx.createLinearGradient(width * 0.20, 0, width * 0.80, height);
  goldGrad.addColorStop(0.0, '#B8860B');
  goldGrad.addColorStop(0.25, '#D4AF37');
  goldGrad.addColorStop(0.50, '#F5DEB3');
  goldGrad.addColorStop(0.75, '#C59A27');
  goldGrad.addColorStop(1.0, '#996515');

  // Inks
  const deepBurgundy = '#381A22';
  const espressoInk = '#3B2329';
  const mutedBurgundy = '#5C3E45';

  // 4. Double Gold Foil Borders with Rounded Corners (Embossed relief)
  const m = 64;
  const rOuter = 26;
  ctx.save();
  ctx.shadowColor = 'rgba(54, 28, 34, 0.40)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 1.5;
  drawRoundedRectPath(ctx, m, m, width - m * 2, height - m * 2, rOuter);
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();

  const m2 = m + 18;
  const rInner = 18;
  drawRoundedRectPath(ctx, m2, m2, width - m2 * 2, height - m2 * 2, rInner);
  ctx.strokeStyle = 'rgba(215, 188, 131, 0.42)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Four Corner Botanical Filigree Ornaments
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2.0;
  const cLen = 32;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(m2 - 4, m2 + cLen); ctx.lineTo(m2 - 4, m2 - 4); ctx.lineTo(m2 + cLen, m2 - 4);
  ctx.stroke();
  drawCornerDiamond(ctx, m2 - 4, m2 - 4, goldGrad);

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - m2 + 4 - cLen, m2 - 4); ctx.lineTo(width - m2 + 4, m2 - 4); ctx.lineTo(width - m2 + 4, m2 + cLen);
  ctx.stroke();
  drawCornerDiamond(ctx, width - m2 + 4, m2 - 4, goldGrad);

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(m2 - 4, height - m2 + 4 - cLen); ctx.lineTo(m2 - 4, height - m2 + 4); ctx.lineTo(m2 + cLen, height - m2 + 4);
  ctx.stroke();
  drawCornerDiamond(ctx, m2 - 4, height - m2 + 4, goldGrad);

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - m2 + 4 - cLen, height - m2 + 4); ctx.lineTo(width - m2 + 4, height - m2 + 4); ctx.lineTo(width - m2 + 4, height - m2 + 4 - cLen);
  ctx.stroke();
  drawCornerDiamond(ctx, width - m2 + 4, height - m2 + 4, goldGrad);

  // ---------------------------------------------------------------------------
  // SECTION A: TOP REGAL MONOGRAM CREST
  // ---------------------------------------------------------------------------
  const crestY = 195;
  drawMonogramCrest(ctx, width / 2, crestY, weddingContent.couple?.monogram || 'Đ · A', goldGrad);

  // Eyebrow (Khắc nổi) — Enchanced size for crisp readability
  const eyebrow = weddingContent.invitation?.eyebrow || 'TRÂN TRỌNG BÁO HỶ VÀ KÍNH MỜI';
  drawEmbossedText(ctx, eyebrow, width / 2, 295, {
    font: '600 32px "Montserrat", sans-serif',
    letterSpacing: '8px',
    fillGrad: '#8A682E',
    isGold: false,
    embossOffset: 1.6,
  });

  // Heading (Khắc nổi)
  const heading = weddingContent.invitation?.heading || 'Lễ Thành Hôn';
  drawEmbossedText(ctx, heading, width / 2, 405, {
    font: 'italic 600 76px "Playfair Display", "Cormorant Garamond", Georgia, serif',
    fillGrad: deepBurgundy,
    isGold: false,
    shadowColor: 'rgba(54, 28, 34, 0.70)',
    highlightColor: 'rgba(255, 250, 240, 0.95)',
    embossOffset: 2.2,
  });

  // Fine divider
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, 450);
  ctx.lineTo(width / 2 + 120, 450);
  ctx.stroke();

  // ---------------------------------------------------------------------------
  // SECTION B: CHỮ MẠ VÀNG KHẮC NỔI — THIÊN ĐỨC & PHƯƠNG ANH
  // "1 tên trên 1 tên xéo xuống dưới chút bên phải" (Strict user request!)
  // ---------------------------------------------------------------------------
  const name1 = weddingContent.couple?.partnerOne || 'Thiên Đức';
  const name2 = weddingContent.couple?.partnerTwo || 'Phương Anh';

  // 1. Groom Name: "Thiên Đức" on top, shifted slightly left (Khắc nổi 3D, Grand scale)
  const name1X = width / 2 - 160;
  const name1Y = 595;
  drawEmbossedText(ctx, name1, name1X, name1Y, {
    font: 'italic 600 120px "Playfair Display", "Cormorant Garamond", Georgia, serif',
    letterSpacing: '2px',
    fillGrad: goldGrad,
    isGold: true,
    shadowColor: 'rgba(40, 18, 24, 0.85)',
    highlightColor: 'rgba(255, 252, 240, 0.95)',
    embossOffset: 2.8,
  });

  // 2. Connecting Cursive Ampersand floating between them (Khắc nổi)
  drawEmbossedText(ctx, '&', width / 2, 705, {
    font: '400 96px "Great Vibes", cursive, serif',
    fillGrad: goldGrad,
    isGold: true,
    shadowColor: 'rgba(40, 18, 24, 0.85)',
    highlightColor: 'rgba(255, 252, 240, 0.95)',
    embossOffset: 2.5,
  });

  // 3. Bride Name: "Phương Anh" shifted down and to the right! (Khắc nổi 3D, Grand scale)
  const name2X = width / 2 + 160;
  const name2Y = 815;
  drawEmbossedText(ctx, name2, name2X, name2Y, {
    font: 'italic 600 120px "Playfair Display", "Cormorant Garamond", Georgia, serif',
    letterSpacing: '2px',
    fillGrad: goldGrad,
    isGold: true,
    shadowColor: 'rgba(40, 18, 24, 0.85)',
    highlightColor: 'rgba(255, 252, 240, 0.95)',
    embossOffset: 2.8,
  });

  // Subtitle (Khắc nổi)
  const subTitle = weddingContent.invitation?.subheading || 'THE WEDDING CELEBRATION';
  drawEmbossedText(ctx, subTitle, width / 2, 915, {
    font: '600 28px "Montserrat", sans-serif',
    letterSpacing: '9px',
    fillGrad: '#8A682E',
    isGold: false,
    embossOffset: 1.5,
  });

  // Sincere Invitation Verse — Large, beautifully readable calligraphic type
  const message = weddingContent.invitation?.message || 
    'Với niềm hạnh phúc và tình yêu thương, chúng tôi trân trọng kính mời bạn và người thương đến chung vui trong ngày đặc biệt nhất của cuộc đời chúng tôi.';
  ctx.font = 'italic 400 38px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = espressoInk;
  wrapText(ctx, message, width / 2, 1010, width - 360, 58);

  // ---------------------------------------------------------------------------
  // SECTION C: BOTANICAL DIAMOND ORNAMENT
  // ---------------------------------------------------------------------------
  const midY = 1180;
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 60, midY);
  ctx.lineTo(width / 2, midY - 18);
  ctx.lineTo(width / 2 + 60, midY);
  ctx.lineTo(width / 2, midY + 18);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.arc(width / 2, midY, 4, 0, Math.PI * 2);
  ctx.fill();

  // ---------------------------------------------------------------------------
  // SECTION D: CEREMONY SCHEDULE & VENUE DETAILS (Khắc nổi)
  // ---------------------------------------------------------------------------
  const dateDisplay = weddingContent.wedding?.dateDisplay || 'Chủ Nhật, 20 Tháng 12, 2026';
  const ceremonyTime = weddingContent.wedding?.ceremonyTime || '15:30';

  drawEmbossedText(ctx, `${ceremonyTime}  ·  ${dateDisplay}`, width / 2, 1310, {
    font: '600 48px "Playfair Display", "Cormorant Garamond", Georgia, serif',
    letterSpacing: '2px',
    fillGrad: '#8A682E',
    isGold: false,
    embossOffset: 1.8,
  });

  // Venue Name (Khắc nổi)
  const venueName = weddingContent.wedding?.venueName || 'The Garden Wedding';
  drawEmbossedText(ctx, venueName, width / 2, 1420, {
    font: '700 64px "Playfair Display", "Cormorant Garamond", Georgia, serif',
    fillGrad: deepBurgundy,
    isGold: false,
    shadowColor: 'rgba(54, 28, 34, 0.70)',
    highlightColor: 'rgba(255, 250, 240, 0.95)',
    embossOffset: 2.2,
  });

  // Venue Address
  const venueAddress = weddingContent.wedding?.venueAddress || '123 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  ctx.font = '500 32px "Montserrat", sans-serif';
  ctx.fillStyle = mutedBurgundy;
  ctx.textAlign = 'center';
  ctx.fillText(venueAddress, width / 2, 1495);

  // ---------------------------------------------------------------------------
  // SECTION E: CLOSING ROMANTIC SENTIMENT (Khắc nổi)
  // ---------------------------------------------------------------------------
  drawEmbossedText(ctx, 'Chúng tôi rất mong được cùng bạn lưu giữ khoảnh khắc ngọt ngào này.', width / 2, 1630, {
    font: 'italic 400 36px "Playfair Display", "Cormorant Garamond", Georgia, serif',
    fillGrad: '#8A682E',
    isGold: false,
    embossOffset: 1.5,
  });
}
