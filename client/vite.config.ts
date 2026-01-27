import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

// Vite config for React SPA with TS, PWA, Tailwind (per electro.md)
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ElectroCare TECH',
        short_name: 'ElectroCare',
        description: 'Precision. Reliability. Excellence. Precision repair and marketplace for your devices.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
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