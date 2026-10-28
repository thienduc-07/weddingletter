import { spawn } from 'node:child_process';
import fs from 'node:fs';

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9256;

  const proc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=/tmp/chrome-test-profile-${Date.now()}`,
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

  // Test 2: Shadow removal verification
  console.log('\n[TEST 2] Verifying All Shadows are Deleted...');
  const shadowCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      shadowMapDisabled: sc.renderer.shadowMap.enabled === false,
      keyLightNoShadow: !sc.keyLight.castShadow,
      noTableContactShadow: !sc.tableContactShadow,
      cssShadowHidden: window.getComputedStyle(document.querySelector('.envelope-floor-shadow'))?.display === 'none'
    };
  })()`);
  console.log('Shadow Removal Check:', shadowCheck.result?.value);

  // Test 3: Mathematical evaluation of getSwayTransform across sample points
  console.log('\n[TEST 3] Evaluating Scroll Draft Serpentine Trajectory...');
  const trajectoryCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    const apex0 = sc.getSwayTransform(0.12); // Apex 0 (top-left)
    const sweep1 = sc.getSwayTransform(0.38); // Sweep 1 (far right)
    const sweep2 = sc.getSwayTransform(0.62); // Sweep 2 (left under seal)
    const sweep3 = sc.getSwayTransform(0.82); // Sweep 3 (right across flowers)
    const sweep4 = sc.getSwayTransform(1.00); // Sweep 4 (land at table y = -0.24)

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
      landsCleanlyOnTable: Math.abs(sweep4.x) < 0.001 && Math.abs(sweep4.y - (-0.24)) < 0.001 && Math.abs(sweep4.rotZ) < 0.001
    };
  })()`);
  console.log('Serpentine Sway Trajectory Check:', JSON.stringify(trajectoryCheck.result?.value, null, 2));

  // Test 4: Visual inspection and screenshot of each scroll draft sway phase
  console.log('\n[TEST 4] Capturing 4 Scroll Draft Sweeps with Background Step Descent...');

  // Sweep 1: p = 0.40 (u ≈ 0.28) Far left to far right across the screen
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.envelopeOpened = false;
    sc.scrollProgress = 0.40;
    sc.targetScrollProgress = 0.40;
    sc.applyChoreography(0.40);
  })()`);
  await captureState('sway_01_sweep1_left_to_right.png', 'Đường vẽ 1: Quét từ mép trái sang mép phải (p=0.40), background hạ nấc 1');

  // Sweep 2: p = 0.43 (u ≈ 0.50) Far right to left under wax seal
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.scrollProgress = 0.43;
    sc.targetScrollProgress = 0.43;
    sc.applyChoreography(0.43);
  })()`);
  await captureState('sway_02_sweep2_right_to_left.png', 'Đường vẽ 2: Vòng từ mép phải quét chéo xuống mép trái (p=0.43), background hạ nấc 2');

  // Sweep 3: p = 0.47 (u ≈ 0.78) Left to right across flower line
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.scrollProgress = 0.47;
    sc.targetScrollProgress = 0.47;
    sc.applyChoreography(0.47);
  })()`);
  await captureState('sway_03_sweep3_across_flowers.png', 'Đường vẽ 3: Vòng từ mép trái quét chéo sang dải hoa bàn tiệc (p=0.47), background hạ nấc 3');

  // Sweep 4 & Landing: p = 0.50 Settled at rest on table
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.scrollProgress = 0.50;
    sc.targetScrollProgress = 0.50;
    sc.applyChoreography(0.50);
    sc.updateSealTriggerPosition();
  })()`);
  await captureState('sway_04_settled_at_rest.png', 'Đường vẽ 4: Trượt vào tâm đáp xuống mặt bàn tiệc (p=0.50), sẵn sàng ấn giữ');

  // Test 5: Verify Scroll Draft bidirectional control (scroll back reverses path)
  console.log('\n[TEST 5] Testing Scroll Draft bidirectional reverse control...');
  const reverseCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    sc.applyChoreography(0.43); // mid sweep 2
    const posForward = { x: sc.stationeryGroup.position.x, y: sc.stationeryGroup.position.y };

    sc.applyChoreography(0.50); // land
    sc.applyChoreography(0.43); // reverse back
    const posReverse = { x: sc.stationeryGroup.position.x, y: sc.stationeryGroup.position.y };

    return {
      posForward,
      posReverse,
      isReversible: Math.abs(posForward.x - posReverse.x) < 0.001 && Math.abs(posForward.y - posReverse.y) < 0.001
    };
  })()`);
  console.log('Scroll Draft Reversibility Check:', reverseCheck.result?.value);

  // Test 6: Verify Wax Seal face is strictly facing forward and zero yaw spinning during sway
  console.log('\n[TEST 6] Verifying Wax Seal face orientation and zero yaw spinning during sway...');
  const sealFaceCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    const points = [0.36, 0.40, 0.43, 0.47, 0.50];
    const results = points.map(p => {
      sc.applyChoreography(p);
      return {
        p,
        envRotY: sc.envelope.group.rotation.y,
        stationeryRotY: sc.stationeryGroup.rotation.y,
        waxSealFacingForward: Math.abs(sc.envelope.group.rotation.y - Math.PI) < 0.001,
        zeroYawSpinning: Math.abs(sc.stationeryGroup.rotation.y) < 0.001,
        bgPanRatio: window.ambientBackground ? window.ambientBackground.targetPanRatio : null
      };
    });

    return {
      allFacingForward: results.every(r => r.waxSealFacingForward),
      allZeroYaw: results.every(r => r.zeroYawSpinning),
      backgroundDescending: results[results.length - 1].bgPanRatio > results[0].bgPanRatio,
      results
    };
  })()`);
  console.log('Wax Seal Face & Zero Yaw Check:', JSON.stringify(sealFaceCheck.result?.value, null, 2));

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
