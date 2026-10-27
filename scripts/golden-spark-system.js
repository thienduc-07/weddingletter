/**
 * GOLDEN SPARK & BURST SYSTEM (3D CELEBRATORY WAX SEAL EXPLOSION)
 * -------------------------------------------------------------
 * High-performance 3D particle emitter that triggers when the wax seal breaks:
 * - 80 radiant golden embers & sparks bursting outward spherically
 * - Realistic particle physics: velocity, drag, soft gravity, and rotational tumble
 * - Expanding luminous champagne gold shockwave ring
 * - Shimmering golden dust motes rising gently from the opened envelope pocket
 */

import * as THREE from './three.module.js';

export class GoldenSparkSystem {
  constructor(scene) {
    this.scene = scene;
    this.numSparks = 80;
    this.isActive = false;

    this.initShockwave();
    this.initSparks();
    this.initAmbientMotes();
  }

  initShockwave() {
    // Expanding golden shockwave ring
    const ringGeom = new THREE.RingGeometry(0.08, 0.16, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFDECB5,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shockwaveMesh = new THREE.Mesh(ringGeom, ringMat);
    this.shockwaveMesh.visible = false;
    this.scene.add(this.shockwaveMesh);
    this.shockwaveRadius = 0.16;
    this.shockwaveOpacity = 0;
  }

  initSparks() {
    this.sparkData = [];
    const positions = new Float32Array(this.numSparks * 3);
    const colors = new Float32Array(this.numSparks * 3);

    const baseColor = new THREE.Color(0xFFEAA7);
    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sparkGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture canvas (soft glowing round spark)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const ctx = pCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 230, 160, 0.9)');
    grad.addColorStop(0.7, 'rgba(215, 188, 131, 0.4)');
    grad.addColorStop(1, 'rgba(215, 188, 131, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const sparkTex = new THREE.CanvasTexture(pCanvas);

    const sparkMat = new THREE.PointsMaterial({
      size: 0.14,
      map: sparkTex,
      transparent: true,
      opacity: 0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(sparkGeom, sparkMat);
    this.points.visible = false;
    this.scene.add(this.points);

    for (let i = 0; i < this.numSparks; i++) {
      this.sparkData.push({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: 1.0,
        size: 1.0,
      });
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }
  }

  initAmbientMotes() {
    // 35 gentle shimmering golden dust motes around the stationery
    this.numMotes = 35;
    const motePos = new Float32Array(this.numMotes * 3);
    const moteColors = new Float32Array(this.numMotes * 3);
    this.moteData = [];

    const gold = new THREE.Color(0xD7BC83);
    for (let i = 0; i < this.numMotes; i++) {
      const x = (Math.random() - 0.5) * 3.5;
      const y = (Math.random() - 0.5) * 2.5 - 0.2;
      const z = (Math.random() - 0.5) * 1.5 + 0.2;
      motePos[i * 3] = x;
      motePos[i * 3 + 1] = y;
      motePos[i * 3 + 2] = z;

      moteColors[i * 3] = gold.r;
      moteColors[i * 3 + 1] = gold.g;
      moteColors[i * 3 + 2] = gold.b;

      this.moteData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const moteGeom = new THREE.BufferGeometry();
    moteGeom.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    moteGeom.setAttribute('color', new THREE.BufferAttribute(moteColors, 3));

    const moteMat = new THREE.PointsMaterial({
      size: 0.08,
      map: this.points.material.map,
      transparent: true,
      opacity: 0.0,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.motes = new THREE.Points(moteGeom, moteMat);
    this.scene.add(this.motes);
  }

  /**
   * Explode burst of golden sparks from the wax seal world coordinate
   * @param {THREE.Vector3} origin
   */
  burst(origin) {
    this.isActive = true;
    this.points.visible = true;
    this.points.material.opacity = 1.0;

    const pos = this.points.geometry.attributes.position.array;

    for (let i = 0; i < this.numSparks; i++) {
      const s = this.sparkData[i];
      s.x = origin.x;
      s.y = origin.y;
      s.z = origin.z + 0.02;

      // Spherical explosion with slight bias toward camera and upward
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.4) * Math.PI;
      const speed = 1.8 + Math.random() * 3.2;

      s.vx = Math.cos(phi) * Math.cos(theta) * speed;
      s.vy = Math.sin(phi) * speed + 0.8;
      s.vz = Math.cos(phi) * Math.sin(theta) * speed * 0.6 + 0.5;

      s.life = 0;
      s.maxLife = 0.65 + Math.random() * 0.65; // ~0.65 - 1.3s

      pos[i * 3] = s.x;
      pos[i * 3 + 1] = s.y;
      pos[i * 3 + 2] = s.z;
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    // Shockwave ring setup
    this.shockwaveMesh.position.copy(origin);
    this.shockwaveMesh.position.z += 0.03;
    this.shockwaveMesh.scale.set(1, 1, 1);
    this.shockwaveOpacity = 1.0;
    this.shockwaveMesh.visible = true;
    this.shockwaveMesh.material.opacity = 1.0;
  }

  /**
   * Set ambient motes visibility/intensity
   */
  setMotesIntensity(intensity) {
    if (this.motes) {
      this.motes.material.opacity = Math.max(0, Math.min(0.75, intensity));
    }
  }

  /**
   * Per-frame update
   */
  update(dt = 0.016, time = 0) {
    // 1. Update expanding shockwave
    if (this.shockwaveOpacity > 0.01) {
      this.shockwaveOpacity -= dt * 2.2;
      const scale = (1.0 - this.shockwaveOpacity) * 7.5 + 1.0;
      this.shockwaveMesh.scale.set(scale, scale, 1);
      this.shockwaveMesh.material.opacity = Math.max(0, this.shockwaveOpacity);
    } else {
      this.shockwaveMesh.visible = false;
    }

    // 2. Update burst sparks
    if (this.isActive) {
      let aliveCount = 0;
      const pos = this.points.geometry.attributes.position.array;

      for (let i = 0; i < this.numSparks; i++) {
        const s = this.sparkData[i];
        if (s.life < s.maxLife) {
          aliveCount++;
          s.life += dt;

          // Drag & Gravity
          s.vx *= 0.96;
          s.vy = (s.vy - 1.6 * dt) * 0.96;
          s.vz *= 0.96;

          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.z += s.vz * dt;

          pos[i * 3] = s.x;
          pos[i * 3 + 1] = s.y;
          pos[i * 3 + 2] = s.z;
        }
      }

      this.points.geometry.attributes.position.needsUpdate = true;

      if (aliveCount === 0) {
        this.isActive = false;
        this.points.visible = false;
      }
    }

    // 3. Update ambient dust motes
    if (this.motes && this.motes.material.opacity > 0.01) {
      const mPos = this.motes.geometry.attributes.position.array;
      const t = time * 0.001;

      for (let i = 0; i < this.numMotes; i++) {
        const d = this.moteData[i];
        const yOff = Math.sin(t * d.speed + d.phase) * 0.18;
        const xOff = Math.cos(t * d.speed * 0.7 + d.phase) * 0.12;

        mPos[i * 3] = d.baseX + xOff;
        mPos[i * 3 + 1] = d.baseY + yOff + (t * 0.05) % 0.8;
        mPos[i * 3 + 2] = d.baseZ;
      }
      this.motes.geometry.attributes.position.needsUpdate = true;
    }
  }
}
