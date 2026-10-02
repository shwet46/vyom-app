import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // The root .env is shared by the frontend and backend.
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const apiUrl = (process.env.VITE_API_URL || env.PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const apiBase = `${apiUrl}/api/v1`;

  return {
    envDir: path.resolve(__dirname, '../..'),
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiBase),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg', 'offline.html'],
        manifest: {
          id: '/',
          name: 'VYOM - Kirana AI Saathi',
          short_name: 'VYOM',
          description: 'AI teammate for Paytm merchants to recover lost revenue from silent churn, dead hours, and pending udhaar.',
          theme_color: '#2597d0',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['business', 'finance', 'productivity'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: '/index.html',
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
