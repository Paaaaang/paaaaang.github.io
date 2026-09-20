import { metrics } from '../content/profile'
import { CountUp, Reveal, ScrubbedWords } from '../components/motion'

/**
 * 증거 섹션.
 *
 * 케이스 스터디를 읽기 전에 결과부터 보여준다.
 * 본인이 정리한 발표 구조(결론 → 근거 → 실행 → 지표)를 사이트 구조에도 적용했다.
 */
export function Proof() {
  return (
    <section id="proof" className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
            증거
          </p>
        </Reveal>

        <ScrubbedWords
          text="세 번 모두 같은 일을 했습니다. 한 사람이나 한 경로에 묶여 있던 운영을 밖으로 꺼내, 다른 사람도 쓰고 확인할 수 있게 만든 것입니다."
          className="measure mt-8 text-chapter font-bold tracking-[-0.03em] leading-[1.2]"
        />

        <div className="rule mt-20">
          <dl className="grid gap-px bg-ink-line sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, i) => (
              <Reveal key={metric.label} delay={i * 0.06}>
                <div className="flex h-full flex-col justify-between bg-ink px-6 py-10 sm:px-7">
                  <dd className="text-[clamp(2.75rem,6vw,4.5rem)] font-bold tracking-[-0.045em] tnum leading-none">
                    {metric.numeric !== undefined ? (
                      <CountUp to={metric.numeric} suffix={metric.suffix ?? ''} />
                    ) : (
                      metric.value
                    )}
                  </dd>
                  <div className="mt-8">
                    <dt className="text-sm leading-relaxed text-paper">{metric.label}</dt>
                    <p className="mt-2 font-mono text-[0.68rem] tracking-[0.1em] text-paper-faint">
                      {metric.source}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
