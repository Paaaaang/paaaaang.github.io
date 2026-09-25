import { about } from '../content/profile'
import { Chapter } from '../components/Chapter'
import { Reveal, ScrubbedWords } from '../components/motion'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 01 About — 히어로의 한 줄을 받치는 세 기둥.
 *
 * 히어로가 "누구"에 답하면 여기서 "어떻게 일하는 사람인가"에 답한다.
 * 기둥마다 증명하는 경험으로 바로 가는 줄을 붙였다.
 * 주장만 있고 근거로 가는 길이 없으면 읽는 사람이 확인할 방법이 없다.
 */
export function About() {
  return (
    <Chapter id="about" index="01" label="About">
      <ScrubbedWords
        text={about.statement}
        className="max-w-[24ch] text-chapter leading-[1.24] font-bold tracking-[-0.035em]"
      />

      <ol className="mt-16 lg:mt-20">
        {about.pillars.map((pillar, i) => (
          <Reveal as="li" key={pillar.n} delay={i * 0.06}>
            <button
              type="button"
              onClick={() => scrollToSection(pillar.proof.href)}
              data-cursor-label="보기"
              className="group rule grid w-full grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 py-8 text-left sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:gap-x-8 lg:py-10"
            >
              <span
                className="pt-1.5 font-mono text-xs tracking-[0.2em] tnum"
                style={{ color: 'var(--accent)' }}
              >
                {pillar.n}
              </span>

              <span className="min-w-0">
                <span className="block text-[clamp(1.3rem,2.4vw,1.9rem)] leading-[1.25] font-bold tracking-[-0.03em] transition-colors duration-300 group-hover:text-(--accent)">
                  {pillar.title}
                </span>
                <span className="measure mt-4 block text-[0.95rem] leading-[1.8] text-paper-dim">
                  {pillar.body}
                </span>
              </span>

              <span className="col-start-2 mt-5 inline-flex items-center gap-2 self-end text-xs text-paper-faint transition-colors group-hover:text-paper sm:col-start-3 sm:mt-0 sm:pb-1">
                <span className="font-mono tracking-[0.12em] uppercase">근거</span>
                <span className="text-paper-dim group-hover:text-paper">{pillar.proof.label}</span>
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </ol>
    </Chapter>
  )
}
