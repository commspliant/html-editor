import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const distDir = path.resolve(__dirname, '../dist')

function copyIndexTo404() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      const index = path.join(distDir, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(distDir, '404.html'))
      }
    },
  }
}

export default defineConfig({
  root: path.resolve(__dirname),
  base: '/',
  plugins: [react(), copyIndexTo404()],
  resolve: {
    alias: {
      'commspliant-html-editor': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  build: {
    outDir: distDir,
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
