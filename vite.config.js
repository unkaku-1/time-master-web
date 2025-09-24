import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwind from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 优化构建性能
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // 提高chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  // 优化开发服务器
  server: {
    host: true,
    port: 3000,
  },
  // 预览服务器配置
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
