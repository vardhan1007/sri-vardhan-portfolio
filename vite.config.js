import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
});
