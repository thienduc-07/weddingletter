import { spawn } from 'node:child_process';
import fs from 'node:fs';

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9255;

  const proc = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/chrome-test-profile-v4',
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
    await new Promise((r) => setTimeout(r, 200));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result?.data) {
      fs.writeFileSync(filename, Buffer.from(shot.result.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 1000));
  // Ensure initial romantic reveal veil is dismissed for automated inspection
  await evaluate(`(() => {
    const v = document.getElementById('romantic-page-veil');
    if (v) v.remove();
  })()`);

  console.log('\n======================================================');
  console.log('STARTING V4 VERIFICATION SUITE — LUXURY WEDDING 3D');
  console.log('======================================================');

  // A. Check for UI button removal and top-right overlap fix
  const uiCheck = await evaluate(`(() => {
    const reloadBtn = document.getElementById('btn-reload-journey');
    const reloadWrapper = document.querySelector('.reload-wrapper');
    const cornerTr = document.querySelector('.corner-tr');
    const cornerTrRect = cornerTr?.getBoundingClientRect();
    return {
      reloadBtnExists: !!reloadBtn,
      reloadWrapperExists: !!reloadWrapper,
      cornerTrRect: cornerTrRect ? { top: cornerTrRect.top, right: cornerTrRect.right, width: cornerTrRect.width } : null,
      romanticVeilExists: !!document.getElementById('romantic-page-veil'),
    };
  })()`);
  console.log('UI Check (Phần VI - Button removal & Corner TR):', uiCheck.result?.value);

  // B. State 1: Page Arrival (p = 0.05) — Front Cover with couple names, NO WAX SEAL!
  await evaluate(`window.sceneController.setProgress(0.05, true);`);
  await new Promise((r) => setTimeout(r, 200));
  const frontCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      envelopeRotY: sc.envelope.group.rotation.y,
      sealVisible: sc.envelope.sealGroup.visible,
      frontWidth: sc.envelope.frontWidth,
      backWidth: sc.envelope.width,
      isBackLarger: sc.envelope.width > sc.envelope.frontWidth,
    };
  })()`);
  console.log('Front Cover Check at p = 0.05 (Phần I & II):', frontCheck.result?.value);
  await captureState('v4_01_front_cover_arrival.png', 'Mặt trước phong bì với tên Thiên Đức & Phương Anh, KHÔNG có sáp');

  // C. State 2: Flight Spin (p = 0.25)
  await evaluate(`window.sceneController.setProgress(0.25, true);`);
  await new Promise((r) => setTimeout(r, 200));
  await captureState('v4_02_flight_spin.png', 'Phong bì bay lượn trên không trung');

  // D. State 3: Checkpoint Landing & Turn to Back Cover (p = 0.50) — Back Cover with Wax Seal!
  await evaluate(`window.sceneController.setProgress(0.50, true);`);
  await new Promise((r) => setTimeout(r, 250));
  const backCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    const sealPos = new THREE.Vector3();
    sc.envelope.getSealWorldPosition(sealPos);
    return {
      state: sc.state,
      envelopeRotY: sc.envelope.group.rotation.y,
      flapAngle: sc.envelope.flapPivot.rotation.x,
      sealWorldPos: sealPos,
      holdTriggerVisible: sc.holdTrigger?.classList.contains('visible'),
    };
  })()`);
  console.log('Back Cover Check at p = 0.50 (Phần I & II):', backCheck.result?.value);
  await captureState('v4_03_back_cover_seal_checkpoint.png', 'Mặt sau phong bì với sáp nến hoàng gia sẵn sàng ấn giữ mở');

  // E. State 4: Flap opening midway (holding seal triggered)
  await evaluate(`(() => {
    window.sceneController.state = 'OPENING_ENVELOPE';
    window.sceneController.openingProgress = 0.50;
    window.sceneController.envelope.setFlapAngle(0.50 * 2.7);
    window.sceneController.envelope.setSealOpacity(1.0 - 0.50 * 1.2);
    window.sceneController.scroll.group.visible = true;
    window.sceneController.scroll.group.position.set(0, 0.05, 0.025);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  await captureState('v4_04_flap_half_open.png', 'Nắp phong bì đang mở giữa chừng, cuộn thư hé lộ');

  // F. State 5: Extraction (p = 0.60) — Scroll slides up, ribbon bow tied securely
  await evaluate(`(() => {
    window.sceneController.envelopeOpened = true;
    window.sceneController.setProgress(0.60, true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  await captureState('v4_05_scroll_extracted.png', 'Cuộn thư trượt lên khỏi phong bì, nơ thắt chặt');

  // G. State 6: Ribbon Phase A — Strictly Horizontal Slide (p = 0.69, t ~ 0.30 in Phase 6)
  await evaluate(`(() => {
    window.sceneController.setProgress(0.69, true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const ribbonPhaseA = await evaluate(`(() => {
    const sc = window.sceneController;
    const ribbon = sc.ribbon;
    return {
      ribbonPosX: ribbon.group.position.x,
      ribbonPosY: ribbon.group.position.y,
      ribbonPosZ: ribbon.group.position.z,
      isStrictlyHorizontal: ribbon.group.position.y === 0,
      rollHalfWidth: ribbon.rollWidth / 2,
    };
  })()`);
  console.log('Ribbon Phase A (Horizontal Movement) Check at p = 0.69:', ribbonPhaseA.result?.value);
  await captureState('v4_06_ribbon_horizontal_slide.png', 'Nơ trượt ngang hoàn toàn dọc theo cuộn giấy, Y = 0');

  // H. State 7: Ribbon Phase B/C — Cleared Cylinder and Falling Diagonally (p = 0.74, t ~ 0.80 in Phase 6)
  await evaluate(`(() => {
    window.sceneController.setProgress(0.74, true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const ribbonPhaseC = await evaluate(`(() => {
    const sc = window.sceneController;
    const ribbon = sc.ribbon;
    const rollHalfWidth = ribbon.rollWidth / 2;
    return {
      ribbonPosX: ribbon.group.position.x,
      ribbonPosY: ribbon.group.position.y,
      isBeyondRollEdge: ribbon.group.position.x > rollHalfWidth,
      noRollIntersection: ribbon.group.position.x > rollHalfWidth && ribbon.group.position.y < 0,
    };
  })()`);
  console.log('Ribbon Phase C (Diagonal Fall after Clearing Roll) Check at p = 0.74:', ribbonPhaseC.result?.value);
  await captureState('v4_07_ribbon_diagonal_fall.png', 'Nơ rơi chéo sau khi đã trượt hoàn toàn ra khỏi mép cuộn giấy, không xuyên giấy');

  // I. State 8: Progressive Unrolling (p = 0.84)
  await evaluate(`(() => {
    window.sceneController.setProgress(0.84, true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  await captureState('v4_08_progressive_unrolling.png', 'Cuộn thư đang mở cuộn 3D xuống dưới');

  // J. State 9: Final Reveal (p = 0.98)
  await evaluate(`(() => {
    window.sceneController.setProgress(0.98, true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  await captureState('v4_09_card_fully_revealed.png', 'Toàn bộ nội dung thư cưới hoàn chỉnh');

  // K. State 10: Reverse Scroll Re-lock Test (p = 0.40)
  console.log('\n--- Testing Reverse Scroll Re-lock ---');
  await evaluate(`(() => {
    window.sceneController.setProgress(0.40, true);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const relockCheck = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      envelopeOpened: sc.envelopeOpened,
      flapAngle: sc.envelope.flapPivot.rotation.x,
      sealOpacity: sc.envelope.goldSealMat?.opacity,
      envelopeRotY: sc.envelope.group.rotation.y,
    };
  })()`);
  console.log('Reverse Re-lock Check at p = 0.40:', relockCheck.result?.value);
  await captureState('v4_10_reverse_relocked.png', 'Kéo ngược cuộn trang: phong bì tự động đóng và khoá lại');

  // L. Mobile Viewport Test (375 x 667)
  console.log('\n--- Testing Mobile Viewport (375 x 667) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await evaluate(`
    window.sceneController.onResize();
    window.sceneController.setProgress(0.05, true);
  `);
  await new Promise((r) => setTimeout(r, 250));
  await captureState('v4_11_mobile_front_cover.png', 'Mobile viewport: Mặt trước phong bì hiển thị hoàn hảo');

  await evaluate(`
    window.sceneController.setProgress(0.50, true);
  `);
  await new Promise((r) => setTimeout(r, 250));
  await captureState('v4_12_mobile_back_seal.png', 'Mobile viewport: Mặt sau có sáp nến căn chỉnh chính xác');

  await evaluate(`
    window.sceneController.envelopeOpened = true;
    window.sceneController.setProgress(1.0, true);
  `);
  await new Promise((r) => setTimeout(r, 350));
  await captureState('v4_13_mobile_card_revealed.png', 'Mobile viewport: Thư cưới hiển thị to rõ trên điện thoại');

  // Check console errors
  console.log('\n======================================================');
  console.log('CONSOLE ERRORS COUNT:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors encountered:', consoleErrors);
  } else {
    console.log('SUCCESS: Zero runtime console errors!');
  }
  console.log('======================================================');

  proc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
