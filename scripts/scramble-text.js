/**
 * EDITORIAL CHARACTER-REVEAL & SCRAMBLER ENGINE (V3.1 CLAUDE CODE & TECH AESTHETIC)
 * -------------------------------------------------------------
 * Ultra-refined typography transition engine supporting:
 * - Scroll-driven chapter storytelling transitions with Claude Code / developer terminal flair
 * - Controlled character decoding (unscramble) without glitch/cross artifacts
 * - Continuous, deterministic progress mapping (100% reversible)
 * - Full Unicode and Vietnamese character preservation
 */

// Refined luxury editorial glyphs for romantic typography reveal
const EDITORIAL_GLYPHS = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', '·', '✧', '✦', '—'];

// Deterministic hash function for zero-jitter transition frames
function hashChar(idx, charCode, step) {
  let h = (idx * 374761393 + charCode * 668265263 + step * 314159265) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 + 24680;
  return Math.abs(h);
}

/**
 * Editorial Storytelling Chapters across Scroll Progress [0..1]
 * Cinematic Romantic Wedding Narrative (Awwwards & Luxury Editorial Aesthetic)
 */
export const CHAPTER_TIMELINE = [
  {
    pMin: 0.00,
    pMax: 0.14,
    chapter: 'ACT I · LỜI MỞ ĐẦU',
    title: 'A LETTER SEALED IN TIME',
    sub: 'THIỆP CƯỚI THIÊN ĐỨC & PHƯƠNG ANH',
    micro: 'THE GARDEN WEDDING · VOWS AT SUNSET',
  },
  {
    pMin: 0.14,
    pMax: 0.36,
    chapter: 'ACT II · HÀNH TRÌNH TÌNH YÊU',
    title: 'A MOMENT SUSPENDED IN TIME',
    sub: 'KHI HAI TRÁI TIM CHUNG MỘT NHỊP',
    micro: 'WHERE LOVE TAKES FLIGHT',
  },
  {
    pMin: 0.36,
    pMax: 0.48,
    chapter: 'ACT III · ĐIỂM HẸN HẠNH PHÚC',
    title: 'EVERY JOURNEY FINDS ITS HOME',
    sub: 'CHÀO ĐÓN BẠN ĐẾN VỚI NGÀY ĐẶC BIỆT',
    micro: '20.12.2026 · SÀI GÒN',
  },
  {
    pMin: 0.48,
    pMax: 0.52,
    chapter: 'ACT IV · KHẮC GHI HẸN ƯỚC',
    title: 'CHẠM VÀ GIỮ CON DẤU ĐỂ MỞ',
    sub: 'MỞ RA BẢO VẬT TÌNH YÊU',
    micro: 'A PROMISE SEALED FOREVER',
  },
  {
    pMin: 0.52,
    pMax: 0.66,
    chapter: 'ACT V · BỨC THƯ HẠNH PHÚC',
    title: 'DRAWN FROM THE HEART',
    sub: 'NHỮNG LỜI YÊU THƯƠNG GỬI ĐẾN BẠN',
    micro: 'AN INVITATION TO FOREVER',
  },
  {
    pMin: 0.66,
    pMax: 0.76,
    chapter: 'ACT VI · MỞ DẢI LỤA HỒNG',
    title: 'A KNOT RELEASED WITH GRACE',
    sub: 'DẢI RUYBĂNG BUỘC CHẶT HẸN ƯỚC',
    micro: 'TWO SOULS, ONE DESTINY',
  },
  {
    pMin: 0.76,
    pMax: 0.92,
    chapter: 'ACT VII · MỞ TỪNG TRANG THƠ',
    title: 'EVERY FOLD HOLDS A STORY',
    sub: 'LỄ THÀNH HÔN THIÊN ĐỨC & PHƯƠNG ANH',
    micro: 'CHIA SẺ KHOẢNH KHẮC THIÊNG LIÊNG',
  },
  {
    pMin: 0.92,
    pMax: 1.00,
    chapter: 'ACT VIII · TRỌN ĐỜI BÊN NHAU',
    title: 'THIÊN ĐỨC × PHƯƠNG ANH',
    sub: 'CHỦ NHẬT, 20 THÁNG 12, 2026',
    micro: 'THE GARDEN WEDDING · TP. HỒ CHÍ MINH',
  },
];

/**
 * Deterministically unscramble from oldText to newText based on transition progress t in [0, 1]
 */
export function unscrambleTransition(fromText, toText, t) {
  t = Math.max(0, Math.min(1, t));

  if (t <= 0) return fromText;
  if (t >= 1) return toText;

  const maxLen = Math.max(fromText.length, toText.length);
  let result = '';

  for (let i = 0; i < maxLen; i++) {
    const fromChar = fromText[i] || ' ';
    const toChar = toText[i] || ' ';

    if (toChar === ' ' && fromChar === ' ') {
      result += ' ';
      continue;
    }

    // Normalized reveal window for this character
    const charStart = (i / maxLen) * 0.45;
    const charEnd = charStart + 0.45;

    if (t < charStart) {
      result += fromChar;
    } else if (t >= charEnd) {
      result += toChar;
    } else {
      // Transitional decoding step
      const localT = (t - charStart) / (charEnd - charStart);
      const step = Math.floor(localT * 6);
      const seed = hashChar(i, toChar.charCodeAt(0) || 65, step);
      result += EDITORIAL_GLYPHS[seed % EDITORIAL_GLYPHS.length];
    }
  }

  return result;
}

/**
 * Get active chapter data and transition values based on progress p in [0, 1]
 */
export function getChapterState(p, envelopeOpened = false) {
  p = Math.max(0, Math.min(1, p));

  let currentIdx = 0;
  if (!envelopeOpened && p >= 0.48) {
    currentIdx = 3; // THE SEAL checkpoint
  } else {
    for (let i = 0; i < CHAPTER_TIMELINE.length; i++) {
      if (i === 3 && envelopeOpened) continue; // Skip THE SEAL prompt once opened
      if (p >= CHAPTER_TIMELINE[i].pMin && (p < CHAPTER_TIMELINE[i].pMax || i === CHAPTER_TIMELINE.length - 1)) {
        currentIdx = i;
        break;
      }
    }
  }

  const cur = CHAPTER_TIMELINE[currentIdx];
  const span = cur.pMax - cur.pMin;
  const localProgress = span > 0 ? (p - cur.pMin) / span : 1.0;

  // Transition window at the start of each chapter (first 25% of the chapter range)
  const transT = Math.min(1.0, localProgress / 0.25);
  const prev = CHAPTER_TIMELINE[Math.max(0, currentIdx - 1)];

  return {
    chapterIndex: currentIdx,
    chapter: cur.chapter,
    title: unscrambleTransition(prev.title, cur.title, transT),
    sub: unscrambleTransition(prev.sub, cur.sub, transT),
    micro: unscrambleTransition(prev.micro, cur.micro, transT),
    isResolved: transT >= 1.0,
  };
}
