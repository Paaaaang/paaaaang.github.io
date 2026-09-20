import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useMotionPreference'

gsap.registerPlugin(ScrollTrigger)

/**
 * 스크롤 모션 프리미티브.
 *
 * 기준값은 한 곳에 모아 둔다. 섹션마다 다른 duration 과 ease 를 쓰면
 * 사이트 전체가 한 사람이 만든 것처럼 보이지 않는다.
 */
export const MOTION = {
  ease: 'power4.out',
  reveal: 0.95,
  /** 스크롤에 물린 움직임의 지연. 낮으면 딱딱하고, 높으면 늘어진다. */
  scrub: 1.1,
  start: 'top 82%',
  lineStagger: 0.11,
  wordStagger: 0.055,
} as const

/* ------------------------------------------------------------------ */
/* MaskedLines — 줄 단위 마스크 리빌                                    */
/* ------------------------------------------------------------------ */

/**
 * 각 줄을 넘치는 영역을 잘라낸 상자에 넣고 아래에서 밀어 올린다.
 *
 * 단순 페이드보다 인쇄물이 넘어가는 느낌에 가깝고, 줄바꿈 위치를 직접
 * 정하므로 한글 어절이 어색하게 끊기지 않는다.
 *
 * 접근성: 보이는 줄들은 `aria-hidden` 이고, 원문 전체를 `aria-label` 로
 * 한 번 더 제공한다. 스크린리더는 끊김 없이 한 문장으로 읽는다.
 */
export function MaskedLines({
  lines,
  className,
  lineClassName,
  as: Tag = 'h2',
  delay = 0,
}: {
  lines: string[]
  className?: string
  lineClassName?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  delay?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.querySelectorAll('[data-line]')

    if (reduced) {
      gsap.set(targets, { yPercent: 0, opacity: 1 })
      return
    }

    const tween = gsap.fromTo(
      targets,
      { yPercent: 108, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        delay,
        ease: MOTION.ease,
        stagger: MOTION.lineStagger,
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [lines, delay, reduced])

  return (
    <Tag ref={ref as React.Ref<never>} className={className} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span
          key={`${line}-${i}`}
          aria-hidden="true"
          className="block overflow-hidden pb-[0.08em]"
        >
          <span data-line className={`block ${lineClassName ?? ''}`}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}

/* ------------------------------------------------------------------ */
/* Parallax — 배경이 본문보다 천천히 흐른다                              */
/* ------------------------------------------------------------------ */

/**
 * 요소를 스크롤 속도보다 느리게 움직여 깊이를 만든다.
 *
 * 폭을 의도적으로 좁게 둔다(기본 6%). 크게 움직이면 화면이 흔들리는 것처럼
 * 보이고, 자료 이미지 위에서는 내용을 읽기 어려워진다.
 */
export function useParallax(
  ref: React.RefObject<HTMLElement | null>,
  { speed = 0.06, enabled = true }: { speed?: number; enabled?: boolean } = {},
) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || !enabled) return

    const tween = gsap.fromTo(
      el,
      { yPercent: speed * 100 },
      {
        yPercent: -speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: MOTION.scrub,
          invalidateOnRefresh: true,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [ref, speed, enabled, reduced])
}

/* ------------------------------------------------------------------ */
/* ClipReveal — 아래에서 위로 걷어내는 등장                              */
/* ------------------------------------------------------------------ */

export function ClipReveal({
  children,
  className,
  duration = 1.05,
}: {
  children: ReactNode
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (reduced) {
      gsap.set(el, { clipPath: 'none', opacity: 1 })
      return
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: MOTION.start, once: true },
    })

    tl.fromTo(
      el,
      { clipPath: 'inset(0% 0% 100% 0%)', opacity: 1 },
      { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: MOTION.ease },
    ).fromTo(
      el.querySelector('img'),
      { scale: 1.07 },
      { scale: 1, duration: duration + 0.15, ease: MOTION.ease },
      0,
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [duration, reduced])

  return (
    <div ref={ref} className={className} style={{ willChange: 'clip-path' }}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cursor — 포인터를 따라오는 작은 원                                    */
/* ------------------------------------------------------------------ */

/**
 * 커스텀 커서.
 *
 * 장식이 아니라 "무엇을 누를 수 있는지"를 보조하는 용도다.
 * `data-cursor-label` 이 달린 요소 위에서는 커서가 커지고 라벨을 띄운다.
 * 터치 기기와 모션 축소 설정에서는 아예 렌더하지 않는다.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    const label = labelRef.current
    if (!dot || !label) return

    gsap.set(dot, { opacity: 0 })

    // quickTo 는 매 이벤트마다 트윈을 새로 만들지 않아 포인터 추적에 적합하다.
    const xTo = gsap.quickTo(dot, 'x', { duration: 0.38, ease: 'power3.out' })
    const yTo = gsap.quickTo(dot, 'y', { duration: 0.38, ease: 'power3.out' })

    let shown = false
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!shown) {
        gsap.to(dot, { opacity: 1, duration: 0.3 })
        shown = true
      }
      xTo(e.clientX)
      yTo(e.clientY)
    }

    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-cursor-label]',
      )
      if (target) {
        label.textContent = target.dataset.cursorLabel ?? ''
        gsap.to(dot, { scale: 3.4, duration: 0.4, ease: 'power3.out' })
      } else {
        label.textContent = ''
        gsap.to(dot, { scale: 1, duration: 0.4, ease: 'power3.out' })
      }
    }

    const onLeave = () => {
      gsap.to(dot, { opacity: 0, duration: 0.25 })
      shown = false
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full mix-blend-difference lg:flex"
      style={{ background: '#e9e5dd', willChange: 'transform' }}
    >
      <span
        ref={labelRef}
        className="absolute text-[0.2rem] font-bold tracking-[0.04em] whitespace-nowrap text-ink"
      />
    </div>
  )
}
