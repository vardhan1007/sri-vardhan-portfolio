/**
 * FloatingStones.js
 * =================
 * 12 floating zen stones arranged in a constellation-like semi-circle,
 * representing Sri Vardhan's technical skills.
 *
 * Each stone:
 *  - Uses IcosahedronGeometry with low detail (1-2) for an organic, faceted look
 *  - Has a unique scale, oscillation amplitude/phase, and rotation speed
 *  - Carries a skill label (stored as data, rendered by DOM overlay)
 *  - Can be highlighted (emissive glow) on hover/interaction
 *
 * The constellation is centred around z = -20 in a semi-circular arrangement.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Skill labels                                                       */
/* ------------------------------------------------------------------ */

const SKILLS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'Three.js',
  'Figma',
  'Docker',
  'PostgreSQL',
  'Next.js',
  'Git',
  'AWS',
  'Blender',
];

/* ------------------------------------------------------------------ */
/*  Stone configuration generator                                      */
/* ------------------------------------------------------------------ */

/**
 * Generate stone positions in a semi-circle constellation.
 * Returns an array of config objects with position, scale, oscillation params.
 */
function generateStoneConfigs() {
  const configs = [];
  const count = SKILLS.length;
  const baseRadius = 8;           // Semi-circle radius
  const centreZ = -20;            // Centre of the constellation
  const centreY = 8;              // Base floating height

  for (let i = 0; i < count; i++) {
    // Distribute stones in a semi-circle (π radians) with some variation
    const angle = (i / (count - 1)) * Math.PI; // 0 to π
    const radiusVariation = 0.7 + Math.random() * 0.6; // 0.7-1.3x
    const r = baseRadius * radiusVariation;

    // Position on semi-circle
    const x = Math.cos(angle) * r;
    const y = centreY + (Math.random() - 0.5) * 4; // Vertical scatter
    const z = centreZ + Math.sin(angle) * r * 0.4 + (Math.random() - 0.5) * 3;

    configs.push({
      label: SKILLS[i],
      position: new THREE.Vector3(x, y, z),
      scale: 0.3 + Math.random() * 0.5,         // Radius 0.3 to 0.8
      detail: Math.random() > 0.5 ? 1 : 2,      // Icosahedron detail level
      oscillation: {
        amplitude: 0.3 + Math.random() * 0.2,    // 0.3 to 0.5
        speed: 0.5 + Math.random() * 0.5,        // Unique oscillation speed
        phase: Math.random() * Math.PI * 2,       // Unique starting phase
      },
      rotationSpeed: 0.1 + Math.random() * 0.3,  // Y-axis rotation speed
    });
  }

  return configs;
}

/* ------------------------------------------------------------------ */
/*  FloatingStones class                                               */
/* ------------------------------------------------------------------ */

export class FloatingStones {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FloatingStones';

    // --- Generate stone configurations ---
    this._configs = generateStoneConfigs();

    // --- Shared base material (cloned per stone for individual highlight) ---
    this._baseMaterialProps = {
      color: 0x4a4a4a,     // Dark stone
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,   // Emphasise the faceted geometry
    };

    // --- Create stones ---
    this._stones = [];     // Array of { mesh, config, material }
    this._createStones();
  }

  /* ---------------------------------------------------------------- */
  /*  Stone creation                                                   */
  /* ---------------------------------------------------------------- */

  /** @private */
  _createStones() {
    for (const config of this._configs) {
      // Each stone gets a unique geometry (different detail level)
      const geometry = new THREE.IcosahedronGeometry(config.scale, config.detail);

      // Clone material so we can independently control emissive per stone
      const material = new THREE.MeshStandardMaterial({
        ...this._baseMaterialProps,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(config.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `Stone_${config.label}`;

      // Store the base Y for oscillation
      mesh.userData.baseY = config.position.y;

      this._stones.push({ mesh, config, material });
      this.group.add(mesh);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Animate each stone:
   *  - Sinusoidal Y oscillation (unique amplitude/phase)
   *  - Slow Y-axis rotation
   *
   * @param {number} time
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    for (const { mesh, config } of this._stones) {
      const { amplitude, speed, phase } = config.oscillation;

      // --- Floating oscillation ---
      mesh.position.y = mesh.userData.baseY + Math.sin(time * speed + phase) * amplitude;

      // --- Slow rotation ---
      mesh.rotation.y += config.rotationSpeed * deltaTime;
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Theme                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * @param {Object} colors
   * @param {string|number} colors.stone - Stone base colour
   */
  updateTheme(colors) {
    if (colors.stone) {
      for (const { material } of this._stones) {
        material.color.set(colors.stone);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Position data (for DOM overlay labels)                           */
  /* ---------------------------------------------------------------- */

  /**
   * Returns an array of stone positions and labels for the DOM overlay system
   * to render floating skill tags.
   *
   * @returns {Array<{position: THREE.Vector3, label: string}>}
   */
  getStonePositions() {
    return this._stones.map(({ mesh, config }) => ({
      position: mesh.position.clone(),
      label: config.label,
    }));
  }

  /* ---------------------------------------------------------------- */
  /*  Highlight                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Make a stone glow by increasing its emissive value.
   * Pass -1 or null to clear all highlights.
   *
   * @param {number|null} index - Stone index (0-11) or null to clear
   */
  highlightStone(index) {
    for (let i = 0; i < this._stones.length; i++) {
      const { material } = this._stones[i];

      if (i === index) {
        // Highlighted — warm emissive glow
        material.emissive.set(0x664422);
        material.emissiveIntensity = 0.8;
      } else {
        // Not highlighted — no emissive
        material.emissive.set(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  }

  /**
   * Clear all stone highlights.
   */
  clearHighlights() {
    this.highlightStone(null);
  }

  /* ---------------------------------------------------------------- */
  /*  Utilities                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Get the number of stones.
   * @returns {number}
   */
  get count() {
    return this._stones.length;
  }

  /**
   * Get a specific stone mesh by index (for raycasting, etc.).
   * @param {number} index
   * @returns {THREE.Mesh|undefined}
   */
  getStoneMesh(index) {
    return this._stones[index]?.mesh;
  }

  /**
   * Get all stone meshes as an array (useful for raycaster intersection).
   * @returns {THREE.Mesh[]}
   */
  getAllMeshes() {
    return this._stones.map(({ mesh }) => mesh);
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    for (const { mesh, material } of this._stones) {
      mesh.geometry.dispose();
      material.dispose();
    }
  }
}
