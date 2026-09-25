import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@edu/shared': fileURLToPath(new URL('../../libs/shared/src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5173, host: true },
  build: {
    target: 'es2022',
    // `three` (~340 kB gzip) is only fetched lazily when a 3D scene is shown
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['motion'],
          query: ['@tanstack/react-query', 'zustand'],
          avatar: ['@dicebear/core', '@dicebear/toon-head'],
        },
      },
    },
  },
});
