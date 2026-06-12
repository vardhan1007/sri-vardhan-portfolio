/**
 * CherryBlossoms.js — Cinematic 3D Sakura Falling Petals & Fireflies
 * =====================================================================
 *
 * Implements:
 *  1. IMMERSIVE SAKURA: Broad, soft, cleft cherry blossom petals that float in 3D.
 *  2. DEPTH-REACTIVE MOTION: Petals fly towards the camera on scroll down (emerging from screen)
 *     and recede into depth on scroll up, with zero snapping.
 *  3. DYNAMIC SCALING: Petals grow larger as they approach the screen and dissolve near-clip.
 *  4. TWINKLING FIREflies: Subtle secondary amber light particles.
 */

import * as THREE from 'three';

// --- Constants ---
const PETAL_COUNT = 800;
const SPAWN_HEIGHT = 35;
const KILL_HEIGHT = -10;
const GRAVITY = -0.25;         // Slow, floating vertical descent
const DRIFT_AMPLITUDE = 1.2;
const DRIFT_FREQUENCY = 0.35;
const ROTATION_SPEED = 0.3;

const FIREFLY_COUNT = 80;
const FIREFLY_RADIUS_XZ = 60;
const FIREFLY_RISE_SPEED = 0.2;
const FIREFLY_WANDER = 0.4;

