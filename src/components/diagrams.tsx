import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { DiagramKey } from '../content/profile'
import {
  actorLabel,
  experienceTime,
  interviewFlow,
  prismArch,
  ttmFlow,
  type Actor,
} from '../content/diagrams'
import { MOTION } from './scroll'
import { useReducedMotion } from '../hooks/useMotionPreference'

gsap.registerPlugin(ScrollTrigger)

/**
 * 경험 안의 구조도.
 *
 * 기획자가 만드는 것은 화면보다 구조다. 그 구조가 읽는 자리에서 노드 하나,
 * 선 하나씩 이어지게 해서 사이트의 명제("흩어진 것이 구조로")를 경험마다
 * 한 번씩 보여 준다.
 *
 * 기본 상태는 완성된 그림이다. 애니메이션은 gsap.from 으로만 걸어서
 * 스크립트가 없거나 모션을 줄인 사용자에게는 처음부터 다 그려진 채로 보인다.
 */

/* ------------------------------------------------------------------ */
/* 그리기 순서                                                          */
/* ------------------------------------------------------------------ */

const DRAW: [selector: string, vars: gsap.TweenVars, at: number][] = [
  ['[data-draw="spine"]', { scaleY: 0, transformOrigin: 'top center', duration: 1.4, ease: 'none' }, 0],
  ['[data-draw="node"]', { opacity: 0, y: 14, duration: 0.6, stagger: 0.12 }, 0.05],
  ['[data-draw="line"]', { scaleX: 0, transformOrigin: 'left center', duration: 0.4, stagger: 0.12 }, 0.2],
  ['[data-draw="vline"]', { scaleY: 0, transformOrigin: 'top center', duration: 0.4, stagger: 0.12 }, 0.2],
  ['[data-draw="bar"]', { scaleX: 0, transformOrigin: 'left center', duration: 1.1, stagger: 0.18 }, 0.15],
  ['[data-draw="late"]', { opacity: 0, y: 8, duration: 0.6, stagger: 0.1 }, 0.9],
]

function useDrawOnScroll(ref: React.RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: MOTION.ease },
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      })
      for (const [selector, vars, at] of DRAW) {
        // 없는 선택자에 트윈을 걸면 GSAP 이 경고를 남긴다. 있는 것만 건다.
        if (el.querySelector(selector)) tl.from(selector, vars, at)
      }
      // 바꾼 설계가 다 그려진 뒤에 처음 설계를 한 단계 가라앉힌다.
      if (el.querySelector('[data-draw="dim"]')) {
        tl.to('[data-draw="dim"]', { opacity: 0.5, duration: 0.8 }, '>')
      }
    }, el)

    return () => ctx.revert()
  }, [ref, reduced])
}

/* ------------------------------------------------------------------ */
/* 틀                                                                  */
/* ------------------------------------------------------------------ */

