import { limits } from '../content/profile'
import { Chapter } from '../components/Chapter'
import { Reveal } from '../components/motion'

/**
 * 05 Retrospective — 틀리고 나서 바꾼 것.
 *
 * 바로 앞의 "일하는 순서"가 어디서 왔는지 보여 준다.
 * 방법론만 있으면 말뿐이고 실패만 있으면 반성문이다.
 * 실패에서 방법이 나왔다는 순서가 보여야 한다.
 */
export function Retrospective() {
  return (
    <Chapter id="retro" index="05" label="Retrospective" title={['틀리고 나서 바꾼 것들']}>
      <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-12">
        {limits.map((limit, i) => (
          <Reveal key={limit.title} delay={i * 0.08}>
            <article className="rule pt-8">
              <p className="font-mono text-[0.66rem] tracking-[0.16em] text-paper-faint uppercase">
                {limit.context}
              </p>
              <h3 className="mt-5 text-xl leading-snug font-bold tracking-[-0.025em]">{limit.title}</h3>
              <p className="mt-6 leading-[1.85] text-paper-dim">{limit.what}</p>

              <div className="mt-7 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3">
                <span
                  className="mt-[0.72rem] h-px w-6"
                  style={{ background: 'var(--accent)' }}
                  aria-hidden="true"
                />
                <div>
                  <p
                    className="font-mono text-[0.64rem] tracking-[0.18em] uppercase"
                    style={{ color: 'var(--accent)' }}
                  >
                    그 뒤로
                  </p>
                  <p className="mt-2 leading-[1.85] text-paper">{limit.change}</p>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Chapter>
  )
}
