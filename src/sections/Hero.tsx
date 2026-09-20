import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { emailAddress, identity, profile } from '../content/profile'
import { useReducedMotion } from '../hooks/useMotionPreference'
import { scrollToSection } from '../hooks/useSmoothScroll'
import { Magnetic } from '../components/Magnetic'

/**
 * 첫 화면 — 정체성 우선.
 *
 * 채용 담당자가 스크롤 없이 확인해야 하는 것은 네 가지다.
 * 얼굴, 이름, 직무, 지금 어떤 상태인가(신입 / 졸업 시점).
 * 주장("요청의 표면이 아니라…")은 그 다음에 온다.
 * 누가 하는 말인지 모른 채 읽는 주장은 남지 않는다.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const email = emailAddress()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

      // 사진은 페이드가 아니라 마스크로 걷어낸다.
      // "이 사람이 등장한다"는 의도가 페이드보다 분명하다.
      tl.from('[data-photo-reveal]', {
        clipPath: 'inset(100% 0% 0% 0%)',
        duration: 0.64,
        ease: 'power3.inOut',
      })
        .from('[data-hero-photo]', { opacity: 0, duration: 0.5 }, 0)
        .from('[data-hero-kicker]', { opacity: 0, y: 12, duration: 0.6 }, '-=0.8')
        .from('[data-hero-name]', { opacity: 0, y: 30, duration: 0.9 }, '-=0.45')
        .from('[data-hero-line]', { opacity: 0, y: 22, duration: 0.85, stagger: 0.07 }, '-=0.55')
        .from('[data-hero-chips] > *', { opacity: 0, y: 10, duration: 0.5, stagger: 0.04 }, '-=0.5')
        .from('[data-hero-cta] > *', { opacity: 0, y: 12, duration: 0.6, stagger: 0.07 }, '-=0.35')

      gsap.to('[data-hero-body]', {
        opacity: 0,
        y: -50,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom 30%', scrub: 0.5 },
      })
    }, el)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] items-center px-6 pt-20 pb-14 sm:px-10 sm:pt-24 lg:px-16"
    >
      {/*
        좁은 화면에서는 사진과 이름이 한 줄에 나란히 서고, 나머지가 그 아래
        두 열을 가로지른다. 사진을 위에 통째로 쌓으면 390px 기기에서
        연락 버튼이 화면 밖으로 밀린다. 첫 화면에서 연락 수단이 보이지 않으면
        정체성을 앞세운 의미가 없다.
      */}
      <div
        data-hero-body
        className="mx-auto grid w-full max-w-6xl grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-5 gap-y-7 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-7 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-center lg:gap-x-16 lg:gap-y-8"
      >
        {/* ---- 사진 ---- */}
        <div
          data-hero-photo
          className="col-start-1 row-start-1 lg:row-span-2 lg:self-center"
        >
          <PhotoFrame />
        </div>

        {/* ---- 이름 ---- */}
        <div className="col-start-2 row-start-1 min-w-0 self-center lg:self-end">
          <p
            data-hero-kicker
            className="font-mono text-[0.64rem] tracking-[0.2em] uppercase sm:text-[0.7rem] sm:tracking-[0.24em]"
            style={{ color: 'var(--accent)' }}
          >
            {profile.role}
          </p>

          <h1 data-hero-name className="mt-3 text-display">
            {profile.name}
          </h1>
        </div>

        {/* ---- 주장 · 기본 정보 · 행동 ---- */}
        <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:self-start">
          <p className="measure text-[clamp(1.02rem,1.75vw,1.45rem)] leading-[1.6] font-bold tracking-[-0.02em]">
            {['요청의 표면이 아니라 그 아래의', '운영 실태를 먼저 확인합니다'].map((line) => (
              <span key={line} data-hero-line className="block">
                {line}
              </span>
            ))}
          </p>

          <p className="measure mt-4 text-[0.94rem] leading-[1.75] text-paper-dim sm:text-base">
            {profile.subthesis}
          </p>

          {/* ---- 적합성 판단용 기본 정보 ---- */}
          <ul
            data-hero-chips
            className="mt-7 flex flex-wrap gap-x-2 gap-y-2"
            aria-label="기본 정보"
          >
            {identity.map((item) => (
              <li
                key={item.label}
                className="rounded-full border px-3 py-1.5 text-[0.74rem] leading-none sm:px-3.5 sm:text-[0.78rem]"
                style={
                  item.emphasis
                    ? {
                        borderColor: 'color-mix(in oklab, var(--accent) 55%, transparent)',
                        color: 'var(--accent)',
                      }
                    : { borderColor: 'var(--color-ink-line)', color: 'var(--color-paper-dim)' }
                }
              >
                <span className="sr-only">{item.label}: </span>
                {item.value}
              </li>
            ))}
          </ul>

          {/* ---- 행동 ---- */}
          <div data-hero-cta className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3.5 text-sm">
            <Magnetic>
              <a
                href={`mailto:${email}`}
                className="group inline-flex items-center gap-2 rounded-sm px-4 py-2.5 font-bold text-ink transition-opacity hover:opacity-85"
                style={{ background: 'var(--accent)' }}
              >
                메일 보내기
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </a>
            </Magnetic>

            {/* 파일이 없으면 버튼을 만들지 않는다. 깨진 링크가 더 나쁘다. */}
            {profile.resumePdf && (
              <a
                href={profile.resumePdf}
                download
                className="group inline-flex items-center gap-2 text-paper transition-colors hover:text-[--accent]"
              >
                이력서 PDF
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  ↓
                </span>
              </a>
            )}

            <button
              type="button"
              onClick={() => scrollToSection('who')}
              className="group inline-flex items-center gap-2 text-paper-dim transition-colors hover:text-paper"
            >
              어떤 사람인지 보기
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * 이력서 사진 자리.
 *
 * 파일을 넣기 전까지는 다른 자료 슬롯과 같은 규칙으로 빈 프레임을 그린다.
 * 사진을 넣어도 프레임 크기가 같아서 레이아웃이 움직이지 않는다.
 */
