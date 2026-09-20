import { method, limits } from '../content/profile'
import { Reveal } from '../components/motion'

/**
 * 일하는 순서 + 한계와 학습.
 *
 * 두 섹션을 붙여 둔 이유가 있다. 방법론만 있으면 말뿐이고,
 * 실패만 있으면 반성문이다. 실패에서 방법이 나왔다는 순서가 보여야 한다.
 */
export function Method() {
  return (
    <>
      <section id="method" className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
              방법
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-7 text-chapter">{method.title}</h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="measure mt-8 text-lede leading-[1.75] text-paper-dim">
              {method.intro}
            </p>
          </Reveal>

          <ol className="rule mt-16 grid gap-px bg-ink-line md:grid-cols-5">
            {method.steps.map((step, i) => (
              <Reveal as="li" key={step.n} delay={i * 0.05}>
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
            ))}
          </ol>
        </div>
      </section>

      <section id="limits" className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
              한계와 학습
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-7 max-w-[22ch] text-chapter">
              고치고 나서야 알게 된 것들
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-14 lg:grid-cols-2 lg:gap-20">
            {limits.map((limit, i) => (
              <Reveal key={limit.title} delay={i * 0.08}>
                <article className="rule pt-9">
                  <p className="font-mono text-[0.68rem] tracking-[0.18em] text-paper-faint uppercase">
                    {limit.context}
                  </p>
                  <h3 className="mt-5 text-xl font-bold tracking-[-0.025em] leading-snug">
                    {limit.title}
                  </h3>
                  <p className="mt-6 leading-[1.85] text-paper-dim">{limit.what}</p>

                  <div className="mt-7 flex gap-4">
                    <span
                      className="mt-[0.7rem] h-px w-6 shrink-0"
                      style={{ background: 'var(--accent)' }}
                      aria-hidden="true"
                    />
                    <p className="leading-[1.85] text-paper">{limit.change}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
