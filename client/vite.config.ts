import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

let commitId = 'dev-latest'
try {
  commitId = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // Silent fail in non-git environments
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __GIT_COMMIT_ID__: JSON.stringify(commitId),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['recharts', 'react-is'],
  },
})
