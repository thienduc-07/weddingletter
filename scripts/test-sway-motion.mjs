import { spawn } from 'node:child_process';
import fs from 'node:fs';

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9256;

  const proc = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/chrome-test-profile-sway',
    '--no-first-run',
    '--window-size=1440,900',
    'http://localhost:4500/'
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 15; attempt++) {
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
    console.log(`\n--- Capturing: ${description} (${filename}) ---`);
    await evaluate(`
      if (window.sceneController) {
        window.sceneController.renderer.render(window.sceneController.scene, window.sceneController.camera);
      }
    `);
    await new Promise((r) => setTimeout(r, 150));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result?.data) {
      fs.writeFileSync(filename, Buffer.from(shot.result.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1000));
  await evaluate(`(() => {
    const v = document.getElementById('romantic-page-veil');
    if (v) v.remove();
  })()`);

  console.log('\n======================================================');
  console.log('STARTING SWAY MOTION & ROTATION CONTINUITY TEST SUITE');
  console.log('======================================================');

  // Test 1: Verify Phase 2 -> Phase 3 Rotation Continuity (Zero frame right tilt jump)
  console.log('\n[TEST 1] Testing Phase 2 to Phase 3 transition continuity...');
  const continuityCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    // Test exact boundary at p = 0.36
    sc.applyChoreography(0.35999);
    const rotPhase2 = {
      x: sc.stationeryGroup.rotation.x,
      y: sc.stationeryGroup.rotation.y % (Math.PI * 2),
      z: sc.stationeryGroup.rotation.z
    };

    sc.applyChoreography(0.36001);
    const rotPhase3 = {
      x: sc.stationeryGroup.rotation.x,
      y: sc.stationeryGroup.rotation.y,
      z: sc.stationeryGroup.rotation.z
    };

    const deltaX = Math.abs(rotPhase3.x - rotPhase2.x);
    const deltaZ = Math.abs(rotPhase3.z - rotPhase2.z);

    return {
      rotPhase2,
      rotPhase3,
      deltaX,
      deltaZ,
      isContinuous: deltaX < 0.01 && deltaZ < 0.01
    };
  })()`);
  console.log('Phase 2 -> Phase 3 Continuity:', continuityCheck.result?.value);

  // Test 2: Mathematical evaluation of getSwayTransform across sample points
  console.log('\n[TEST 2] Evaluating 4-Stage Sway Trajectory...');
  const trajectoryCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    const apex0 = sc.getSwayTransform(0.12); // Apex 0 (top-left)
    const sweep1 = sc.getSwayTransform(0.38); // Sweep 1 (far right)
    const sweep2 = sc.getSwayTransform(0.62); // Sweep 2 (left under seal)
    const sweep3 = sc.getSwayTransform(0.82); // Sweep 3 (right across flowers)
    const sweep4 = sc.getSwayTransform(1.00); // Sweep 4 (land at rest)

    return {
      apex0_topLeft: apex0,
      sweep1_farRight: sweep1,
      sweep2_leftUnderSeal: sweep2,
      sweep3_rightFlowers: sweep3,
      sweep4_restPosition: sweep4,
      wideAmplitude: apex0.x < -2.0 && sweep1.x > 2.0 && sweep2.x < -1.5 && sweep3.x > 1.5,
      backgroundDescendsMonotonically:
        sweep1.bgDescent > apex0.bgDescent &&
        sweep2.bgDescent > sweep1.bgDescent &&
        sweep3.bgDescent > sweep2.bgDescent &&
        sweep4.bgDescent >= sweep3.bgDescent,
      stopsCleanlyAtZero: sweep4.x === 0 && sweep4.y === 0 && sweep4.rotZ === 0 && sweep4.rotX === 0
    };
  })()`);
  console.log('Serpentine Sway Trajectory Check:', JSON.stringify(trajectoryCheck.result?.value, null, 2));

  // Test 3: Visual inspection and screenshot of each sway phase
  console.log('\n[TEST 3] Capturing 4 Serpentine Sweeps with Background Step Descent...');

  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.envelopeOpened = false;
    sc.scrollProgress = 0.50;
    sc.targetScrollProgress = 0.50;
    sc.applyChoreography(0.50);
  })()`);

  // Sweep 1: Far left to far right across the screen
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.26); // Mid Sweep 1 crossing screen
    sc.swayGroup.position.set(sway.x, sway.y, sway.z || 0);
    sc.swayGroup.rotation.set(sway.rotX, sway.rotY || 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
    if (window.ambientBackground) {
      window.ambientBackground.setSwayDescent(sway.bgDescent, sway.x / 3.5);
      window.ambientBackground.swayDescent = sway.bgDescent;
      window.ambientBackground.render();
    }
  })()`);
  await captureState('sway_01_sweep1_left_to_right.png', 'Đường vẽ 1: Quét từ mép trái sang mép phải, background hạ nấc 1');

  // Sweep 2: Far right to left under wax seal
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.50); // Mid Sweep 2 passing under wax seal
    sc.swayGroup.position.set(sway.x, sway.y, sway.z || 0);
    sc.swayGroup.rotation.set(sway.rotX, sway.rotY || 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
    if (window.ambientBackground) {
      window.ambientBackground.setSwayDescent(sway.bgDescent, sway.x / 3.5);
      window.ambientBackground.swayDescent = sway.bgDescent;
      window.ambientBackground.render();
    }
  })()`);
  await captureState('sway_02_sweep2_right_to_left.png', 'Đường vẽ 2: Vòng từ mép phải quét chéo xuống mép trái dưới sáp nến, background hạ nấc 2');

  // Sweep 3: Left to right across flower line
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.72); // Mid Sweep 3 crossing table flowers
    sc.swayGroup.position.set(sway.x, sway.y, sway.z || 0);
    sc.swayGroup.rotation.set(sway.rotX, sway.rotY || 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
    if (window.ambientBackground) {
      window.ambientBackground.setSwayDescent(sway.bgDescent, sway.x / 3.5);
      window.ambientBackground.swayDescent = sway.bgDescent;
      window.ambientBackground.render();
    }
  })()`);
  await captureState('sway_03_sweep3_across_flowers.png', 'Đường vẽ 3: Vòng từ mép trái quét chéo sang dải hoa bàn tiệc, background hạ nấc 3');

  // Sweep 4 & Landing: Slide right to center and settle at rest
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.swayFinished = true;
    sc.isSwaying = false;
    sc.swayGroup.position.set(0, 0, 0);
    sc.swayGroup.rotation.set(0, 0, 0);
    sc.tableContactShadow.position.x = 0;
    sc.state = 'SETTLED';
    if (sc.holdTrigger) sc.holdTrigger.classList.add('visible');
    sc.updateSealTriggerPosition();
    if (window.ambientBackground) {
      window.ambientBackground.setSwayDescent(1.0, 0);
      window.ambientBackground.swayDescent = 1.0;
      window.ambientBackground.render();
    }
  })()`);
  await captureState('sway_04_settled_at_rest.png', 'Đường vẽ 4: Trượt vào tâm đáp xuống mặt bàn tiệc, sẵn sàng ấn giữ');

  // Test 4: Live time-based sway execution
  console.log('\n[TEST 4] Testing live time-based sway execution...');
  const liveSwayResult = await evaluate(`(async () => {
    const sc = window.sceneController;
    // Reset to start of Phase 4
    sc.swayFinished = false;
    sc.isSwaying = false;
    sc.swayStartTime = null;
    sc.applyChoreography(0.50, performance.now());

    const startState = sc.state;
    const startSwaying = sc.isSwaying;

    // Simulate 1.1s of elapsed time (midway through sway)
    const midTime = sc.swayStartTime + 1100;
    sc.applyChoreography(0.50, midTime);
    const midState = sc.state;
    const midPosX = sc.swayGroup.position.x;
    const midRotZ = sc.swayGroup.rotation.z;

    // Simulate 2.3s of elapsed time (past swayDuration = 2200ms)
    const endTime = sc.swayStartTime + 2300;
    sc.applyChoreography(0.50, endTime);
    const endState = sc.state;
    const endFinished = sc.swayFinished;
    const endPosX = sc.swayGroup.position.x;
    const endRotZ = sc.swayGroup.rotation.z;
    const holdVisible = sc.holdTrigger?.classList.contains('visible');

    return {
      startState,
      startSwaying,
      midState,
      midPosX,
      midRotZ,
      endState,
      endFinished,
      endPosX,
      endRotZ,
      holdVisible,
    };
  })()`);
  console.log('Live Sway Execution Result:', liveSwayResult.result?.value);

  console.log('\n======================================================');
  console.log(`CONSOLE ERRORS COUNT: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  } else {
    console.log('SUCCESS: Zero runtime console errors in sway test!');
  }
  console.log('======================================================\n');

  ws.close();
  proc.kill();
  setTimeout(() => process.exit(0), 200);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
