import { about } from '../content/profile'
import { Chapter } from '../components/Chapter'
import { Reveal, ScrubbedWords } from '../components/motion'
import { revealCase } from '../components/caseAccordion'

/**
 * 01 About — 한 문장과 세 기둥.
 *
 * 히어로가 "누구"에 답하면 여기서 "무엇을 바꿔 온 사람인가"에 답한다.
 * 기둥마다 역량 이름은 작은 태그로 내리고, 제목은 바꾼 것을 한 문장으로,
 * 오른쪽에 그 결과를 숫자 하나로 둔다. 행 전체가 그 경험으로 가는 링크다.
 */
export function About() {
  return (
    <Chapter id="about" index="01" label="About">
      <ScrubbedWords
        text={about.statement}
        className="max-w-[26ch] text-chapter leading-[1.28] font-bold tracking-[-0.035em]"
      />

      <ol className="mt-16 lg:mt-20">
        {about.pillars.map((pillar, i) => (
          <Reveal as="li" key={pillar.n} delay={i * 0.06}>
            <button
              type="button"
              onClick={() => revealCase(pillar.proof.href)}
              data-cursor-label="보기"
              className="group rule grid w-full grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 gap-y-5 py-8 text-left sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,13rem)] sm:gap-x-8 lg:py-10"
            >
              <span
                className="pt-1 font-mono text-xs tracking-[0.2em] tnum"
                style={{ color: 'var(--accent)' }}
              >
                {pillar.n}
              </span>

              <span className="min-w-0">
                <span className="font-mono text-[0.66rem] tracking-[0.2em] text-paper-faint uppercase">
                  {pillar.tag}
                </span>
                <span className="mt-2 block max-w-[22ch] text-[clamp(1.3rem,2.3vw,1.85rem)] leading-[1.28] font-bold tracking-[-0.03em] transition-colors duration-300 group-hover:text-(--accent)">
                  {pillar.title}
                </span>
                <span className="measure mt-3 block text-[0.95rem] leading-[1.8] text-paper-dim">
                  {pillar.body}
                </span>
              </span>

              {/* 결과 숫자와 경험 링크. 좁은 화면에서는 본문 아래로 내려온다. */}
              <span className="col-start-2 flex items-end justify-between gap-4 sm:col-start-3 sm:flex-col sm:items-end sm:justify-between sm:text-right">
                <span>
                  <span
                    className="block text-[clamp(1.6rem,3vw,2.4rem)] leading-none font-bold tracking-[-0.04em] tnum whitespace-nowrap"
                    style={{ color: 'var(--accent)' }}
                  >
                    {pillar.metric.value}
                    <span className="ml-1 text-[0.5em] font-medium">{pillar.metric.unit}</span>
                  </span>
                  <span className="mt-2 block text-xs text-paper-faint">{pillar.metric.label}</span>
                </span>

                <span className="inline-flex items-center gap-2 text-xs text-paper-faint transition-colors group-hover:text-paper">
                  <span className="font-mono tracking-[0.14em] uppercase">Experience</span>
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                  <span className="sr-only">{pillar.proof.label}로 이동</span>
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </ol>
    </Chapter>
  )
}
