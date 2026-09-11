import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// GitHub Pages project site: set BASE_PATH=/hk-commute-fare/ at build time.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  test: {
    // Day3：元件測試需要 DOM。domain 純函式在 jsdom 下也可跑（已驗證全綠）。
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
