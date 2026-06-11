/**
 * Lighting.js
 * ===========
 * Theme-reactive lighting rig for the zen garden scene.
 *
 * Contains:
 *  - Ambient light (soft fill, theme-reactive)
 *  - Directional light (sun/moon key light with shadows)
 *  - 4 accent point lights at key scene landmarks:
 *      1. Torii gate glow
 *      2. Water reflection shimmer
 *      3. Floating stones area
 *      4. Cherry blossom canopy
 *
 * All lights live inside a single THREE.Group for easy scene management.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Default light configuration                                        */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  ambient: {
    color: 0xfff5eb,
    intensity: 0.4,
  },
  directional: {
    color: 0xffeedd,
    intensity: 1.0,
    position: new THREE.Vector3(15, 30, 20),
    shadowMapSize: 2048,
  },
  accents: [
    { name: 'torii',    color: 0xff6b6b, intensity: 0.8, position: new THREE.Vector3(0, 6, 0) },
    { name: 'water',    color: 0x64b5f6, intensity: 0.5, position: new THREE.Vector3(0, 3, -50) },
    { name: 'stones',   color: 0xce93d8, intensity: 0.4, position: new THREE.Vector3(5, 12, -20) },
    { name: 'blossoms', color: 0xf48fb1, intensity: 0.3, position: new THREE.Vector3(-5, 18, 25) },
  ],
};

/* ------------------------------------------------------------------ */
/*  Lighting class                                                     */
/* ------------------------------------------------------------------ */

export class Lighting {
  constructor() {
    // Container group — add this to the scene
    this.group = new THREE.Group();
    this.group.name = 'LightingRig';

    // --- Ambient light ---
    this.ambient = new THREE.AmbientLight(
      DEFAULTS.ambient.color,
      DEFAULTS.ambient.intensity
    );
    this.group.add(this.ambient);

    // --- Directional (key) light ---
    this.directional = new THREE.DirectionalLight(
      DEFAULTS.directional.color,
      DEFAULTS.directional.intensity
    );
    this.directional.position.copy(DEFAULTS.directional.position);
    this.directional.castShadow = true;

    // Shadow camera frustum — covers the scene footprint
    const shadow = this.directional.shadow;
    shadow.mapSize.set(DEFAULTS.directional.shadowMapSize, DEFAULTS.directional.shadowMapSize);
    shadow.camera.near = 0.5;
    shadow.camera.far = 100;
    shadow.camera.left = -40;
    shadow.camera.right = 40;
    shadow.camera.top = 40;
    shadow.camera.bottom = -40;
    shadow.bias = -0.0005;
    shadow.normalBias = 0.02;

    this.group.add(this.directional);
    this.group.add(this.directional.target); // target defaults to (0,0,0)

    // --- Accent point lights ---
    this.accents = [];
    for (const cfg of DEFAULTS.accents) {
      const light = new THREE.PointLight(cfg.color, cfg.intensity, 30, 1.5);
      light.position.copy(cfg.position);
      light.name = cfg.name;

      // Store base intensity for breathing animation
      light.userData.baseIntensity = cfg.intensity;
      light.userData.phase = Math.random() * Math.PI * 2; // Unique phase per light

      this.accents.push(light);
      this.group.add(light);
    }

    // --- Transition state (for smooth theme changes) ---
    this._transitionDuration = 1.0; // seconds
    this._transitionElapsed = 0;
    this._isTransitioning = false;
    this._fromColors = null;
    this._toColors = null;
  }

  /* ---------------------------------------------------------------- */
  /*  Theme transitions                                                */
  /* ---------------------------------------------------------------- */

  /**
   * Smoothly transition light colors and intensities to match a new theme.
   *
   * @param {Object} themeColors
   * @param {string|number} themeColors.ambientColor      - Hex color for ambient
   * @param {number}        themeColors.ambientIntensity   - Ambient intensity
   * @param {string|number} themeColors.directionalColor   - Hex color for directional
   * @param {number}        themeColors.directionalIntensity - Directional intensity
   * @param {string|number} themeColors.accentColor        - Hex color for accent lights
   */
  updateTheme(themeColors) {
    // Snapshot current state as "from"
    this._fromColors = {
      ambientColor: this.ambient.color.clone(),
      ambientIntensity: this.ambient.intensity,
      directionalColor: this.directional.color.clone(),
      directionalIntensity: this.directional.intensity,
      accentColor: this.accents[0]?.color.clone() || new THREE.Color(0xffffff),
    };

    // Parse target colors
    this._toColors = {
      ambientColor: new THREE.Color(themeColors.ambientColor),
      ambientIntensity: themeColors.ambientIntensity ?? this.ambient.intensity,
      directionalColor: new THREE.Color(themeColors.directionalColor),
      directionalIntensity: themeColors.directionalIntensity ?? this.directional.intensity,
      accentColor: new THREE.Color(themeColors.accentColor),
    };

    this._transitionElapsed = 0;
    this._isTransitioning = true;
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Called every frame. Handles:
   *  1. Smooth theme color transitions
   *  2. Accent light breathing / pulsing
   *
   * @param {number} time      - Elapsed time in seconds
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    // --- Theme transition ---
    if (this._isTransitioning) {
      this._transitionElapsed += deltaTime;
      const t = Math.min(this._transitionElapsed / this._transitionDuration, 1);

      // Smooth step easing
      const ease = t * t * (3 - 2 * t);

      // Interpolate ambient
      this.ambient.color.lerpColors(this._fromColors.ambientColor, this._toColors.ambientColor, ease);
      this.ambient.intensity = THREE.MathUtils.lerp(
        this._fromColors.ambientIntensity,
        this._toColors.ambientIntensity,
        ease
      );

      // Interpolate directional
      this.directional.color.lerpColors(
        this._fromColors.directionalColor,
        this._toColors.directionalColor,
        ease
      );
      this.directional.intensity = THREE.MathUtils.lerp(
        this._fromColors.directionalIntensity,
        this._toColors.directionalIntensity,
        ease
      );

      // Interpolate accents
      for (const accent of this.accents) {
        accent.color.lerpColors(this._fromColors.accentColor, this._toColors.accentColor, ease);
      }

      if (t >= 1) this._isTransitioning = false;
    }

    // --- Accent light breathing ---
    for (const accent of this.accents) {
      const phase = accent.userData.phase;
      const base = accent.userData.baseIntensity;
      // Gentle sinusoidal pulse — ±15% intensity variation
      accent.intensity = base * (1 + 0.15 * Math.sin(time * 1.5 + phase));
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Quality                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Adjust shadow quality.
   * @param {'high'|'medium'|'low'} level
   */
  setQuality(level) {
    const sizes = { high: 2048, medium: 1024, low: 512 };
    const size = sizes[level] || 1024;
    this.directional.shadow.mapSize.set(size, size);

    // Force shadow map recreation
    if (this.directional.shadow.map) {
      this.directional.shadow.map.dispose();
      this.directional.shadow.map = null;
    }

    this.directional.castShadow = level !== 'low';
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    if (this.directional.shadow.map) {
      this.directional.shadow.map.dispose();
    }
  }
}
