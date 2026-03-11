import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    modulePreload: { polyfill: true },
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@tanstack/react-router') || id.includes('node_modules/@tanstack/router-core')) {
            return 'vendor-router'
          }
          if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/@tanstack/query')) {
            return 'vendor-query'
          }
          if (id.includes('node_modules/@base-ui/react') || id.includes('node_modules/sonner') || id.includes('node_modules/@floating-ui')) {
            return 'vendor-ui'
          }
          if (id.includes('node_modules/zod')) {
            return 'vendor-zod'
          }
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'vendor-forms'
          }
          if (id.includes('node_modules/zustand') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge') || id.includes('node_modules/class-variance-authority')) {
            return 'vendor-utils'
          }
          if (id.includes('node_modules/better-auth')) {
            return 'vendor-auth'
          }
        },
      },
    },
  },
})