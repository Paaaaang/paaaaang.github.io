import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { caseStudies, type CaseStudy } from '../content/profile'
import { Chapter, Row } from '../components/Chapter'
import { Reveal, useChapterAccent } from '../components/motion'
import { MaskedLines } from '../components/scroll'
import { MediaGallery } from '../components/MediaFrame'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 02 Selected Work — 대표 경험 세 가지.
 *
 * 세 경험 모두 같은 순서로 읽힌다.
 * 문제 → 목표 → 핵심 결정 → 자료 → 결과 → 회고.
 * 기획자가 실제로 쓰는 문서 순서라 읽는 사람이 다음에 무엇이 올지 안다.
 * 그래야 경험끼리 비교가 되고 3분 안에 하나를 끝까지 읽는다.
 *
 * 왼쪽 레일에는 세 경험이 목차로 붙어 있고 지금 읽는 경험에 불이 들어온다.
 */
export function SelectedWork() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const triggers = caseStudies.map((study, i) =>
      ScrollTrigger.create({
        trigger: `#${study.id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) setActive((prev) => (prev === i ? prev : i))
        },
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <Chapter
      id="work"
      index="02"
      label="Selected Work"
      title={['대표 경험 세 가지']}
      intro="요청을 다시 정의한 일, 운영을 구조로 바꾼 일, 기술의 한계를 문제로 잡은 일입니다. 셋 다 같은 순서로 정리했습니다."
      accent={null}
      rail={<CaseRail active={active} />}
    >
      {/* 좁은 화면에는 레일이 없어서 목차를 본문 머리에 둔다. */}
      <Reveal stagger className="mt-12 lg:hidden">
        {caseStudies.map((study) => (
          <button
            key={study.id}
            type="button"
            onClick={() => scrollToSection(study.id)}
            className="rule flex w-full items-baseline gap-4 py-4 text-left"
          >
            <span className="font-mono text-xs tnum" style={{ color: study.accent }}>
              {study.index}
            </span>
            <span className="text-[0.95rem] font-bold tracking-[-0.02em]">{study.short}</span>
            <span aria-hidden="true" className="ml-auto text-paper-faint">
              ↓
            </span>
          </button>
        ))}
      </Reveal>

      <div className="mt-20 space-y-36 lg:mt-28 lg:space-y-48">
        {caseStudies.map((study) => (
          <CaseArticle key={study.id} study={study} />
        ))}
      </div>
    </Chapter>
  )
}

/** 레일 목차. 지금 읽는 경험의 번호에 챕터 색이 들어온다. */
function CaseRail({ active }: { active: number }) {
  return (
    <nav aria-label="대표 경험 목차" className="mt-10 hidden lg:block">
      <ol className="space-y-1">
        {caseStudies.map((study, i) => {
          const on = i === active
          return (
            <li key={study.id}>
              <button
                type="button"
                onClick={() => scrollToSection(study.id)}
                aria-current={on ? 'true' : undefined}
                className="group flex w-full items-center gap-3 py-2 text-left"
              >
                <span
                  aria-hidden="true"
                  className="h-px shrink-0 transition-all duration-500"
                  style={{
                    width: on ? '1.5rem' : '0.75rem',
                    background: on ? study.accent : 'var(--color-ink-line)',
                  }}
                />
                <span
                  className="font-mono text-[0.7rem] tnum transition-colors duration-500"
                  style={{ color: on ? study.accent : 'var(--color-paper-faint)' }}
                >
                  {study.index}
                </span>
                <span
                  className={`text-[0.8rem] leading-snug transition-colors duration-500 ${
                    on ? 'text-paper' : 'text-paper-faint group-hover:text-paper-dim'
                  }`}
                >
                  {study.short}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * 긴 제목을 두 줄로 나눈다. 어절 경계에서만 자르고 앞줄이 조금 길게
 * 중간보다 뒤에서 끊는다. 뒷줄이 짧아야 제목이 안정적으로 읽힌다.
 */
function splitTitle(title: string): string[] {
  const words = title.split(' ')
  if (words.length < 4) return [title]
  const cut = Math.ceil(words.length * 0.55)
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
}

/** 경험 하나. 모든 경험이 같은 행 순서를 쓴다. */
function CaseArticle({ study }: { study: CaseStudy }) {
  const ref = useRef<HTMLElement>(null)
  useChapterAccent(ref, study.accent)

  return (
    <article ref={ref} id={study.id} aria-label={study.title} className="scroll-mt-24">
      {/* ---- 머리 ---- */}
      <header>
        <Reveal>
          <div className="flex items-baseline gap-5">
            <span
              className="text-[clamp(2.75rem,6vw,4.75rem)] leading-none font-bold tracking-[-0.05em] tnum"
              style={{ color: study.accent }}
            >
              {study.index}
            </span>
            <span className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
              {study.kicker}
            </span>
          </div>
        </Reveal>

        <MaskedLines
          lines={splitTitle(study.title)}
          className="mt-8 max-w-[20ch] text-chapter"
          as="h3"
          delay={0.05}
        />

        <Reveal delay={0.12}>
          <p className="measure mt-8 text-lede leading-[1.75] text-paper-dim">{study.summary}</p>
        </Reveal>

        <Reveal delay={0.18}>
          <dl className="mt-10 grid gap-x-8 gap-y-5 text-sm sm:grid-cols-3">
            <Meta term="기간" value={study.period} />
            <Meta term="소속" value={study.org} />
            <Meta term="역할" value={study.role} />
          </dl>
        </Reveal>
      </header>

      {/* ---- 본문 ---- */}
      <div className="mt-16 space-y-14">
        <Row label="문제">
          <Reveal stagger className="space-y-3">
            {study.problem.map((line) => (
              <p key={line} className="measure leading-[1.85] text-paper-dim">
                {line}
              </p>
            ))}
          </Reveal>
        </Row>

        <Row label="목표">
          <Reveal>
            <p className="measure text-lede leading-[1.7] font-medium text-paper">{study.goal}</p>
          </Reveal>
        </Row>

        <Row label="핵심 결정">
          <ol className="space-y-10">
            {study.actions.map((action, i) => (
              <Reveal as="li" key={action.heading} delay={i * 0.04}>
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
                  <span
                    className="pt-1 font-mono text-xs tnum"
                    style={{ color: study.accent }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-lg leading-snug font-bold tracking-[-0.02em]">
                      {action.heading}
                    </h4>
                    <p className="measure mt-3 leading-[1.85] text-paper-dim">{action.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </Row>

        <Row label="자료">
          <MediaGallery slots={study.media} />
        </Row>

        <Row label="결과">
          <Reveal stagger className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
            {study.results.map((result) => (
              <div key={result.label}>
                <p
                  className="text-[clamp(1.75rem,3.2vw,2.6rem)] leading-none font-bold tracking-[-0.04em] tnum"
                  style={{ color: study.accent }}
                >
                  {result.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{result.label}</p>
              </div>
            ))}
          </Reveal>
        </Row>

        <Row label="회고">
          <Reveal>
            <blockquote className="border-l-2 pl-6" style={{ borderColor: study.accent }}>
              <p className="measure text-lede leading-[1.7] text-paper">{study.learning}</p>
            </blockquote>
          </Reveal>
        </Row>
      </div>
    </article>
  )
}

function Meta({ term, value }: { term: string; value: string }) {
  return (
    <div className="rule pt-3">
      <dt className="font-mono text-[0.66rem] tracking-[0.2em] text-paper-faint uppercase">
        {term}
      </dt>
      <dd className="mt-2 leading-relaxed text-paper-dim">{value}</dd>
    </div>
  )
}
