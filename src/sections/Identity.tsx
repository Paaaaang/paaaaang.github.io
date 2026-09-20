import { strengths } from '../content/profile'
import { Reveal } from '../components/motion'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * "어떤 사람인가" — 강점 3가지.
 *
 * 히어로와 증거(숫자) 사이에 둔다.
 * 히어로가 "누구"에 답하고, 이 섹션이 "무엇을 할 수 있는가"에 답한 다음,
 * 증거 섹션이 "그게 사실인가"에 답한다.
 *
 * 각 강점에는 그것을 증명하는 곳으로 가는 링크를 붙였다.
 * 주장만 있고 근거로 가는 길이 없으면 읽는 사람이 확인할 방법이 없다.
 */
export function Identity() {
  return (
    <section id="who" className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
            어떤 사람인가
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-7 max-w-[24ch] text-chapter">
            기획자로서 제가 잘하는 일 세 가지
          </h2>
        </Reveal>

        <ol className="rule mt-16 grid gap-px bg-ink-line lg:grid-cols-3">
          {strengths.map((strength, i) => (
            <Reveal as="li" key={strength.n} delay={i * 0.07}>
              <article className="flex h-full flex-col bg-ink px-6 py-9 sm:px-7 sm:py-10">
                <span
                  className="font-mono text-xs tracking-[0.2em] tnum"
                  style={{ color: 'var(--accent)' }}
                >
                  {strength.n}
                </span>

                <h3 className="mt-6 text-lg leading-snug font-bold tracking-[-0.025em]">
                  {strength.title}
                </h3>

                <p className="mt-4 flex-1 text-sm leading-[1.85] text-paper-dim">
                  {strength.body}
                </p>

                <button
                  type="button"
                  onClick={() => scrollToSection(strength.proof.href)}
                  className="group mt-8 inline-flex items-center gap-2 self-start text-left text-xs text-paper-faint transition-colors hover:text-paper"
                >
                  <span className="font-mono tracking-[0.12em] uppercase">근거</span>
                  <span className="text-paper-dim group-hover:text-paper">
                    {strength.proof.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </button>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
