import type { MediaSlot } from '../content/profile'
import { Reveal } from './motion'

/**
 * 자료가 들어갈 자리.
 *
 * `src` 가 없으면 무엇이 들어갈 자리인지 적힌 빈 프레임을 그린다.
 * 나중에 이미지를 넣어도 크기가 그대로라 레이아웃이 흔들리지 않는다.
 * "준비 중"이라고 얼버무리지 않고, 어떤 자료가 올 자리인지 그대로 적는다.
 */

const RATIO: Record<NonNullable<MediaSlot['ratio']>, string> = {
  wide: '16 / 7',
  video: '16 / 9',
  square: '1 / 1',
  portrait: '4 / 5',
}

export function MediaFrame({ slot }: { slot: MediaSlot }) {
  const aspect = RATIO[slot.ratio ?? 'video']

  return (
    <figure className="m-0">
      {slot.src ? (
        <img
          src={slot.src}
          alt={slot.alt ?? slot.caption}
          loading="lazy"
          decoding="async"
          className="w-full rounded-sm border border-[--color-ink-line] bg-[--color-ink-raised] object-cover"
          style={{ aspectRatio: aspect }}
        />
      ) : (
        <div
          className="relative grid w-full place-items-center rounded-sm border border-dashed border-[--color-ink-line] bg-[--color-ink-raised]/60"
          style={{ aspectRatio: aspect }}
        >
          {/* 빈 프레임임을 드러내는 옅은 격자. 회색 덩어리보다 의도가 읽힌다. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--color-ink-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink-line) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="relative px-6 text-center">
            <span
              className="font-mono text-[0.68rem] tracking-[0.22em] uppercase"
              style={{ color: 'var(--accent)' }}
            >
              {slot.kind}
            </span>
            <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-[--color-paper-faint]">
              {slot.caption}
            </p>
          </div>
        </div>
      )}

      <figcaption className="mt-3 flex items-baseline gap-2 text-xs text-[--color-paper-faint]">
        <span
          className="font-mono tracking-[0.14em] uppercase"
          style={{ color: 'var(--accent)' }}
        >
          {slot.kind}
        </span>
        <span className="text-[--color-ink-line]">/</span>
        <span className="text-[--color-paper-dim]">{slot.caption}</span>
      </figcaption>
    </figure>
  )
}

/**
 * 케이스 스터디의 자료 묶음.
 *
 * 첫 자료는 폭을 다 쓰고 나머지는 2열로 간다. 전부 같은 크기로 늘어놓으면
 * 어떤 게 핵심 자료인지 구분되지 않는다.
 */
export function MediaGallery({ slots }: { slots: MediaSlot[] }) {
  if (slots.length === 0) return null

  const [lead, ...rest] = slots

  return (
    <div className="mt-14">
      <p className="mb-5 font-mono text-[0.68rem] tracking-[0.22em] text-[--color-paper-faint] uppercase">
        자료
      </p>

      {lead && (
        <Reveal>
          <MediaFrame slot={lead} />
        </Reveal>
      )}

      {rest.length > 0 && (
        <Reveal stagger className="mt-8 grid gap-8 sm:grid-cols-2">
          {rest.map((slot) => (
            <div key={slot.caption}>
              <MediaFrame slot={slot} />
            </div>
          ))}
        </Reveal>
      )}
    </div>
  )
}
