# THE UNFOLDING LETTER — V3.0 PHYSICAL INTEGRITY & STORYTELLING 📜🎀🌿
### Cinematic 3D Wedding Invitation · Continuous Scene Transitions · Interactive Envelope & Ribbon

> *“An exquisite blush-pink envelope descends from the sunny skies of an Italian garden estate, tumbling and banking in continuous 3D multi-axis flight before decelerating onto a candlelit banquet table. You press and hold the golden wax seal to unseal it. The flap swings open, revealing a satin-ribbon-tied parchment love letter. You scroll down to draw out the letter, watch the satin bow untie and slide smoothly away to the right, and witness the bespoke luxury Wedding Invitation Card emerge into the spotlight with its gilded edges and handcrafted 3D rose secured with washi tape.”*

**The Unfolding Letter (V3.0)** is an award-calibre interactive 3D wedding stationery experience designed for **THIÊN ĐỨC & PHƯƠNG ANH** (*The Garden Wedding, 20.12.2026*).

---

## 💎 Key V3.0 Architectural Refinements & Solutions

### 1. Dynamic Continuous Outdoor Wedding Environment
- **Continuous Camera Descent & Transition**: As the envelope enters from above ($p = 0.00 \to 0.36$), the background view looks high up at the golden Tuscan sunset sky, distant rolling hills, and villa. As the stationery descends ($p = 0.36 \to 0.54$), the camera smoothly tracks downward through olive groves and rose pergolas to the rustic banquet table terrace.
- **Table Touchdown & Optical Bokeh**: Lands directly on the table runner. When stationery settles and unfolds ($p \ge 0.54$), the background transitions into a soft optical bokeh with warm candlelight pools, ensuring the 3D stationery commands razor-sharp focus.
- **100% Reversible**: Scrolling back up smoothly reverses the camera pan up to the sky.

### 2. Solid, Slim & Seamless 3D Envelope (Dẹt Dẹt)
- **Ultra-Slim Profile**: Envelope depth reduced from 8cm to $0.028$ (2.8cm in 3D units), matching genuine luxury cardstock.
- **Seamless 4-Sided Enclosure**: Full-height continuous casing seals Left, Right, and Bottom edges with die-cut rounded corners ($r = 0.10$). The top edge features an integrated top-crease fold on the flap, sealing the top opening completely when closed. Zero gaps, zero open wedges.
- **Strict Sealed Visibility**: Card and scroll remain completely invisible while sealed ($p < 0.54$). Zero clipping or parts poking through during flight, spin, or landing.

### 3. Dedicated 3D Letter Scroll & Snug Ribbon Bow
- **Authentic Paper Roll**: Rolled parchment cylinder ($R = 0.16, W = 2.30$) with dedicated outer texture displaying a gold monogram crest (`Đ · A`), deckled borders, and **zero inverted ceremony date text**.
- **Snug Ribbon Attachment**: Blush satin ribbon bow is wrapped directly around the waist of the scroll cylinder ($y = 0$).
- **Two-Stage Extraction & Slide-Off**:
  - Phase 5 ($p = 0.54 \to 0.70$): Scroll is drawn upward out of the envelope with ribbon bow **firmly tied**.
  - Phase 6 ($p = 0.70 \to 0.82$): The ribbon knot loosens and the ribbon slides smoothly off to the right ($+X$, $x = 0 \to 4.6$) with trailing fluttering tails, without vanishing abruptly.

### 4. Bespoke Wedding Card & AAA 3D Volumetric Rose with Washi Tape
- **Tấm Thiệp Cưới Cao Cấp**: Dedicated paperboard ($W = 2.35, H = 3.48$) with gilded champagne gold edges, double hairline foil framing, royal wreath monogram crest, and crystal-clear Vietnamese ceremony typography.
- **True 3D Volumetric Rose**: Layered 3D curved petals with real thickness and bevels, inner burgundy bud swirl, secondary rosebud with green sepals, and 3D creased sage green leaves.
- **Translucent Japanese Washi Tape**: Semi-transparent fibrous masking tape arched realistically over the 3D stem while adhering flat to the card surface, casting subtle shadows and catching highlights from every 3D angle.

### 5. Claude-Code Minimal Tech Editorial HUD
- All bulky pill boxes, heavy borders, and background card frames removed from Scramble text and the interaction hint.
- Clean modern developer-grade aesthetic: pure monospaced and sans-serif typography (`Space Mono` / `Montserrat`), subtle pulsing gold indicator dot, and crisp high-contrast legibility.

### 8. Hidden Native Scrollbar
- Scrollbar is completely hidden across all modern browsers:
  ```css
  html, body {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  html::-webkit-scrollbar, body::-webkit-scrollbar {
    display: none;
  }
  ```
- Native scrollwheel, trackpad, touch swipe, and arrow keys function smoothly and continuously.

---

## 🌟 Single Source of Truth (`src/data/wedding-content.js`)

All couple names, wedding schedule, venue details, invitation text, and theme colors are managed centrally:
- **Couple Names**: `Thiên Đức & Phương Anh`
- **Monogram**: `Đ · A`
- **Date & Time**: `15:30 · Chủ Nhật, 20 Tháng 12, 2026`
- **Venue**: `The Garden Wedding`, `123 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh`
- **Invitation Copy**: `TRÂN TRỌNG KÍNH MỜI`, `Lễ Thành Hôn`, `WEDDING INVITATION`

---

## 🚀 Verification & Automated Testing Suite

Run the automated Chrome DevTools Protocol verification suite:
```bash
node scripts/test-v2-states.mjs
```

Validated test suite covers 10 critical states:
1. `v2_01_arriving.png`: Aerial entry from upper right with European ballroom background.
2. `v2_02_scroll_draft_spin.png`: 3D multi-axis barrel roll and spatial perspective banking.
3. `v2_03_centered.png`: Docked upright at $(0,0,0)$ with sealed gold monogram wax seal.
4. `v2_04_holding_progress.png`: Tactile hold with golden circular meter and seal depression.
5. `v2_05_envelope_open_peek.png`: Broken seal, flap open $155^\circ$, ribbon bow & rolled paper peek 8%.
6. `v2_06_extracting_letter.png`: Scroll pulls letter up, ribbon unties, text visible on curved paper.
7. `v2_07_unfolding_letter.png`: Letter coils unroll downward into 3D space.
8. `v2_08_letter_revealed.png`: Completely flat planar invitation, perfectly framed with generous margins.
9. `v2_09_reverse_scroll_open.png`: Reverse scroll rewinds letter back into open envelope.
10. `v2_10_mobile_revealed.png`: Responsive framing on mobile ($390 \times 844$) with zero clipping.
11. **Console health**: **0 runtime errors**.
# weddingletter
# weddingletter
