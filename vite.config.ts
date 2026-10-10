import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The app always calls relative /api and /healthz, so it behaves the same in
// dev (proxied to `wera serve`, :8080 unless WERA_API says otherwise), behind
// nginx, and behind Vercel rewrites.
// Node's process, typed here so the config needs no @types/node.
declare const process: { env: Record<string, string | undefined> };
const api = process.env.WERA_API ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': api,
      '/healthz': api,
    },
  },
});
