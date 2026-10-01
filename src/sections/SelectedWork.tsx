import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { OPEN_CASE_EVENT, revealCase } from '../components/caseAccordion'
import { useReducedMotion } from '../hooks/useMotionPreference'
import { caseStudies, timeline, type CaseStudy } from '../content/profile'
import { withArchitecture } from '../content/architecture'
import { Chapter, KO_LABEL, Row } from '../components/Chapter'
import { CountUp, Reveal, useChapterAccent } from '../components/motion'
import { MaskedLines } from '../components/scroll'
import { MediaGallery } from '../components/MediaFrame'
import { Diagram } from '../components/diagrams'
import { scrollToSection } from '../hooks/useSmoothScroll'
import { Sentences } from '../components/Sentences'

/**
 * 02 Experience — 경험, 03 Case — CASE.
 *
 * 두 챕터로 나눈다. 02 는 연도별 목록(Project Summary) 하나로 전체를 보여 주고,
 * 03 은 그중 CASE 가 붙은 넷을 자세히 펼친다. 목록의 CASE 줄을 누르면 03 에서
 * 그 케이스가 아코디언으로 열린다. 한 번에 하나만 연다. 케이스를 늘 길게 쌓아 두면
 * 페이지가 끝없이 길어지고, 목록과 상세가 같은 이야기를 두 번 한다.
 * 왼쪽 레일도 챕터마다 따로 선다. 02 는 번호만, 03 은 번호 아래 케이스 목차를 둔다.
 *
 * 케이스는 최신순(profile.ts)이라 목록과 같은 방향으로 읽힌다.
 *
 * 열린 케이스는 어느 것이든 같은 뼈대로 읽힌다.
 *   번호 · 제목 · 요약 → 정보표 → 결과 → 문제 → 목표 → 핵심 결정 → 구조도 → 자료 → 회고
 * 기획자가 실제로 쓰는 문서 순서라 읽는 사람이 다음에 무엇이 올지 안다.
 *
 * 격자는 항목 수에 맞춰 열 수를 고른다. 3열 격자에 4개를 넣어 마지막 줄에
 * 하나만 남는 식의 빈칸을 만들지 않는다. 빈칸은 "뭔가 빠졌나" 하고 멈추게 한다.
 *
 * 닫힌 케이스도 DOM 에는 남긴다(hidden="until-found"). 브라우저 찾기(Ctrl+F)로
 * 찾아지고, PDF 에서는 인쇄 스타일이 전부 펼친다.
 */
export function SelectedWork() {
  // 처음에는 01 을 열어 둔다. 목록 아래가 비어 있으면 "여기서 끝"으로 읽힌다.
  const [openId, setOpenId] = useState<string | null>(caseStudies[0]?.id ?? null)

  // 바깥(About · 레일 · 타임라인 · 찾기)에서 경험을 여는 신호.
  useEffect(() => {
    const onOpen = (e: Event) => setOpenId((e as CustomEvent<string>).detail)
    window.addEventListener(OPEN_CASE_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CASE_EVENT, onOpen)
  }, [])

  /** 닫기. 목록 줄에서 닫으면 그 자리에 두고, 케이스 끝에서 닫으면 02 의 목록으로 돌아간다. */
  const close = (backToList: boolean) => {
    setOpenId(null)
    if (backToList) requestAnimationFrame(() => scrollToSection('work-summary'))
  }
  const toggle = (id: string) => (openId === id ? close(false) : revealCase(id))

  return (
    <>
      <Chapter id="work" index="02" label="Experience" title={['경험']} accent={null}>
        <ProjectSummary openId={openId} onToggle={toggle} />
      </Chapter>
      <Chapter
        id="cases"
        index="03"
        label="Case"
        title={['CASE']}
        accent={null}
        rail={<CaseRail openId={openId} />}
      >
        <CasePanel openId={openId} onClose={close} />
      </Chapter>
    </>
  )
}

/**
 * Project Summary — 연도별 타임라인.
 *
 * 전체 이력을 한 화면에 깐다. CASE 가 붙은 줄은 누르면 목록 맨 아래에서
 * 그 경험이 열리고, 열린 줄을 다시 누르면 닫힌다. 나머지는 한 줄 요약과 결과만 둔다.
 * 좁은 화면에서는 이 목록이 레일 목차 역할도 한다.
 */
