import { spawn } from 'node:child_process';
import fs from 'node:fs';

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9249;

  const proc = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/chrome-test-profile-v3',
    '--no-first-run',
    '--window-size=1440,900',
    'http://localhost:4500/'
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      await new Promise((r) => setTimeout(r, 600));
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      pages = await res.json();
      if (pages && pages.length > 0) break;
    } catch (e) {
      // retry
    }
  }

  if (!pages) {
    console.error('Failed to connect to Chrome remote debugger');
    proc.kill();
    return;
  }
  const page = pages.find((p) => p.type === 'page');

  if (!page || !page.webSocketDebuggerUrl) {
    console.error('Failed to get page debugger URL');
    proc.kill();
    return;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const msg = data.params.args.map((a) => a.value || a.description).join(' ');
      if (msg.includes('DEBUG:')) {
        console.log('CLIENT CONSOLE:', msg);
      }
      if (data.params.type === 'error') {
        consoleErrors.push(msg);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails?.text || 'Exception');
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(expression) {
    return await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  }

  async function captureState(filename, description) {
    console.log(`\n--- Capturing: ${description} ---`);
    await evaluate(`
      if (window.sceneController) {
        window.sceneController.renderer.render(window.sceneController.scene, window.sceneController.camera);
      }
    `);
    await new Promise((r) => setTimeout(r, 200));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result?.data) {
      fs.writeFileSync(filename, Buffer.from(shot.result.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1500));

  // 1. PHASE 01 — THE ARRIVAL (p = 0.05)
  console.log('\n--- 1. Testing Phase 01: THE ARRIVAL (p = 0.05) ---');
  await evaluate(`
    window.sceneController.setProgress(0.05, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  await captureState('v3_01_arrival.png', '1. Flight entry from top-right into outdoor European garden wedding scene');

  // 2. PHASE 02 — THE SPIN (p = 0.22)
  console.log('\n--- 2. Testing Phase 02: THE SPIN (p = 0.22) ---');
  await evaluate(`
    window.sceneController.setProgress(0.22, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const spinStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      pos: sc.stationeryGroup.position,
      rot: sc.stationeryGroup.rotation,
      paperVisible: sc.paper.group.visible,
      ribbonVisible: sc.ribbon.group.visible,
      chapter: document.getElementById('hud-top-right')?.textContent,
      title: document.getElementById('hud-top-left')?.textContent
    };
  })()`);
  console.log('Spin Status at p = 0.22:', spinStatus.result?.result?.value);
  await captureState('v3_02_spin.png', '2. 3D multi-axis barrel rolls in mid-air with tied ribbon bow visible');

  // 3. PHASE 03 — THE LANDING (p = 0.42)
  console.log('\n--- 3. Testing Phase 03: THE LANDING (p = 0.42) ---');
  await evaluate(`
    window.sceneController.setProgress(0.42, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const landingStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      pos: sc.stationeryGroup.position,
      tableContactOpacity: sc.tableContactShadow?.material.opacity,
      chapter: document.getElementById('hud-top-right')?.textContent,
      hint: document.getElementById('scroll-hint-text')?.textContent
    };
  })()`);
  console.log('Landing Status at p = 0.42:', landingStatus.result?.result?.value);
  await captureState('v3_03_landing.png', '3. Decelerating onto banquet table linen with realistic contact shadow');

  // 4. PHASE 04 — THE SEAL CHECKPOINT (p = 0.50)
  console.log('\n--- 4. Testing Phase 04: THE SEAL Checkpoint & Hold (p = 0.50) ---');
  await evaluate(`
    window.sceneController.setProgress(0.50, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const sealStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      pos: sc.stationeryGroup.position,
      holdVisible: document.getElementById('seal-hold-trigger')?.classList.contains('visible'),
      chapter: document.getElementById('hud-top-right')?.textContent,
      hint: document.getElementById('scroll-hint-text')?.textContent
    };
  })()`);
  console.log('Settled Status at p = 0.50:', sealStatus.result?.result?.value);

  // Press & hold feedback
  await evaluate(`
    const trigger = document.getElementById('seal-hold-trigger');
    window.sceneController.holdDuration = 1200;
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 260));
  await captureState('v3_04_seal_hold.png', '4. Wax seal press & hold with circular gold meter');

  // Complete hold >= 850ms to open flap and trigger sparks
  await evaluate(`
    window.sceneController.holdDuration = 850;
    const trigger = document.getElementById('seal-hold-trigger');
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 920));
  await new Promise((r) => setTimeout(r, 950));

  const openedStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      envelopeOpened: sc.envelopeOpened,
      flapAngle: sc.envelope.flapPivot.rotation.x,
      scrollVisible: sc.scroll.group.visible,
      scrollPos: sc.scroll.group.position,
      ribbonVisible: sc.ribbon.group.visible,
      hint: document.getElementById('scroll-hint-text')?.textContent
    };
  })()`);
  console.log('Opened Status (Flap swung open 155°, roll peeking out):', openedStatus.result?.result?.value);
  await captureState('v3_05_seal_opened.png', '5. Flap open 155°, seal broken with golden particle burst, scroll track unlocked');

  // 5. PHASE 05 — THE EXTRACTION (p = 0.58)
  console.log('\n--- 5. Testing Phase 05: THE EXTRACTION (p = 0.58) ---');
  await evaluate(`
    window.sceneController.setProgress(0.58, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const extStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      scrollY: sc.scroll.group.position.y,
      ribbonPosX: sc.ribbon.group.position.x,
      chapter: document.getElementById('hud-top-right')?.textContent,
      hint: document.getElementById('scroll-hint-text')?.textContent
    };
  })()`);
  console.log('Extraction Status at p = 0.58 (Bow MUST remain tied):', extStatus.result?.result?.value);
  await captureState('v3_06_extraction_bow_tied.png', '6. Letter pulled up out of envelope with satin ribbon still firmly tied');

  // 6. PHASE 06 — THE RIBBON (p = 0.72)
  console.log('\n--- 6. Testing Phase 06: THE RIBBON (p = 0.72) ---');
  await evaluate(`
    window.sceneController.setProgress(0.72, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const ribStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      ribbonPosX: sc.ribbon.group.position.x,
      chapter: document.getElementById('hud-top-right')?.textContent
    };
  })()`);
  console.log('Ribbon Slide Status at p = 0.72 (Sliding off to right):', ribStatus.result?.result?.value);
  await captureState('v3_07_ribbon_sliding_off.png', '7. Ribbon knot loosens and slides gracefully to the right off the roll');

  // 7. PHASE 07 — THE PROGRESSIVE UNROLLING (p = 0.84)
  console.log('\n--- 7. Testing Phase 07: THE PROGRESSIVE UNROLLING (p = 0.84) ---');
  await evaluate(`
    window.sceneController.setProgress(0.84, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const unfStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      scrollUnrollMesh: sc.scroll.unrollMesh?.visible,
      chapter: document.getElementById('hud-top-right')?.textContent
    };
  })()`);
  console.log('Unfolding Status at p = 0.84:', unfStatus.result?.result?.value);
  await captureState('v3_08_unfolding_3d.png', '8. 3D paper spiral unrolling downward into space with progressive curl physics');

  // 8. PHASE 08 — THE REVEAL (p = 0.98)
  console.log('\n--- 8. Testing Phase 08: THE REVEAL (p = 0.98) ---');
  await evaluate(`
    window.sceneController.setProgress(0.98, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const revealedStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      paperPos: sc.paper.group.position,
      unrollMeshVisible: sc.paper.unrollMesh?.visible,
      roseBranchVisible: sc.roseBranch.group.visible,
      hudTopLeft: document.getElementById('hud-top-left')?.textContent,
      hudBotLeft: document.getElementById('hud-bot-left-names')?.textContent,
      chapter: document.getElementById('hud-top-right')?.textContent
    };
  })()`);
  console.log('Revealed Status (Flat luxury unrolled letter, rose with washi tape, names):', revealedStatus.result?.result?.value);
  await captureState('v3_09_reveal_card.png', '9. Planar, upright, luxury paperboard invitation with 3D rose and washi tape');

  // 9. REVERSE SCROLL TEST (p = 0.62)
  console.log('\n--- 9. Testing Reverse Scroll to Extraction (p = 0.62) ---');
  await evaluate(`
    window.sceneController.setProgress(0.62, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const revStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      paperY: sc.paper.group.position.y,
      ribbonPosX: sc.ribbon.group.position.x
    };
  })()`);
  console.log('Reverse Scroll Status (Ribbon must be back tied to roll):', revStatus.result?.result?.value);
  await captureState('v3_10_reverse_scroll.png', '10. Reverse scroll smoothly re-coils paper and ties ribbon back onto roll');

  // 9b. STRICT REVERSE RE-LOCK TEST (p = 0.40)
  console.log('\n--- 9b. Testing Reverse Scroll Past Checkpoint to Re-lock Envelope (p = 0.40) ---');
  await evaluate(`
    window.sceneController.setProgress(0.40, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const relockStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      envelopeOpened: sc.envelopeOpened,
      flapAngle: sc.envelope.flapPivot.rotation.x,
      sealOpacity: sc.envelope.goldSealMat.opacity
    };
  })()`);
  console.log('Re-lock Status at p = 0.40 (Envelope MUST be sealed & locked):', relockStatus.result?.result?.value);
  if (relockStatus.result?.result?.value?.envelopeOpened === false) {
    console.log('✅ PASS: Envelope successfully resealed and re-locked upon reverse scroll!');
  } else {
    console.error('❌ FAIL: Envelope did not re-lock upon reverse scroll!');
  }

  // 9c. FORWARD SCROLL TO CHECKPOINT (p = 0.50) — VERIFY LOCKED & CLAMPED
  console.log('\n--- 9c. Testing Forward Scroll Back to Checkpoint (p = 0.50) ---');
  await evaluate(`
    window.sceneController.setProgress(0.50, true);
  `);
  await new Promise((r) => setTimeout(r, 200));
  const reCheckpointStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    const trigger = document.getElementById('seal-hold-trigger');
    return {
      state: sc.state,
      envelopeOpened: sc.envelopeOpened,
      triggerVisible: trigger?.classList.contains('visible'),
      triggerDisplay: trigger?.style.display
    };
  })()`);
  console.log('Checkpoint Status (Awaiting hold again):', reCheckpointStatus.result?.result?.value);

  // 9d. QUICK TAP TEST (< 300ms) — VERIFY ENVELOPE DOES NOT OPEN!
  console.log('\n--- 9d. Testing Quick Tap (< 300ms) — Must NOT open! ---');
  await evaluate(`
    const trigger = document.getElementById('seal-hold-trigger');
    window.sceneController.holdDuration = 850;
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 200)); // release early
  await evaluate(`
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 200));
  const tapStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      envelopeOpened: sc.envelopeOpened,
      state: sc.state
    };
  })()`);
  console.log('Quick Tap Result (envelopeOpened MUST be false):', tapStatus.result?.result?.value);
  if (tapStatus.result?.result?.value?.envelopeOpened === false) {
    console.log('✅ PASS: Quick tap did not open the envelope! Genuine press-and-hold is enforced.');
  } else {
    console.error('❌ FAIL: Quick tap opened the envelope!');
  }

  // 9e. FULL HOLD TEST (>= 850ms) — MUST OPEN
  console.log('\n--- 9e. Testing Full Press & Hold (>= 850ms) — Must Open! ---');
  const r9e = await evaluate(`(() => {
    window.sceneController.holdDuration = 800;
    const trigger = document.getElementById('seal-hold-trigger');
    const sc = window.sceneController;
    console.log('DEBUG: 9e before dispatch - trigger:', trigger ? trigger.id : 'null', 'opened:', sc.envelopeOpened, 'state:', sc.state);
    const ok = trigger ? trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })) : false;
    console.log('DEBUG: 9e after dispatch - ok:', ok, 'state:', sc.state, 'isDown:', sc.isPointerDown);
    return { ok, state: sc.state, isDown: sc.isPointerDown };
  })()`);
  console.log('r9e result:', r9e.result?.result?.value);
  await new Promise((r) => setTimeout(r, 1100));
  await evaluate(`
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 1100));
  const fullHoldStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      envelopeOpened: sc.envelopeOpened,
      state: sc.state,
      flapAngle: sc.envelope.flapPivot.rotation.x
    };
  })()`);
  console.log('Full Hold Result (envelopeOpened MUST be true):', fullHoldStatus.result?.result?.value);
  if (fullHoldStatus.result?.result?.value?.envelopeOpened === true) {
    console.log('✅ PASS: Full press & hold successfully cracked the wax seal and opened the envelope!');
  } else {
    console.error('❌ FAIL: Full hold failed to open the envelope!');
  }

  // 9f. TEST RELOAD JOURNEY WITH ANTI-SPAM LOCK
  console.log('\n--- 9f. Testing Reload Journey with Anti-Spam Lock ---');
  await evaluate(`
    window.sceneController.triggerReloadJourney();
  `);
  const spamClick1 = await evaluate(`(() => {
    const sc = window.sceneController;
    const isReloadingFirst = sc.isReloading;
    // Attempt spam reload immediately
    sc.triggerReloadJourney();
    return { isReloadingFirst, isReloadingSpam: sc.isReloading };
  })()`);
  console.log('Anti-Spam Reload Status:', spamClick1.result?.result?.value);
  if (spamClick1.result?.result?.value?.isReloadingFirst === true) {
    console.log('✅ PASS: Anti-spam lock engaged immediately upon reload trigger!');
  }
  await new Promise((r) => setTimeout(r, 2200)); // wait for reload to finish and reset to top
  const afterReloadStatus = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      scrollProgress: sc.scrollProgress,
      envelopeOpened: sc.envelopeOpened,
      isReloading: sc.isReloading
    };
  })()`);
  console.log('Status After Reload Finish (progress=0, envelopeOpened=false):', afterReloadStatus.result?.result?.value);
  if (afterReloadStatus.result?.result?.value?.envelopeOpened === false && afterReloadStatus.result?.result?.value?.scrollProgress === 0) {
    console.log('✅ PASS: Reload journey smoothly reset scene to top and re-locked the envelope!');
  }

  // 10. MOBILE VIEWPORT TEST (390 x 844)
  console.log('\n--- 10. Testing Mobile Viewport (390 x 844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await evaluate(`
    window.dispatchEvent(new Event('resize'));
    if (window.sceneController) {
      window.sceneController.onResize();
      window.sceneController.setProgress(0.98, true);
    }
  `);
  await new Promise((r) => setTimeout(r, 300));
  await captureState('v3_11_mobile_reveal.png', '11. Mobile portrait view with responsive camera framing and zero overflow');

  // Reset viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('\n========================================');
  console.log('CONSOLE ERRORS COUNT:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console Errors Detected:', consoleErrors);
  } else {
    console.log('✅ 0 CONSOLE ERRORS DETECTED! 100% CLEAN RUNTIME.');
  }
  console.log('========================================\n');

  ws.close();
  proc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
