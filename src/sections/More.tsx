import { moreWork } from '../content/profile'
import { Chapter } from '../components/Chapter'
import { Reveal } from '../components/motion'

/**
 * 03 More — 대표에서 빠졌지만 같은 방식으로 일한 흔적.
 *
 * 구조도는 두지 않고 한 장씩 가볍게 읽히게 한다. 결과 줄만 챕터 색이다.
 * 대표 경험보다 한 단계 낮은 무게로 보여야 대표 경험이 대표로 읽힌다.
 */
export function More() {
  return (
    <Chapter id="more" index="03" label="More" title={['그 밖에 해 온 일']}>
      <Reveal stagger className="mt-14 grid gap-px bg-ink-line lg:grid-cols-3">
        {moreWork.map((work) => (
          <article key={work.title} className="flex h-full flex-col bg-ink px-6 py-8 sm:px-7">
            <p className="font-mono text-[0.66rem] tracking-[0.14em] text-paper-faint tnum">
              {work.period}
            </p>
            <h3 className="mt-5 text-lg leading-snug font-bold tracking-[-0.025em]">{work.title}</h3>
            <p className="mt-2 text-xs text-paper-faint">{work.org}</p>
            <p className="mt-5 flex-1 text-sm leading-[1.85] text-paper-dim">{work.body}</p>
            <p
              className="mt-7 border-t border-ink-line pt-4 text-sm leading-relaxed font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {work.result}
            </p>
          </article>
        ))}
      </Reveal>
    </Chapter>
  )
}
