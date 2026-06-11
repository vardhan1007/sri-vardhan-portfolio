/**
 * PostProcessing.js
 * =================
 * Post-processing pipeline built on Three.js EffectComposer.
 *
 * Effects:
 *  - RenderPass: Base scene render
 *  - UnrealBloomPass: Soft cinematic bloom for glowing elements
 *
 * Quality levels control bloom intensity and can disable post-processing
 * entirely for low-end devices.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ------------------------------------------------------------------ */
/*  Quality presets for bloom                                          */
/* ------------------------------------------------------------------ */

const BLOOM_PRESETS = {
  high: {
    enabled: true,
    threshold: 0.8,
    strength: 0.4,
    radius: 0.5,
  },
  medium: {
    enabled: true,
    threshold: 0.9,
    strength: 0.25,
    radius: 0.3,
  },
  low: {
    enabled: true, // Keep bloom enabled for soft glowing sun and particles
    threshold: 0.9,
    strength: 0.18,
    radius: 0.3,
  },
};

/* ------------------------------------------------------------------ */
/*  PostProcessing class                                               */
/* ------------------------------------------------------------------ */

export class PostProcessing {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  constructor(renderer, scene, camera) {
    this._renderer = renderer;

    /** Whether post-processing is active. When false, render() falls through to direct rendering. */
    this.enabled = true;

    // --- EffectComposer ---
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();

    this.composer = new EffectComposer(renderer);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(size.x, size.y);

    // --- RenderPass: base scene render ---
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // --- UnrealBloomPass: cinematic bloom ---
    const bloomPreset = BLOOM_PRESETS.high;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      bloomPreset.strength,
      bloomPreset.radius,
      bloomPreset.threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  /* ---------------------------------------------------------------- */
  /*  Quality                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Adjust post-processing quality.
   *
   * @param {'high'|'medium'|'low'} level
   */
  setQuality(level) {
    const preset = BLOOM_PRESETS[level];
    if (!preset) return;

    this.enabled = preset.enabled;
    this.bloomPass.threshold = preset.threshold;
    this.bloomPass.strength = preset.strength;
    this.bloomPass.radius = preset.radius;
  }

  /* ---------------------------------------------------------------- */
  /*  Resize                                                           */
  /* ---------------------------------------------------------------- */

  /**
   * Update composer and pass sizes when viewport changes.
   *
   * @param {number} width  - New width in CSS pixels
   * @param {number} height - New height in CSS pixels
   */
  resize(width, height) {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  /**
   * Render the scene through the post-processing pipeline.
   * If `this.enabled` is false, falls through to direct renderer.render().
   *
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  render(scene, camera) {
    if (!this.enabled) {
      this._renderer.render(scene, camera);
      return;
    }

    // Update the render pass references (in case camera changed)
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;

    this.composer.render();
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    // EffectComposer disposes internal render targets
    this.composer.passes.forEach((pass) => {
      if (typeof pass.dispose === 'function') pass.dispose();
    });
  }
}
