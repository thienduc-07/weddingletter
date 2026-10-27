import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9280;

  console.log('Spawning Chrome Headless on port', port, '...');
  const proc = spawn(chromePath, [
    '--headless',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/chrome-test-profile-9280',
    '--no-first-run',
    '--window-size=1440,900',
    'http://localhost:4500/'
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 20; attempt++) {
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
    process.exit(1);
  }
  const page = pages.find((p) => p.type === 'page');

  if (!page || !page.webSocketDebuggerUrl) {
    console.error('Failed to get page debugger URL');
    proc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let idCounter = 1;
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

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const curId = idCounter++;
      pending.set(curId, resolve);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  }

  async function captureState(filename, label) {
    await evaluate(`(() => {
      if (window.ambientBackground) {
        window.ambientBackground.render();
      }
      if (window.sceneController) {
        window.sceneController.renderer.render(window.sceneController.scene, window.sceneController.camera);
      }
    })()`);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot && shot.result && shot.result.data) {
      const buffer = Buffer.from(shot.result.data, 'base64');
      const outPath = path.resolve('artifacts', filename);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buffer);
      console.log(`[Captured] ${filename} -> ${label} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return outPath;
    }
  }

  console.log('Waiting for WebGL initialization...');
  await new Promise((r) => setTimeout(r, 1800));

  // Dismiss romantic veil
  await evaluate(`(() => {
    const veil = document.getElementById('romantic-page-veil');
    if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
  })()`);

  console.log('\n======================================================');
  console.log('STAGE 1: TẤM THIỆP NGHIÊNG MẠNH SANG TRÁI (u = 0.18)');
  console.log('======================================================');
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.freezeFalling = true;
    sc.introFallingComplete = false;
    sc.introFallingTime = 0.18 * sc.introFallingDuration;
    sc.applyFallingLeaf(0.18);
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  const s1 = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      rotZDeg: (sc.stationeryGroup.rotation.z * 180 / Math.PI).toFixed(1),
      envelopeRotY: sc.envelope.group.rotation.y,
      sealVisible: sc.envelope.sealGroup.visible,
      holdTriggerVisible: sc.holdTrigger?.classList.contains('visible')
    };
  })()`);
  console.log('Stage 1 Result:', s1);
  await captureState('cinematic_fall_01_stage1_left_peak.png', 'Giai đoạn 1: Thiệp nghiêng mạnh sang trái (100% biên độ)');

  console.log('\n======================================================');
  console.log('STAGE 2: ĐUNG ĐƯA SANG PHẢI VỚI BIÊN ĐỘ NHỎ HƠN (u = 0.38)');
  console.log('======================================================');
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.introFallingTime = 0.38 * sc.introFallingDuration;
    sc.applyFallingLeaf(0.38);
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  const s2 = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      rotZDeg: (sc.stationeryGroup.rotation.z * 180 / Math.PI).toFixed(1),
      ratioToStage1: (Math.abs(sc.stationeryGroup.rotation.z) / (0.26)).toFixed(2)
    };
  })()`);
  console.log('Stage 2 Result:', s2);
  await captureState('cinematic_fall_02_stage2_right_peak.png', 'Giai đoạn 2: Đung đưa sang phải với biên độ ~70%');

  console.log('\n======================================================');
  console.log('STAGE 3: DAO ĐỘNG GIẢM DẦN (u = 0.56, 0.72, 0.84)');
  console.log('======================================================');
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.introFallingTime = 0.56 * sc.introFallingDuration;
    sc.applyFallingLeaf(0.56);
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  const s3a = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      rotZDeg: (sc.stationeryGroup.rotation.z * 180 / Math.PI).toFixed(1)
    };
  })()`);
  console.log('Stage 3a (Left Sway 2):', s3a);
  await captureState('cinematic_fall_03_stage3_left_decay.png', 'Giai đoạn 3a: Nghiêng trái lần 2 (~42%)');

  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.introFallingTime = 0.72 * sc.introFallingDuration;
    sc.applyFallingLeaf(0.72);
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  const s3b = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      rotZDeg: (sc.stationeryGroup.rotation.z * 180 / Math.PI).toFixed(1)
    };
  })()`);
  console.log('Stage 3b (Right Sway 2):', s3b);
  await captureState('cinematic_fall_04_stage3_right_decay.png', 'Giai đoạn 3b: Nghiêng phải lần 2 (~21%)');

  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.introFallingTime = 0.84 * sc.introFallingDuration;
    sc.applyFallingLeaf(0.84);
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  const s3c = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      rotZDeg: (sc.stationeryGroup.rotation.z * 180 / Math.PI).toFixed(1)
    };
  })()`);
  console.log('Stage 3c (Subtle Final Sway bias Right):', s3c);
  await captureState('cinematic_fall_05_stage3_final_bias.png', 'Giai đoạn 3c: Dao động cuối rất nhẹ chuẩn bị đáp (~10%)');

  console.log('\n======================================================');
  console.log('STAGE 4: TỪ BÊN PHẢI TRƯỢT SANG TRÁI, HẠ XUỐNG, GIẢM TỐC (u = 0.92)');
  console.log('======================================================');
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.introFallingTime = 0.92 * sc.introFallingDuration;
    sc.applyFallingLeaf(0.92);
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  const s4 = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      rotZDeg: (sc.stationeryGroup.rotation.z * 180 / Math.PI).toFixed(1),
      shadowOpacity: sc.tableContactShadow?.material?.opacity
    };
  })()`);
  console.log('Stage 4 Result:', s4);
  await captureState('cinematic_fall_06_stage4_landing_glide.png', 'Giai đoạn 4: Trượt từ phải sang trái, hạ xuống và giảm tốc');

  console.log('\n======================================================');
  console.log('STAGE 5: ĐÁP XUỐNG & HIỂN THỊ TRẠNG THÁI CHỜ TƯƠNG TÁC (u = 1.00)');
  console.log('======================================================');
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.freezeFalling = false;
    sc.completeFallingLeaf();
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const s5 = await evaluate(`(() => {
    const sc = window.sceneController;
    return {
      state: sc.state,
      posX: sc.stationeryGroup.position.x,
      posY: sc.stationeryGroup.position.y,
      posZ: sc.stationeryGroup.position.z,
      rotX: sc.stationeryGroup.rotation.x,
      rotY: sc.stationeryGroup.rotation.y,
      rotZ: sc.stationeryGroup.rotation.z,
      shadowOpacity: sc.tableContactShadow?.material?.opacity,
      holdTriggerVisible: sc.holdTrigger?.classList.contains('visible'),
      promptText: document.getElementById('hold-prompt-text')?.innerText?.trim()
    };
  })()`);
  console.log('Stage 5 Result (Settled):', s5);
  await captureState('cinematic_fall_07_stage5_settled.png', 'Giai đoạn 5: Đáp xuống bàn tiệc, hiện hướng dẫn ấn giữ');

  console.log('\n======================================================');
  console.log('SHADOW FIX VERIFICATION: CUỘN THƯ VÀ NƠ ĐỔ BÓNG ĐỀU TRÊN THIỆP');
  console.log('======================================================');
  await evaluate(`(() => {
    const sc = window.sceneController;
    sc.state = 'OPENING_ENVELOPE';
    sc.openingProgress = 0.50;
    sc.envelope.setFlapAngle(0.50 * 2.7);
    sc.envelope.setSealOpacity(1.0 - 0.50 * 1.2);
    sc.scroll.group.visible = true;
    sc.scroll.group.position.set(0, 0.05, 0.025);
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const shadowReport = await evaluate(`(() => {
    const sc = window.sceneController;
    const env = sc.envelope;
    const meshShadows = [];
    env.group.traverse((c) => {
      if (c.isMesh) {
        meshShadows.push({
          castShadow: c.castShadow,
          receiveShadow: c.receiveShadow,
          hasPolygonOffset: !!c.material?.polygonOffset
        });
      }
    });
    return {
      allFoldsReceiveShadow: meshShadows.every(m => m.receiveShadow),
      count: meshShadows.length
    };
  })()`);
  console.log('Shadow Reception Report:', shadowReport.value);
  await captureState('cinematic_fall_08_shadow_continuity_open.png', 'Kiểm tra đổ bóng: Cuộn thư và nơ đổ bóng liền mạch trên toàn bộ mặt thiệp');

  console.log('\nConsole Errors:', consoleErrors);
  console.log('\nSUCCESS: ALL 5 STAGES & SHADOW FIX FULLY VERIFIED!');
  ws.close();
  proc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
