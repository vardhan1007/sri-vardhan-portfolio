/**
 * CherryBlossoms.js — Clean Sakura Falling Petals & Twinkling Fireflies
 * =====================================================================
 *
 * Implements:
 *  1. FALLING PETALS: 280 high-fidelity pink cherry blossom petals that drift
 *     downwards with gravity, sway sideways, and rotate in 3D.
 *  2. UPWARD FIREFLIES: Soft glowing amber orbs that float upwards.
 *  3. No Mascot, no rising light streaks.
 */

import * as THREE from 'three';

// --- Constants ---
const PETAL_COUNT = 280;
const SPAWN_HEIGHT = 35;
const KILL_HEIGHT = -10;
const SPAWN_RADIUS_XZ = 30;
const GRAVITY = -0.25;         // Negative gravity for falling feel
const DRIFT_AMPLITUDE = 1.2;
const DRIFT_FREQUENCY = 0.35;
const ROTATION_SPEED = 0.3;

const FIREFLY_COUNT = 80;
const FIREFLY_RADIUS_XZ = 30;
const FIREFLY_RISE_SPEED = 0.2;
const FIREFLY_WANDER = 0.4;

const MOUSE_PUSH_RADIUS = 5;
const MOUSE_PUSH_FORCE = 2.0;

/* ------------------------------------------------------------------ */
/*  Procedural Canvas Petal Textures                                   */
/* ------------------------------------------------------------------ */

