import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',     // installed apps auto-pull new web builds
      injectRegister: null,           // we register manually in main.jsx
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Famba Fleet - Driver',
        short_name: 'Famba Driver',
        description: 'Famba Fleet driver app - start trips, live tracking, report faults.',
        theme_color: '#0f766e',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/driver',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      devOptions: { enabled: true, type: 'module' },  // lets us test the SW in `npm run dev`
    }),
  ],
  server: { port: 5182, host: true },
  // Native-only Capacitor plugin: keep it out of the web bundle. It is loaded via
  // a dynamic import that only runs on a native build, where Capacitor resolves it.
  build: { rollupOptions: { external: ['@capacitor-community/background-geolocation'] } },
})
