/**
 * Torii.js
 * ========
 * A traditional Japanese Torii gate (鳥居) constructed entirely from
 * basic Three.js geometries.
 *
 * Structure (from top to bottom):
 *  ┌─────────────────────────────┐  ← Kasagi (top beam, slightly curved/wider)
 *  │                             │
 *  ├─────────────────────────────┤  ← Nuki (lower cross-beam)
 *  │          ┌─────┐            │
 *  │          │TABLET│           │  ← Gakuzuka (name tablet)
 *  │          └─────┘            │
 *  ║                             ║  ← Hashira (vertical pillars)
 *  ║                             ║
 *  ═                             ═  ← Ground
 *
 * Features:
 *  - Theme-reactive accent colour (vermillion red by default)
 *  - Internal glow point light
 *  - Subtle breathing pulse animation on the glow
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Gate dimensions                                                    */
/* ------------------------------------------------------------------ */

const PILLAR_RADIUS = 0.3;
const PILLAR_HEIGHT = 8;
const PILLAR_SPACING = 5;     // Distance between pillar centres

const KASAGI_WIDTH = 7;       // Top beam extends past pillars
const KASAGI_HEIGHT = 0.4;
const KASAGI_DEPTH = 0.6;

const NUKI_WIDTH = 5.5;       // Lower beam, flush with pillars
const NUKI_HEIGHT = 0.3;
const NUKI_DEPTH = 0.4;
const NUKI_Y = 6.5;           // Height of the lower beam

const TABLET_WIDTH = 1.2;
const TABLET_HEIGHT = 1.0;
const TABLET_DEPTH = 0.15;

/* ------------------------------------------------------------------ */
/*  Torii class                                                        */
/* ------------------------------------------------------------------ */

export class Torii {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ToriiGate';

    // --- Material (shared across all gate parts) ---
    this._material = new THREE.MeshStandardMaterial({
      color: 0xc0392b,       // Vermillion red
      roughness: 0.6,
      metalness: 0.15,
    });

    // --- Build gate parts ---
    this._buildPillars();
    this._buildKasagi();
    this._buildNuki();
    this._buildGakuzuka();
    this._buildGlow();

