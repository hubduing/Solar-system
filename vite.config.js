import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://hubduing.github.io/Solar-system/
export default defineConfig({
  plugins: [react()],
  base: '/Solar-system/',
})
