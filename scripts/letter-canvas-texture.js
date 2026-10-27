/**
 * LETTER CANVAS TEXTURE GENERATOR (AWARD-WINNING LUXURY STATIONERY DESIGN)
 * -------------------------------------------------------------
 * Dynamically draws the high-resolution wedding letter texture onto
 * an offscreen canvas to map directly onto the 3D deformable paper mesh.
 * 
 * Features:
 * - Asynchronous font synchronization via document.fonts.ready
 * - Perfect Vietnamese diacritic rendering for THIÊN ĐỨC & PHƯƠNG ANH
 * - Soft rounded deckle border and fine-art cotton grain
 * - Metallic gold foil styling with specular gradient highlights
 * - Automatic texture reload when webfonts finish loading
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

export function createLetterTextures() {
  const width = 1536;
  const height = 2228;

  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = width;
  frontCanvas.height = height;

  const backCanvas = document.createElement('canvas');
  backCanvas.width = width;
  backCanvas.height = height;

  const frontTex = new THREE.CanvasTexture(frontCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;

  const backTex = new THREE.CanvasTexture(backCanvas);
  backTex.colorSpace = THREE.SRGBColorSpace;
  backTex.anisotropy = 8;

  function renderTextures() {
    renderFront(frontCanvas.getContext('2d'), width, height);
    renderBack(backCanvas.getContext('2d'), width, height);
    frontTex.needsUpdate = true;
    backTex.needsUpdate = true;
  }

  // Initial immediate render (with whatever fonts are currently in memory)
  renderTextures();

  // Re-render as soon as external Google Fonts (Playfair Display, Cormorant Garamond) finish loading
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      renderTextures();
    }).catch(() => {});
  }

  return { frontTex, backTex, refresh: renderTextures };
}

function renderFront(ctx, width, height) {
  // 1. Warm Pearl-Ivory Cotton Paper (#FAF7F2)
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, width, height);

  // 2. Micro Paper Fibers & Tactile Fine-Art Grain
  ctx.fillStyle = 'rgba(74, 45, 52, 0.012)';
  for (let i = 0; i < 5500; i++) {
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

  // 3. Metallic Champagne Gold Gradient
  const goldGrad = ctx.createLinearGradient(width * 0.25, 0, width * 0.75, height);
  goldGrad.addColorStop(0.0, '#D7BC83');
  goldGrad.addColorStop(0.35, '#F5E5B8');
  goldGrad.addColorStop(0.65, '#987A46');
  goldGrad.addColorStop(1.0, '#D7BC83');

  // Deep Espresso / Burgundy Ink for maximum prestige & legibility
  const deepBurgundy = '#381A22';
  const espressoInk = '#462E34';
  const mutedBurgundy = '#6E5057';

  // 4. Double Gold Foil Borders with Rounded Corners
  const m = 64; // Outer margin
  const rOuter = 26;
  drawRoundedRectPath(ctx, m, m, width - m * 2, height - m * 2, rOuter);
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Inner hairline with rounded corners
  const m2 = m + 18;
  const rInner = 18;
  drawRoundedRectPath(ctx, m2, m2, width - m2 * 2, height - m2 * 2, rInner);
  ctx.strokeStyle = 'rgba(215, 188, 131, 0.35)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Four Corner Botanical Filigree Ornaments
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2.0;
  const cLen = 32;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(m2 - 4, m2 + cLen);
  ctx.lineTo(m2 - 4, m2 - 4);
  ctx.lineTo(m2 + cLen, m2 - 4);
  ctx.stroke();
  drawCornerDiamond(ctx, m2 - 4, m2 - 4, goldGrad);

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - m2 + 4 - cLen, m2 - 4);
  ctx.lineTo(width - m2 + 4, m2 - 4);
  ctx.lineTo(width - m2 + 4, m2 + cLen);
  ctx.stroke();
  drawCornerDiamond(ctx, width - m2 + 4, m2 - 4, goldGrad);

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(m2 - 4, height - m2 + 4 - cLen);
  ctx.lineTo(m2 - 4, height - m2 + 4);
  ctx.lineTo(m2 + cLen, height - m2 + 4);
  ctx.stroke();
  drawCornerDiamond(ctx, m2 - 4, height - m2 + 4, goldGrad);

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - m2 + 4 - cLen, height - m2 + 4);
  ctx.lineTo(width - m2 + 4, height - m2 + 4);
  ctx.lineTo(width - m2 + 4, height - m2 + 4 - cLen);
  ctx.stroke();
  drawCornerDiamond(ctx, width - m2 + 4, height - m2 + 4, goldGrad);

  // ---------------------------------------------------------------------------
  // SECTION A: TOP REGAL MONOGRAM CREST
  // ---------------------------------------------------------------------------
  const crestY = 190;
  drawMonogramCrest(ctx, width / 2, crestY, weddingContent.couple?.monogram || 'Đ · A', goldGrad);

  // Eyebrow
  const eyebrow = weddingContent.invitation?.eyebrow || 'TRÂN TRỌNG BÁO HỶ VÀ KÍNH MỜI';
  ctx.font = '600 23px "Montserrat", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillStyle = '#8A682E';
  ctx.textAlign = 'center';
  ctx.fillText(eyebrow, width / 2, 280);
  ctx.letterSpacing = '0px';

  // Heading
  const heading = weddingContent.invitation?.heading || 'Lễ Thành Hôn';
  ctx.font = 'italic 500 52px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = deepBurgundy;
  ctx.fillText(heading, width / 2, 365);

  // Fine divider
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 90, 405);
  ctx.lineTo(width / 2 + 90, 405);
  ctx.stroke();

  // ---------------------------------------------------------------------------
  // SECTION B: CENTERPIECE — COUPLE NAMES (THIÊN ĐỨC & PHƯƠNG ANH)
  // Roman Display Serifs with Gold Calligraphic Ampersand
  // ---------------------------------------------------------------------------
  const p1 = (weddingContent.couple?.partnerOne || 'THIÊN ĐỨC').toUpperCase();
  const p2 = (weddingContent.couple?.partnerTwo || 'PHƯƠNG ANH').toUpperCase();

  ctx.font = 'italic 600 102px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = deepBurgundy;
  ctx.fillText(p1, width / 2, 550);
  ctx.letterSpacing = '0px';

  // Ampersand
  ctx.font = '400 80px "Great Vibes", cursive, serif';
  ctx.fillStyle = goldGrad;
  ctx.fillText('&', width / 2, 650);

  // Bride Name
  ctx.font = 'italic 600 102px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = deepBurgundy;
  ctx.fillText(p2, width / 2, 775);
  ctx.letterSpacing = '0px';

  // Subtitle
  const subTitle = weddingContent.invitation?.subheading || 'THE WEDDING CELEBRATION';
  ctx.font = '600 22px "Montserrat", sans-serif';
  ctx.letterSpacing = '9px';
  ctx.fillStyle = '#8A682E';
  ctx.fillText(subTitle, width / 2, 855);
  ctx.letterSpacing = '0px';

  // Sincere Invitation Verse
  const message = weddingContent.invitation?.message || 
    'Với trọn vẹn yêu thương và niềm hạnh phúc, chúng tôi trân trọng kính mời bạn đến chung vui trong ngày đặc biệt của chúng tôi.';
  ctx.font = '400 28px "Montserrat", sans-serif';
  ctx.fillStyle = mutedBurgundy;
  wrapText(ctx, message, width / 2, 970, width - 420, 46);

  // ---------------------------------------------------------------------------
  // SECTION C: BOTANICAL DIAMOND ORNAMENT
  // ---------------------------------------------------------------------------
  const midY = 1170;
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.4;
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
  // SECTION D: CEREMONY SCHEDULE & VENUE DETAILS
  // ---------------------------------------------------------------------------
  const dateDisplay = weddingContent.wedding?.dateDisplay || 'Chủ Nhật, 20 Tháng 12, 2026';
  const ceremonyTime = weddingContent.wedding?.ceremonyTime || '15:30';

  ctx.font = '600 38px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '2px';
  ctx.fillStyle = '#8A682E';
  ctx.fillText(`${ceremonyTime}  ·  ${dateDisplay}`, width / 2, 1320);
  ctx.letterSpacing = '0px';

  // Venue Name
  const venueName = weddingContent.venue?.name || 'THE GARDEN WEDDING';
  ctx.font = '600 36px "Montserrat", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillStyle = espressoInk;
  ctx.fillText(venueName, width / 2, 1425);
  ctx.letterSpacing = '0px';

  // Venue Address
  const venueAddress = weddingContent.venue?.address || '123 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  ctx.font = '400 26px "Montserrat", sans-serif';
  ctx.fillStyle = mutedBurgundy;
  wrapText(ctx, venueAddress, width / 2, 1500, width - 420, 42);

  // ---------------------------------------------------------------------------
  // SECTION E: CLOSING SENTIMENT (Carefully positioned to leave bottom-right open)
  // ---------------------------------------------------------------------------
  const closing = weddingContent.invitation?.closing || 
    'Sự hiện diện của bạn là niềm vinh hạnh và hạnh phúc lớn nhất của chúng tôi.';
  ctx.font = 'italic 30px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = mutedBurgundy;
  // Offset to the left to ensure generous negative space for the 3D rose branch
  wrapText(ctx, closing, width / 2 - 70, 1740, width - 560, 44, 'center');
}

function renderBack(ctx, width, height) {
  // Back texture in soft warm blush tone (#FAF3F5)
  ctx.fillStyle = '#FAF3F5';
  ctx.fillRect(0, 0, width, height);

  // Fine fibers
  ctx.fillStyle = 'rgba(74, 45, 52, 0.010)';
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
  }

  // Soft subtle watermark of monogram in center back
  ctx.textAlign = 'center';
  ctx.font = 'italic 180px "Playfair Display", "Cormorant Garamond", serif';
  ctx.fillStyle = 'rgba(215, 188, 131, 0.12)';
  ctx.fillText(weddingContent.couple?.monogram || 'Đ · A', width / 2, height / 2 + 60);

  // Delicate hairline frame
  const m = 64;
  drawRoundedRectPath(ctx, m, m, width - m * 2, height - m * 2, 26);
  ctx.strokeStyle = 'rgba(215, 188, 131, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
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

function drawCornerDiamond(ctx, x, y, style) {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x - 5, y);
  ctx.closePath();
  ctx.fill();
}

function drawMonogramCrest(ctx, cx, cy, monogram, goldGrad) {
  // Ornate botanical wreath surrounding monogram
  ctx.save();
  ctx.strokeStyle = 'rgba(215, 188, 131, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.stroke();

  // Mini laurel leaves around circle
  ctx.fillStyle = goldGrad;
  const numLeaves = 16;
  for (let i = 0; i < numLeaves; i++) {
    const a = (i / numLeaves) * Math.PI * 2;
    const lx = cx + Math.cos(a) * 58;
    const ly = cy + Math.sin(a) * 58;
    ctx.beginPath();
    ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Monogram initials
  ctx.textAlign = 'center';
  ctx.font = 'italic 500 68px "Playfair Display", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = goldGrad;
  ctx.fillText(monogram, cx, cy + 22);
  ctx.restore();
}
