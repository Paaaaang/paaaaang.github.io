import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** 전역 Lenis 인스턴스. 3D 씬이 스크롤 진행도를 읽을 때 쓴다. */
let lenisInstance: Lenis | null = null
export const getLenis = () => lenisInstance

/**
 * Lenis 스무스 스크롤을 켜고 GSAP ScrollTrigger 와 동기화한다.
 *
 * 둘을 각자 두면 ScrollTrigger 가 네이티브 스크롤 위치를 보고 Lenis 는 보간된
 * 위치를 그려서 한 프레임씩 어긋난다. Lenis 의 tick 을 GSAP ticker 에 물려
 * 한 루프 안에서 돌린다.
 *
 * `enabled` 가 false 면(모션 축소 선호) 아무것도 하지 않고 네이티브 스크롤을 쓴다.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      ScrollTrigger.refresh()
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      // 끝에서 부드럽게 감속. 관성이 과하면 콘텐츠를 읽기 어렵다.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // 터치는 네이티브 스크롤이 더 자연스럽고 배터리에도 낫다.
      syncTouch: false,
    })
    lenisInstance = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [enabled])
}

/** 고정 상단 바 높이. 앵커로 이동할 때 이만큼 위를 비워 둔다. */
const HEADER_OFFSET = 72

/** 앵커 이동. Lenis 가 있으면 Lenis 로, 없으면 네이티브로 스크롤한다. */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return

  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.2 })
  } else {
    // 고정 바에 제목이 가리지 않도록 직접 계산해서 이동한다.
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'auto' })
  }
}