    // Position the gate at z=0 (between about/projects in camera path)
    this.group.position.set(0, 0, 0);
  }

  /* ---------------------------------------------------------------- */
  /*  Construction                                                     */
  /* ---------------------------------------------------------------- */

  /** Two vertical pillars (hashira) @private */
  _buildPillars() {
    const geometry = new THREE.CylinderGeometry(
      PILLAR_RADIUS,          // radiusTop
      PILLAR_RADIUS * 1.15,   // radiusBottom (slightly wider base for stability look)
      PILLAR_HEIGHT,
      16                      // radial segments
    );

    // Left pillar
    const leftPillar = new THREE.Mesh(geometry, this._material);
    leftPillar.position.set(-PILLAR_SPACING / 2, PILLAR_HEIGHT / 2, 0);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    leftPillar.name = 'Pillar_Left';
    this.group.add(leftPillar);

    // Right pillar
    const rightPillar = new THREE.Mesh(geometry, this._material);
    rightPillar.position.set(PILLAR_SPACING / 2, PILLAR_HEIGHT / 2, 0);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    rightPillar.name = 'Pillar_Right';
    this.group.add(rightPillar);
  }

  /** Top beam (kasagi) — slightly wider and gently curved @private */
  _buildKasagi() {
    // Main kasagi beam
    const kasagiGeometry = new THREE.BoxGeometry(KASAGI_WIDTH, KASAGI_HEIGHT, KASAGI_DEPTH);

    const kasagi = new THREE.Mesh(kasagiGeometry, this._material);
    kasagi.position.set(0, PILLAR_HEIGHT + KASAGI_HEIGHT / 2, 0);
    kasagi.castShadow = true;
    kasagi.name = 'Kasagi';

    // Slight upward curve at the ends — simulate by rotating tiny end caps
    // Left end cap
    const capGeometry = new THREE.BoxGeometry(0.6, KASAGI_HEIGHT, KASAGI_DEPTH);

    const leftCap = new THREE.Mesh(capGeometry, this._material);
    leftCap.position.set(-KASAGI_WIDTH / 2 - 0.25, PILLAR_HEIGHT + KASAGI_HEIGHT / 2 + 0.1, 0);
    leftCap.rotation.z = 0.15; // Slight upward tilt
    leftCap.castShadow = true;
    leftCap.name = 'Kasagi_LeftCap';

    const rightCap = new THREE.Mesh(capGeometry, this._material);
    rightCap.position.set(KASAGI_WIDTH / 2 + 0.25, PILLAR_HEIGHT + KASAGI_HEIGHT / 2 + 0.1, 0);
    rightCap.rotation.z = -0.15;
    rightCap.castShadow = true;
    rightCap.name = 'Kasagi_RightCap';

    // Shimagi — thinner beam directly below kasagi
    const shimagiGeometry = new THREE.BoxGeometry(KASAGI_WIDTH * 0.95, KASAGI_HEIGHT * 0.5, KASAGI_DEPTH * 0.8);
    const shimagi = new THREE.Mesh(shimagiGeometry, this._material);
    shimagi.position.set(0, PILLAR_HEIGHT - KASAGI_HEIGHT * 0.1, 0);
    shimagi.castShadow = true;
    shimagi.name = 'Shimagi';

    this.group.add(kasagi, leftCap, rightCap, shimagi);
  }

  /** Lower cross-beam (nuki) @private */
  _buildNuki() {
    const geometry = new THREE.BoxGeometry(NUKI_WIDTH, NUKI_HEIGHT, NUKI_DEPTH);

    const nuki = new THREE.Mesh(geometry, this._material);
    nuki.position.set(0, NUKI_Y, 0);
    nuki.castShadow = true;
    nuki.name = 'Nuki';

    this.group.add(nuki);
  }

  /** Centre tablet (gakuzuka) @private */
  _buildGakuzuka() {
    const geometry = new THREE.BoxGeometry(TABLET_WIDTH, TABLET_HEIGHT, TABLET_DEPTH);

    // Slightly different material — darker, like a painted nameplate
    const tabletMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      roughness: 0.5,
      metalness: 0.3,
    });

    const tablet = new THREE.Mesh(geometry, tabletMaterial);
    tablet.position.set(0, NUKI_Y + NUKI_HEIGHT / 2 + TABLET_HEIGHT / 2 + 0.1, 0);
    tablet.name = 'Gakuzuka';

    this.group.add(tablet);

    // Store reference for potential text overlay
    this._tabletMaterial = tabletMaterial;
  }

  /** Internal glow light @private */
  _buildGlow() {
    this._glowLight = new THREE.PointLight(0xff6b6b, 0.8, 15, 1.5);
    this._glowLight.position.set(0, NUKI_Y - 1, 0.5);
    this._glowLight.name = 'ToriiGlow';

    // Store base intensity for pulsing animation
    this._glowBaseIntensity = 0.8;
    this._glowPhase = 0;

    this.group.add(this._glowLight);
  }

  /* ---------------------------------------------------------------- */
  /*  Theme                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Update gate colour to match the current theme accent.
   *
   * @param {Object} colors
   * @param {string|number} colors.accent - Theme accent colour
   */
  updateTheme(colors) {
    if (colors.accent) {
      this._material.color.set(colors.accent);
      // Glow light should match but be brighter
      this._glowLight.color.set(colors.accent);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Subtle glow pulsing animation.
   *
   * @param {number} time
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    // Breathing pulse — smooth sine wave, ±20% intensity
    this._glowLight.intensity = this._glowBaseIntensity * (1 + 0.2 * Math.sin(time * 2.0));
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material && child.material !== this._material) child.material.dispose();
    });
    this._material.dispose();
    if (this._tabletMaterial) this._tabletMaterial.dispose();
  }
}
