import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useMotionPreference'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/* Reveal — 뷰포트 진입 시 한 번 올라오며 나타난다                        */
/* ------------------------------------------------------------------ */

type RevealProps = {
  children: ReactNode
  /** 같은 부모 안의 여러 Reveal 을 순차로 띄울 때의 지연(초). */
  delay?: number
  /** 자식 요소를 각각 스태거로 올릴지 여부. */
  stagger?: boolean
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'footer'
}

export function Reveal({
  children,
  delay = 0,
  stagger = false,
  className,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 모션을 끈 사용자에게는 최종 상태를 즉시 적용한다.
    if (reduced) {
      const targets = stagger ? Array.from(el.children) : [el]
      gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' })
      return
    }

    const targets = stagger ? Array.from(el.children) : [el]

    const tween = gsap.fromTo(
      targets,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'expo.out',
        stagger: stagger ? 0.07 : 0,
        scrollTrigger: {
          trigger: el,
          // 요소 윗부분이 화면 아래에서 15% 정도 올라왔을 때 시작한다.
          start: 'top 85%',
          once: true,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [delay, stagger, reduced])

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={[stagger ? undefined : 'will-reveal', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------ */
/* ChapterAccent — 스크롤이 이 섹션에 들어오면 전역 강조색을 바꾼다        */
/* ------------------------------------------------------------------ */

export function useChapterAccent(
  ref: React.RefObject<HTMLElement | null>,
  color: string | null,
) {
  useEffect(() => {
    const el = ref.current
    // null 이면 색을 건드리지 않는다. 안쪽 요소가 직접 색을 정하는 챕터용.
    if (!el || !color) return

    const apply = () => {
      // 색 전환 자체는 CSS transition 으로 처리해 매 프레임 쓰기를 피한다.
      document.documentElement.style.setProperty('--accent', color)
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: apply,
      onEnterBack: apply,
    })

    return () => trigger.kill()
  }, [ref, color])
}

/* ------------------------------------------------------------------ */
/* CountUp — 지표 숫자를 세어 올린다                                     */
/* ------------------------------------------------------------------ */

export function CountUp({
  to,
  suffix = '',
  className,
}: {
  to: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (reduced || to === 0) {
      el.textContent = `${to}${suffix}`
      return
    }

    const state = { value: 0 }
    el.textContent = `0${suffix}`

    const tween = gsap.to(state, {
      value: to,
      duration: 1.6,
      ease: 'expo.out',
      onUpdate: () => {
        el.textContent = `${Math.round(state.value)}${suffix}`
      },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [to, suffix, reduced])

  // 애니메이션이 돌기 전에도 스크린 리더와 크롤러는 최종 값을 읽는다.
  return (
    <span ref={ref} className={className} aria-label={`${to}${suffix}`}>
      {to}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* ScrubbedWords — 스크롤에 맞춰 문장이 어절 단위로 또렷해진다            */
/* ------------------------------------------------------------------ */

export function ScrubbedWords({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduced = useReducedMotion()

  // 한글은 어절(공백) 단위로 끊어야 줄바꿈이 자연스럽다.
  const words = text.split(' ')

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    const spans = el.querySelectorAll('[data-word]')

    const tween = gsap.fromTo(
      spans,
      { opacity: 0.18 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.5,
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          end: 'bottom 45%',
          scrub: 0.6,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [text, reduced])

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} data-word style={{ opacity: reduced ? 1 : undefined }}>
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  )
}
