import { useRef } from 'react'
import type { MediaSlot } from '../content/profile'
import { Reveal } from './motion'
import { ClipReveal, useParallax } from './scroll'

/**
 * 자료가 들어갈 자리.
 *
 * `src` 가 없으면 무엇이 들어갈 자리인지 적힌 빈 프레임을 그린다.
 * 나중에 이미지를 넣어도 크기가 그대로라 레이아웃이 흔들리지 않는다.
 * "준비 중"이라고 얼버무리지 않고, 어떤 자료가 올 자리인지 그대로 적는다.
 */

const RATIO: Record<NonNullable<MediaSlot['ratio']>, string | undefined> = {
  wide: '16 / 7',
  video: '16 / 9',
  square: '1 / 1',
  portrait: '4 / 5',
  // 원본 비율. 문서 캡처는 잘리면 읽을 수 없다.
  natural: undefined,
}

export function MediaFrame({ slot }: { slot: MediaSlot }) {
  const aspect = RATIO[slot.ratio ?? 'video']
  // 빈 프레임은 원본 비율을 모르니 가로형으로 둔다.
  const emptyAspect = aspect ?? '16 / 9'
  const frameRef = useRef<HTMLElement>(null)

  // 자료 프레임이 본문보다 아주 조금 느리게 흐른다.
  // 폭을 좁게 둔 이유는, 다이어그램 위에서 크게 움직이면 읽기 어려워지기 때문이다.
  useParallax(frameRef, { speed: 0.035 })

  return (
    <figure ref={frameRef} className="m-0">
      {slot.src ? (
        <ClipReveal
          className={`overflow-hidden rounded-sm border border-ink-line ${
            // 흰 바탕 문서는 종이 한 장처럼 여백을 둬서 잉크 배경과 부딪히지 않게 한다.
            slot.light ? 'bg-[#f4f2ee] p-4 sm:p-6' : 'bg-ink-raised'
          }`}
        >
          {/* 문서 캡처는 작게 보면 글자가 안 읽힌다. 원본을 새 탭으로 연다. */}
          <a href={slot.src} target="_blank" rel="noopener" data-cursor-label="원본" className="block">
            <img
              src={slot.src}
              alt={slot.alt ?? slot.caption}
              loading="lazy"
              decoding="async"
              className={`w-full ${aspect ? 'object-cover' : 'h-auto'} ${slot.light ? 'mx-auto max-w-[640px]' : ''}`}
              style={aspect ? { aspectRatio: aspect } : undefined}
            />
            <span className="sr-only">원본 크기로 보기 (새 탭)</span>
          </a>
        </ClipReveal>
      ) : (
        <div
          className="relative grid w-full place-items-center rounded-sm border border-dashed border-ink-line bg-ink-raised/60"
          style={{ aspectRatio: emptyAspect }}
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
            <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-paper-faint">
              {slot.caption}
            </p>
          </div>
        </div>
      )}

      <figcaption className="mt-3 flex items-baseline gap-2 text-xs text-paper-faint">
        <span
          className="font-mono tracking-[0.14em] uppercase"
          style={{ color: 'var(--accent)' }}
        >
          {slot.kind}
        </span>
        <span className="text-ink-line">/</span>
        <span className="text-paper-dim">{slot.caption}</span>
      </figcaption>
    </figure>
  )
}

/**
 * 경험의 자료 묶음.
 *
 * 2열 격자에 놓되, 따로 정하지 않으면 첫 자료만 폭을 다 쓴다.
 * 전부 같은 크기로 늘어놓으면 어떤 게 핵심 자료인지 구분되지 않는다.
 * 가로로 긴 캡처처럼 반 폭에서 읽히지 않는 자료는 span 을 full 로 준다.
 */
export function MediaGallery({ slots }: { slots: MediaSlot[] }) {
  if (slots.length === 0) return null

  return (
    <Reveal stagger className="grid items-start gap-8 sm:grid-cols-2">
      {slots.map((slot, i) => {
        const full = (slot.span ?? (i === 0 ? 'full' : 'half')) === 'full'
        return (
          <div key={slot.caption} className={full ? 'sm:col-span-2' : undefined}>
            <MediaFrame slot={slot} />
          </div>
        )
      })}
    </Reveal>
  )
}
