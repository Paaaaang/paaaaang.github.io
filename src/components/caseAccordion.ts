import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 경험을 여는 신호.
 *
 * 경험은 Project Summary 목록 아래 한 칸에서 한 번에 하나만 열린다.
 * About 의 "Case 0N" 링크, 목록의 CASE 줄, 레일 목차, 경험 끝의 "다음" 버튼이
 * 모두 이 신호로 그 경험을 연 다음 그 경험 머리로 이동한다.
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
