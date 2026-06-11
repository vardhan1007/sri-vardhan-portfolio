/**
 * WaterRipple.js
 * ==============
 * A reflective water plane placed at the end of the zen garden scene.
 *
 * Uses a custom ShaderMaterial with:
 *  - Vertex shader: animated wave displacement (sin/cos)
 *  - Fragment shader: procedural reflective water with
 *    - Base water colour (theme-reactive)
 *    - Fresnel-like edge brightening
 *    - Animated noise-based ripple patterns
 *    - Subtle transparency (alpha 0.7)
 *  - Interactive ripple system: addRipple(x, z) drops a ripple at a position
 *
 * Position: z = -50, y = 0.5 (slightly above ground)
 * Size: 30×30, 64 segments for smooth wave deformation
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_RIPPLES = 8; // Max concurrent interactive ripples

/* ------------------------------------------------------------------ */
/*  Shaders                                                            */
/* ------------------------------------------------------------------ */

const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec4  uRipples[${MAX_RIPPLES}]; // xy = position, z = startTime, w = active flag

  varying vec2  vUv;
  varying vec3  vWorldPosition;
  varying vec3  vNormal;
  varying float vElevation;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // --- Ambient wave displacement ---
    // Large, slow rolling waves
    float wave1 = sin(pos.x * 0.3 + uTime * 0.8) * cos(pos.y * 0.2 + uTime * 0.6) * 0.15;
    // Smaller, faster chop
    float wave2 = sin(pos.x * 0.8 + uTime * 1.5) * cos(pos.y * 0.6 - uTime * 1.2) * 0.08;
    // Micro ripple
    float wave3 = sin(pos.x * 2.0 - uTime * 2.5) * sin(pos.y * 1.8 + uTime * 2.0) * 0.03;

    float totalWave = wave1 + wave2 + wave3;

    // --- Interactive ripples ---
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      if (uRipples[i].w > 0.5) {
        float dx = pos.x - uRipples[i].x;
        float dy = pos.y - uRipples[i].y;
        float dist = sqrt(dx * dx + dy * dy);
        float age = uTime - uRipples[i].z;

        // Expanding ring
        float ringRadius = age * 5.0;
        float ringWidth = 2.0;
        float ringFactor = exp(-pow(dist - ringRadius, 2.0) / ringWidth);

        // Decay over time
        float decay = exp(-age * 1.5);

        totalWave += sin(dist * 4.0 - uTime * 8.0) * ringFactor * decay * 0.2;
      }
    }

    pos.z += totalWave;
    vElevation = totalWave;

    // Compute world position for Fresnel
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    // Approximate normal from displacement (finite differences)
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3  uWaterColor;
  uniform vec3  uCameraPosition;

  varying vec2  vUv;
  varying vec3  vWorldPosition;
  varying vec3  vNormal;
  varying float vElevation;

  // Simple 2D hash for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smoothstep

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal Brownian Motion — layered noise for organic ripple pattern
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // --- Base water colour ---
    vec3 color = uWaterColor;

    // --- Animated noise ripple pattern ---
    vec2 noiseCoord = vUv * 8.0 + vec2(uTime * 0.1, uTime * 0.08);
    float rippleNoise = fbm(noiseCoord) * 0.3;

    // Add elevation-based highlights (wave crests are brighter)
    float crestHighlight = smoothstep(0.0, 0.15, vElevation) * 0.25;

    color += rippleNoise * 0.15;
    color += crestHighlight;

    // --- Fresnel-like edge brightening ---
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float fresnel = 1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0);
    fresnel = pow(fresnel, 3.0);

    // Blend in a sky/reflection colour at grazing angles
    vec3 reflectionColor = color * 1.4 + vec3(0.1, 0.15, 0.2);
    color = mix(color, reflectionColor, fresnel * 0.6);

    // --- Specular highlights ---
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    vec3 halfDir = normalize(viewDir + lightDir);
    float spec = pow(max(dot(vec3(0.0, 1.0, 0.0), halfDir), 0.0), 64.0);
    color += spec * 0.3;

    // --- Edge fade (soft edges around the plane) ---
    float edgeFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x)
                   * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);

    float alpha = 0.7 * edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/*  WaterRipple class                                                  */
/* ------------------------------------------------------------------ */

export class WaterRipple {
  constructor() {
    // --- Geometry ---
    this._geometry = new THREE.PlaneGeometry(30, 30, 64, 64);

    // --- Initialise ripple uniforms ---
    const ripplesArray = [];
    for (let i = 0; i < MAX_RIPPLES; i++) {
      ripplesArray.push(new THREE.Vector4(0, 0, 0, 0)); // x, y, startTime, active
    }
    this._rippleIndex = 0; // Ring buffer index

    // --- Material ---
    this._material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaterColor: { value: new THREE.Color(0x2d5f8a) },
        uCameraPosition: { value: new THREE.Vector3(0, 10, 0) },
        uRipples: { value: ripplesArray },
      },
      vertexShader: WATER_VERTEX,
      fragmentShader: WATER_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // --- Mesh ---
    this.mesh = new THREE.Mesh(this._geometry, this._material);
    this.mesh.rotation.x = -Math.PI / 2; // Lay flat
    this.mesh.position.set(0, 0.5, -50);  // End of the scene
    this.mesh.name = 'WaterRipple';

    // Expose as `group` for SceneManager compatibility
    this.group = this.mesh;
  }

  /* ---------------------------------------------------------------- */
  /*  Per-frame update                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Pass time to shader for wave animation.
   *
   * @param {number} time      - Elapsed time in seconds
   * @param {number} [deltaTime=0.016]
   */
  update(time, deltaTime = 0.016) {
    this._material.uniforms.uTime.value = time;

    // Deactivate old ripples (older than 3 seconds)
    const ripples = this._material.uniforms.uRipples.value;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      if (ripples[i].w > 0.5 && (time - ripples[i].z) > 3.0) {
        ripples[i].w = 0;
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Theme                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * @param {Object} colors
   * @param {string|number} colors.water - Water colour
   */
  updateTheme(colors) {
    if (colors.water) {
      this._material.uniforms.uWaterColor.value.set(colors.water);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Interactive ripples                                               */
  /* ---------------------------------------------------------------- */

  /**
   * Trigger a ripple at a world position.
   * The position is converted to local plane coordinates.
   *
   * @param {number} x - World X position
   * @param {number} z - World Z position
   */
  addRipple(x, z) {
    const ripples = this._material.uniforms.uRipples.value;

    // Convert world position to local plane UV-ish coordinates
    // The plane is 30×30, centred at (0, 0.5, -50), rotated flat
    const localX = x - this.mesh.position.x;
    const localZ = z - this.mesh.position.z;

    // Use ring buffer to cycle through ripple slots
    ripples[this._rippleIndex].set(
      localX,
      localZ,
      this._material.uniforms.uTime.value, // Start time
      1.0                                    // Active flag
    );

    this._rippleIndex = (this._rippleIndex + 1) % MAX_RIPPLES;
  }

  /**
   * Update camera position uniform for Fresnel calculation.
   * Call this when the camera moves.
   *
   * @param {THREE.Vector3} cameraPos
   */
  updateCameraPosition(cameraPos) {
    this._material.uniforms.uCameraPosition.value.copy(cameraPos);
  }

  /* ---------------------------------------------------------------- */
  /*  Cleanup                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    this._geometry.dispose();
    this._material.dispose();
  }
}
