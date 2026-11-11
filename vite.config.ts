import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/audio-stream/',
  plugins: [vue()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
