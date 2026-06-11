/**
 * ═══════════════════════════════════════════════════════════════
 * Sri Vardhan's 3D Portfolio — Main Entry Point
 * "I build worlds — in code and on canvas"
 * ═══════════════════════════════════════════════════════════════
 *
 * This file orchestrates the entire portfolio experience:
 * 1. Initializes the 3D scene (Three.js)
 * 2. Sets up scroll-driven camera movement (GSAP)
 * 3. Activates all interactive elements
 * 4. Manages theme switching
 * 5. Handles performance adaptation
 */

// ── Scene & 3D ──────────────────────────────────────────────
import { SceneManager } from './scene/SceneManager.js';
import { Camera } from './scene/Camera.js';
import { Lighting } from './scene/Lighting.js';
import { Environment } from './scene/Environment.js';
import { PostProcessing } from './scene/PostProcessing.js';

// ── 3D Objects ──
import { CherryBlossoms } from './objects/CherryBlossoms.js';

// ── Interactions ────────────────────────────────────────────
import { CustomCursor } from './interactions/CustomCursor.js';
import { ScrollManager } from './interactions/ScrollManager.js';
import { MagneticButtons } from './interactions/MagneticButtons.js';
import { ParallaxElements } from './interactions/ParallaxElements.js';
import { MobileHover } from './interactions/MobileHover.js';

// ── Sections ────────────────────────────────────────────────
import { Loader } from './sections/Loader.js';
import { Hero } from './sections/Hero.js';
import { About } from './sections/About.js';
import { Projects } from './sections/Projects.js';
import { Skills } from './sections/Skills.js';
import { MangaGallery } from './sections/MangaGallery.js';
import { Experience } from './sections/Experience.js';
import { Contact } from './sections/Contact.js';

// ── Utilities ───────────────────────────────────────────────
import { ThemeManager } from './utils/ThemeManager.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { getThemeColors, isTouchDevice } from './utils/helpers.js';

/**
 * ═══════════════════════════════════════════════════════════════
 * Application Class — The Heart of the Portfolio
 * ═══════════════════════════════════════════════════════════════
 */
class App {
  constructor() {
    // ── Core Systems ──
    this.sceneManager = null;
    this.camera = null;
    this.lighting = null;
    this.environment = null;
    this.postProcessing = null;

    // ── 3D Objects ──
    this.cherryBlossoms = null;

    // ── Interactions ──
    this.customCursor = null;
    this.scrollManager = null;
    this.magneticButtons = null;
    this.parallaxElements = null;

    // ── Sections ──
    this.loader = null;
    this.hero = null;
    this.about = null;
    this.projects = null;
    this.skills = null;
    this.mangaGallery = null;
    this.experience = null;
    this.contact = null;

    // ── Utilities ──
    this.themeManager = null;
    this.performanceMonitor = null;

    // ── State ──
    this.mousePosition = { x: 0, y: 0 };
    this.isInitialized = false;
  }

  /**
   * ── Initialize Everything ──
   * Called once on page load. Sets up the entire experience.
   */
  async init() {
    console.log('🌸 Initializing Sri Vardhan\'s Portfolio...');

    // 1. Start with the loading screen
    this.loader = new Loader();

    // 2. Initialize performance monitoring
    this.performanceMonitor = new PerformanceMonitor();
    this.performanceMonitor.startSampling();

    // 3. Initialize the 3D scene while loader is showing
    this.initScene();

    // 4. Initialize theme manager
    this.themeManager = new ThemeManager();
    this.themeManager.init();
    this.themeManager.onThemeChange((themeName) => this.handleThemeChange(themeName));

    // 5. Apply initial theme to 3D world
    const initialTheme = this.themeManager.getCurrentTheme();
    this.handleThemeChange(initialTheme);

    // 6. Set up mouse tracking for 3D interactions
    this.setupMouseTracking();

    // 7. Wait for performance assessment, then adjust quality
    this.performanceMonitor.onQualityDetermined((quality) => {
      console.log(`📊 Performance tier: ${quality}`);
      this.setQuality(quality);
    });

    // 8. Start the loader animation, then reveal the site
    this.loader.simulateLoading(() => {
      this.onLoadComplete();
    });
  }

