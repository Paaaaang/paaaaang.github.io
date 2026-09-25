import { useEffect, useState } from 'react'
import { sections, profile, emailAddress } from '../content/profile'
import { scrollToSection } from '../hooks/useSmoothScroll'

/**
 * 목차.
 *
 * 데스크톱에서는 오른쪽에 붙어 현재 위치를 보여주고,
 * 좁은 화면에서는 상단 진행 막대만 남긴다.
 * 긴 문서에서 지금 어디쯤인지 모르는 게 가장 큰 이탈 이유다.
 */
export function Nav() {
  const [active, setActive] = useState<string>('hero')
  const [progress, setProgress] = useState(0)
  /** 히어로를 지났는지. 상단 바 노출 여부를 정한다. */
  const [past, setPast] = useState(false)

  useEffect(() => {
    const ids = sections.map((s) => s.id)
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        // 화면 중앙에 가장 가까운 섹션을 현재 섹션으로 본다.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    elements.forEach((el) => observer.observe(el))

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? window.scrollY / max : 0)
        setPast(window.scrollY > window.innerHeight * 0.75)
        frame = 0
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <a
        href="#about"
        onClick={(e) => {
          e.preventDefault()
          scrollToSection('about')
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        본문으로 건너뛰기
      </a>

      {/* 상단 진행 막대 */}
      <div
        className="fixed inset-x-0 top-0 z-40 h-px bg-ink-line"
        role="presentation"
      >
        <div
          className="h-full origin-left transition-none"
          style={{
            background: 'var(--accent)',
            transform: `scaleX(${progress})`,
          }}
        />
      </div>

      {/* 상단 바. 히어로를 지나면 나타나 이름·직무·연락을 계속 들고 다닌다.
          18,000px 문서 어디에서 마음먹어도 한 번에 연락할 수 있어야 한다. */}
      <div
        className={`fixed top-0 right-0 left-0 z-30 flex items-center justify-between gap-4 border-b px-6 py-3.5 transition-all duration-500 sm:px-10 lg:px-16 ${
          past
            ? 'translate-y-0 border-ink-line bg-ink/92 opacity-100 backdrop-blur-xl'
            : 'pointer-events-none -translate-y-2 border-transparent opacity-0'
        }`}
      >
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="shrink-0 text-sm font-bold tracking-[-0.01em]">{profile.name}</span>
          <span className="truncate font-mono text-[0.66rem] tracking-[0.16em] text-paper-faint uppercase">
            {profile.role}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden font-mono text-[0.66rem] tracking-[0.14em] text-paper-faint uppercase sm:inline">
            {sections.find((s) => s.id === active)?.label ?? ''}
          </span>
          <a
            href={`mailto:${emailAddress()}`}
            className="rounded-sm px-3 py-1.5 text-xs font-bold text-ink transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)' }}
          >
            메일
          </a>
        </div>
      </div>

      {/* 넓은 화면: 세로 목차 */}
      <nav
        aria-label="섹션 목차"
        className="fixed top-1/2 right-6 z-30 hidden -translate-y-1/2 lg:block"
      >
        {/* 이름은 각 챕터 레일과 상단 바에 이미 있다. 여기서는 위치만 점으로 보인다.
            이름까지 띄우면 넓은 화면에서 본문 오른쪽 끝과 겹친다. */}
        <ul className="space-y-3.5">
          {sections.map((section) => {
            const isActive = section.id === active
            return (
              <li key={section.id} className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  aria-label={`${section.label} 섹션으로 이동`}
                  aria-current={isActive ? 'true' : undefined}
                  title={section.label}
                  className="block h-2 w-2 rounded-full transition-all duration-300 hover:scale-150"
                  style={{
                    background: isActive ? 'var(--accent)' : 'var(--color-ink-line)',
                    transform: isActive ? 'scale(1.35)' : undefined,
                  }}
                />
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
