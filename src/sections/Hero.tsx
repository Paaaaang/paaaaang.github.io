import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { emailAddress, profile } from '../content/profile'
import { useReducedMotion } from '../hooks/useMotionPreference'
import { scrollToSection } from '../hooks/useSmoothScroll'
import { Magnetic } from '../components/Magnetic'
import { StatBand } from './StatBand'

/**
 * 첫 화면 — 정체성 우선.
 *
 * 채용 담당자가 스크롤 없이 확인해야 하는 것은 얼굴, 이름, 직무다.
 * 문장은 이력서 맨 윗줄과 같은 형식을 쓴다.
 * "가치와 효율을 찾아내는 / 서비스 기획자 오평일입니다."
 * 관형구가 위에서 받치고 직함과 이름이 문장을 닫는다.
 *
 * 수치 띠와 스크롤 표시까지 첫 화면 안에 넣는다. 스크롤하기 전에 규모가 보여야
 * "더 볼 이유"가 생기고, 아래에 무언가 더 있다는 신호도 함께 준다.
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
        .from('[data-hero-lead]', { opacity: 0, y: 20, duration: 0.8 }, '-=0.45')
        .from('[data-hero-line]', { opacity: 0, y: 30, duration: 0.95, stagger: 0.09 }, '-=0.5')
        .from('[data-hero-contact] > *', { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, '-=0.5')
        .from('[data-hero-cta] > *', { opacity: 0, y: 12, duration: 0.6, stagger: 0.07 }, '-=0.35')
        .from('[data-hero-stats] > *', { opacity: 0, y: 16, duration: 0.7, stagger: 0.07 }, '-=0.45')
        .from('[data-hero-cue]', { opacity: 0, duration: 0.8 }, '-=0.3')

      gsap.to('[data-hero-body]', {
        opacity: 0,
        y: -50,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom 30%', scrub: 0.5 },
      })

      // 스크롤 표시는 할 일을 마치면 바로 빠진다. 내려가기 시작했는데 계속 "내려가세요"라고 하면 소음이다.
      gsap.to('[data-hero-cue]', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '+=160', scrub: 0.3 },
      })
    }, el)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] flex-col px-6 pt-16 sm:px-10 sm:pt-24 lg:px-16 [@media(max-height:820px)]:sm:pt-14"
    >
      <div className="flex flex-1 items-center py-4 sm:py-6 lg:py-8 [@media(max-height:820px)]:sm:py-3">
        {/*
          글이 왼쪽, 사진이 오른쪽이다. 읽는 순서대로 문장이 먼저 오고
          얼굴이 그 문장을 받친다.
          좁은 화면에서는 머리말과 사진이 한 줄에 나란히 서고, 나머지가 그 아래
          두 열을 가로지른다. 사진을 위에 통째로 쌓으면 390px 기기에서
          연락 버튼이 화면 밖으로 밀린다.
        */}
        <div
          data-hero-body
          className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_6.5rem] items-start gap-x-5 gap-y-6 sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-x-6 lg:grid-cols-[minmax(0,42rem)_16.5rem] lg:items-center lg:justify-center lg:gap-x-14 lg:gap-y-6"
        >
          {/* ---- 사진 ---- */}
          <div
            data-hero-photo
            className="col-start-2 row-start-1 lg:row-span-2 lg:self-center"
          >
            <PhotoFrame />
          </div>

          {/* ---- 머리말 + 관형구 ---- */}
          <div className="col-start-1 row-start-1 min-w-0 self-center lg:self-end">
            <p
              data-hero-kicker
              className="font-mono text-[0.62rem] tracking-[0.22em] text-paper-faint uppercase sm:text-[0.68rem] sm:tracking-[0.26em]"
            >
              Service Planner
            </p>

            <p
              data-hero-lead
              className="mt-4 text-[clamp(1.15rem,2.6vw,2.15rem)] leading-[1.32] font-medium tracking-[-0.035em] text-paper-dim"
            >
              {profile.lead}
            </p>
          </div>

          {/* ---- 선언 · 기본 정보 · 행동 ---- */}
          <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-1 lg:self-start">
            {/*
              이력서 맨 윗줄과 같은 형식이다. 관형구가 위에서 받쳐 주고
              여기서 직함과 이름이 문장을 닫는다.
            */}
            <h1 data-hero-name className="text-display">
              <span data-hero-line className="block" style={{ color: 'var(--accent)' }}>
                서비스 기획자
              </span>
              <span data-hero-line className="block">
                {profile.name}입니다.
              </span>
            </h1>

            <p
              data-hero-line
              className="mt-4 font-mono text-[0.72rem] tracking-[0.22em] text-paper-faint uppercase"
            >
              {profile.nameEn}
            </p>

            <p className="measure mt-5 text-[0.94rem] leading-[1.7] text-paper-dim sm:mt-6 sm:text-base sm:leading-[1.75] [@media(max-height:820px)]:sm:mt-4">
              {profile.subthesis}
            </p>

            {/* ---- 연락처 ----
                히어로에서 곧바로 연락할 수 있게 주소를 그대로 보인다. 버튼 뒤에 숨기면
                메일 앱이 없는 PC에서 담당자가 주소를 복사할 방법이 없다. */}
            <ul
              data-hero-contact
              className="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-[0.9rem] sm:mt-7 [@media(max-height:820px)]:sm:mt-4"
              aria-label="연락처"
            >
              <li>
                <a
                  href={`mailto:${email}`}
                  data-cursor-label="메일"
                  className="group inline-flex items-baseline gap-2.5 text-paper transition-colors hover:text-(--accent)"
                >
                  <span className="font-mono text-[0.62rem] tracking-[0.2em] text-paper-faint uppercase">
                    Email
                  </span>
                  <span className="underline decoration-ink-line underline-offset-4 transition-colors group-hover:decoration-current">
                    {email}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-baseline gap-2.5 text-paper transition-colors hover:text-(--accent)"
                >
                  <span className="font-mono text-[0.62rem] tracking-[0.2em] text-paper-faint uppercase">
                    GitHub
                  </span>
                  <span className="underline decoration-ink-line underline-offset-4 transition-colors group-hover:decoration-current">
                    {profile.github.replace(/^https?:\/\//, '')}
                  </span>
                  <span aria-hidden="true" className="text-paper-faint">
                    ↗
                  </span>
                </a>
              </li>
            </ul>

            {/* ---- 행동 ----
                메일은 바로 위 연락처가 맡는다. 버튼은 다음에 읽을 곳 하나만 가리킨다.
                PDF 에서는 누를 곳이 없는 버튼이라 인쇄에서 뺀다. */}
            <div
              data-hero-cta
              data-print="hide"
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3.5 text-sm sm:mt-7 [@media(max-height:820px)]:sm:mt-4"
            >
              <Magnetic>
                <button
                  type="button"
                  onClick={() => scrollToSection('work')}
                  className="group inline-flex items-center gap-2 rounded-sm px-4 py-2.5 font-bold text-ink transition-opacity hover:opacity-85"
                  style={{ background: 'var(--accent)' }}
                >
                  프로젝트 보기
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
                  >
                    ↓
                  </span>
                </button>
              </Magnetic>

              {/* 파일이 없으면 버튼을 만들지 않는다. 깨진 링크가 더 나쁘다. */}
              {profile.pdf.href && (
                <a
                  href={profile.pdf.href}
                  download={profile.pdf.filename}
                  className="group inline-flex items-center gap-2 text-paper transition-colors hover:text-(--accent)"
                >
                  포트폴리오 PDF
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
                  >
                    ↓
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- 규모 · 스크롤 표시 ----
          첫 화면 맨 아래에 붙는다. 사진과 문장이 먼저 읽히고, 눈이 내려오면 숫자가 받는다. */}
      <div className="mx-auto w-full max-w-6xl">
        <StatBand />
        <ScrollCue />
      </div>
    </section>
  )
}

/**
 * 스크롤 표시.
 *
 * 첫 화면이 꽉 차 보이면 여기서 끝나는 페이지로 읽힌다. 얇은 선 안에서 점이
 * 아래로 흐르며 더 내려갈 곳이 있다고 알린다. 누르면 다음 챕터로 이동한다.
 * 모션을 줄이면 흐름은 멈추고 선과 글자만 남는다.
 */
function ScrollCue() {
  return (
    <div
      data-hero-cue
      data-print="hide"
      className="flex justify-center pt-2.5 pb-3 sm:pt-4 sm:pb-5 [@media(max-height:820px)]:sm:pt-2 [@media(max-height:820px)]:sm:pb-3"
    >
      <button
        type="button"
        onClick={() => scrollToSection('about')}
        aria-label="아래로 스크롤해 소개 보기"
        className="group flex flex-col items-center gap-1.5 font-mono sm:gap-2 text-[0.6rem] tracking-[0.3em] text-paper-faint uppercase transition-colors hover:text-paper"
      >
        Scroll
        <span
          aria-hidden="true"
          className="relative block h-5 w-px overflow-hidden bg-ink-line sm:h-9 [@media(max-height:820px)]:sm:h-6"
        >
          <span
            className="absolute inset-x-0 top-0 h-1/2 animate-scroll-cue"
            style={{ background: 'var(--accent)' }}
          />
        </span>
      </button>
    </div>
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