  /**
   * ── Initialize Three.js Scene ──
   * Sets up the 3D world with all objects and effects.
   */
  initScene() {
    try {
      // Core scene
      this.sceneManager = new SceneManager();
      this.sceneManager.init();

      // Camera with scroll-driven path
      this.camera = new Camera();
      this.sceneManager.setCamera(this.camera);

      // Lighting — addObject auto-adds the group to the scene
      this.lighting = new Lighting();
      this.sceneManager.addObject(this.lighting);

      // Environment (fog, atmospheric particles)
      this.environment = new Environment(this.sceneManager.getScene());
      this.sceneManager.addObject(this.environment);

      // Post-processing (bloom, etc.)
      this.postProcessing = new PostProcessing(
        this.sceneManager.getRenderer(),
        this.sceneManager.getScene(),
        this.camera.camera
      );
      // Wire post-processing into SceneManager so _tick() uses it
      this.sceneManager.postProcessing = this.postProcessing;

      // ── Create 3D Objects ──
      // Only subtle atmospheric objects — no terrain/arch clutter

      // Cherry blossom particle system
      this.cherryBlossoms = new CherryBlossoms(800);
      this.cherryBlossoms.camera = this.camera.camera;
      this.sceneManager.addObject(this.cherryBlossoms);

      // Start the render loop
      this.sceneManager.start();

      console.log('✅ 3D scene initialized');
    } catch (error) {
      console.warn('⚠️ 3D scene initialization failed, running in 2D mode:', error);
      // Portfolio still works without 3D — graceful degradation
    }
  }

  /**
   * ── Called When Loading Completes ──
   * Reveals the site and starts all interactions.
   */
  onLoadComplete() {
    console.log('🎬 Loading complete, revealing the experience...');

    // Initialize all interactions
    this.initInteractions();

    // Initialize all sections
    this.initSections();

    this.isInitialized = true;
    console.log('🌸 Portfolio fully initialized. Welcome, visitor!');
  }

  /**
   * ── Initialize Interactions ──
   * Custom cursor, scroll management, magnetic buttons, parallax.
   */
  initInteractions() {
    // Custom cursor (skip on touch devices)
    this.customCursor = new CustomCursor();
    this.customCursor.init();

    // Scroll manager — orchestrates all scroll-based animations
    this.scrollManager = new ScrollManager();
    this.scrollManager.init();

    // Connect scroll to camera
    this.scrollManager.onProgress((progress) => {
      if (this.camera) {
        this.camera.updateFromScroll(progress);
      }
    });

    // Magnetic buttons
    this.magneticButtons = new MagneticButtons();
    this.magneticButtons.init();

    // Parallax elements
    this.parallaxElements = new ParallaxElements();
    this.parallaxElements.init();

    // Mobile touch hover interactions
    this.mobileHover = new MobileHover();
    this.mobileHover.init();

    console.log('✅ Interactions initialized');
  }

  /**
   * ── Initialize Sections ──
   * Each section has its own scroll-triggered animations.
   */
  initSections() {
    this.hero = new Hero();
    this.hero.init();

    this.about = new About();
    this.about.init();

    this.projects = new Projects();
    this.projects.init();

    this.skills = new Skills();
    this.skills.init();

    this.mangaGallery = new MangaGallery();
    this.mangaGallery.init();

    this.experience = new Experience();
    this.experience.init();

    this.contact = new Contact();
    this.contact.init();

    console.log('✅ Sections initialized');
  }

  /**
   * ── Handle Theme Change ──
   * Updates the 3D world to match the selected theme.
   */
  handleThemeChange(themeName) {
    const colors = getThemeColors(themeName);
    if (!colors) return;

    console.log(`🎨 Switching theme to: ${themeName}`);

    // Update all 3D objects with new theme colors
    if (this.lighting) this.lighting.updateTheme(colors);
    if (this.environment) this.environment.updateTheme(colors);
    if (this.cherryBlossoms) this.cherryBlossoms.updateTheme(colors);
  }

  /**
   * ── Set Quality Level ──
   * Adjusts 3D complexity based on device performance.
   */
  setQuality(level) {
    if (this.sceneManager) this.sceneManager.setQuality(level);

    // Adjust particle counts based on quality — keep a high count for stunning aesthetics
    if (this.cherryBlossoms) {
      const intensityMap = { high: 1.0, medium: 0.8, low: 0.5 };
      this.cherryBlossoms.setIntensity(intensityMap[level] || 0.8);
    }

    console.log(`⚙️ Quality set to: ${level}`);
  }

  /**
   * ── Mouse Tracking ──
   * Feeds mouse position to camera parallax and object interactions.
   */
  setupMouseTracking() {
    if (isTouchDevice()) return;

    window.addEventListener('mousemove', (e) => {
      // Normalized -1 to 1
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Feed to camera for subtle parallax
      if (this.camera) {
        this.camera.addMouseParallax(this.mousePosition.x, this.mousePosition.y);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// Bootstrap — Start the experience when DOM is ready
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();

  // Expose for debugging in dev mode
  if (import.meta.env.DEV) {
    window.__portfolio = app;
  }
});
