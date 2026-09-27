import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { OPEN_CASE_EVENT, revealCase } from '../components/caseAccordion'
import { useReducedMotion } from '../hooks/useMotionPreference'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { caseStudies, timeline, type CaseStudy } from '../content/profile'
import { Chapter, KO_LABEL, Row } from '../components/Chapter'
import { CountUp, Reveal, useChapterAccent } from '../components/motion'
import { MaskedLines } from '../components/scroll'
import { MediaGallery } from '../components/MediaFrame'
import { Diagram } from '../components/diagrams'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 02 Selected Work — 대표 경험 세 가지.
 *
 * 세 경험 모두 같은 뼈대로 읽힌다. 칸 수가 경험마다 달라도 모양은 같다.
 *
 *   늘 보임   번호 · 제목 · 요약 → 정보표 → 결과 → [자세히 보기]
 *   펼치면    문제 → 목표 → 핵심 결정 → 구조도 → 자료 → 회고
 *
 * 기획자가 실제로 쓰는 문서 순서라 읽는 사람이 다음에 무엇이 올지 안다.
 * 그래야 경험끼리 비교가 되고 3분 안에 하나를 끝까지 읽는다.
 *
 * 격자는 항목 수에 맞춰 열 수를 고른다. 3열 격자에 4개를 넣어 마지막 줄에
 * 하나만 남는 식의 빈칸을 만들지 않는다. 빈칸은 "뭔가 빠졌나" 하고 멈추게 한다.
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
            {/* 넓은 화면에서는 연도가 그해 첫 항목의 첫 줄과 같은 높이에 선다(항목 py-4 만큼 내림). */}
            <p className="font-mono text-sm font-bold tnum md:pt-4" style={{ color: 'var(--accent)' }}>
              {year}
            </p>
            <ol className="min-w-0">
              {timeline
                .filter((t) => t.year === year)
                .map((item) => {
                  const body = (
                    <>
                      {/* 줄 순서를 모든 항목에서 고정한다: 언제·무엇·누구 → 제목 → 요약 → 결과.
                          팀·역할을 제목 옆에 붙이면 제목 길이에 따라 옆에 붙었다가
                          아래로 떨어졌다가 해서 줄마다 모양이 달라졌다. */}
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        {item.period && (
                          <span className="font-mono text-[0.72rem] text-paper-faint tnum">{item.period}</span>
                        )}
                        <span className="rounded-sm border border-ink-line px-1.5 py-0.5 text-[0.66rem] text-paper-faint">
                          {item.kind}
                        </span>
                        {/* 좁은 화면에서는 늘 한 줄을 따로 쓴다. 길이에 따라 옆에 붙었다 떨어졌다 하지 않게. */}
                        <span className="basis-full text-xs text-paper-dim sm:basis-auto">
                          {[item.team, item.role].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[1.02rem] font-bold tracking-[-0.02em] transition-colors group-hover:text-(--accent)">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-paper-dim">{item.summary}</span>
                      {item.result && (
                        <span className="mt-1 block text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          {item.result}
                        </span>
                      )}
                    </>
                  )
                  // 대표 경험으로 이어지는 줄은 몇 번 경험인지 적는다. "Detail" 만 있으면
                  // TAP TO ME 와 PRISM 이 같은 03 으로 간다는 걸 누르기 전에는 모른다.
                  const target = item.href ? caseStudies.find((c) => c.id === item.href) : undefined
                  return (
                    <li key={item.title} className="border-b border-ink-line/70 last:border-b-0">
                      {item.href ? (
                        <button
                          type="button"
                          onClick={() => revealCase(item.href!)}
                          data-cursor-label="보기"
                          className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 py-4 text-left"
                        >
                          <span className="min-w-0">{body}</span>
                          <span className="pt-0.5 font-mono text-[0.66rem] tracking-[0.14em] whitespace-nowrap text-paper-faint uppercase group-hover:text-paper">
                            Case {target?.index} ↓
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
                onClick={() => revealCase(study.id)}
                aria-current={on ? 'true' : undefined}
                className="group flex w-full items-center gap-3 py-2 text-left"
              >
                {/* 선 자리는 폭을 고정하고 선만 늘인다. 폭을 바꾸면 켜진 줄의
                    번호와 이름이 오른쪽으로 밀려 목차의 글자 줄이 흔들린다. */}
                <span aria-hidden="true" className="relative h-px w-6 shrink-0">
                  <span
                    className="absolute inset-0 origin-left transition-[transform,background-color] duration-500"
                    style={{
                      transform: on ? 'scaleX(1)' : 'scaleX(0.5)',
                      background: on ? study.accent : 'var(--color-ink-line)',
                    }}
                  />
                </span>
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

/** 경험 하나. 세 경험이 같은 뼈대와 같은 행 순서를 쓴다. */
function CaseArticle({ study }: { study: CaseStudy }) {
  const ref = useRef<HTMLElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  // 대표 경험 하나는 끝까지 읽히게 열어 둔다. 나머지는 요약과 결과만.
  const [open, setOpen] = useState(study.index === '01')
  useChapterAccent(ref, study.accent)

  const toggle = (next: boolean) => setOpen(next)

  // 바깥(About · 타임라인 · 레일)에서 이 경험으로 이동하면 먼저 펼친다.
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail === study.id) setOpen(true)
    }
    window.addEventListener(OPEN_CASE_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CASE_EVENT, onOpen)
  }, [study.id])

  // 접힌 내용도 Ctrl+F 로 찾으면 브라우저가 beforematch 를 보낸다. 그때 펼친다.
  useEffect(() => {
    const el = detailRef.current
    if (!el) return
    const onMatch = () => setOpen(true)
    el.addEventListener('beforematch', onMatch)
    return () => el.removeEventListener('beforematch', onMatch)
  }, [])

  useEffect(() => {
    const el = detailRef.current
    if (!el) return
    if (!open) {
      // until-found 를 모르는 브라우저는 평범한 hidden 으로 동작한다.
      el.setAttribute('hidden', 'until-found')
      return
    }
    el.removeAttribute('hidden')
    if (reduced) return
    const tween = gsap.fromTo(
      el,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: 'height,opacity' },
    )
    return () => {
      tween.kill()
    }
  }, [open, reduced])

  // 자료 목록. 경험 밖에서 오는 자료(예: 아키텍처 이미지)는 여기에 붙이면
  // 갤러리 줄 나누기(MediaGallery)와 버튼의 목차 줄이 같이 따라온다.
  const media = study.media

  // 펼치면 무엇이 나오는지. 열려 있든 닫혀 있든 같은 줄을 보여 줘서
  // 01(처음부터 열림)과 02 · 03(닫힘)의 버튼 모양이 달라 보이지 않게 한다.
  const contents = [
    '문제',
    '목표',
    `핵심 결정 ${study.actions.length}개`,
    study.diagrams && study.diagrams.length > 0 ? '구조도' : null,
    media.length > 0 ? '자료' : null,
    '회고',
  ]
    .filter(Boolean)
    .join(' · ')

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
            {/* 번호(76px)와 제목(48px) 사이의 부제. 11px 모노로 두면 둘 사이에서 사라진다. */}
            <span className="text-sm font-semibold tracking-[-0.01em] text-paper-dim">{study.kicker}</span>
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
      </header>

      {/* ---- 정보표 ---- */}
      <Reveal delay={0.18}>
        <Spec study={study} />
      </Reveal>

      {/* ---- 결과: 접혀 있어도 늘 보인다 ---- */}
      <Results study={study} />

      <button
        type="button"
        onClick={() => toggle(!open)}
        aria-expanded={open}
        aria-controls={`${study.id}-detail`}
        className="group mt-10 flex w-full items-center justify-between gap-4 rounded-sm border border-ink-line px-5 py-4 text-left transition-colors hover:border-(--accent)"
      >
        <span>
          <span className="block text-[0.95rem] font-bold tracking-[-0.02em]">
            {open ? '접기' : '자세히 보기'}
          </span>
          <span className="mt-0.5 block text-xs text-paper-faint">{contents}</span>
        </span>
        <span
          aria-hidden="true"
          className="font-mono text-lg transition-transform duration-300"
          style={{ color: study.accent, transform: open ? 'rotate(180deg)' : undefined }}
        >
          ↓
        </span>
      </button>

      {/* ---- 상세: 접으면 숨기되 브라우저 찾기(Ctrl+F)로는 찾아지게 until-found ---- */}
      <div ref={detailRef} id={`${study.id}-detail`} className="overflow-hidden">
        <div className="mt-14 space-y-14">
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
            <Decisions study={study} />
          </Row>

          {study.diagrams && study.diagrams.length > 0 && (
            <Row label="구조도">
              <div className="grid gap-6">
                {study.diagrams.map((key) => (
                  <Diagram key={key} id={key} />
                ))}
              </div>
            </Row>
          )}

          {media.length > 0 && (
            <Row label="자료">
              <MediaGallery slots={media} />
            </Row>
          )}

          <Row label="회고">
            <Reveal>
              <blockquote className="border-l-2 pl-6" style={{ borderColor: study.accent }}>
                <p className="measure text-lede leading-[1.7] text-paper">{study.learning}</p>
              </blockquote>
            </Reveal>
          </Row>
        </div>

        <button
          type="button"
          onClick={() => {
            toggle(false)
            revealCaseTop(study.id)
          }}
          className="mt-10 text-xs font-semibold text-paper-faint transition-colors hover:text-paper"
        >
          접기 ↑
        </button>
      </div>
    </article>
  )
}

/**
 * 정보표. 칸 이름과 값이 한 줄씩 선다.
 *
 * 예전에는 3열 격자에 칸을 채워서 경험마다 칸 수(6 · 4 · 5)에 따라
 * 둘째 줄에 빈칸이 생기고, 도구는 격자 밖 별도 줄에 떠 있었다.
 * 한 줄 한 칸이면 값이 없는 칸은 줄째로 빠질 뿐 빈자리가 남지 않고,
 * 세 경험에서 같은 정보가 늘 같은 순서, 같은 위치에 있다.
 */
function Spec({ study }: { study: CaseStudy }) {
  const rows: [string, ReactNode][] = [
    ['기간', study.period],
    ['소속', study.org],
    ['역할', study.role],
  ]
  if (study.team) rows.push(['팀 구성', study.team])
  if (study.note) rows.push(['특이사항', study.note])
  if (study.links && study.links.length > 0) {
    rows.push([
      '링크',
      <span className="flex flex-wrap gap-x-5 gap-y-1">
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
      </span>,
    ])
  }
  if (study.tools && study.tools.length > 0) {
    rows.push([
      '도구 · 산출물',
      <span className="flex flex-wrap gap-1.5">
        {study.tools.map((tool) => (
          <span key={tool} className="rounded-full border border-ink-line px-2.5 py-0.5 text-xs text-paper-dim">
            {tool}
          </span>
        ))}
      </span>,
    ])
  }

  return (
    // 줄마다 선을 긋지 않는다. 표 위아래 선(위: 이 표, 아래: 결과 행)만 두면
    // 정보표가 한 덩어리로 읽히고, 선 두 줄이 겹쳐 빈 줄처럼 보이지 않는다.
    <dl className="mt-10 grid gap-y-2.5 border-t border-ink-line py-5 text-sm">
      {rows.map(([term, value]) => (
        <div
          key={term}
          className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-x-4 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-6"
        >
          <dt className={KO_LABEL}>{term}</dt>
          <dd className="leading-relaxed text-paper-dim">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * 결과 격자의 열 수. 항목 수에 맞춰 마지막 줄이 꽉 차게 고른다.
 * 3 → 3열, 4 → 2열(중간 폭) · 4열(넓은 폭), 6 → 3열 두 줄.
 * Tailwind 는 클래스 이름을 소스에서 찾으므로 문자열을 통째로 적어 둔다.
 */
const RESULT_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  6: 'sm:grid-cols-3',
  8: 'sm:grid-cols-2 lg:grid-cols-4',
  9: 'sm:grid-cols-3',
}

/**
 * 결과 숫자.
 *
 * 넓은 화면: 항목 수에 맞춘 격자. 큰 숫자 아래에 설명.
 * 좁은 화면: 숫자 | 설명 한 줄씩. 큰 숫자를 한 칸씩 쌓으면 결과 여섯 개가
 * 화면 한 장(686px)을 넘겨 정작 "자세히 보기"가 보이지 않았다.
 */
function Results({ study }: { study: CaseStudy }) {
  const cols = RESULT_COLS[study.results.length] ?? 'sm:grid-cols-3'
  // 상세의 다른 행과 같은 틀(선 → 라벨 → 내용)을 쓴다. 결과만 라벨 없이 떠 있으면
  // 정보표의 일부인지 따로 읽어야 하는 칸인지 헷갈린다.
  return (
    <Row label="결과">
      <Reveal stagger className={`grid sm:gap-x-8 sm:gap-y-7 ${cols}`}>
        {study.results.map((result) => (
          <div
            key={result.label}
            className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-ink-line py-3 first:pt-0 sm:block sm:border-b-0 sm:py-0"
          >
            <p
              className="text-[1.4rem] leading-none font-bold tracking-[-0.04em] tnum sm:text-[clamp(1.6rem,2.8vw,2.3rem)]"
              style={{ color: study.accent }}
            >
              <ResultValue value={result.value} />
            </p>
            <p className="text-sm leading-relaxed text-paper-dim sm:mt-2.5">{result.label}</p>
          </div>
        ))}
      </Reveal>
    </Row>
  )
}

/**
 * "코칭 기준을 … 받았습니다 · TAP TO ME" 처럼 제목 끝에 붙은 영문 프로젝트 이름을 떼어
 * 번호 옆 꼬리표로 옮긴다. 한 경험에 프로젝트가 둘일 때만 쓰는 표기라 없으면 그대로 둔다.
 */
function splitProject(heading: string): { title: string; project?: string } {
  const m = heading.match(/^(.*\S)\s+·\s+([A-Z][A-Z0-9 ]*[A-Z0-9])$/)
  return m ? { title: m[1]!, project: m[2]! } : { title: heading }
}

/**
 * 핵심 결정. 레퍼런스의 트러블슈팅 카드를 기획 결정으로 옮겼다.
 * 무엇이 문제였나(?) → 어떻게 풀었나(!) → 무엇이 바뀌었나(→).
 *
 * 카드는 한 줄에 하나. 넓은 화면에서는 카드 안이 두 단이다.
 *   왼쪽: 번호 · 결정 · 결과  ← 이 단만 위에서 아래로 훑어도 결정과 결과가 다 읽힌다
 *   오른쪽: 문제와 해결
 * 예전 2열 격자는 결정 수(6 · 3 · 5)에 따라 마지막 카드가 반 칸에 혼자 남았다.
 * 읽는 순서(문제 → 해결 → 결과)는 마크업 순서로 지켜서 스크린리더도 같은 순서로 읽는다.
 */
function Decisions({ study }: { study: CaseStudy }) {
  return (
    <ol className="grid gap-4">
      {study.actions.map((action, i) => {
        const { title, project } = splitProject(action.heading)
        return (
          <Reveal as="li" key={action.heading} delay={Math.min(i, 3) * 0.04}>
            <article className="grid gap-y-4 rounded-sm border border-ink-line bg-ink-raised/50 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-10">
              <header className="md:col-start-1 md:row-start-1">
                <p className="font-mono text-[0.66rem] tracking-[0.16em] tnum" style={{ color: study.accent }}>
                  {String(i + 1).padStart(2, '0')}
                  {project && <span className="text-paper-faint"> · {project}</span>}
                </p>
                <h4 className="mt-2 text-[1.05rem] leading-snug font-bold tracking-[-0.02em]">{title}</h4>
              </header>

              <dl className="flex flex-col gap-3 text-[0.9rem] leading-[1.75] md:col-start-2 md:row-span-2 md:row-start-1">
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
                  className="border-t border-ink-line pt-3 text-sm leading-relaxed font-medium md:col-start-1 md:row-start-2 md:self-start"
                  style={{ color: study.accent }}
                >
                  → {action.result}
                </p>
              )}
            </article>
          </Reveal>
        )
      })}
    </ol>
  )
}

/** 아래쪽 접기 버튼을 누르면 그 경험 머리로 돌아간다. 접힌 뒤 엉뚱한 곳에 남지 않게. */
function revealCaseTop(id: string) {
  requestAnimationFrame(() => scrollToSection(id))
}

/** "143명"처럼 숫자 하나로 된 값만 세어 올린다. "5 → 2초" 같은 값은 그대로 둔다. */
function ResultValue({ value }: { value: string }) {
  const m = value.match(/^(\d+)([^\d→]*)$/)
  if (!m) return <>{value}</>
  return <CountUp to={Number(m[1])} suffix={m[2]} />
}