function Frame({ label, caption, children }: { label: string; caption: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useDrawOnScroll(ref)

  return (
    <figure ref={ref} className="m-0 rounded-sm border border-ink-line bg-ink-raised/50 p-5 sm:p-7">
      <p className="font-mono text-[0.66rem] tracking-[0.2em] text-paper-faint uppercase">{label}</p>
      <div className="mt-6">{children}</div>
      <figcaption className="mt-6 border-t border-ink-line pt-4 text-xs leading-relaxed text-paper-faint">
        {caption}
      </figcaption>
    </figure>
  )
}

const ACTOR_COLOR: Record<Actor, string> = {
  user: 'var(--color-ch3)',
  ops: 'var(--color-ch1)',
  system: 'var(--color-paper)',
}

/* ------------------------------------------------------------------ */
/* D1 · 스윔레인                                                        */
/* ------------------------------------------------------------------ */

/**
 * 면접 운영 흐름. 넓은 화면에서는 누가 하는 일인지에 따라 세 칸(레인) 중
 * 한 칸에 놓이고, 왼쪽 척추선이 위에서 아래로 그려진다. 좁은 화면에서는
 * 한 줄로 쌓고 행위자를 꼬리표로 붙인다.
 */
function InterviewFlow() {
  const lanes: Actor[] = ['user', 'ops', 'system']
  const { nodes, actors, caption } = interviewFlow

  return (
    <Frame label="면접 운영 흐름" caption={caption}>
      {/* 레인 머리 */}
      <div className="hidden grid-cols-[2rem_repeat(3,minmax(0,1fr))] gap-x-3 md:grid">
        <span />
        {lanes.map((lane) => (
          <span
            key={lane}
            className="border-b border-ink-line pb-2 font-mono text-[0.66rem] tracking-[0.16em] uppercase"
            style={{ color: ACTOR_COLOR[lane] }}
          >
            {actors[lane]}
          </span>
        ))}
      </div>

      <ol className="relative mt-3 grid gap-y-3">
        <span
          data-draw="spine"
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[0.95rem] w-px"
          style={{ background: 'color-mix(in oklab, var(--accent) 60%, transparent)' }}
        />
        {nodes.map((node, i) => {
          const lane = lanes.indexOf(node.who)
          return (
            <li
              key={node.title}
              className="relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 md:grid-cols-[2rem_repeat(3,minmax(0,1fr))]"
            >
              <span
                data-draw="node"
                className="relative z-10 mt-2.5 grid h-5 w-5 place-items-center justify-self-center rounded-full border bg-ink font-mono text-[0.6rem] tnum"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                {i + 1}
              </span>
              <div
                data-draw="node"
                className="rounded-sm border bg-ink px-4 py-3 md:col-start-(--lane)"
                style={{
                  borderColor: node.key
                    ? 'color-mix(in oklab, var(--accent) 60%, var(--color-ink-line))'
                    : 'var(--color-ink-line)',
                  // 넓은 화면에서만 레인 칸으로 민다. 좁은 화면은 두 번째 칸 고정.
                  ['--lane' as string]: String(lane + 2),
                }}
              >
                <span
                  className="font-mono text-[0.62rem] tracking-[0.16em] uppercase md:hidden"
                  style={{ color: ACTOR_COLOR[node.who] }}
                >
                  {actors[node.who] ?? actorLabel[node.who]}
                </span>
                <p className="text-[0.92rem] leading-snug font-bold tracking-[-0.02em]">{node.title}</p>
                {node.note && (
                  <p className="mt-1.5 text-xs leading-relaxed text-paper-dim">{node.note}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* D2 · 막대 (실제 수치 비례)                                            */
/* ------------------------------------------------------------------ */

function ExperienceTime() {
  const { bars, max, guide, ticks, unit, caption } = experienceTime
  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <Frame label="체험 시간" caption={caption}>
      <div className="grid gap-y-4 pt-5">
        {bars.map((bar, i) => (
          <div key={bar.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4">
            <span className="text-right text-xs text-paper-dim">{bar.label}</span>
            <div className="relative h-8">
              <div
                data-draw="bar"
                className="flex h-full items-center justify-end rounded-[1px] pr-3 font-mono text-xs tnum"
                style={{
                  width: pct(bar.value),
                  background: bar.muted ? 'var(--color-ink-line)' : 'var(--accent)',
                  color: bar.muted ? 'var(--color-paper-dim)' : 'var(--color-ink)',
                }}
              >
                {bar.value}
                {unit}
              </div>
              <span
                aria-hidden="true"
                className="absolute -top-2 -bottom-2 border-l border-dashed"
                style={{ left: pct(guide.value), borderColor: 'var(--color-ch3)' }}
              >
                {i === 0 && (
                  <span
                    className="absolute -top-5 left-1.5 font-mono text-[0.62rem] whitespace-nowrap"
                    style={{ color: 'var(--color-ch3)' }}
                  >
                    {guide.label}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4" aria-hidden="true">
          <span />
          <div className="flex justify-between font-mono text-[0.62rem] text-paper-faint tnum">
            {ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* D3 · 처음 설계 → 바꾼 설계                                             */
/* ------------------------------------------------------------------ */

function Block({ title, note, tone }: { title: string; note?: string; tone?: 'hot' | 'cool' }) {
  return (
    <div
      data-draw="node"
      className="rounded-sm border bg-ink px-4 py-3"
      style={{
        borderColor:
          tone === 'hot'
            ? 'color-mix(in oklab, var(--color-ch1) 65%, var(--color-ink-line))'
            : tone === 'cool'
              ? 'color-mix(in oklab, var(--accent) 65%, var(--color-ink-line))'
              : 'var(--color-ink-line)',
      }}
    >
      <p className="text-[0.9rem] leading-snug font-bold tracking-[-0.02em]">{title}</p>
      {note && <p className="mt-1 text-xs leading-relaxed text-paper-dim">{note}</p>}
    </div>
  )
}

function Down({ label, dashed }: { label?: string; dashed?: boolean }) {
  return (
    <div className="relative ml-6 h-7" aria-hidden="true">
      <span
        data-draw="vline"
        className="absolute top-0 bottom-1.5 left-0 w-px"
        style={{
          background: dashed
            ? 'repeating-linear-gradient(var(--color-paper-faint) 0 3px, transparent 3px 6px)'
            : 'var(--accent)',
        }}
      />
      <span
        className="absolute bottom-0 -left-[3px] h-0 w-0 border-x-[3.5px] border-t-[5px] border-x-transparent"
        style={{ borderTopColor: dashed ? 'var(--color-paper-faint)' : 'var(--accent)' }}
      />
      {label && (
        <span className="absolute top-1.5 left-3 font-mono text-[0.62rem] whitespace-nowrap text-paper-faint">
          {label}
        </span>
      )}
    </div>
  )
}

function PrismArch() {
  const { before, after, caption } = prismArch

  return (
    <Frame label="PRISM 시스템 구성" caption={caption}>
      <div className="grid gap-5 md:grid-cols-2">
        <div data-draw="dim" className="rounded-sm border border-ink-line p-4">
          <p className="mb-4 font-mono text-[0.64rem] tracking-[0.18em] text-paper-faint uppercase">
            {before.label}
          </p>
          <Block {...before.source} />
          <Down label="모든 데이터를 보냄" />
          <Block {...before.hub} tone="hot" />
          <Down label="판단 결과" />
          <Block {...before.out} />
          <ul className="mt-4 space-y-1 text-xs" style={{ color: 'var(--color-ch1)' }}>
            {before.issues.map((issue) => (
              <li key={issue} data-draw="late">
                × {issue}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-sm border p-4"
          style={{ borderColor: 'color-mix(in oklab, var(--accent) 45%, var(--color-ink-line))' }}
        >
          <p
            className="mb-4 font-mono text-[0.64rem] tracking-[0.18em] uppercase"
            style={{ color: 'var(--accent)' }}
          >
            {after.label}
          </p>
          <Block {...after.source} />
          <Down />
          <Block {...after.hub} tone="cool" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Down label={after.local.edge} />
              <Block title={after.local.title} />
            </div>
            <div>
              <Down label={after.server.edge} dashed />
              <Block title={after.server.title} note={after.server.note} />
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-xs" style={{ color: 'var(--accent)' }}>
            {after.results.map((r) => (
              <li key={r} data-draw="late">
                ✓ {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* D4 · 사용자 흐름과 뒤에서 도는 기술                                    */
/* ------------------------------------------------------------------ */

function TtmFlow() {
  const { steps, tech, latency, caption } = ttmFlow

  return (
    <Frame label="TAP TO ME 사용 흐름" caption={caption}>
      <ol className="grid gap-y-0 md:grid-cols-4 md:gap-x-0">
        {steps.map((step, i) => (
          <li key={step.title} className="relative md:pr-6">
            <div
              data-draw="node"
              className="h-full rounded-sm border bg-ink px-4 py-3"
              style={{
                borderColor: step.key
                  ? 'color-mix(in oklab, var(--accent) 60%, var(--color-ink-line))'
                  : 'var(--color-ink-line)',
              }}
            >
              <span
                className="font-mono text-[0.62rem] tracking-[0.16em] uppercase"
                style={{ color: 'var(--color-ch3)' }}
              >
                사용자 · {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-1 text-[0.92rem] leading-snug font-bold tracking-[-0.02em]">{step.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-paper-dim">{step.note}</p>
              {/* 좁은 화면에서는 기술을 같은 칸 아래에 작게 적는다. */}
              {tech[i] && (
                <p className="mt-2 border-t border-dashed border-ink-line pt-2 font-mono text-[0.62rem] text-paper-faint md:hidden">
                  AI · {tech[i]}
                </p>
              )}
            </div>

            {i < steps.length - 1 && (
              <>
                {/* 넓은 화면: 가로 화살표 */}
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 right-1 hidden h-px w-4 md:block"
                  style={{ background: 'var(--accent)' }}
                  data-draw="line"
                />
                {/* 좁은 화면: 세로 화살표 */}
                <span aria-hidden="true" className="ml-6 block h-4 md:hidden">
                  <span data-draw="vline" className="block h-full w-px" style={{ background: 'var(--accent)' }} />
                </span>
              </>
            )}
          </li>
        ))}
      </ol>

      {/* 기다리는 시간: 촬영과 결과 확인 사이 */}
      <div className="mt-4 md:grid md:grid-cols-4" data-draw="late">
        <div
          className="border-t pt-2 text-center font-mono text-[0.66rem] md:col-span-2 md:col-start-2 md:mr-6"
          style={{ borderColor: 'var(--color-ch3)', color: 'var(--color-ch3)' }}
        >
          {latency}
        </div>
      </div>

      <div className="mt-4 hidden grid-cols-4 md:grid" aria-label="뒤에서 도는 AI">
        {tech.map((t, i) => (
          <div key={i} className="pr-6">
            {t && (
              <p
                data-draw="late"
                className="rounded-sm border border-dashed border-ink-line px-3 py-2 font-mono text-[0.64rem] leading-relaxed text-paper-faint"
              >
                AI · {t}
              </p>
            )}
          </div>
        ))}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */

const REGISTRY: Record<DiagramKey, () => ReactNode> = {
  'interview-flow': InterviewFlow,
  'experience-time': ExperienceTime,
  'ttm-flow': TtmFlow,
  'prism-arch': PrismArch,
}

export function Diagram({ id }: { id: DiagramKey }) {
  const Component = REGISTRY[id]
  return <Component />
}
