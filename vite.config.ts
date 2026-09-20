import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 레포를 Paaaaang.github.io 로 변경하면 루트(/)로 배포된다.
// 하위 경로 배포가 필요하면 VITE_BASE=/pioh.github.io/ 로 빌드한다.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // 3D 번들을 본문과 분리해 첫 화면이 three.js 파싱을 기다리지 않게 한다.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('@react-three')) return 'three'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/motion'))
            return 'motion'
          return undefined
        },
      },
    },
  },
})
