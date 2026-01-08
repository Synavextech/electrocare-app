import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// Vite config for React SPA with TS, PWA, Tailwind (per electro.md)
export default defineConfig({
  plugins: [react(), TanStackRouterVite()], // Merged/single plugins key; add more if needed (e.g., vite-plugin-pwa if automated PWA)
  base: '/', // For cPanel public_html root
  server: {
    port: 3000, // Local dev port
    open: true, // Auto-open browser in VS Code
  },
  build: {
    outDir: '../dist', // Build to root dist
    sourcemap: true, // For debugging
    chunkSizeWarningLimit: 1000, // Larger chunks ok for code splitting
  },
  resolve: {
    alias: {
      '@': '/src', // Optional: For easier imports (e.g., import from '@/components')
    },
  },
  envPrefix: 'VITE_', // For .env vars (VITE_API_BASE_URL, etc.)
});