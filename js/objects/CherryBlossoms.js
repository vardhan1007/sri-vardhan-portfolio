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
const PETAL_COUNT = 800;
const SPAWN_HEIGHT = 35;
const KILL_HEIGHT = -10;
const SPAWN_RADIUS_XZ = 65;     // Expanded from 30 for wider horizontal scatter
const GRAVITY = -0.25;         // Negative gravity for falling feel
const DRIFT_AMPLITUDE = 1.2;
const DRIFT_FREQUENCY = 0.35;
const ROTATION_SPEED = 0.3;

const FIREFLY_COUNT = 80;
const FIREFLY_RADIUS_XZ = 60;   // Expanded from 30 for wider horizontal scatter
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
    // Broad Cleft Petal - Classic Sakura
    ctx.moveTo(128, 235);
    ctx.bezierCurveTo(10, 200, 5, 60, 105, 40);
    ctx.bezierCurveTo(128, 30, 115, 70, 128, 70);
    ctx.bezierCurveTo(141, 70, 128, 30, 151, 40);
    ctx.bezierCurveTo(251, 60, 246, 200, 128, 235);
  } else if (shapeIndex === 1) {
    // Slightly Asymmetric Broad Cleft Petal
    ctx.moveTo(128, 235);
    ctx.bezierCurveTo(20, 195, 10, 70, 110, 45);
    ctx.bezierCurveTo(125, 35, 118, 75, 130, 75);
    ctx.bezierCurveTo(142, 75, 132, 35, 155, 40);
    ctx.bezierCurveTo(245, 55, 235, 195, 128, 235);
  } else if (shapeIndex === 2) {
    // Deep Cleft Heart Petal
    ctx.moveTo(128, 230);
    ctx.bezierCurveTo(15, 185, 10, 50, 100, 35);
    ctx.bezierCurveTo(128, 25, 115, 80, 128, 80);
    ctx.bezierCurveTo(141, 80, 128, 25, 156, 35);
    ctx.bezierCurveTo(246, 50, 241, 185, 128, 230);
  } else {
    // Full Broad Rounded Petal (no cleft, but wide)
    ctx.moveTo(128, 235);
    ctx.bezierCurveTo(5, 190, 5, 50, 128, 30);
    ctx.bezierCurveTo(251, 50, 251, 190, 128, 235);
  }
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createLinearGradient(128, 235, 128, 30);
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
    ctx.moveTo(128, 225);
    const t = j / veinCount;
    const targetX = 25 + t * 206;
    const targetY = 45 + Math.sin(t * Math.PI) * 25;
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
  ctx.moveTo(128, 225);
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

  _getViewportBounds(z, camera) {
    if (!camera) {
      // Fallback for initialization before camera is bound
      // Camera is assumed at (0, 30, 50) looking down at Y=0 (Z=0)
      const dist = 50 - z;
      const vFOV = (60 * Math.PI) / 180;
      const height = 2 * Math.tan(vFOV / 2) * dist;
      const width = height * (16 / 9);
      
      return {
        top: 30 + height / 2,
        bottom: 30 - height / 2,
        left: -width / 2,
        right: width / 2
      };
    }
    
    // Distance from camera to the plane
    const dist = camera.position.z - z;
    
    // Calculate visible height at this distance
    const vFOV = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFOV / 2) * dist;
    const width = height * camera.aspect;
    
    return {
      top: camera.position.y + height / 2,
      bottom: camera.position.y - height / 2,
      left: camera.position.x - width / 2,
      right: camera.position.x + width / 2
    };
  }

  _buildPetals() {
    const c = this.count;
    this._pPos   = new Float32Array(c * 3);
    this._pVel   = new Float32Array(c * 3);
    this._pRot   = new Float32Array(c * 3);
    this._pPhase = new Float32Array(c);

    for (let i = 0; i < c; i++) {
      this._resetPetal(i, true);
    }

    this._petalTextures = [];
    for (let i = 0; i < 4; i++) {
      this._petalTextures.push(createPetalTexture(i));
    }

    this.meshes = [];
    const countPerMesh = Math.ceil(c / 4);
    const opacities = [1.0, 0.85, 0.7, 0.55]; // Vary opacity per layer to create depth

    for (let s = 0; s < 4; s++) {
      const geo = new THREE.PlaneGeometry(1.2, 1.2, 1, 1);
      const mat = new THREE.MeshBasicMaterial({
        map: this._petalTextures[s],
        transparent: true,
        opacity: opacities[s],
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

  _resetPetal(i, randomY = false) {
    const i3 = i * 3;
    const camera = this.camera;
    const cameraY = camera ? camera.position.y : 30;
    const cameraZ = camera ? camera.position.z : 50;

    const countPerMesh = Math.ceil(this.count / 4);
    const s = Math.floor(i / countPerMesh); // Layer depth group

    // Distribute depth (Z position) based on layers to match opacity
    if (s === 0) {
      this._pPos[i3 + 2] = cameraZ - 15 + Math.random() * 13; // Foreground: Z = -15 to -2
    } else if (s === 1) {
      this._pPos[i3 + 2] = cameraZ - 25 + Math.random() * 15; // Mid-ground 1: Z = -25 to -10
    } else if (s === 2) {
      this._pPos[i3 + 2] = cameraZ - 35 + Math.random() * 15; // Mid-ground 2: Z = -35 to -20
    } else {
      this._pPos[i3 + 2] = cameraZ - 42 + Math.random() * 12; // Background: Z = -42 to -30
    }
    
    const bounds = this._getViewportBounds(this._pPos[i3 + 2], camera);
    
    // Spawn X fully within visible horizontal bounds plus drift margin
    const marginX = 2;
    this._pPos[i3] = bounds.left - marginX + Math.random() * (bounds.right - bounds.left + 2 * marginX);
    
    // Spawn Y covering full viewport height (initial) or off-screen top (recycle)
    this._pPos[i3 + 1] = randomY
      ? bounds.bottom + Math.random() * (bounds.top - bounds.bottom)
      : bounds.top + 2 + Math.random() * 4;

    // Downward floating speeds (slower for background, faster for foreground)
    const speedMultiplier = 1.0 - (s * 0.12);
    this._pVel[i3]     = (Math.random() - 0.5) * 0.5 * speedMultiplier;
    this._pVel[i3 + 1] = (-1.2 - Math.random() * 1.5) * speedMultiplier;
    this._pVel[i3 + 2] = (Math.random() - 0.5) * 0.3 * speedMultiplier;

    this._pRot[i3]     = Math.random() * Math.PI * 2;
    this._pRot[i3 + 1] = Math.random() * Math.PI * 2;
    this._pRot[i3 + 2] = Math.random() * Math.PI * 2;

    this._pPhase[i] = Math.random() * Math.PI * 2;
  }

  _updatePetals(time, dt) {
    const camera = this.camera;
    const cameraY = camera ? camera.position.y : 30;
    const cameraZ = camera ? camera.position.z : 50;

    for (let i = 0; i < this._visibleCount; i++) {
      const i3 = i * 3;
      const ph = this._pPhase[i];

      // Gravity acceleration
      this._pVel[i3 + 1] += GRAVITY * dt;
      const termVel = -1.8 - (ph % 1.2);
      this._pVel[i3 + 1] = Math.max(this._pVel[i3 + 1], termVel);

      const driftX = Math.sin(time * DRIFT_FREQUENCY + ph) * DRIFT_AMPLITUDE * dt;
      const driftZ = Math.cos(time * DRIFT_FREQUENCY * 0.7 + ph * 1.3) * DRIFT_AMPLITUDE * 0.6 * dt;

      this._pPos[i3]     += this._pVel[i3] * dt + driftX;
      this._pPos[i3 + 1] += this._pVel[i3 + 1] * dt;
      this._pPos[i3 + 2] += this._pVel[i3 + 2] * dt + driftZ;

      // Rotate in 3D (X, Y, Z) so the broad petals flip and sway gracefully
      this._pRot[i3]     += ROTATION_SPEED * dt * (0.6 + ph * 0.1);
      this._pRot[i3 + 1] += ROTATION_SPEED * dt * (0.4 + (ph % 0.5));
      this._pRot[i3 + 2] += ROTATION_SPEED * 0.3 * dt;

      // Get bounds at current Z depth
      const bounds = this._getViewportBounds(this._pPos[i3 + 2], camera);

      // Wrap Y (falling below bounds.bottom)
      if (this._pPos[i3 + 1] < bounds.bottom - 4) {
        this._resetPetal(i, false);
      }

      // Wrap Z corridor to keep petals around the camera depth of field
      if (camera) {
        const relativeZ = this._pPos[i3 + 2] - cameraZ;
        if (relativeZ < -40) {
          this._pPos[i3 + 2] = cameraZ - Math.random() * 10;
        } else if (relativeZ > 2) {
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
        
        // Randomize scale but make foreground layers slightly larger and background layers slightly smaller
        const baseScale = 0.95 - s * 0.15; // Layer 0: 0.95, Layer 1: 0.8, Layer 2: 0.65, Layer 3: 0.5
        const scaleRandomizer = (this._pPhase[globalIdx] % 0.4);
        const scale = visible ? (baseScale + scaleRandomizer) : 0;

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
    // Keep petals white-tinted (original pink textures) in all themes
    this.meshes.forEach(mesh => {
      mesh.material.color.set(0xffffff);
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