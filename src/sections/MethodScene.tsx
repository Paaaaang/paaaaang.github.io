import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { method } from '../content/profile'
import { Reveal } from '../components/motion'
import { MaskedLines, MOTION } from '../components/scroll'
import { ChapterMark } from '../components/Chapter'
import { useReducedMotion } from '../hooks/useMotionPreference'

gsap.registerPlugin(ScrollTrigger)

/**
 * "일하는 순서" — 핀 고정 시퀀스.
 *
 * 이 사이트에서 화면을 붙잡아 두는 구간은 여기 하나뿐이다.
 * 다섯 단계가 순서를 가진 절차라서, 스크롤을 그 순서에 물리는 것이
 * 내용과 맞는다. 카드 다섯 장을 늘어놓으면 순서가 아니라 목록으로 읽힌다.
 *
 * 좁은 화면과 모션 축소 설정에서는 핀을 걸지 않고 평범하게 쌓는다.
 * 작은 화면에서 긴 핀 구간은 "스크롤이 멈췄다"는 오해를 만든다.
 */
export function MethodScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    // 핀은 넓은 화면에서만. matchMedia 로 걸어야 창 크기가 바뀔 때
    // GSAP 이 알아서 되돌린다.
    const mm = gsap.matchMedia()

    mm.add(
      {
        wide: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      },
      (ctx) => {
        if (!ctx.conditions?.wide) return
        setPinned(true)

        const steps = method.steps.length

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            // 단계 하나당 한 화면 높이씩 스크롤을 배정한다.
            end: () => `+=${window.innerHeight * (steps - 1) * 0.9}`,
            scrub: MOTION.scrub,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const index = Math.min(steps - 1, Math.round(self.progress * (steps - 1)))
              // 값이 바뀔 때만 상태를 건드린다. 매 프레임 setState 하면
              // 섹션 전체가 다시 그려지고 제목 애니메이션이 처음부터 다시 돈다.
              setActive((prev) => (prev === index ? prev : index))
            },
          },
        })

        // 트랙을 가로로 밀어 현재 단계만 화면에 남긴다.
        tl.to(track, {
          xPercent: -100 * (steps - 1),
          ease: 'none',
        })

        return () => setPinned(false)
      },
    )

    return () => mm.revert()
  }, [reduced])

  const steps = method.steps

  return (
    <section
      ref={sectionRef}
      id="method"
      aria-label="How I Work"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 py-24 sm:px-10 lg:px-16 lg:py-0"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-y-10 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-x-14">
        <aside>
          <ChapterMark index="04" label="How I Work" />
        </aside>

        <div className="min-w-0">
        {/* ---- 머리말 ---- */}
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
          <MaskedLines lines={['일하는 순서']} className="text-chapter" as="h2" />

          <Reveal delay={0.1}>
            <p className="measure mt-6 text-[0.94rem] leading-[1.75] text-paper-dim lg:mt-0 lg:max-w-[36ch] lg:text-right">
              {method.intro}
            </p>
          </Reveal>
        </div>

        {/* ---- 진행 막대 (핀 구간에서만) ---- */}
        {pinned && (
          <div className="rule mt-14 hidden lg:block">
            <ol className="flex gap-px bg-ink-line" aria-hidden="true">
              {steps.map((step, i) => (
                <li key={step.n} className="flex-1 bg-ink pt-4">
                  <span
                    className="block h-px w-full origin-left transition-transform duration-500"
                    style={{
                      background: i <= active ? 'var(--accent)' : 'var(--color-ink-line)',
                      transform: `scaleX(${i <= active ? 1 : 0.999})`,
                    }}
                  />
                  <span
                    className="mt-3 block font-mono text-[0.66rem] tracking-[0.18em] tnum transition-colors duration-500"
                    style={{
                      color: i === active ? 'var(--accent)' : 'var(--color-paper-faint)',
                    }}
                  >
                    {step.n}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ---- 단계 ---- */}
        <div className={pinned ? 'mt-12 overflow-hidden' : 'mt-14'}>
          <ol
            ref={trackRef}
            className={
              pinned
                ? 'flex w-full will-change-transform'
                : 'grid gap-px bg-ink-line md:grid-cols-2 lg:grid-cols-5'
            }
          >
            {steps.map((step, i) => (
              <li
                key={step.n}
                className={pinned ? 'w-full shrink-0' : ''}
                aria-current={pinned && i === active ? 'step' : undefined}
              >
                {pinned ? (
                  <div
                    className="transition-opacity duration-500"
                    style={{ opacity: i === active ? 1 : 0.25 }}
                  >
                    <span
                      className="block font-mono text-sm tracking-[0.24em] tnum"
                      style={{ color: 'var(--accent)' }}
                    >
                      {step.n}
                    </span>
                    <h3 className="mt-6 max-w-[14ch] text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.06] font-bold tracking-[-0.04em]">
                      {step.label}
                    </h3>
                    <p className="measure mt-7 text-lede leading-[1.75] text-paper-dim">
                      {step.body}
                    </p>
                  </div>
                ) : (
                  <Reveal delay={i * 0.05}>
                    <div className="flex h-full flex-col bg-ink px-6 py-9">
                      <span
                        className="font-mono text-xs tracking-[0.2em] tnum"
                        style={{ color: 'var(--accent)' }}
                      >
                        {step.n}
                      </span>
                      <h3 className="mt-5 text-base font-bold tracking-[-0.02em]">
                        {step.label}
                      </h3>
                      <p className="mt-3 text-sm leading-[1.8] text-paper-dim">{step.body}</p>
                    </div>
                  </Reveal>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* 핀 구간에서는 스크롤이 멈춘 게 아니라는 신호가 필요하다. */}
        {pinned && (
          <p
            className="mt-12 hidden font-mono text-[0.64rem] tracking-[0.2em] text-paper-faint uppercase lg:block"
            aria-hidden="true"
          >
            스크롤 — {String(active + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </p>
        )}
        </div>
      </div>
    </section>
  )
}
