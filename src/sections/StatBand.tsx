import { awards, certificates, teamProjects } from '../content/profile'
import { CountUp, Reveal } from '../components/motion'

/**
 * 히어로 바로 아래 수치 띠.
 *
 * 히어로 안에는 숫자를 두지 않는다. 첫 화면은 얼굴과 문장이 맡고,
 * 스크롤을 한 번 내렸을 때 규모를 한 줄로 보여 준다.
 * 개수는 목록 길이에서 바로 센다. 손으로 적은 숫자는 목록과 어긋난다.
 */
export function StatBand() {
  const stats = [
    { value: teamProjects.length, label: 'Team Projects', note: '팀으로 진행한 프로젝트' },
    { value: awards.length, label: 'Awards', note: '공모전 · 경진대회 수상' },
    { value: certificates.length, label: 'Certificates', note: '정보처리기사 외' },
  ]

  return (
    <section aria-label="요약 수치" className="relative px-6 sm:px-10 lg:px-16">
      <Reveal stagger className="mx-auto grid max-w-6xl grid-cols-3 border-y border-ink-line">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-3 py-7 sm:px-6 sm:py-9 ${i > 0 ? 'border-l border-ink-line' : ''}`}
          >
            <p className="text-[clamp(2rem,5vw,3.5rem)] leading-none font-bold tracking-[-0.045em] tnum">
              <CountUp to={stat.value} />
            </p>
            <p
              className="mt-3 font-mono text-[0.6rem] tracking-[0.18em] uppercase sm:text-[0.68rem] sm:tracking-[0.22em]"
              style={{ color: 'var(--accent)' }}
            >
              {stat.label}
            </p>
            <p className="mt-1.5 hidden text-xs text-paper-faint sm:block">{stat.note}</p>
          </div>
        ))}
      </Reveal>
    </section>
  )
}
