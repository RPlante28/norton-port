import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base:'./' emits RELATIVE asset URLs so the built site works whether it's
// dropped at the domain root (public_html/) or in a subfolder on GoDaddy.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // The portfolio content/engine files (content.js, animations.js,
    // cpu6502.js) live in public/ and are loaded as classic scripts, so they
    // are copied verbatim into dist/ — no bundling, easy to edit post-build.
    emptyOutDir: true,
  },
});
