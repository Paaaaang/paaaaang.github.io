import { awards, certificates, profile, skillGroups, emailAddress } from '../content/profile'
import { Reveal } from '../components/motion'
import { Chapter, ChapterMark } from '../components/Chapter'
import { Magnetic } from '../components/Magnetic'

/**
 * 수상 — 연도 · 상 이름 · 대회와 주관 기관을 한 줄씩 쌓은 표.
 *
 * 예전에는 넓은 화면에서 화면을 붙잡고 가로로 흘려보냈다. 표로 두는 편이 한눈에
 * 훑어보기 쉬워서(본인 피드백) 모든 화면에서 이 배치 하나만 쓴다.
 * 좁은 화면에서는 대회 정보가 상 이름 아래로 내려간다.
 */
function AwardsList() {
  return (
    // data-awards: 인쇄에서 이 묶음은 쪽 사이에서 잘려도 된다(줄 하나하나는 자르지 않는다).
    <div data-awards className="mt-20">
      <Reveal>
        <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
          수상 · {awards.length}
        </h3>
      </Reveal>

      <ol className="rule mt-7">
        {awards.map((award, i) => (
          <li
            key={`${award.year}-${award.name}-${award.detail}`}
            className="grid grid-cols-[3.5rem_1fr] gap-x-5 border-b border-ink-line py-6 sm:grid-cols-[4.5rem_minmax(0,16rem)_1fr] sm:gap-x-8"
          >
            <Reveal delay={i * 0.04} className="contents">
              <span className="font-mono text-sm tnum text-paper-faint">{award.year}</span>
              <span className="font-bold tracking-[-0.015em]" style={{ color: 'var(--accent)' }}>
                {award.name}
              </span>
              <div className="col-start-2 sm:col-start-3">
                <p className="text-sm leading-relaxed text-paper-dim">{award.detail}</p>
                <p className="mt-1 text-xs text-paper-faint">{award.org}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** 05 Certificates — 역량 · 자격 · 수상. 스캔하듯 읽는 구간이라 표에 가깝게 짠다. */
export function Toolkit() {
  return (
    <Chapter id="toolkit" index="05" label="Certificates" title={['Certificates']}>
      <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
        {skillGroups.map((group, i) => (
          <Reveal key={group.group} delay={i * 0.06}>
            <div className="rule pt-6">
              <h3 className="text-sm font-bold tracking-[-0.01em]">{group.group}</h3>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-paper-dim">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ---- 자격증 ---- */}
      <div className="mt-20">
        <Reveal>
          <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
            자격증 · {certificates.length}
          </h3>
        </Reveal>
        <Reveal stagger className="rule mt-6">
          {certificates.map((cert) => (
            <div
              key={cert.name}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 border-b border-ink-line py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_5rem]"
            >
              <span className="font-bold tracking-[-0.015em]">{cert.name}</span>
              <span className="hidden text-sm text-paper-dim sm:block">{cert.org}</span>
              <span className="text-right font-mono text-sm tnum text-paper-faint">{cert.date}</span>
            </div>
          ))}
        </Reveal>
      </div>

      <AwardsList />
    </Chapter>
  )
}

/** 06 Contact — 마지막 화면. 연락 수단은 이메일과 GitHub 뿐이다. */
export function Contact() {
  const email = emailAddress()

  return (
    <footer id="contact" aria-label="Contact" className="relative px-6 pt-28 pb-16 sm:px-10 lg:px-16 lg:pt-40">
      <div className="mx-auto grid max-w-6xl gap-y-10 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-x-14">
        <aside>
          <ChapterMark index="06" label="Contact" />
        </aside>

        <div className="min-w-0">
          <Reveal>
            <h2 className="max-w-[16ch] text-display">
              가치를 담아낼 수 있는
              <br />
              <span style={{ color: 'var(--accent)' }}>기획을 하겠습니다</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-6">
              <Magnetic>
                <a
                  href={`mailto:${email}`}
                  data-cursor-label="메일"
                  className="group inline-flex items-baseline gap-3 text-lede font-bold tracking-[-0.02em] transition-colors hover:text-(--accent)"
                >
                  {email}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </Magnetic>

              <Magnetic>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-lede text-paper-dim transition-colors hover:text-paper"
                >
                  GitHub
                </a>
              </Magnetic>

            </div>
          </Reveal>

          <div className="rule mt-24 flex flex-wrap items-center justify-between gap-4 pt-7 text-xs text-paper-faint">
            <span>
              © {new Date().getFullYear()} {profile.name} · {profile.role}
            </span>
            <span className="font-mono tracking-[0.12em]">
              {profile.education.school} {profile.education.major} · {profile.education.minor}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
