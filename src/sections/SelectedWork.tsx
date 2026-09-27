import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { caseStudies, timeline, type CaseStudy } from '../content/profile'
import { Chapter, Row } from '../components/Chapter'
import { CountUp, Reveal, useChapterAccent } from '../components/motion'
import { MaskedLines } from '../components/scroll'
import { MediaGallery } from '../components/MediaFrame'
import { Diagram } from '../components/diagrams'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 02 Selected Work — 대표 경험 세 가지.
 *
 * 세 경험 모두 같은 순서로 읽힌다.
 * 문제 → 목표 → 핵심 결정 → 구조도 → 자료 → 결과 → 회고.
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
      intro="전체 이력을 연도별로 먼저 보여 드리고 그중 세 가지를 자세히 풀었습니다. 요청을 다시 정의한 일과 운영을 구조로 바꾼 일, 기술의 한계를 문제로 잡은 일입니다."
      accent={null}
      rail={<CaseRail active={active} />}
    >
      <ProjectSummary />

      <div className="mt-20 space-y-36 lg:mt-28 lg:space-y-48">
        {caseStudies.map((study) => (
          <CaseArticle key={study.id} study={study} />
        ))}
      </div>
    </Chapter>
  )
}

/**
 * Project Summary — 연도별 타임라인.
 *
 * 대표 경험을 읽기 전에 전체 이력을 한 화면에 깐다. 대표 경험 줄은
 * 누르면 상세로 내려가고, 나머지는 한 줄 요약과 결과만 둔다.
 * 좁은 화면에서는 이 목록이 레일 목차 역할도 한다.
 */
function ProjectSummary() {
  const years = Array.from(new Set(timeline.map((t) => t.year)))

  return (
    <div className="mt-14">
      <p className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
        Project Summary
      </p>
      <div className="mt-5">
        {years.map((year) => (
          <div key={year} className="rule grid gap-y-2 pt-5 pb-3 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-x-6">
            <p className="font-mono text-sm font-bold tnum" style={{ color: 'var(--accent)' }}>
              {year}
            </p>
            <ol className="min-w-0">
              {timeline
                .filter((t) => t.year === year)
                .map((item) => {
                  const body = (
                    <>
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        {item.period && (
                          <span className="font-mono text-[0.72rem] text-paper-faint tnum">{item.period}</span>
                        )}
                        <span className="rounded-sm border border-ink-line px-1.5 py-0.5 text-[0.66rem] text-paper-faint">
                          {item.kind}
                        </span>
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-[1.02rem] font-bold tracking-[-0.02em] transition-colors group-hover:text-(--accent)">
                          {item.title}
                        </span>
                        <span className="text-xs text-paper-dim">
                          {[item.team, item.role].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-paper-dim">{item.summary}</span>
                      {item.result && (
                        <span className="mt-1 block text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          {item.result}
                        </span>
                      )}
                    </>
                  )
                  return (
                    <li key={item.title} className="border-b border-ink-line/70 last:border-b-0">
                      {item.href ? (
                        <button
                          type="button"
                          onClick={() => scrollToSection(item.href!)}
                          data-cursor-label="보기"
                          className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 py-4 text-left"
                        >
                          <span className="min-w-0">{body}</span>
                          <span className="pt-1 font-mono text-[0.66rem] tracking-[0.14em] whitespace-nowrap text-paper-faint uppercase group-hover:text-paper">
                            Detail ↓
                          </span>
                        </button>
                      ) : (
                        <div className="py-4">{body}</div>
                      )}
                    </li>
                  )
                })}
            </ol>
          </div>
        ))}
      </div>
    </div>
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
            {study.team && <Meta term="팀 구성" value={study.team} />}
            {study.note && <Meta term="특이사항" value={study.note} />}
            {study.links && study.links.length > 0 && (
              <div className="rule pt-3">
                <dt className="font-mono text-[0.66rem] tracking-[0.2em] text-paper-faint uppercase">
                  링크
                </dt>
                <dd className="mt-2 flex flex-col gap-1">
                  {study.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-paper-dim underline decoration-ink-line underline-offset-4 transition-colors hover:text-(--accent)"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          {study.tools && study.tools.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[0.66rem] tracking-[0.2em] text-paper-faint uppercase">
                도구 · 산출물
              </span>
              {study.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-ink-line px-3 py-1 text-xs text-paper-dim"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
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

        <Row label="핵심 결정" wide>
          {/* 레퍼런스의 트러블슈팅 카드를 기획 결정으로 옮겼다.
              무엇이 문제였나(?) → 어떻게 풀었나(!) → 무엇이 바뀌었나. */}
          <ol className="grid gap-4 md:grid-cols-2">
            {study.actions.map((action, i) => (
              <Reveal as="li" key={action.heading} delay={i * 0.04}>
                <article className="flex h-full flex-col rounded-sm border border-ink-line bg-ink-raised/50 p-5 sm:p-6">
                  <p className="font-mono text-[0.66rem] tracking-[0.16em] tnum" style={{ color: study.accent }}>
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h4 className="mt-2 text-[1.05rem] leading-snug font-bold tracking-[-0.02em]">
                    {action.heading}
                  </h4>

                  <dl className="mt-4 flex flex-1 flex-col gap-3 text-[0.9rem] leading-[1.75]">
                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                      <dt className="font-mono font-bold text-paper-faint">
                        ?<span className="sr-only">문제</span>
                      </dt>
                      <dd className="text-paper-dim">{action.q}</dd>
                    </div>
                    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                      <dt className="font-mono font-bold" style={{ color: study.accent }}>
                        !<span className="sr-only">해결</span>
                      </dt>
                      <dd className="text-paper">{action.body}</dd>
                    </div>
                  </dl>

                  {action.result && (
                    <p
                      className="mt-4 border-t border-ink-line pt-3 text-sm font-medium"
                      style={{ color: study.accent }}
                    >
                      → {action.result}
                    </p>
                  )}
                </article>
              </Reveal>
            ))}
          </ol>
        </Row>

        {study.diagrams && study.diagrams.length > 0 && (
          <Row label="구조도" wide>
            <div className="grid gap-6">
              {study.diagrams.map((key) => (
                <Diagram key={key} id={key} />
              ))}
            </div>
          </Row>
        )}

        <Row label="자료" wide>
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
                  <ResultValue value={result.value} />
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

/** "143명"처럼 숫자 하나로 된 값만 세어 올린다. "5 → 2초" 같은 값은 그대로 둔다. */
function ResultValue({ value }: { value: string }) {
  const m = value.match(/^(\d+)([^\d→]*)$/)
  if (!m) return <>{value}</>
  return <CountUp to={Number(m[1])} suffix={m[2]} />
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