function PhotoFrame() {
  if (profile.photo) {
    return (
      <div
        data-photo-reveal
        className="relative overflow-hidden rounded-sm border border-ink-line"
        style={{ aspectRatio: '4 / 5' }}
      >
        <img
          src={profile.photo}
          alt={profile.photoAlt}
          width={640}
          height={800}
          // 첫 화면 이미지라 지연 로딩하지 않는다. 늦게 뜨면 의미가 없다.
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
          style={{
            // 얼굴을 정중앙이 아니라 위쪽 1/3에 둔다.
            // 정중앙 배치는 증명사진 특유의 경직됨을 그대로 가져온다.
            objectPosition: 'center 28%',
            // 채도만 조금 낮추고 명암을 살짝 올려 사이트의 잉크 계조에 들인다.
            // 완전 흑백은 쓰지 않는다. 채용 포트폴리오에서 흑백 인물은 거리감을 만든다.
            filter: 'saturate(0.88) contrast(1.06)',
          }}
        />

        {/* 증명사진의 균일한 배경은 테두리가 칼같이 드러난다.
            잉크로 향하는 비네트를 겹쳐 사각형이 떠 있지 않게 한다. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(118% 88% at 50% 32%, transparent 46%, color-mix(in oklab, var(--color-ink) 78%, transparent) 100%)',
          }}
        />

        {/* 챕터 색 하어라인. 사진이 사이트의 일부라는 신호. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-px"
          style={{ background: 'var(--accent)' }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative grid w-full place-items-center rounded-sm border border-dashed border-ink-line bg-ink-raised/60"
      style={{ aspectRatio: '4 / 5' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-ink-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink-line) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative px-5 text-center">
        <span
          className="font-mono text-[0.66rem] tracking-[0.2em] uppercase"
          style={{ color: 'var(--accent)' }}
        >
          이력서 사진
        </span>
        <p className="mt-2 text-xs leading-relaxed text-paper-faint">
          public/media/profile/ 에 넣고
          <br />
          profile.photo 경로를 연결하세요
        </p>
      </div>
    </div>
  )
}