function ProjectSummary({ openId, onToggle }: { openId: string | null; onToggle: (id: string) => void }) {
  const years = Array.from(new Set(timeline.map((t) => t.year)))

  return (
    <div id="work-summary" className="mt-14 scroll-mt-24">
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
                      <span className="mt-1 block text-sm leading-relaxed text-paper-dim">
                        <Sentences text={item.summary} />
                      </span>
                      {item.result && (
                        <span className="mt-1 block text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          {item.result}
                        </span>
                      )}
                    </>
                  )
                  // 대표 경험으로 이어지는 줄은 몇 번 경험인지 적는다. 아래 경험 칸의 번호와
                  // 같아서, 누르기 전에 어느 경험이 열릴지 안다.
                  const target = item.href ? caseStudies.find((c) => c.id === item.href) : undefined
                  const isOpen = !!item.href && openId === item.href
                  return (
                    <li key={item.title} className="border-b border-ink-line/70 last:border-b-0">
                      {item.href ? (
                        <button
                          type="button"
                          onClick={() => onToggle(item.href!)}
                          // "-detail" 로 끝나는 aria-controls 는 인쇄에서 숨기는 버튼이다. 목록 줄은 PDF 에도 남아야 한다.
                          aria-controls="case-panel"
                          aria-expanded={isOpen}
                          data-cursor-label={isOpen ? '닫기' : '열기'}
                          className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 py-4 text-left"
                        >
                          <span className="min-w-0">{body}</span>
                          <span
                            className={`pt-0.5 font-mono text-[0.66rem] tracking-[0.14em] whitespace-nowrap uppercase transition-colors ${
                              isOpen ? '' : 'text-paper-faint group-hover:text-paper'
                            }`}
                            style={isOpen ? { color: target?.accent } : undefined}
                          >
                            Case {target?.index} {isOpen ? '▲' : '↓'}
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

/** 레일 목차. 열려 있는 케이스의 번호에 챕터 색이 들어온다. */
function CaseRail({ openId }: { openId: string | null }) {
  return (
    <nav aria-label="케이스 목차" className="mt-10 hidden lg:block">
      <ol className="space-y-1">
        {caseStudies.map((study) => {
          const on = study.id === openId
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

/**
 * 03 의 케이스 칸. 열린 케이스 하나만 보인다.
 *
 * 머리에 케이스 바로가기를 둔다. 넓은 화면에서는 왼쪽 레일이 같은 일을 하지만
 * 좁은 화면에는 레일이 없어서, 다른 경험으로 가려면 목록까지 올라가야 한다.
 */
function CasePanel({ openId, onClose }: { openId: string | null; onClose: (backToList: boolean) => void }) {
  const current = caseStudies.find((c) => c.id === openId)

  return (
    <div id="case-panel" className="mt-14 scroll-mt-24">
      <div className="rule flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pt-5">
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
          {current ? `Case ${current.index} / ${String(caseStudies.length).padStart(2, '0')}` : 'Case'}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2" data-print="hide">
          {caseStudies.map((study) => {
            const on = study.id === openId
            return (
              <li key={study.id}>
                <button
                  type="button"
                  onClick={() => (on ? onClose(false) : revealCase(study.id))}
                  aria-controls="case-panel"
                  aria-expanded={on}
                  className={`text-xs transition-colors ${on ? 'font-semibold' : 'text-paper-faint hover:text-paper'}`}
                  style={on ? { color: study.accent } : undefined}
                >
                  <span className="font-mono tnum">{study.index}</span> {study.short}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {!current && (
        <p className="mt-8 text-sm text-paper-faint" data-print="hide">
          위 바로가기나 경험 목록의 CASE 줄을 누르면 여기에서 자세히 펼쳐집니다.
        </p>
      )}

      {caseStudies.map((study, i) => (
        <CaseArticle
          key={study.id}
          study={study}
          open={study.id === openId}
          next={caseStudies[(i + 1) % caseStudies.length] ?? study}
          onClose={() => onClose(true)}
        />
      ))}
    </div>
  )
}

/** 경험 하나. 모든 경험이 같은 뼈대와 같은 행 순서를 쓴다. */
function CaseArticle({
  study,
  open,
  next,
  onClose,
}: {
  study: CaseStudy
  open: boolean
  next: CaseStudy
  onClose: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)
  const reduced = useReducedMotion()
  useChapterAccent(ref, study.accent)

  // 닫힌 경험도 Ctrl+F 로 찾으면 브라우저가 beforematch 를 보낸다. 그때 연다.
  // 브라우저가 찾은 곳으로 직접 스크롤하므로 여기서는 열기만 한다.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onMatch = () => window.dispatchEvent(new CustomEvent<string>(OPEN_CASE_EVENT, { detail: study.id }))
    el.addEventListener('beforematch', onMatch)
    return () => el.removeEventListener('beforematch', onMatch)
  }, [study.id])

  // 화면을 그리기 전에 숨김을 바꾼다. 바깥에서 열고 바로 스크롤할 때(revealCase)
  // 아직 숨은 채로 위치를 재면 엉뚱한 곳으로 간다.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const first = firstRun.current
    firstRun.current = false
    if (!open) {
      // 펼치는 중에 다른 케이스로 넘어가면 높이 트윈이 중간에 멈춰 인라인 height 가 남는다.
      // until-found 는 display:none 이 아니라 상자를 남기므로, 그 높이만큼 빈칸이 생긴다.
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'height,opacity' })
      // until-found 를 모르는 브라우저는 평범한 hidden 으로 동작한다.
      el.setAttribute('hidden', 'until-found')
      return
    }
    el.removeAttribute('hidden')
    // 처음 열려 있는 01 은 그냥 보인다. 누를 때만 아래로 펼쳐지며 나타난다.
    if (reduced || first) return
    const tween = gsap.fromTo(
      el,
      { height: 0, opacity: 0 },
      {
        height: 'auto',
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'height,opacity',
        // 다 펼쳐진 뒤의 높이로 아래 트리거 위치를 다시 잰다.
        onComplete: () => ScrollTrigger.refresh(),
      },
    )
    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'height,opacity' })
    }
  }, [open, reduced])

  return (
    // id 끝의 "-detail" 은 인쇄 스타일이 알아보는 표시다. PDF 에서는 닫힌 경험도 펼쳐 찍는다.
    <div ref={wrapRef} id={`${study.id}-detail`} className="overflow-hidden">
      <article ref={ref} id={study.id} aria-label={study.title} className="scroll-mt-24 pt-10">
        {/* 열 때마다 안쪽을 새로 마운트한다. 닫힌 채(hidden) 처음 마운트된 안쪽은 스크롤 등장
            트리거가 크기 0 으로 재져 이미 지나간 것으로 끝나 버리고(once), 내용이 투명한 채 남는다.
            열린 뒤에 새로 마운트하면 보이는 상태에서 트리거를 만든다. 숨김은 부모의 layout effect 가
            먼저 걷고, 안쪽의 트리거(useEffect)는 그 뒤에 만들어진다. */}
        <CaseBody key={open ? 'open' : 'closed'} study={study} next={next} onClose={onClose} />
      </article>
    </div>
  )
}

/** 케이스 한 편의 내용. 머리 · 정보표 · 결과 · 상세 · 끝 버튼. */
function CaseBody({ study, next, onClose }: { study: CaseStudy; next: CaseStudy; onClose: () => void }) {
  // 자료 목록. 경험 밖에서 오는 자료(예: 아키텍처 이미지)는 여기에 붙이면
  // 갤러리 줄 나누기(MediaGallery)가 같이 따라온다.
  const media = withArchitecture(study.id, study.media)

  return (
    <>
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
          <p className="measure mt-8 text-lede leading-[1.75] text-paper-dim">
              <Sentences text={study.summary} />
            </p>
        </Reveal>
      </header>

      {/* ---- 정보표 ---- */}
      <Reveal delay={0.18}>
        <Spec study={study} />
      </Reveal>

      {/* ---- 결과 ---- */}
      <Results study={study} />

      {/* ---- 상세 ---- */}
      <div className="mt-14 space-y-14">
        <Row label="문제">
          <Reveal stagger className="space-y-3">
            {study.problem.map((line) => (
              <p key={line} className="measure leading-[1.85] text-paper-dim">
                <Sentences text={line} />
              </p>
            ))}
          </Reveal>
        </Row>

        <Row label="목표">
          <Reveal>
            <p className="measure text-lede leading-[1.7] font-medium text-paper">
                <Sentences text={study.goal} />
              </p>
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
              <p className="measure text-lede leading-[1.7] text-paper">
                  <Sentences text={study.learning} />
                </p>
            </blockquote>
          </Reveal>
        </Row>
      </div>

      {/* ---- 끝: 닫고 목록으로, 또는 다음 경험으로 ---- */}
      <div
        data-print="hide"
        className="rule mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-5 text-sm"
      >
        <button
          type="button"
          onClick={onClose}
          className="font-semibold text-paper-faint transition-colors hover:text-paper"
        >
          닫고 목록으로 ↑
        </button>
        <button
          type="button"
          onClick={() => revealCase(next.id)}
          className="group inline-flex items-baseline gap-2 font-semibold transition-colors hover:text-(--accent)"
        >
          <span className="font-mono text-xs text-paper-faint">다음 · {next.index}</span>
          {next.short}
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </div>
    </>
  )
}

/**
 * 정보표. 칸 이름과 값이 한 줄씩 선다.
 *
 * 예전에는 3열 격자에 칸을 채워서 경험마다 칸 수(6 · 4 · 5)에 따라
 * 둘째 줄에 빈칸이 생기고, 도구는 격자 밖 별도 줄에 떠 있었다.
 * 한 줄 한 칸이면 값이 없는 칸은 줄째로 빠질 뿐 빈자리가 남지 않고,
 * 모든 경험에서 같은 정보가 늘 같은 순서, 같은 위치에 있다.
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
                  <dd className="text-paper-dim">
                    <Sentences text={action.q} />
                  </dd>
                </div>
                <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                  <dt className="font-mono font-bold" style={{ color: study.accent }}>
                    !<span className="sr-only">해결</span>
                  </dt>
                  <dd className="text-paper">
                    <Sentences text={action.body} />
                  </dd>
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

/** "143명"처럼 숫자 하나로 된 값만 세어 올린다. "5 → 2초" 같은 값은 그대로 둔다. */
function ResultValue({ value }: { value: string }) {
  const m = value.match(/^(\d+)([^\d→]*)$/)
  if (!m) return <>{value}</>
  return <CountUp to={Number(m[1])} suffix={m[2]} />
}