function createPetalTexture(shapeIndex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);
  ctx.save();
  ctx.beginPath();
  
  if (shapeIndex === 0) {
    ctx.moveTo(128, 220);
    ctx.bezierCurveTo(48, 190, 40, 70, 108, 50);
    ctx.bezierCurveTo(128, 40, 120, 70, 128, 70);
    ctx.bezierCurveTo(136, 70, 128, 40, 148, 50);
    ctx.bezierCurveTo(216, 70, 208, 190, 128, 220);
  } else if (shapeIndex === 1) {
    ctx.moveTo(128, 220);
    ctx.bezierCurveTo(68, 180, 60, 90, 108, 50);
    ctx.bezierCurveTo(128, 30, 168, 50, 168, 90);
    ctx.bezierCurveTo(168, 170, 168, 190, 128, 220);
  } else if (shapeIndex === 2) {
    ctx.moveTo(128, 210);
    ctx.bezierCurveTo(88, 190, 68, 100, 108, 60);
    ctx.bezierCurveTo(128, 40, 148, 60, 156, 100);
    ctx.bezierCurveTo(164, 160, 148, 190, 128, 210);
  } else {
    ctx.moveTo(128, 220);
    ctx.bezierCurveTo(38, 180, 38, 70, 128, 40);
    ctx.bezierCurveTo(218, 70, 218, 180, 128, 220);
  }
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createLinearGradient(128, 220, 128, 40);
  if (shapeIndex === 0) {
    grad.addColorStop(0.0, '#ffe5ec');
    grad.addColorStop(0.4, '#ffb7c5');
    grad.addColorStop(0.8, '#ff758f');
    grad.addColorStop(1.0, '#ff4d6d');
  } else if (shapeIndex === 1) {
    grad.addColorStop(0.0, '#fff0f3');
    grad.addColorStop(0.3, '#ffccd5');
    grad.addColorStop(0.7, '#ff8fa3');
    grad.addColorStop(1.0, '#ff0a54');
  } else if (shapeIndex === 2) {
    grad.addColorStop(0.0, '#ffeef1');
    grad.addColorStop(0.5, '#ffccd5');
    grad.addColorStop(1.0, '#ff5c8a');
  } else {
    grad.addColorStop(0.0, '#fff5f6');
    grad.addColorStop(0.4, '#ffe5ec');
    grad.addColorStop(0.8, '#ffb7c5');
    grad.addColorStop(1.0, '#ff758f');
  }
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(232, 93, 117, 0.16)';
  ctx.lineWidth = 1.0;
  const veinCount = 6;
  for (let j = 0; j <= veinCount; j++) {
    ctx.beginPath();
    ctx.moveTo(128, 220);
    const t = j / veinCount;
    const targetX = 60 + t * 136;
    const targetY = 50 + Math.sin(t * Math.PI) * 20;
    ctx.bezierCurveTo(
      128 + (targetX - 128) * 0.3, 170,
      128 + (targetX - 128) * 0.7, 110,
      targetX, targetY
    );
    ctx.stroke();
  }

  const highlightGrad = ctx.createRadialGradient(90, 100, 10, 90, 100, 90);
  highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlightGrad;
  ctx.fill();

  const shadowGrad = ctx.createRadialGradient(160, 180, 5, 160, 180, 80);
  shadowGrad.addColorStop(0, 'rgba(206, 38, 77, 0.22)');
  shadowGrad.addColorStop(1, 'rgba(206, 38, 77, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(128, 220);
  if (shapeIndex === 1) {
    ctx.quadraticCurveTo(110, 130, 140, 50);
  } else {
    ctx.quadraticCurveTo(120, 140, 128, 40);
  }
  ctx.strokeStyle = 'rgba(206, 38, 77, 0.28)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ------------------------------------------------------------------ */
/*  Firefly Shaders (Come and Go)                                      */
/* ------------------------------------------------------------------ */

const FIREFLY_VERT = /* glsl */ `
  attribute float aPulse;
  attribute float aSize;
  uniform float uTime;
  varying float vAlpha;
 
  void main() {
    float speed = 0.3 + 0.4 * fract(aPulse * 97.543);
    float cycle = sin(uTime * speed + aPulse) * 1.6 - 0.6;
    vAlpha = clamp(cycle, 0.0, 1.0);
 
    float twinkle = 0.85 + 0.15 * sin(uTime * 5.0 + aPulse * 15.0);
    vAlpha *= twinkle;
 
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (150.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 10.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FIREFLY_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
 
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
 
    float core = 1.0 - smoothstep(0.0, 0.25, dist);
    float halo = 1.0 - smoothstep(0.18, 0.5, dist);
    float alpha = (core * 0.95 + halo * 0.45) * vAlpha;
 
    if (alpha < 0.01) discard;
 
    vec3 finalColor = uColor + core * 0.35;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/*  CherryBlossoms Main Class                                          */
/* ------------------------------------------------------------------ */

export class CherryBlossoms {
  constructor(count = PETAL_COUNT) {
    this.count = count;
    this._visibleCount = count;
    this.camera = null;

    this._matrix = new THREE.Matrix4();
    this._euler = new THREE.Euler();
    this._quat = new THREE.Quaternion();
    this._scale = new THREE.Vector3(1, 1, 1);
    this._pos = new THREE.Vector3();

    this.group = new THREE.Group();
    this.group.name = 'CherryBlossomsSystem';

    this._buildPetals();
    this._buildFireflies();
  }

  _buildPetals() {
    const c = this.count;
    this._pPos   = new Float32Array(c * 3);
    this._pVel   = new Float32Array(c * 3);
    this._pRot   = new Float32Array(c * 3);
    this._pPhase = new Float32Array(c);

    for (let i = 0; i < c; i++) {
      this._resetPetal(i, true, 50);
    }

    this._petalTextures = [];
    for (let i = 0; i < 4; i++) {
      this._petalTextures.push(createPetalTexture(i));
    }

    this.meshes = [];
    const countPerMesh = Math.ceil(c / 4);

    for (let s = 0; s < 4; s++) {
      const geo = new THREE.PlaneGeometry(1.2, 1.2, 1, 1);
      const mat = new THREE.MeshBasicMaterial({
        map: this._petalTextures[s],
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
        fog: false,
      });

      const mesh = new THREE.InstancedMesh(geo, mat, countPerMesh);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.name = `PetalLayer_${s}`;
      this.group.add(mesh);
      this.meshes.push(mesh);
    }

    this._updatePetalMatrices();
  }

  _resetPetal(i, randomY = false, cameraZ = 50) {
    const i3 = i * 3;
    
    this._pPos[i3]     = (Math.random() - 0.5) * SPAWN_RADIUS_XZ;
    
    // Falling physics: spawn at the top of the scene on reset
    this._pPos[i3 + 1] = randomY
      ? Math.random() * (SPAWN_HEIGHT - KILL_HEIGHT) + KILL_HEIGHT
      : SPAWN_HEIGHT + Math.random() * 5;
    
    this._pPos[i3 + 2] = cameraZ - 40 + Math.random() * 45;

    // Downward floating speeds
    this._pVel[i3]     = (Math.random() - 0.5) * 0.25;
    this._pVel[i3 + 1] = GRAVITY * 0.6 - Math.random() * 0.25;
    this._pVel[i3 + 2] = (Math.random() - 0.5) * 0.25;

    this._pRot[i3]     = Math.random() * Math.PI * 2;
    this._pRot[i3 + 1] = Math.random() * Math.PI * 2;
    this._pRot[i3 + 2] = Math.random() * Math.PI * 2;

    this._pPhase[i] = Math.random() * Math.PI * 2;
  }

  _updatePetals(time, dt) {
    const cameraZ = this.camera ? this.camera.position.z : 50;

    for (let i = 0; i < this._visibleCount; i++) {
      const i3 = i * 3;
      const ph = this._pPhase[i];

      // Gravity acceleration (negative for downward pull)
      this._pVel[i3 + 1] += GRAVITY * dt * 0.2;
      this._pVel[i3 + 1] = Math.max(this._pVel[i3 + 1], GRAVITY * 0.8);

      const driftX = Math.sin(time * DRIFT_FREQUENCY + ph) * DRIFT_AMPLITUDE * dt;
      const driftZ = Math.cos(time * DRIFT_FREQUENCY * 0.7 + ph * 1.3) * DRIFT_AMPLITUDE * 0.6 * dt;

      this._pPos[i3]     += this._pVel[i3] * dt + driftX;
      this._pPos[i3 + 1] += this._pVel[i3 + 1] * dt;
      this._pPos[i3 + 2] += this._pVel[i3 + 2] * dt + driftZ;

      this._pRot[i3]     += ROTATION_SPEED * dt * (0.6 + ph * 0.1);
      this._pRot[i3 + 1] += ROTATION_SPEED * 0.5 * dt;
      this._pRot[i3 + 2] += ROTATION_SPEED * 0.4 * dt;

      // Wrap Y (falling below KILL_HEIGHT)
      if (this._pPos[i3 + 1] < KILL_HEIGHT) {
        this._resetPetal(i, false, cameraZ);
      }

      // Wrap Z corridor to keep petals around the camera depth of field
      if (this.camera) {
        const relativeZ = this._pPos[i3 + 2] - cameraZ;
        if (relativeZ < -40) {
          // Passed far in front, recycle to closer in front
          this._pPos[i3 + 2] = cameraZ - Math.random() * 10;
        } else if (relativeZ > 2) {
          // Went behind the camera, recycle to far in front
          this._pPos[i3 + 2] = cameraZ - 40 + Math.random() * 10;
        }
      }
    }
    this._updatePetalMatrices();
  }

  _updatePetalMatrices() {
    const countPerMesh = Math.ceil(this.count / 4);

    for (let s = 0; s < 4; s++) {
      const mesh = this.meshes[s];

      for (let i = 0; i < countPerMesh; i++) {
        const globalIdx = s * countPerMesh + i;
        if (globalIdx >= this.count) break;

        const i3 = globalIdx * 3;
        const visible = globalIdx < this._visibleCount;
        const scale = visible ? (0.6 + (this._pPhase[globalIdx] % 0.7)) : 0;

        this._pos.set(this._pPos[i3], this._pPos[i3 + 1], this._pPos[i3 + 2]);
        this._euler.set(this._pRot[i3], this._pRot[i3 + 1], this._pRot[i3 + 2]);
        this._quat.setFromEuler(this._euler);
        this._scale.set(scale, scale, scale);

        this._matrix.compose(this._pos, this._quat, this._scale);
        mesh.setMatrixAt(i, this._matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  _buildFireflies() {
    const c = FIREFLY_COUNT;
    this._ffPos   = new Float32Array(c * 3);
    this._ffVel   = new Float32Array(c * 3);
    this._ffPhase = new Float32Array(c);
    this._ffSizes = new Float32Array(c);

    for (let i = 0; i < c; i++) {
      this._resetFirefly(i, true, 50);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._ffPos, 3));

    const pulseArr = new Float32Array(c);
    const sizeArr  = new Float32Array(c);
    for (let i = 0; i < c; i++) {
      pulseArr[i] = this._ffPhase[i];
      sizeArr[i]  = this._ffSizes[i];
    }
    geo.setAttribute('aPulse', new THREE.BufferAttribute(pulseArr, 1));
    geo.setAttribute('aSize',  new THREE.BufferAttribute(sizeArr, 1));

    this._fireflyMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xfff0b3) },
        uTime:  { value: 0 },
      },
      vertexShader:   FIREFLY_VERT,
      fragmentShader: FIREFLY_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._fireflyPoints = new THREE.Points(geo, this._fireflyMat);
    this._fireflyPoints.frustumCulled = false;
    this._fireflyPoints.name = 'FireflyLayer';
    this.group.add(this._fireflyPoints);
  }

  _resetFirefly(i, randomY = false, cameraZ = 50) {
    const i3 = i * 3;
    
    this._ffPos[i3]     = (Math.random() - 0.5) * FIREFLY_RADIUS_XZ;
    this._ffPos[i3 + 1] = randomY
      ? (Math.random() - 0.5) * (SPAWN_HEIGHT + 5)
      : KILL_HEIGHT - Math.random() * 3;
    
    this._ffPos[i3 + 2] = cameraZ + (Math.random() - 0.5) * 80;

    this._ffVel[i3]     = (Math.random() - 0.5) * 0.15;
    this._ffVel[i3 + 1] = FIREFLY_RISE_SPEED * (0.4 + Math.random() * 0.6);
    this._ffVel[i3 + 2] = (Math.random() - 0.5) * 0.15;

    this._ffPhase[i] = Math.random() * Math.PI * 20;
    this._ffSizes[i] = 1.5 + Math.random() * 3.0;
  }

  _updateFireflies(time, dt) {
    const pos = this._fireflyPoints.geometry.attributes.position;
    const cameraZ = this.camera ? this.camera.position.z : 50;

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const i3 = i * 3;
      const ph = this._ffPhase[i];

      this._ffPos[i3]     += this._ffVel[i3]     * dt + Math.sin(time * 0.4 + ph) * FIREFLY_WANDER * dt;
      this._ffPos[i3 + 1] += this._ffVel[i3 + 1] * dt;
      this._ffPos[i3 + 2] += this._ffVel[i3 + 2] * dt + Math.cos(time * 0.3 + ph * 0.7) * FIREFLY_WANDER * 0.6 * dt;

      if (this._ffPos[i3 + 1] > SPAWN_HEIGHT + 5) {
        this._resetFirefly(i, false, cameraZ);
      }

      if (this.camera) {
        const relativeZ = this._ffPos[i3 + 2] - cameraZ;
        if (relativeZ < -45) {
          this._ffPos[i3 + 2] = cameraZ + 35 + Math.random() * 10;
        } else if (relativeZ > 45) {
          this._ffPos[i3 + 2] = cameraZ - 35 + Math.random() * 10;
        }
      }
    }

    pos.array.set(this._ffPos);
    pos.needsUpdate = true;
    this._fireflyMat.uniforms.uTime.value = time;
  }

  update(time, deltaTime = 0.016) {
    const dt = Math.min(deltaTime, 0.1);
    this._updatePetals(time, dt);
    this._updateFireflies(time, dt);
  }

  updateTheme(colors) {
    const isSakura = !colors.particle1 || colors.particle1 === 0x8F9E5B;
    const tintColor = isSakura ? 0xffffff : colors.particle1;

    this.meshes.forEach(mesh => {
      mesh.material.color.set(tintColor);
    });

    if (colors.accent) {
      this._fireflyMat.uniforms.uColor.value.set(colors.accent);
    }
  }

  setIntensity(factor) {
    const f = Math.max(0, Math.min(1, factor));
    this._visibleCount = Math.floor(f * this.count);

    const ffCount = Math.floor(f * FIREFLY_COUNT);
    const sizeAttr = this._fireflyPoints.geometry.attributes.aSize;
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      sizeAttr.array[i] = i < ffCount ? this._ffSizes[i] : 0;
    }
    sizeAttr.needsUpdate = true;
  }

  interact(mouseWorldPos) {
    if (!mouseWorldPos) return;

    const r2 = MOUSE_PUSH_RADIUS * MOUSE_PUSH_RADIUS;

    for (let i = 0; i < this._visibleCount; i++) {
      const i3 = i * 3;
      const dx = this._pPos[i3]     - mouseWorldPos.x;
      const dy = this._pPos[i3 + 1] - mouseWorldPos.y;
      const dz = this._pPos[i3 + 2] - mouseWorldPos.z;
      const d2 = dx * dx + dy * dy + dz * dz;

      if (d2 < r2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (1 - d / MOUSE_PUSH_RADIUS) * MOUSE_PUSH_FORCE;
        this._pVel[i3]     += (dx / d) * f;
        this._pVel[i3 + 1] += (dy / d) * f * 0.5;
        this._pVel[i3 + 2] += (dz / d) * f;
      }
    }

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const i3 = i * 3;
      const dx = this._ffPos[i3]     - mouseWorldPos.x;
      const dy = this._ffPos[i3 + 1] - mouseWorldPos.y;
      const dz = this._ffPos[i3 + 2] - mouseWorldPos.z;
      const d2 = dx * dx + dy * dy + dz * dz;

      if (d2 < r2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (1 - d / MOUSE_PUSH_RADIUS) * MOUSE_PUSH_FORCE * 1.5;
        this._ffVel[i3]     += (dx / d) * f;
        this._ffVel[i3 + 1] += (dy / d) * f * 0.3;
        this._ffVel[i3 + 2] += (dz / d) * f;
      }
    }
  }

  dispose() {
    this.meshes.forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this._petalTextures.forEach(tex => tex.dispose());
    this._fireflyPoints.geometry.dispose();
    this._fireflyMat.dispose();
  }
}