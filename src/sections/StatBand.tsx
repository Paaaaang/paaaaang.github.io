import { awards, certificates, teamProjects } from '../content/profile'
import { CountUp } from '../components/motion'

/**
 * 히어로 맨 아래의 수치 띠.
 *
 * 문장 안에는 숫자를 두지 않는다. 얼굴과 문장이 먼저 읽히고, 눈이 첫 화면
 * 아래로 내려오면 규모를 한 줄로 받는다. 스크롤하기 전에 보여야 해서
 * 넓은 화면에서는 숫자와 설명을 옆으로 눕혀 높이를 줄였다.
 * 개수는 목록 길이에서 바로 센다. 손으로 적은 숫자는 목록과 어긋난다.
 *
 * 등장은 히어로 타임라인이 맡는다. 스크롤 리빌에 맡기면 낮은 화면에서
 * 띠가 트리거 선 아래에 걸려 빈칸으로 남는다.
 */
export function StatBand() {
  const stats = [
    { value: teamProjects.length, label: 'Team Projects', note: '팀으로 진행한 프로젝트' },
    { value: awards.length, label: 'Awards', note: '공모전 · 경진대회 수상' },
    { value: certificates.length, label: 'Certificates', note: '정보처리기사 외' },
  ]

  return (
    <section aria-label="요약 수치">
      <div data-hero-stats className="grid grid-cols-3 border-y border-ink-line">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-3 py-4 sm:flex sm:items-center sm:gap-5 sm:px-6 sm:py-6 [@media(max-height:820px)]:sm:py-4 ${
              i > 0 ? 'border-l border-ink-line' : ''
            }`}
          >
            <p className="text-[clamp(1.9rem,4.2vw,3.1rem)] leading-none font-bold tracking-[-0.045em] tnum">
              <CountUp to={stat.value} start="top bottom" />
            </p>
            <div className="mt-2.5 sm:mt-0">
              <p
                className="font-mono text-[0.6rem] tracking-[0.18em] uppercase sm:text-[0.66rem] sm:tracking-[0.22em]"
                style={{ color: 'var(--accent)' }}
              >
                {stat.label}
              </p>
              <p className="mt-1 hidden text-xs text-paper-faint sm:block">{stat.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
