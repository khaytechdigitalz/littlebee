import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // public/ is repurposed as AdonisJS's static-serving root (it already
  // holds public/uploads/* for KYC docs and payment receipts) rather than
  // Vite's own static-passthrough folder, so disable that convention...
  publicDir: false,

  build: {
    // ...and instead build the frontend bundle straight into public/, which
    // is what @adonisjs/static serves and what the SPA-fallback route in
    // start/routes.ts reads index.html from.
    outDir: 'public',
    // Never wipe public/uploads/* (real user-uploaded files) on a rebuild.
    emptyOutDir: false,
    assetsDir: 'assets',
  },

  server: {
    port: 5174,
    // In dev, Vite serves the React app on :5173 with HMR while AdonisJS
    // runs the API on :3333 (via `node ace serve --hmr`, started alongside
    // this by `npm run dev`). Proxying keeps every request same-origin from
    // the browser's point of view, so no CORS config or absolute API URL is
    // ever needed in the frontend code.
    proxy: {
      '/api': 'http://localhost:3333',
      '/uploads': 'http://localhost:3333',
    },
  },
})
