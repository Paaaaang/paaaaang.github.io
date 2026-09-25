import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import {
  usePerfTier,
  useReducedMotion,
  useWebGLSupport,
} from '../hooks/useMotionPreference'

/**
 * 고정 배경 레이어. 문서 전체 뒤에 한 장만 깔린다.
 *
 * 3D는 여기 한 곳에만 있다. 섹션마다 캔버스를 띄우면 컨텍스트가 늘어나고
 * 모바일에서 먼저 무너진다.
 */

/**
 * 문서 스크롤 진행도를 읽어 두 값으로 나눈다.
 *
 * - progress: 흩어짐(0) → 정렬(1). 첫 화면을 벗어나기 전에 끝난다.
 * - visibility: 배경의 존재감. 정렬이 끝나면 옅어진다.
 *
 * 정렬은 히어로에서 보여주는 장면이다. 케이스 스터디를 읽는 동안에도
 * 배경이 같은 세기로 깔려 있으면 본문 대비가 떨어져서 글이 안 읽힌다.
 * 할 말을 마친 배경은 물러나야 한다.
 */
function useScrollProgress(
  target: React.MutableRefObject<number>,
  visibility: React.MutableRefObject<number>,
) {
  useEffect(() => {
    let frame = 0

    const read = () => {
      // 문서 비율로 재면 챕터가 늘 때마다 시점이 밀린다. 화면 높이로 잰다.
      const vh = window.innerHeight || 1
      const y = window.scrollY

      // 첫 화면을 0.9화면만큼 내리는 동안 정렬이 끝난다.
      target.current = Math.min(1, y / (vh * 0.9))

      // 한 화면까지는 온전히 보이고, 1.8화면에 이르면 0.2 까지 내려간다.
      // About 을 읽을 무렵에는 이미 물러나 있다.
      const fade = Math.min(1, Math.max(0, (y - vh) / (vh * 0.8)))
      visibility.current = 1 - fade * 0.8

      frame = 0
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [target, visibility])
}

/** 현재 챕터 색을 CSS 변수(--accent)에서 읽어 3D 씬으로 넘긴다. */
function useAccentColor(target: React.MutableRefObject<THREE.Color>) {
  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      if (value) {
        try {
          target.current.set(value)
        } catch {
          /* 파싱 실패 시 이전 색을 유지한다 */
        }
      }
    }

    read()
    // GSAP 이 --accent 를 바꾸므로 인라인 style 변화를 관찰한다.
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
    return () => observer.disconnect()
  }, [target])
}

export function SceneCanvas() {
  const reduced = useReducedMotion()
  const tier = usePerfTier()
  const supported = useWebGLSupport()

  const progress = useRef(0)
  const visibility = useRef(1)
  const accent = useRef(new THREE.Color('#e8542f'))

  useScrollProgress(progress, visibility)
  useAccentColor(accent)

  // WebGL이 없으면 조용히 빠진다. 콘텐츠는 그대로 읽힌다.
  if (!supported) return <StaticBackdrop />

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
      // 배경이 본문 대비를 떨어뜨리지 않도록 전체적으로 눌러둔다.
      style={{ opacity: 0.55 }}
    >
      <Canvas
        // 레티나에서 2를 넘기면 파티클 렌더 비용만 커지고 차이는 거의 없다.
        dpr={[1, tier === 'low' ? 1.25 : 1.75]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 40 }}
        // 모션을 끈 사용자에게는 정렬된 최종 상태를 한 번만 그린다.
        frameloop={reduced ? 'demand' : 'always'}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0)
        }}
      >
        <Suspense fallback={null}>
          <ParticleField
            progressRef={reduced ? { current: 1 } : progress}
            visibilityRef={reduced ? { current: 0.22 } : visibility}
            accentRef={accent}
            tier={tier}
            animate={!reduced}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

/** WebGL을 못 쓸 때의 대체 배경. 아무것도 없는 검정보다는 낫다. */
function StaticBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden="true"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 14%, transparent) 0%, transparent 62%)',
      }}
    />
  )
}
