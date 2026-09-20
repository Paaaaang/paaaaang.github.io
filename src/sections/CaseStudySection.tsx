import { useRef } from 'react'
import type { CaseStudy } from '../content/profile'
import { Reveal, useChapterAccent } from '../components/motion'
import { MediaGallery } from '../components/MediaFrame'

/**
 * 케이스 스터디 한 챕터.
 *
 * 구조는 이력서의 서술 순서를 그대로 따른다.
 * 문제 상황 → 이슈 해결 → 주요 성과 → 배운 점.
 * 기획자가 실제로 쓰는 문서 구조라 읽는 사람이 예측 가능하다.
 */
export function CaseStudySection({ study }: { study: CaseStudy }) {
  const ref = useRef<HTMLElement>(null)
  useChapterAccent(ref, study.accent)

  return (
    <section
      ref={ref}
      id={study.id}
      className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32"
      aria-labelledby={`${study.id}-title`}
    >
      <div className="mx-auto max-w-6xl">
        {/* ---- 챕터 헤더 ---- */}
        <div className="rule pt-10">
          <Reveal>
            <div className="flex items-baseline gap-5">
              <span
                className="font-mono text-sm tracking-[0.2em] tnum"
                style={{ color: study.accent }}
              >
                {study.index}
              </span>
              <span className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
                {study.kicker}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2
              id={`${study.id}-title`}
              className="mt-7 max-w-[20ch] text-chapter"
            >
              {study.title}
            </h2>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="measure mt-8 text-lede leading-[1.75] text-paper-dim">
              {study.summary}
            </p>
          </Reveal>

          <Reveal delay={0.2} stagger className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <span className="text-paper-faint">
              <span className="text-paper-dim">{study.org}</span>
            </span>
            <span className="text-paper-faint">{study.role}</span>
            <span className="text-paper-faint tnum">{study.period}</span>
          </Reveal>
        </div>

        {/* ---- 본문: 문제 / 실행 ---- */}
        <div className="mt-20 grid gap-16 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
                문제 상황
              </h3>
            </Reveal>
            <Reveal stagger className="mt-6 space-y-4">
              {study.problem.map((line) => (
                <p key={line} className="text-sm leading-[1.8] text-paper-dim">
                  {line}
                </p>
              ))}
            </Reveal>
          </div>

          <div>
            <Reveal>
              <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
                해결 과정
              </h3>
            </Reveal>

            <ol className="mt-8 space-y-12">
              {study.actions.map((action, i) => (
                <Reveal as="li" key={action.heading} delay={i * 0.04}>
                  <div className="flex gap-5">
                    <span
                      className="mt-[0.4rem] h-px w-8 shrink-0"
                      style={{ background: study.accent }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold tracking-[-0.02em]">
                        {action.heading}
                      </h4>
                      <p className="measure mt-3 leading-[1.85] text-paper-dim">
                        {action.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>

        {/* ---- 성과 ---- */}
        <div className="rule mt-24 pt-10">
          <Reveal>
            <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
              주요 성과
            </h3>
          </Reveal>
          <Reveal
            stagger
            className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
          >
            {study.results.map((result) => (
              <div key={result.label}>
                <p
                  className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold tracking-[-0.04em] tnum leading-none"
                  style={{ color: study.accent }}
                >
                  {result.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                  {result.label}
                </p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* ---- 자료 (아키텍처 / 화면 설계 / 발표 자료 / 현장 사진) ---- */}
        <MediaGallery slots={study.media} />

        {/* ---- 배운 점 ---- */}
        <Reveal>
          <blockquote className="mt-20 border-l-2 pl-7" style={{ borderColor: study.accent }}>
            <p className="measure text-lede leading-[1.7] text-paper">
              {study.learning}
            </p>
            <footer className="mt-4 font-mono text-[0.68rem] tracking-[0.2em] text-paper-faint uppercase">
              배운 점
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  )
}
