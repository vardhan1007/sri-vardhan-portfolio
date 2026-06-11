/**
 * ZenGarden.js
 * ============
 * The ground plane of the 3D zen garden.
 *
 * Features:
 *  1. Large plane (100×100, 128 segments) with procedural displacement
 *     using a sine-based noise approximation for gentle rolling hills
 *  2. Raked sand patterns — concentric circle line geometries on the surface
 *  3. Theme-reactive colours
 *  4. Subtle real-time vertex wave animation
 *
 * The garden sits at y=0, rotated flat on the XZ plane.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Compact sine-based noise                                           */
/* ------------------------------------------------------------------ */

/**
 * A simple 2D pseudo-noise function built from layered sine waves.
 * Not true simplex noise, but visually convincing for terrain and much
 * smaller than a full noise library.
 *
 * @param {number} x
 * @param {number} y
 * @returns {number} Value in roughly [-1, 1]
 */
function pseudoNoise2D(x, y) {
  // Layer 1: large-scale hills
  let n = Math.sin(x * 0.07 + y * 0.09) * 0.5;
  // Layer 2: medium detail
  n += Math.sin(x * 0.15 - y * 0.12 + 1.7) * 0.25;
  // Layer 3: fine ripple
  n += Math.sin(x * 0.3 + y * 0.25 + 3.1) * 0.125;
  // Layer 4: micro detail
  n += Math.sin(x * 0.6 - y * 0.5 + 5.3) * 0.0625;

  return n;
}

/* ------------------------------------------------------------------ */
/*  ZenGarden class                                                    */
/* ------------------------------------------------------------------ */

export class ZenGarden {
  constructor() {
    // --- Ground plane ---
    const segments = 128;
    this._geometry = new THREE.PlaneGeometry(100, 100, segments, segments);

    // Apply procedural displacement to vertices
    this._applyDisplacement();

    // Store original Y positions for real-time wave animation
    const posAttr = this._geometry.getAttribute('position');
    this._basePositions = new Float32Array(posAttr.array.length);
    this._basePositions.set(posAttr.array);

    // --- Material ---
    this._material = new THREE.MeshStandardMaterial({
      color: 0xd4c5a9,  // Sandy / earthy tone
      roughness: 0.9,
      metalness: 0.1,
      flatShading: false,
    });

    // --- Mesh ---
    this.mesh = new THREE.Mesh(this._geometry, this._material);
    this.mesh.rotation.x = -Math.PI / 2; // Lay flat
    this.mesh.receiveShadow = true;
    this.mesh.name = 'ZenGarden';

    // --- Raked sand lines ---
    this._rakedLines = this._createRakedSandLines();

    // --- Group for SceneManager ---
    this.group = new THREE.Group();
    this.group.name = 'ZenGardenGroup';
    this.group.add(this.mesh);
    this.group.add(this._rakedLines);
  }

  /* ---------------------------------------------------------------- */
  /*  Procedural displacement                                          */
  /* ---------------------------------------------------------------- */

  /** @private */
  _applyDisplacement() {
    const posAttr = this._geometry.getAttribute('position');
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i); // This is the "depth" axis before rotation

      // Noise-based height displacement
      const height = pseudoNoise2D(x, y) * 1.5;

      // Set the Z component (which becomes Y after rotation)
      posAttr.setZ(i, height);
    }

    posAttr.needsUpdate = true;
    this._geometry.computeVertexNormals();
  }

  /* ---------------------------------------------------------------- */
  /*  Raked sand patterns                                              */
  /* ---------------------------------------------------------------- */

  /**
   * Create concentric circle line geometries representing the
   * meditative raking patterns of a zen garden.
   *
   * @returns {THREE.Group}
   * @private
   */
  _createRakedSandLines() {
    const group = new THREE.Group();
    group.name = 'RakedSandPatterns';

    // Material for the lines — slightly darker than the sand
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xc0b090,
      transparent: true,
      opacity: 0.35,
    });

    // --- Concentric circles around a few focal points ---
    const focalPoints = [
      { x: 0,   z: 0,   rings: 8, maxRadius: 12, startRadius: 2 },
      { x: -15, z: -30, rings: 6, maxRadius: 8,  startRadius: 1.5 },
      { x: 10,  z: -45, rings: 5, maxRadius: 6,  startRadius: 1 },
    ];

    for (const focal of focalPoints) {
      for (let r = 0; r < focal.rings; r++) {
        const radius = focal.startRadius + (focal.maxRadius - focal.startRadius) * (r / (focal.rings - 1));
        const segments = 64;
        const points = [];

        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          // Add slight wobble for organic feel
          const wobble = Math.sin(angle * 3 + r) * 0.15;
          const x = focal.x + Math.cos(angle) * (radius + wobble);
          const z = focal.z + Math.sin(angle) * (radius + wobble);
          // Sample ground height at this position
          const y = pseudoNoise2D(x, z) * 1.5 + 0.05; // Slightly above ground
          points.push(new THREE.Vector3(x, y, z));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      }
    }

    // --- Parallel straight lines in some areas (traditional raking) ---
    const lineCount = 15;
    for (let l = 0; l < lineCount; l++) {
      const zOffset = 10 + l * 1.5; // Spaced 1.5 units apart, starting at z=10
      const points = [];

      for (let x = -30; x <= 30; x += 1) {
        const wobble = Math.sin(x * 0.5 + l * 0.3) * 0.1;
        const y = pseudoNoise2D(x, zOffset) * 1.5 + 0.05;
        points.push(new THREE.Vector3(x, y, zOffset + wobble));
      }

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);
    }

    return group;
  }

  /* ---------------------------------------------------------------- */
  /*  Theme                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Update ground colour to match the current theme.
   *
   * @param {Object} colors
   * @param {string|number} colors.ground - Ground plane colour
   */
  updateTheme(colors) {
    if (colors.ground) {
      this._material.color.set(colors.ground);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Very subtle vertex animation — a gentle wave ripples across the sand.
   *
   * @param {number} time - Elapsed time in seconds
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    const posAttr = this._geometry.getAttribute('position');
    const count = posAttr.count;
    const base = this._basePositions;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = base[i3];
      const y = base[i3 + 1];
      const baseZ = base[i3 + 2]; // Original height

      // Gentle sinusoidal wave
      const wave = Math.sin(x * 0.1 + time * 0.3) * Math.cos(y * 0.1 + time * 0.2) * 0.08;

      posAttr.array[i3 + 2] = baseZ + wave;
    }

    posAttr.needsUpdate = true;
    // Note: Skipping computeVertexNormals() every frame for performance.
    // The wave is subtle enough that static normals look fine.
  }

  /* ---------------------------------------------------------------- */
  /*  Quality                                                          */
  /* ---------------------------------------------------------------- */

  /**
   * @param {'high'|'medium'|'low'} level
   */
  setQuality(level) {
    this._material.wireframe = level === 'low';
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    this._geometry.dispose();
    this._material.dispose();
    // Dispose line geometries
    this._rakedLines.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
