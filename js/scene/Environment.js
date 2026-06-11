/**
 * Environment.js
 * ==============
 * Atmospheric elements that wrap the entire scene:
 *
 *  1. Exponential fog (FogExp2) — theme-reactive, softens distant objects
 *  2. Gradient background — procedural sky gradient via canvas texture
 *  3. Atmospheric dust — 200 tiny particles drifting slowly for ethereal depth
 *
 * All elements react to theme changes for seamless light/dark transitions.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DUST_COUNT = 80;
const DUST_VOLUME = { x: 80, y: 40, z: 120 };  // Bounding box for dust spawn
const DUST_SPEED = 0.15;                         // Base drift speed

/* ------------------------------------------------------------------ */
/*  Environment class                                                  */
/* ------------------------------------------------------------------ */

export class Environment {
  /**
   * @param {THREE.Scene} scene - The scene to attach fog and background to
   */
  constructor(scene) {
    this.scene = scene;

    // --- Fog ---
    this._fogColor = new THREE.Color(0xf5f0eb);
    this.scene.fog = new THREE.FogExp2(this._fogColor, 0.015);

    // --- Background gradient ---
    this._bgTexture = this._createGradientTexture(
      '#f5f0eb', // top color
      '#e8e0d6'  // bottom color
    );
    this.scene.background = this._bgTexture;

    // --- Atmospheric dust particles ---
    this._dustGroup = this._createDust();

    // Expose for SceneManager auto-add
    this.group = this._dustGroup;
  }

  /* ---------------------------------------------------------------- */
  /*  Background gradient                                              */
  /* ---------------------------------------------------------------- */

  /**
   * Create a vertical gradient texture using an off-screen canvas.
   * Used as scene.background for a soft sky effect.
   *
   * @param {string} topColor    - CSS color for the top of the gradient
   * @param {string} bottomColor - CSS color for the bottom
   * @returns {THREE.CanvasTexture}
   * @private
   */
  _createGradientTexture(topColor, bottomColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
  }

  /* ---------------------------------------------------------------- */
  /*  Dust particles                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Create a THREE.Points system with DUST_COUNT tiny white particles.
   * @returns {THREE.Points}
   * @private
   */
  _createDust() {
    const positions = new Float32Array(DUST_COUNT * 3);
    const velocities = new Float32Array(DUST_COUNT * 3);
    const sizes = new Float32Array(DUST_COUNT);

    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3;

      // Random position within volume, centered around origin
      positions[i3]     = (Math.random() - 0.5) * DUST_VOLUME.x;
      positions[i3 + 1] = Math.random() * DUST_VOLUME.y;
      positions[i3 + 2] = (Math.random() - 0.5) * DUST_VOLUME.z;

      // Drift velocities — mostly upward with subtle horizontal wander
      velocities[i3]     = (Math.random() - 0.5) * DUST_SPEED * 0.3;
      velocities[i3 + 1] = Math.random() * DUST_SPEED * 0.4 + DUST_SPEED * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * DUST_SPEED * 0.3;

      // Random particle size (extremely small)
      sizes[i] = Math.random() * 0.6 + 0.2;
    }

    this._dustPositions = positions;
    this._dustVelocities = velocities;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for soft, round dust motes
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 0.15 },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        varying float vAlpha;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Size attenuation — particles shrink with distance
          gl_PointSize = size * (150.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.2, 3.0);

          // Fade particles near camera and far away
          float dist = -mvPosition.z;
          vAlpha = smoothstep(1.0, 5.0, dist) * smoothstep(80.0, 50.0, dist);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;

        void main() {
          // Soft circle shape
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          alpha *= vAlpha * uOpacity;

          if (alpha < 0.01) discard;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._dustMaterial = material;

    const points = new THREE.Points(geometry, material);
    points.name = 'AtmosphericDust';
    points.frustumCulled = false; // Always render — particles span the whole scene

    return points;
  }

  /* ---------------------------------------------------------------- */
  /*  Theme update                                                     */
  /* ---------------------------------------------------------------- */

  /**
   * Update environment visuals to match a new theme.
   *
   * @param {Object} themeColors
   * @param {string|number} themeColors.fogColor       - Fog and background color
   * @param {string|number} [themeColors.bgTopColor]   - Gradient top
   * @param {string|number} [themeColors.bgBottomColor]- Gradient bottom
   * @param {string|number} [themeColors.dustColor]    - Dust particle color
   * @param {number}        [themeColors.dustOpacity]  - Dust opacity
   */
  updateTheme(themeColors) {
    // Fog
    if (themeColors.fogColor) {
      this._fogColor.set(themeColors.fogColor);
      this.scene.fog.color.copy(this._fogColor);
    }

    // Background gradient
    if (themeColors.bgTopColor && themeColors.bgBottomColor) {
      if (this._bgTexture) this._bgTexture.dispose();

      this._bgTexture = this._createGradientTexture(
        themeColors.bgTopColor,
        themeColors.bgBottomColor
      );
      this.scene.background = this._bgTexture;
    }

    // Dust color
    if (themeColors.dustColor) {
      this._dustMaterial.uniforms.uColor.value.set(themeColors.dustColor);
    }
    if (themeColors.dustOpacity !== undefined) {
      this._dustMaterial.uniforms.uOpacity.value = themeColors.dustOpacity;
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Animate dust particles — gentle drift with wrapping.
   *
   * @param {number} time      - Elapsed time (seconds)
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    const pos = this._dustPositions;
    const vel = this._dustVelocities;

    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3;

      // Integrate velocity
      pos[i3]     += vel[i3]     * deltaTime;
      pos[i3 + 1] += vel[i3 + 1] * deltaTime;
      pos[i3 + 2] += vel[i3 + 2] * deltaTime;

      // Add subtle sinusoidal drift for organic feel
      pos[i3]     += Math.sin(time * 0.3 + i * 0.7) * 0.002;
      pos[i3 + 2] += Math.cos(time * 0.2 + i * 1.1) * 0.002;

      // Wrap particles back when they exceed the volume
      if (pos[i3 + 1] > DUST_VOLUME.y) {
        pos[i3 + 1] = 0;
        pos[i3]     = (Math.random() - 0.5) * DUST_VOLUME.x;
        pos[i3 + 2] = (Math.random() - 0.5) * DUST_VOLUME.z;
      }

      // Horizontal wrapping
      if (Math.abs(pos[i3]) > DUST_VOLUME.x * 0.5) {
        pos[i3] = -Math.sign(pos[i3]) * DUST_VOLUME.x * 0.5;
      }
      if (Math.abs(pos[i3 + 2]) > DUST_VOLUME.z * 0.5) {
        pos[i3 + 2] = -Math.sign(pos[i3 + 2]) * DUST_VOLUME.z * 0.5;
      }
    }

    // Flag GPU buffer for update
    this._dustGroup.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    this._dustGroup.geometry.dispose();
    this._dustMaterial.dispose();
    if (this._bgTexture) this._bgTexture.dispose();
  }
}
