import { about, caseStudies } from '../content/profile'
import { Chapter } from '../components/Chapter'
import { Reveal } from '../components/motion'
import { revealCase } from '../components/caseAccordion'

/**
 * 01 About — 서비스 기획자의 네 가지 일과 그 근거.
 *
 * 히어로 문단이 네 가지 일을 한 문장씩 말한다. 여기서는 일마다 실제로 한 일
 * 하나와 숫자 하나를 붙여 주장을 근거로 바꾼다. 같은 문장을 또 쓰면 두 번
 * 읽힐 뿐이다.
 *
 * 한 행은 왼쪽부터 일 → 근거 → 숫자 순서다. 몇 초만 훑어도 왼쪽 단의 네 단어와
 * 오른쪽 단의 네 숫자가 짝으로 읽히게 했다. 가운데 글은 궁금할 때 읽는 층이다.
 * 행 전체가 그 경험으로 가는 링크다.
 */
export function About() {
  return (
    <Chapter id="about" index="01" label="About" title={about.title} intro={about.intro}>
      <ol className="mt-12 border-b border-ink-line lg:mt-16">
        {about.jobs.map((item, i) => {
          const study = caseStudies.find((c) => c.id === item.caseId)

          return (
            <Reveal as="li" key={item.n} delay={i * 0.06}>
              {/*
                넓은 화면(xl)은 일 · 근거 · 숫자 세 단이다. 그보다 좁으면 레일이
                폭을 먹어 가운데 글이 한 줄에 열 자 남짓으로 줄어든다. 그때는
                숫자를 근거 아래로 내려 두 단으로 읽힌다.
              */}
              <div className="group rule relative grid gap-x-8 py-7 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:py-8 lg:py-9 xl:grid-cols-[8rem_minmax(0,1fr)_12rem] xl:gap-x-10">
                {/* 번호와 일. 좁은 화면에서는 한 줄, 넓으면 번호 아래에 선다.
                    번호 줄과 옆 단의 맥락 줄 높이를 같게 둬 일과 행 제목의 윗선이 맞는다. */}
                <div className="flex items-baseline gap-3 sm:row-span-2 sm:block xl:row-span-1">
                  <span
                    className="font-mono text-xs leading-5 tracking-[0.2em] tnum"
                    style={{ color: 'var(--accent)' }}
                  >
                    {item.n}
                  </span>
                  <h3 className="text-[clamp(1.35rem,2.1vw,1.75rem)] leading-[1.1] font-bold tracking-[-0.035em] sm:mt-2">
                    {item.job}
                  </h3>
                </div>

                {/* 근거. 어디서 무슨 역할로 한 일인지 먼저 밝힌다.
                    팀 프로젝트에서 맡지 않은 몫까지 내 일처럼 읽히면 안 된다. */}
                <div className="mt-3 min-w-0 sm:mt-0">
                  <p className="text-xs leading-5 text-paper-faint">{item.where}</p>
                  <p className="mt-2 text-[clamp(1.08rem,1.55vw,1.28rem)] leading-[1.4] font-bold tracking-[-0.025em] transition-colors duration-300 group-hover:text-(--accent)">
                    {item.title}
                  </p>
                  <p className="measure mt-2.5 text-[0.93rem] leading-[1.8] text-paper-dim">
                    {item.body}
                  </p>
                </div>

                {/* 숫자와 경험 링크. 두 단일 때는 근거 아래 한 줄로 눕는다. */}
                <div className="mt-5 flex items-end justify-between gap-4 sm:col-start-2 xl:col-start-3 xl:row-start-1 xl:mt-0 xl:flex-col xl:justify-between xl:text-right">
                  <p>
                    <span
                      className="block text-[clamp(1.6rem,2.6vw,2.2rem)] leading-none font-bold tracking-[-0.04em] tnum whitespace-nowrap"
                      style={{ color: 'var(--accent)' }}
                    >
                      {item.metric.value}
                      <span className="ml-1 text-[0.5em] font-medium">{item.metric.unit}</span>
                    </span>
                    <span className="mt-2 block text-xs leading-snug text-paper-faint">
                      {item.metric.label}
                    </span>
                  </p>

                  {/* 버튼 하나를 행 전체로 늘린다(::after). 버튼 안에는 제목이나 문단을
                      넣을 수 없어서 행을 통째로 버튼으로 감싸면 h3 를 쓸 수 없다. */}
                  {study && (
                    <button
                      type="button"
                      onClick={() => revealCase(study.id)}
                      data-cursor-label="보기"
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap text-paper-faint transition-colors group-hover:text-paper after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-(--accent)"
                    >
                      <span>Case {study.index}</span>
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
                      >
                        ↓
                      </span>
                      <span className="sr-only">{study.short} 자세히 보기</span>
                    </button>
                  )}
                </div>
              </div>
            </Reveal>
          )
        })}
      </ol>
    </Chapter>
  )
}
