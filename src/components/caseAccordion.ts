import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 경험 아코디언을 바깥에서 여는 신호.
 *
 * About 의 Experience 링크, 타임라인의 Detail, 레일 목차가 경험으로 이동할 때
 * 접혀 있으면 먼저 펼친 다음 이동한다. 접힌 채로 이동하면 요약에서 멈춰
 * 사용자가 무엇을 누른 건지 헷갈린다.
 */
export const OPEN_CASE_EVENT = 'case:open'

export function revealCase(id: string) {
  window.dispatchEvent(new CustomEvent<string>(OPEN_CASE_EVENT, { detail: id }))
  // 펼친 내용이 그려진 다음 위치를 다시 재고 이동한다.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      scrollToSection(id)
    }),
  )
}