const MOUSE_PUSH_RADIUS = 6;
const MOUSE_PUSH_FORCE = 2.5;

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
    // Soft Wide Petal with subtle cleft
    ctx.moveTo(128, 235);
    ctx.bezierCurveTo(15, 195, 15, 60, 112, 42);
    ctx.bezierCurveTo(128, 35, 122, 65, 128, 65);
    ctx.bezierCurveTo(134, 65, 128, 35, 144, 42);
    ctx.bezierCurveTo(241, 60, 241, 195, 128, 235);
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
    this.cameraWrapper = null;

    this._matrix = new THREE.Matrix4();
    this._euler = new THREE.Euler();
    this._quat = new THREE.Quaternion();
    this._scale = new THREE.Vector3(1, 1, 1);
    this._pos = new THREE.Vector3();

    this.group = new THREE.Group();
    this.group.name = 'CherryBlossomsSystem';

    this._prevScrollProgress = 0;
    this._scrollVelocity = 0;

    this._buildPetals();
    this._buildFireflies();
  }

  _getViewportBounds(z, camera) {
    if (!camera) {
      // Fallback for initialization before camera is bound
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
    
    // Absolute distance to handle bounds behind and in front of camera
    const dist = Math.max(0.1, Math.abs(camera.position.z - z));
    
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
    const opacities = [1.0, 0.85, 0.70, 0.55];

    for (let s = 0; s < 4; s++) {
      const geo = new THREE.PlaneGeometry(2.0, 2.0, 1, 1); // Large premium geometry
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

  _resetPetal(i, randomY = false, forceNear = false) {
    const i3 = i * 3;
    const camera = this.camera;
    const cameraZ = camera ? camera.position.z : 50;

    const countPerMesh = Math.ceil(this.count / 4);
    const s = Math.floor(i / countPerMesh); // Layer depth group

    // Position Z relative to camera depth
    if (randomY) {
      // Distribute evenly on start
      this._pPos[i3 + 2] = cameraZ - 42 + Math.random() * 40;
    } else if (forceNear) {
      // Scrolling up: spawn just behind camera so they emerge from foreground back into the scene
      this._pPos[i3 + 2] = cameraZ + 8 + Math.random() * 4;
    } else {
      // Scrolling down/Normal: spawn at far depth
      this._pPos[i3 + 2] = cameraZ - 40 - Math.random() * 5;
    }
    
    const bounds = this._getViewportBounds(this._pPos[i3 + 2], camera);
    
    // Scatter X and Y across viewport bounds at their depth
    this._pPos[i3] = bounds.left + Math.random() * (bounds.right - bounds.left);
    
    if (randomY || forceNear) {
      this._pPos[i3 + 1] = bounds.bottom + Math.random() * (bounds.top - bounds.bottom);
    } else {
      // Normal recycle: spawn slightly above top of screen to fall naturally
      this._pPos[i3 + 1] = bounds.top + 2 + Math.random() * 3;
    }

    // Motion physics
    const speedMultiplier = 1.0 - (s * 0.12);
    this._pVel[i3]     = (Math.random() - 0.5) * 1.5 * speedMultiplier; // Sideways drift
    this._pVel[i3 + 1] = (-0.3 - Math.random() * 0.7) * speedMultiplier; // Gentle fall rate
    this._pVel[i3 + 2] = (1.5 + Math.random() * 2.5) * speedMultiplier;  // Forward Z-drift

    // 3D rotations (Euler axes)
    this._pRot[i3]     = Math.random() * Math.PI * 2;
    this._pRot[i3 + 1] = Math.random() * Math.PI * 2;
    this._pRot[i3 + 2] = Math.random() * Math.PI * 2;

    this._pPhase[i] = Math.random() * Math.PI * 2;
  }

  _updatePetals(time, dt) {
    const camera = this.camera;
    const cameraY = camera ? camera.position.y : 30;
    const cameraZ = camera ? camera.position.z : 50;

    let scrollBoost = 0;
    let rotSpeedMultiplier = 1.0;

    // Track scroll direction and velocity from Camera wrapper
    if (this.cameraWrapper) {
      const currentProgress = this.cameraWrapper.getProgress();
      const progressDelta = currentProgress - this._prevScrollProgress;
      this._prevScrollProgress = currentProgress;

      const targetScrollVel = progressDelta / dt;
      this._scrollVelocity = THREE.MathUtils.lerp(this._scrollVelocity, targetScrollVel, 0.1);

      // Scroll speed translates to Z wind boost
      scrollBoost = this._scrollVelocity * 45.0;
      
      // Speed up rotations based on scroll velocity magnitude
      rotSpeedMultiplier = 1.0 + Math.abs(this._scrollVelocity) * 12.0;
    }

    for (let i = 0; i < this._visibleCount; i++) {
      const i3 = i * 3;
      const ph = this._pPhase[i];

      // Slow downward gravity drift
      this._pVel[i3 + 1] += GRAVITY * 0.5 * dt;
      const termVel = -1.0 - (ph % 0.5);
      this._pVel[i3 + 1] = Math.max(this._pVel[i3 + 1], termVel);

      const driftX = Math.sin(time * DRIFT_FREQUENCY + ph) * DRIFT_AMPLITUDE * dt;
      const driftZ = Math.cos(time * DRIFT_FREQUENCY * 0.7 + ph * 1.3) * DRIFT_AMPLITUDE * 0.4 * dt;

      // Update positions
      this._pPos[i3]     += this._pVel[i3] * dt + driftX;
      this._pPos[i3 + 1] += this._pVel[i3 + 1] * dt;
      this._pPos[i3 + 2] += (this._pVel[i3 + 2] + scrollBoost) * dt + driftZ;

      // Add mild camera corridor push (expand outward as camera approaches to fly *around* lens)
      if (camera) {
        const dx = this._pPos[i3] - camera.position.x;
        const dy = this._pPos[i3 + 1] - camera.position.y;
        const distZ = cameraZ - this._pPos[i3 + 2];
        if (distZ > 0.1 && distZ < 15) {
          const push = (1.0 - distZ / 15) * 0.15;
          this._pPos[i3] += dx * push * dt;
          this._pPos[i3 + 1] += dy * push * dt;
        }
      }

      // Rotate on all three Euler axes (rotateX, rotateY, rotateZ) for 3D tumbling
      this._pRot[i3]     += ROTATION_SPEED * dt * (0.6 + ph * 0.1) * rotSpeedMultiplier;
      this._pRot[i3 + 1] += ROTATION_SPEED * dt * (0.4 + (ph % 0.5)) * rotSpeedMultiplier;
      this._pRot[i3 + 2] += ROTATION_SPEED * 0.3 * dt * rotSpeedMultiplier;

      const bounds = this._getViewportBounds(this._pPos[i3 + 2], camera);

      if (camera) {
        const relativeZ = this._pPos[i3 + 2] - cameraZ;

        // Symmetric boundary recycles to avoid clipping or screen gap
        if (relativeZ > 12) {
          this._resetPetal(i, false, false); // Passed far behind camera: recycle far front
        } else if (relativeZ < -45) {
          this._resetPetal(i, false, true);  // Receded too far front: recycle near back
        } else if (this._pPos[i3 + 1] < bounds.bottom - 5) {
          this._resetPetal(i, false, false);
        } else if (this._pPos[i3] < bounds.left - 5 || this._pPos[i3] > bounds.right + 5) {
          this._resetPetal(i, false, false);
        }
      }
    }
    this._updatePetalMatrices();
  }

  _updatePetalMatrices() {
    const countPerMesh = Math.ceil(this.count / 4);
    const camera = this.camera;
    const cameraZ = camera ? camera.position.z : 50;

    for (let s = 0; s < 4; s++) {
      const mesh = this.meshes[s];

      for (let i = 0; i < countPerMesh; i++) {
        const globalIdx = s * countPerMesh + i;
        if (globalIdx >= this.count) break;

        const i3 = globalIdx * 3;
        const visible = globalIdx < this._visibleCount;
        
        let scale = 0;
        if (visible) {
          const baseScale = 1.0 - s * 0.15; // Layer base scales: s=0: 1.0, s=1: 0.85, s=2: 0.7, s=3: 0.55
          
          // Distance along Z to camera
          const dist = cameraZ - this._pPos[i3 + 2];
          let sizeFactor = 1.0;

          if (dist > 45) {
            sizeFactor = 0.25;
          } else if (dist < 0) {
            sizeFactor = 0; // Behind camera
          } else if (dist < 1.5) {
            // Near-clip scaling: quickly fade scale to 0 to prevent blockiness or camera intersection
            sizeFactor = (dist / 1.5) * 2.2;
          } else if (dist < 5) {
            sizeFactor = 2.2; // Keep maximum scale when very close
          } else {
            // Interpolate scale between mid-ground and background
            const t = (dist - 5) / 40; 
            sizeFactor = THREE.MathUtils.lerp(2.2, 0.25, t);
          }

          const scaleRandomizer = 0.8 + (this._pPhase[globalIdx] % 0.4); // Adds variance
          scale = baseScale * sizeFactor * scaleRandomizer;
        }

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