import { useEffect, useState } from 'react'

/**
 * `prefers-reduced-motion` 을 구독한다.
 *
 * 이 값이 true 이면 사이트는 스무스 스크롤, 스크롤 리빌, 3D 애니메이션을 모두 끄고
 * 정적인 문서로 동작한다. 설정을 도중에 바꿔도 즉시 반영된다.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * 기기 성능 등급. 3D 씬의 파티클 수와 픽셀 비율을 여기에 맞춘다.
 *
 * 벤치마크를 돌리지 않고 하드웨어 힌트만 본다. 정확하진 않지만
 * "저사양에서 무거운 씬을 띄우지 않는다"는 목적에는 충분하다.
 */
export type PerfTier = 'low' | 'mid' | 'high'

export function usePerfTier(): PerfTier {
  const [tier] = useState<PerfTier>(() => {
    if (typeof window === 'undefined') return 'mid'

    const cores = navigator.hardwareConcurrency ?? 4
    // deviceMemory 는 Chromium 계열에만 있다.
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const narrow = window.innerWidth < 768

    if (cores <= 4 || memory <= 4 || (coarse && narrow)) return 'low'
    if (cores >= 8 && memory >= 8 && !coarse) return 'high'
    return 'mid'
  })

  return tier
}

/** WebGL 컨텍스트를 만들 수 있는지 확인한다. 실패하면 3D 없이 렌더한다. */
export function useWebGLSupport(): boolean {
  const [supported] = useState(() => {
    if (typeof document === 'undefined') return false
    try {
      const canvas = document.createElement('canvas')
      return Boolean(
        canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
      )
    } catch {
      return false
    }
  })

  return supported
}
