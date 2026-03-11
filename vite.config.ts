import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    Buffer: ['buffer', 'Buffer'],
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: [
      'buffer',
      '@solana/web3.js',
      '@solana/spl-token',
      'bn.js',
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
