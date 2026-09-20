import { awards, certificates, profile, skillGroups, emailAddress } from '../content/profile'
import { Reveal } from '../components/motion'
import { Magnetic } from '../components/Magnetic'

/** 역량 · 자격 · 수상. 스캔하듯 읽는 구간이라 표에 가깝게 짠다. */
export function Credentials() {
  return (
    <section id="credentials" className="relative px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
            역량
          </p>
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-3 lg:gap-12">
          {skillGroups.map((group, i) => (
            <Reveal key={group.group} delay={i * 0.06}>
              <div className="rule pt-7">
                <h3 className="text-sm font-bold tracking-[-0.01em]">{group.group}</h3>
                <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2.5">
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
        <div className="mt-28">
          <Reveal>
            <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
              자격증
            </h3>
          </Reveal>
          <Reveal stagger className="rule mt-7">
            {certificates.map((cert) => (
              <div
                key={cert.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink-line py-5"
              >
                <span className="font-bold tracking-[-0.015em]">{cert.name}</span>
                <span className="text-sm text-paper-dim">{cert.org}</span>
                <span className="font-mono text-sm tnum text-paper-faint">{cert.date}</span>
              </div>
            ))}
          </Reveal>
        </div>

        {/* ---- 수상 ---- */}
        <div className="mt-24">
          <Reveal>
            <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
              수상 · 6회
            </h3>
          </Reveal>
          <Reveal stagger className="rule mt-7">
            {awards.map((award) => (
              <div
                key={`${award.year}-${award.name}-${award.detail}`}
                className="grid grid-cols-[3.5rem_1fr] gap-x-5 border-b border-ink-line py-6 sm:grid-cols-[4.5rem_minmax(0,16rem)_1fr] sm:gap-x-8"
              >
                <span className="font-mono text-sm tnum text-paper-faint">{award.year}</span>
                <span
                  className="font-bold tracking-[-0.015em]"
                  style={{ color: 'var(--accent)' }}
                >
                  {award.name}
                </span>
                <div className="col-start-2 sm:col-start-3">
                  <p className="text-sm leading-relaxed text-paper-dim">{award.detail}</p>
                  <p className="mt-1 text-xs text-paper-faint">{award.org}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/** 마지막 화면. 연락 수단은 이메일과 GitHub 뿐이다. */
export function Contact() {
  const email = emailAddress()

  return (
    <footer
      id="contact"
      className="relative px-6 pt-28 pb-16 sm:px-10 lg:px-16 lg:pt-44"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
            연락
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-8 max-w-[16ch] text-display">
            만들 수 있는
            <br />
            <span style={{ color: 'var(--accent)' }}>기획을 내놓겠습니다</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-6">
            <Magnetic>
              <a
                href={`mailto:${email}`}
                className="group inline-flex items-baseline gap-3 text-lede font-bold tracking-[-0.02em] transition-colors hover:text-[--accent]"
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
    </footer>
  )
}
