import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { awards, certificates, profile, skillGroups, emailAddress } from '../content/profile'
import { Reveal } from '../components/motion'
import { Magnetic } from '../components/Magnetic'
import { MOTION } from '../components/scroll'
import { useReducedMotion } from '../hooks/useMotionPreference'

gsap.registerPlugin(ScrollTrigger)

/**
 * 수상 6회 — 가로로 흐르는 띠.
 *
 * 세로 목록으로 쌓으면 여섯 줄짜리 표가 되고, 여섯 번 받았다는 사실이
 * 숫자로만 남는다. 가로로 흘려보내면 하나씩 지나가는 동안 각각을 보게 된다.
 *
 * 세로 스크롤을 가로 이동으로 바꾸는 구간이라 거리를 짧게 잡았다.
 * 길게 잡으면 "스크롤이 안 내려간다"는 인상을 준다.
 * 좁은 화면과 모션 축소 설정에서는 그냥 세로로 쌓는다.
 */
function AwardsStrip() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const [horizontal, setHorizontal] = useState(false)
  const reduced = useReducedMotion()

  // 1단계: 가로 배치를 쓸 화면인지 먼저 정한다.
  //
  // 이걸 ScrollTrigger 생성과 같은 이펙트에서 하면, React 가 아직
  // flex 레이아웃으로 다시 그리기 전에 track.scrollWidth 를 재게 된다.
  // 세로 레이아웃의 폭이 측정되어 이동 거리가 0 이 되고 핀이 걸리지 않는다.
  useEffect(() => {
    if (reduced) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setHorizontal(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [reduced])

  // 2단계: 가로 배치가 실제로 그려진 다음에야 트리거를 만든다.
  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!horizontal || !section || !track) return

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - section.clientWidth)

      gsap.to(track, {
        // 트랙이 화면보다 넘치는 만큼만 민다. 끝에 빈 공간이 남지 않는다.
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'center center',
          end: () => `+=${distance()}`,
          scrub: MOTION.scrub,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, section)

    // 방금 바뀐 레이아웃을 기준으로 다시 재게 한다.
    ScrollTrigger.refresh()

    return () => ctx.revert()
  }, [horizontal])

  return (
    <div ref={sectionRef} className="mt-24 overflow-hidden">
      <Reveal>
        <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
          수상 · 6회
        </h3>
      </Reveal>

      <ol
        ref={trackRef}
        className={
          horizontal
            ? 'mt-10 flex gap-6 will-change-transform'
            : 'rule mt-7'
        }
      >
        {awards.map((award, i) => (
          <li
            key={`${award.year}-${award.name}-${award.detail}`}
            className={
              horizontal
                ? 'flex w-[22rem] shrink-0 flex-col justify-between border border-ink-line bg-ink-raised/40 p-7'
                : 'grid grid-cols-[3.5rem_1fr] gap-x-5 border-b border-ink-line py-6 sm:grid-cols-[4.5rem_minmax(0,16rem)_1fr] sm:gap-x-8'
            }
          >
            {horizontal ? (
              <>
                <span className="font-mono text-sm tnum text-paper-faint">{award.year}</span>
                <div className="mt-14">
                  <p
                    className="text-xl leading-snug font-bold tracking-[-0.025em]"
                    style={{ color: 'var(--accent)' }}
                  >
                    {award.name}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-paper-dim">{award.detail}</p>
                  <p className="mt-2 text-xs text-paper-faint">{award.org}</p>
                </div>
              </>
            ) : (
              <Reveal delay={i * 0.04} className="contents">
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
              </Reveal>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

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

        <AwardsStrip />

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

            <Magnetic>
              <a
                href={profile.blog}
                target="_blank"
                rel="noreferrer noopener"
                className="text-lede text-paper-dim transition-colors hover:text-paper"
              >
                블로그
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
