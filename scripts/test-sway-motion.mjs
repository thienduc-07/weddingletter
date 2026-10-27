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
    const stageA = sc.getSwayTransform(0.15); // Peak A (left tilt)
    const stageB = sc.getSwayTransform(0.40); // Peak B (right tilt)
    const stageC = sc.getSwayTransform(0.63); // Oscillation C
    const stageD_mid = sc.getSwayTransform(0.85); // Slide left D
    const stageD_end = sc.getSwayTransform(1.0);  // Rest position

    return {
      stageA_peakLeft: stageA,
      stageB_peakRight: stageB,
      stageC_decay: stageC,
      stageD_slide: stageD_mid,
      stageD_finalRest: stageD_end,
      // In Three.js: positive rotZ tilts top to left, negative rotZ tilts top to right
      leftIsStrongest: stageA.rotZ > Math.abs(stageB.rotZ) && stageA.x < 0,
      rightIsSubtler: Math.abs(stageB.rotZ) < stageA.rotZ && stageB.x > 0,
      stopsCleanlyAtZero: stageD_end.x === 0 && stageD_end.y === 0 && stageD_end.rotZ === 0 && stageD_end.rotX === 0
    };
  })()`);
  console.log('Sway Trajectory Check:', trajectoryCheck.result?.value);

  // Test 3: Visual inspection and screenshot of each sway phase
  console.log('\n[TEST 3] Capturing 4 Sway Stages visual frames...');

  // Set p = 0.50 and manually drive sway u parameter for screenshot verification
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.envelopeOpened = false;
    sc.scrollProgress = 0.50;
    sc.targetScrollProgress = 0.50;
    sc.applyChoreography(0.50);
  })()`);

  // Stage A: Peak tilt left
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.15);
    sc.swayGroup.position.set(sway.x, sway.y, 0);
    sc.swayGroup.rotation.set(sway.rotX, 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
  })()`);
  await captureState('sway_01_stageA_tilt_left.png', 'Giai đoạn A: Nghiêng mạnh sang trái với biên độ lớn nhất');

  // Stage B: Tilt right with smaller amplitude
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.40);
    sc.swayGroup.position.set(sway.x, sway.y, 0);
    sc.swayGroup.rotation.set(sway.rotX, 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
  })()`);
  await captureState('sway_02_stageB_tilt_right.png', 'Giai đoạn B: Nghiêng sang phải với biên độ nhỏ hơn');

  // Stage C: Decaying oscillation
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.63);
    sc.swayGroup.position.set(sway.x, sway.y, 0);
    sc.swayGroup.rotation.set(sway.rotX, 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
  })()`);
  await captureState('sway_03_stageC_decay_oscillation.png', 'Giai đoạn C: Đung đưa giảm dần biên độ');

  // Stage D: Sliding left and landing
  await evaluate(`(() => {
    const sc = window.sceneController;
    const sway = sc.getSwayTransform(0.85);
    sc.swayGroup.position.set(sway.x, sway.y, 0);
    sc.swayGroup.rotation.set(sway.rotX, 0, sway.rotZ);
    sc.tableContactShadow.position.x = sway.x;
  })()`);
  await captureState('sway_04_stageD_slide_landing.png', 'Giai đoạn D: Từ bên phải trượt sang trái và đáp xuống');

  // Settle at Rest: Hold prompt displayed, zero displacement
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
  })()`);
  await captureState('sway_05_settled_at_rest.png', 'Dừng hẳn ổn định tại vị trí nghỉ, hiển thị ấn giữ con dấu sáp');

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
