/**
 * InkWash.js
 * ==========
 * Creates a traditional East Asian ink wash painting (水墨画 / sumi-e) effect
 * in 3D space using layered mountain silhouette planes and floating mist.
 *
 * Composition:
 *  1. 4 mountain planes at different Z depths — each with a custom shader
 *     that generates a procedural mountain silhouette from noise/sine
 *  2. 80 mist particles (THREE.Points) floating upward slowly
 *
 * Placed far back in the scene (z = -60 to -80) so they form a distant
 * atmospheric backdrop.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Mountain shader                                                    */
/* ------------------------------------------------------------------ */

const MOUNTAIN_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader — procedurally generates a mountain silhouette.
 * The bottom is opaque (mountain body), top fades to transparent (sky).
 * Uses layered sine waves for the mountain ridge line.
 */
const MOUNTAIN_FRAGMENT = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uSeed;       // Unique per layer for variety
  uniform float uMountainHeight; // How tall the mountains are (0-1)

  varying vec2 vUv;

  // Simple pseudo-noise from sine
  float noise(float x) {
    return sin(x * 1.0) * 0.5
         + sin(x * 2.3 + 1.7) * 0.25
         + sin(x * 4.1 + 3.2) * 0.125
         + sin(x * 7.9 + 5.1) * 0.0625;
  }

  void main() {
    // Generate mountain ridge line — varies across the X axis
    float ridgeLine = noise(vUv.x * 6.0 + uSeed) * uMountainHeight;

    // Shift ridge up so mountains fill the bottom portion
    ridgeLine = 0.3 + ridgeLine * 0.4;

    // Mountain body: below the ridge line
    float mountainMask = smoothstep(ridgeLine + 0.02, ridgeLine - 0.05, vUv.y);

    // Fade at the very bottom edge for soft ground blending
    float bottomFade = smoothstep(0.0, 0.05, vUv.y);

    // Atmospheric fade — edges of the plane fade out
    float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

    // Final alpha
    float alpha = mountainMask * bottomFade * edgeFade * uOpacity;

    if (alpha < 0.01) discard;

    // Slight vertical gradient on the mountain body (lighter at ridge)
    float lightening = smoothstep(ridgeLine - 0.15, ridgeLine, vUv.y) * 0.15;
    vec3 color = uColor + lightening;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/*  Mountain layer configurations                                      */
/* ------------------------------------------------------------------ */

const MOUNTAIN_LAYERS = [
  { z: -60, width: 120, height: 40, opacity: 0.20, seed: 0.0,  mountainHeight: 0.6, yOffset: -5  },
  { z: -65, width: 130, height: 45, opacity: 0.15, seed: 3.7,  mountainHeight: 0.8, yOffset: -3  },
  { z: -72, width: 140, height: 50, opacity: 0.10, seed: 7.2,  mountainHeight: 0.9, yOffset: -1  },
  { z: -80, width: 150, height: 55, opacity: 0.07, seed: 11.5, mountainHeight: 1.0, yOffset:  0  },
];

/* ------------------------------------------------------------------ */
/*  Mist constants                                                     */
/* ------------------------------------------------------------------ */

const MIST_COUNT = 80;
const MIST_VOLUME = { x: 80, yMin: -2, yMax: 30, z: 25 }; // Relative to mountain area
const MIST_BASE_Z = -65;

/* ------------------------------------------------------------------ */
/*  InkWash class                                                      */
/* ------------------------------------------------------------------ */

export class InkWash {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'InkWash';

    // --- Mountain colour (will be updated by theme) ---
    this._mountainColor = new THREE.Color(0x8a8a8a);

    // --- Create mountain planes ---
    this._mountainMaterials = [];
    this._createMountains();

    // --- Create mist particles ---
    this._createMist();
  }

  /* ---------------------------------------------------------------- */
  /*  Mountain planes                                                  */
  /* ---------------------------------------------------------------- */

  /** @private */
  _createMountains() {
    for (const layer of MOUNTAIN_LAYERS) {
      const geometry = new THREE.PlaneGeometry(layer.width, layer.height, 1, 1);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: this._mountainColor.clone() },
          uOpacity: { value: layer.opacity },
          uSeed: { value: layer.seed },
          uMountainHeight: { value: layer.mountainHeight },
        },
        vertexShader: MOUNTAIN_VERTEX,
        fragmentShader: MOUNTAIN_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      this._mountainMaterials.push(material);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, layer.height * 0.3 + layer.yOffset, layer.z);
      mesh.name = `MountainLayer_${layer.z}`;

      this.group.add(mesh);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Mist particles                                                   */
  /* ---------------------------------------------------------------- */

  /** @private */
  _createMist() {
    const positions = new Float32Array(MIST_COUNT * 3);
    const sizes = new Float32Array(MIST_COUNT);
    const velocities = new Float32Array(MIST_COUNT * 3);

    for (let i = 0; i < MIST_COUNT; i++) {
      const i3 = i * 3;

      positions[i3]     = (Math.random() - 0.5) * MIST_VOLUME.x;
      positions[i3 + 1] = MIST_VOLUME.yMin + Math.random() * (MIST_VOLUME.yMax - MIST_VOLUME.yMin);
      positions[i3 + 2] = MIST_BASE_Z + (Math.random() - 0.5) * MIST_VOLUME.z;

      sizes[i] = Math.random() * 4 + 2;

      // Very slow upward + slight horizontal drift
      velocities[i3]     = (Math.random() - 0.5) * 0.05;
      velocities[i3 + 1] = Math.random() * 0.08 + 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.03;
    }

    this._mistPositions = positions;
    this._mistVelocities = velocities;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this._mistMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xcccccc) },
        uOpacity: { value: 0.15 },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        varying float vAlpha;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 15.0);

          // Distance-based fading
          float dist = -mvPosition.z;
          vAlpha = smoothstep(5.0, 20.0, dist) * smoothstep(120.0, 60.0, dist);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          // Very soft, diffuse circle
          float alpha = 1.0 - smoothstep(0.15, 0.5, dist);
          alpha *= vAlpha * uOpacity;

          if (alpha < 0.005) discard;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._mistPoints = new THREE.Points(geometry, this._mistMaterial);
    this._mistPoints.name = 'MistParticles';
    this._mistPoints.frustumCulled = false;

    this.group.add(this._mistPoints);
  }

  /* ---------------------------------------------------------------- */
  /*  Theme                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * @param {Object} colors
   * @param {string|number} colors.mountain - Mountain silhouette colour
   * @param {string|number} [colors.mist]   - Mist particle colour
   */
  updateTheme(colors) {
    if (colors.mountain) {
      this._mountainColor.set(colors.mountain);
      for (const mat of this._mountainMaterials) {
        mat.uniforms.uColor.value.copy(this._mountainColor);
      }
    }

    if (colors.mist) {
      this._mistMaterial.uniforms.uColor.value.set(colors.mist);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Animate mist particles. Mountains stay static (they're painted scenery).
   *
   * @param {number} time
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    const pos = this._mistPositions;
    const vel = this._mistVelocities;
    const dt = Math.min(deltaTime, 0.1);

    for (let i = 0; i < MIST_COUNT; i++) {
      const i3 = i * 3;

      // Integrate
      pos[i3]     += vel[i3]     * dt + Math.sin(time * 0.2 + i * 0.5) * 0.005;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;

      // Wrap vertically
      if (pos[i3 + 1] > MIST_VOLUME.yMax) {
        pos[i3 + 1] = MIST_VOLUME.yMin;
        pos[i3]     = (Math.random() - 0.5) * MIST_VOLUME.x;
        pos[i3 + 2] = MIST_BASE_Z + (Math.random() - 0.5) * MIST_VOLUME.z;
      }
    }

    this._mistPoints.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
