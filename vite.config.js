import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-classic-script',
      closeBundle() {
        copyFileSync(resolve(import.meta.dirname, 'script.js'), resolve(import.meta.dirname, 'dist/script.js'))
        copyFileSync(resolve(import.meta.dirname, 'pay.js'), resolve(import.meta.dirname, 'dist/pay.js'))
      },
    },
  ],
  publicDir: 'output_이미지에셋',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        pay: resolve(import.meta.dirname, 'pay.html'),
      },
    },
  },
})
