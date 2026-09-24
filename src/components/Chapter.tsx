import { useRef, type ReactNode } from 'react'
import { Reveal, useChapterAccent } from './motion'
import { MaskedLines } from './scroll'

/**
 * 챕터 틀 — 인덱스 레일.
 *
 * 모든 챕터가 같은 뼈대를 쓴다. 왼쪽 좁은 단에 번호와 이름이 붙어 있고
 * 오른쪽 넓은 단에 내용이 흐른다. 넓은 화면에서는 왼쪽 단이 스크롤을
 * 따라 내려와, 긴 경험을 읽는 중에도 지금 몇 번째 챕터인지 놓치지 않는다.
 *
 * 챕터마다 레이아웃을 새로 짜면 사이트가 섹션 모음집처럼 읽힌다.
 * 틀이 같아야 내용의 차이가 보인다.
 */
export function Chapter({
  id,
  index,
  label,
  title,
  intro,
  accent = '#E8542F',
  rail,
  children,
  className,
}: {
  id: string
  index: string
  label: string
  /** 줄 단위로 넘기면 그 위치에서 끊는다. 한글 제목은 어절 경계에서 직접 끊는 게 낫다. */
  title?: string[]
  intro?: string
  /** null 이면 챕터가 색을 정하지 않는다. 안쪽 경험이 각자 정할 때 쓴다. */
  accent?: string | null
  /** 레일 아래에 붙는 보조 목차. Selected Work 에서 경험 목록으로 쓴다. */
  rail?: ReactNode
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useChapterAccent(ref, accent)

  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      className={`relative px-6 py-24 sm:px-10 lg:px-16 lg:py-36 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl gap-y-10 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-x-14">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <ChapterMark index={index} label={label} />
          {rail}
        </aside>

        <div className="min-w-0">
          {title && (
            <MaskedLines
              lines={title}
              className="max-w-[22ch] text-chapter"
              as="h2"
            />
          )}

          {intro && (
            <Reveal delay={0.1}>
              <p className="measure mt-7 text-lede leading-[1.75] text-paper-dim">{intro}</p>
            </Reveal>
          )}

          {children}
        </div>
      </div>
    </section>
  )
}

/** 챕터 번호와 이름. 좁은 화면에서는 한 줄, 넓은 화면에서는 두 줄로 선다. */
export function ChapterMark({ index, label }: { index: string; label: string }) {
  return (
    <Reveal>
      <div className="rule flex items-baseline gap-4 pt-5 lg:block lg:pt-6">
        <span
          className="font-mono text-sm tracking-[0.2em] tnum"
          style={{ color: 'var(--accent)' }}
        >
          {index}
        </span>
        <span className="font-mono text-[0.7rem] tracking-[0.24em] text-paper-faint uppercase lg:mt-3 lg:block">
          {label}
        </span>
      </div>
    </Reveal>
  )
}

/**
 * 챕터 안의 소제목 줄. 경험 케이스의 "문제 / 목표 / 핵심 결정" 같은
 * 행 머리에 쓴다. 넓은 화면에서는 왼쪽 좁은 단에 서고 내용이 오른쪽에 붙는다.
 */
export function Row({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rule grid gap-y-4 pt-7 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-10 ${className ?? ''}`}
    >
      <Reveal>
        <h3 className="font-mono text-[0.7rem] tracking-[0.22em] text-paper-faint uppercase">
          {label}
        </h3>
      </Reveal>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
