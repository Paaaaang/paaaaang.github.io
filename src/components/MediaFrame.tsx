import { useRef, type CSSProperties } from 'react'
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

/** 자료의 원래 가로세로 비. 빈 프레임은 ratio 값을, 이미지는 원본 크기를 쓴다. */
const RATIO: Record<NonNullable<MediaSlot['ratio']>, number | undefined> = {
  wide: 16 / 7,
  video: 16 / 9,
  square: 1,
  portrait: 4 / 5,
  // 원본 비율. 문서 캡처는 잘리면 읽을 수 없다.
  natural: undefined,
}

/**
 * 갤러리 안에서 자료가 서는 자리.
 * full = 한 줄을 다 쓴다. pair = 두 칸 중 한 칸.
 */
export type MediaRole = 'full' | 'pair'

/** 두 칸에 나란히 선 자료는 같은 틀을 쓴다. 높이와 캡션 줄이 맞아야 짝으로 읽힌다. */
const PAIR_FRAME = 5 / 4
/**
 * 한 줄을 다 쓰는 자료는 이보다 높아지지 않는다(가로 16 : 세로 7).
 * 원본이 더 세로로 길면 틀 가운데에 놓고 양옆을 바탕으로 둔다.
 * 제한이 없으면 랜딩 캡처 한 장이 핵심 화면보다 두 배 크게 보인다.
 */
const FULL_MIN = 16 / 7

function naturalRatio(slot: MediaSlot): number {
  if (slot.size) return slot.size[0] / slot.size[1]
  return RATIO[slot.ratio ?? 'video'] ?? 16 / 9
}

export function MediaFrame({ slot, role = 'full' }: { slot: MediaSlot; role?: MediaRole }) {
  const natural = naturalRatio(slot)
  // 좁은 화면은 한 줄로 쌓이니 높이를 맞출 이웃이 없다. 원본 비율 그대로 둔다.
  // 폰 캡처처럼 좁은 자료만 세로 4:5 틀에 넣어 화면 하나를 다 먹지 않게 한다.
  const mobile = slot.narrow ? Math.max(natural, 4 / 5) : natural
  // 넓은 화면: 짝이면 공통 틀, 한 줄이면 원본(단, 16:7 보다 높지 않게. uncapped 는 원본 그대로).
  const frame = role === 'pair' ? PAIR_FRAME : slot.uncapped ? natural : Math.max(natural, FULL_MIN)
  const frameRef = useRef<HTMLElement>(null)

  // 자료 프레임이 본문보다 아주 조금 느리게 흐른다.
  // 폭을 좁게 둔 이유는, 다이어그램 위에서 크게 움직이면 읽기 어려워지기 때문이다.
  useParallax(frameRef, { speed: 0.035 })

  const vars = {
    '--m': String(mobile),
    '--f': String(frame),
    ...(slot.backdrop ? { '--bd': slot.backdrop } : {}),
  } as CSSProperties
  const box = 'relative w-full aspect-(--m) sm:aspect-(--f)'

  return (
    <figure ref={frameRef} className="m-0" style={vars}>
      {slot.src ? (
        <ClipReveal
          className={`${box} overflow-hidden rounded-sm border border-ink-line ${
            // 흰 바탕 문서는 종이 한 장처럼 흰 바탕을 깔아 잉크 배경과 부딪히지 않게 한다.
            slot.light ? 'bg-white' : slot.backdrop ? 'bg-(--bd)' : 'bg-ink-raised'
          }`}
        >
          {/* 문서 캡처는 작게 보면 글자가 안 읽힌다. 원본을 새 탭으로 연다. */}
          <a
            href={slot.src}
            target="_blank"
            rel="noopener"
            data-cursor-label="원본"
            className={`absolute inset-0 block ${slot.light ? 'p-4 sm:p-6' : ''} ${slot.narrow ? 'py-4' : ''}`}
          >
            {/* 틀 안에 원본 비율 그대로 담는다(contain). 자르지 않아서 문서 글자가 잘리지 않는다. */}
            <img
              src={slot.src}
              alt={slot.alt ?? slot.caption}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
              width={slot.size?.[0]}
              height={slot.size?.[1]}
            />
            <span className="sr-only">원본 크기로 보기 (새 탭)</span>
          </a>
        </ClipReveal>
      ) : (
        <div className={`${box} grid place-items-center rounded-sm border border-dashed border-ink-line bg-ink-raised/60`}>
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
          {/* 무엇이 올 자리인지는 아래 캡션이 말한다. 안에는 종류만 적어 같은 문장을 두 번 읽히지 않는다. */}
          <span
            className="relative rounded-sm bg-ink px-2.5 py-1 text-xs font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            {slot.kind} 자리
          </span>
        </div>
      )}

      <figcaption className="mt-3 flex items-baseline gap-2 text-xs leading-relaxed">
        {/* 종류 라벨은 줄바꿈하지 않는다. 좁은 화면에서 "화면 / 설계"로 쪼개지던 문제. */}
        <span className="shrink-0 font-semibold whitespace-nowrap" style={{ color: 'var(--accent)' }}>
          {slot.kind}
        </span>
        <span aria-hidden="true" className="text-ink-line">
          /
        </span>
        <span className="text-paper-dim">{slot.caption}</span>
      </figcaption>
    </figure>
  )
}

/**
 * 자료를 줄로 나눈다. 세 경험이 같은 규칙을 쓴다.
 *
 * 1. `span: 'full'` 인 자료는 한 줄을 혼자 쓴다. 정하지 않으면 첫 자료만 full.
 * 2. 나머지는 나온 순서대로 둘씩 짝을 짓는다. 짝은 같은 틀이라 높이가 맞는다.
 * 3. 짝을 못 찾은 마지막 하나는 한 줄을 다 쓴다. 반 칸 옆에 빈칸을 남기지 않는다.
 *
 * 자료를 하나 더 붙여도(예: 아키텍처 이미지) 규칙대로 자리가 정해진다.
 */
export function layoutMedia(slots: MediaSlot[]): { slot: MediaSlot; role: MediaRole }[] {
  const out: { slot: MediaSlot; role: MediaRole }[] = []
  let run: MediaSlot[] = []
  const flush = () => {
    for (let k = 0; k + 1 < run.length; k += 2) {
      out.push({ slot: run[k]!, role: 'pair' }, { slot: run[k + 1]!, role: 'pair' })
    }
    if (run.length % 2 === 1) out.push({ slot: run[run.length - 1]!, role: 'full' })
    run = []
  }
  slots.forEach((slot, i) => {
    if ((slot.span ?? (i === 0 ? 'full' : 'half')) === 'full') {
      flush()
      out.push({ slot, role: 'full' })
    } else {
      run.push(slot)
    }
  })
  flush()
  return out
}

/** 경험의 자료 묶음. 줄 나누기는 layoutMedia 가 정한다. */
export function MediaGallery({ slots }: { slots: MediaSlot[] }) {
  if (slots.length === 0) return null

  return (
    <Reveal stagger className="grid items-start gap-x-6 gap-y-10 sm:grid-cols-2">
      {layoutMedia(slots).map(({ slot, role }) => (
        <div key={slot.caption} className={role === 'full' ? 'sm:col-span-2' : undefined}>
          <MediaFrame slot={slot} role={role} />
        </div>
      ))}
    </Reveal>
  )
}
