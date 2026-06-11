/**
 * SceneManager.js
 * ===============
 * Central orchestrator for the Three.js 3D scene.
 * Manages the renderer, scene graph, animation loop, quality presets,
 * and provides an object registration system for updatable 3D entities.
 */

import * as THREE from 'three';

/** Quality preset definitions */
const QUALITY_PRESETS = {
  high: {
    pixelRatio: 2,
    shadowMapSize: 2048,
    shadowsEnabled: true,
  },
  medium: {
    pixelRatio: 1.5,
    shadowMapSize: 1024,
    shadowsEnabled: true,
  },
  low: {
    pixelRatio: 1,
    shadowMapSize: 512,
    shadowsEnabled: false,
  },
};

export class SceneManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.containerSelector='#canvas-container'] - CSS selector for the mount point
   */
  constructor(options = {}) {
    this.containerSelector = options.containerSelector || '#canvas-container';
    this.container = null;

    // --- Core Three.js objects ---
    this.renderer = null;
    this.scene = null;
    this.camera = null;           // Camera wrapper instance (set via setCamera)

    // --- Object registry ---
    this._objects = [];           // Objects with update(time, deltaTime) methods

    // --- Animation loop state ---
    this._animFrameId = null;
    this._clock = new THREE.Clock();
    this._isRunning = false;

    // --- Current quality level ---
    this._qualityLevel = 'high';

    // --- Post-processing reference (set externally) ---
    this.postProcessing = null;
  }

  /* ------------------------------------------------------------------ */
  /*  Initialisation                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Initialise renderer, scene, and mount the canvas into the DOM.
   * Call this once after the DOM is ready.
   */
  init() {
    // Locate mount point
    this.container = document.querySelector(this.containerSelector);
    if (!this.container) {
      console.warn(`[SceneManager] Container "${this.containerSelector}" not found – creating fallback.`);
      this.container = document.createElement('div');
      this.container.id = 'canvas-container';
      document.body.prepend(this.container);
    }

    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    // Clamp pixel ratio to avoid GPU overload on ultra-high DPI displays
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Tone mapping for cinematic look
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Color space
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Mount into DOM
    this.container.appendChild(this.renderer.domElement);

    // --- Scene ---
    this.scene = new THREE.Scene();

    // --- Resize listener ---
    this._onResize = this.resize.bind(this);
    window.addEventListener('resize', this._onResize);

    // Apply initial quality
    this.setQuality(this._qualityLevel);

    return this;
  }

  /* ------------------------------------------------------------------ */
  /*  Camera                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Store a reference to the Camera wrapper (js/scene/Camera.js).
   * @param {import('./Camera.js').Camera} cameraInstance
   */
  setCamera(cameraInstance) {
    this.camera = cameraInstance;
  }

  /** @returns {THREE.Scene} */
  getScene() {
    return this.scene;
  }

  /** @returns {THREE.WebGLRenderer} */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Returns the raw THREE.PerspectiveCamera.
   * If a Camera wrapper is set, delegates to its `.camera` property.
   * @returns {THREE.PerspectiveCamera|null}
   */
  getCamera() {
    return this.camera?.camera ?? null;
  }

  /* ------------------------------------------------------------------ */
  /*  Object management                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Register a 3D object so its `update(time, deltaTime)` is called each frame.
   * If the object exposes a `group` or is itself a THREE.Object3D, it is
   * automatically added to the scene.
   * @param {Object} obj - Must have an `update(time, deltaTime)` method
   */
  addObject(obj) {
    if (!obj || typeof obj.update !== 'function') {
      console.warn('[SceneManager] addObject requires an object with an update() method.');
      return;
    }
    this._objects.push(obj);

    // Auto-add to scene graph if applicable
    const sceneChild = obj.group || obj.mesh || obj.points || obj.object3D;
    if (sceneChild instanceof THREE.Object3D) {
      this.scene.add(sceneChild);
    }
  }

  /**
   * Unregister a 3D object and remove it from the scene.
   * @param {Object} obj
   */
  removeObject(obj) {
    const idx = this._objects.indexOf(obj);
    if (idx !== -1) this._objects.splice(idx, 1);

    const sceneChild = obj.group || obj.mesh || obj.points || obj.object3D;
    if (sceneChild instanceof THREE.Object3D) {
      this.scene.remove(sceneChild);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Quality                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Adjust rendering quality.
   * @param {'high'|'medium'|'low'} level
   */
  setQuality(level) {
    const preset = QUALITY_PRESETS[level];
    if (!preset) {
      console.warn(`[SceneManager] Unknown quality level "${level}".`);
      return;
    }

    this._qualityLevel = level;

    // Pixel ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));

    // Shadows
    this.renderer.shadowMap.enabled = preset.shadowsEnabled;

    // Propagate quality to post-processing if available
    if (this.postProcessing) {
      this.postProcessing.setQuality(level);
    }

    // Propagate to registered objects that support quality changes
    for (const obj of this._objects) {
      if (typeof obj.setQuality === 'function') {
        obj.setQuality(level);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Resize                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Handle viewport resize — updates renderer, camera, and all registered objects.
   */
  resize() {
    if (!this.container || !this.renderer) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Update renderer
    this.renderer.setSize(width, height);

    // Update camera
    if (this.camera && typeof this.camera.resize === 'function') {
      this.camera.resize(width / height);
    }

    // Update post-processing composer
    if (this.postProcessing && typeof this.postProcessing.resize === 'function') {
      this.postProcessing.resize(width, height);
    }

    // Notify all registered objects
    for (const obj of this._objects) {
      if (typeof obj.resize === 'function') {
        obj.resize(width, height);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Animation loop                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Start the render loop.
   */
  start() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._clock.start();
    this._tick();
  }

  /**
   * Stop the render loop.
   */
  stop() {
    this._isRunning = false;
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }

  /**
   * Internal render tick — called every frame via requestAnimationFrame.
   * @private
   */
  _tick() {
    if (!this._isRunning) return;
    this._animFrameId = requestAnimationFrame(this._tick.bind(this));

    const elapsed = this._clock.getElapsedTime();
    const delta = this._clock.getDelta();

    // Update all registered objects
    this.update(elapsed, delta);

    // Render
    const cam = this.getCamera();
    if (cam) {
      if (this.postProcessing && this.postProcessing.enabled) {
        this.postProcessing.render(this.scene, cam);
      } else {
        this.renderer.render(this.scene, cam);
      }
    }
  }

  /**
   * Update all registered objects. Called automatically by the render loop,
   * but can also be called externally.
   * @param {number} time - Elapsed time in seconds
   * @param {number} [deltaTime=0.016] - Time since last frame in seconds
   */
  update(time, deltaTime = 0.016) {
    for (const obj of this._objects) {
      obj.update(time, deltaTime);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Cleanup                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Dispose of all resources and remove listeners.
   */
  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);

    // Dispose registered objects
    for (const obj of this._objects) {
      if (typeof obj.dispose === 'function') obj.dispose();
    }
    this._objects = [];

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
