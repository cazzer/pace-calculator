import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/embed.tsx',
      name: 'PaceCalculator',
      fileName: 'pace-calculator',
      formats: ['iife'], // Immediately Invoked Function Expression for embedding
    },
    rollupOptions: {
      external: [], // Don't externalize anything - bundle everything
      output: {
        globals: {},
      },
    },
  },
})
