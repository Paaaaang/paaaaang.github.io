/**
 * Cloudcraft 블루프린트를 코드로 짓는 도구.
 *
 * 모양은 사용자가 고른 참고 그림(등각 · 어두운 바탕)을 따른다.
 * - 요소 하나 = 흰 블록. 윗면에 로고(없으면 Font Awesome 4.7 아이콘)를 눕히고,
 *   앞면(화면 왼쪽 아래를 보는 면)에 이름을 세워 쓴다. 블록 둘레에 초록 테두리 사각형.
 * - 호스트(Vercel · Supabase …)는 두꺼운 주황 테두리의 흰 영역, 그 안의 묶음은 하늘색 영역,
 *   앱 · 클라이언트는 노란 테두리 영역. 영역 제목은 테두리 띠 위에 굵게.
 * - 묶음 이름표는 얇은 판에 글자를 세운 표지판(참고 그림의 AI-Server · BackEnd).
 * - 선은 직각 꺾은선. 꺾이는 자리마다 connector 를 둔다. 흰 · 하늘색 영역 위는 검은색,
 *   어두운 바탕 위를 지나는 토막은 밝은 회색으로 나눠 그린다(검은 선은 바탕에 묻힌다).
 * - 로고는 Cloudcraft API 로 올릴 수 없어서, 내보낸 SVG 에 finish-svg.mjs 가 그려 넣는다.
 *
 * 좌표: Cloudcraft 격자 칸. x 는 화면 오른쪽 아래, y 는 왼쪽 아래, z 는 위로 뻗는다.
 * 요소 자리(at)는 화면에 그려지는 블록 바닥의 가운데다.
 *
 * id 는 블루프린트 키와 요소 키로 만든 UUID v5 라서 다시 돌려도 같다.
 * Cloudcraft 쪽에서 같은 요소가 새로 생기지 않고 제자리에서 바뀐다.
 */
import { createHash } from 'node:crypto'
import { LOGOS } from './logos.mjs'

export { LOGOS }

/* ------------------------------------------------------------------ */
/* 참고 그림의 색                                                        */
/* ------------------------------------------------------------------ */
export const COLOR = {
  block: '#ffffff',
  name: '#1b1f24',
  icon: '#232f3e',
  host: '#ff9900',
  zone: '#8fd3fe',
  comp: '#7cc242',
  client: '#ffeb3b',
  fill: '#ffffff',
  tag: '#eef1f4',
  /** 흰 · 하늘색 영역 위의 선 */
  line: '#000000',
  /** 어두운 바탕(#121212) 위를 지나는 선 토막과 그 위 글자 */
  lineOnDark: '#b8bec7',
  textOnDark: '#e9ecef',
}

export const PROJECTION = 'isometric'
const ISO = PROJECTION === 'isometric'

/**
 * Cloudcraft 등각 렌더 실측값. 계정의 예제 블루프린트와 우리 블루프린트를 SVG 로 내보내
 * 요소 data 와 좌표를 맞대어 읽었다. 렌더가 바뀌면 여기만 고친다.
 */
export const RENDER = {
  /** 바닥 한 칸이 화면에서 x 축으로 (64, 37) px, y 축으로 (-64, 37) px. 높이 한 칸은 위로 73.9 px */
  isoX: [64, 37],
  isoY: [-64, 37],
  isoZ: 73.9,
  /** 블록은 width · depth · height 의 절반 크기로, mapPos(바닥 -x -y 모서리)에서부터 그려진다 */
  blockScale: 0.5,
  /** 글자는 한 칸 = 90.5px 인 평면에 쓴 뒤 등각 행렬로 눕히거나 세운다. 크기 N 은 N pt(= N·4/3 px) */
  textPx: 90.5,
  ptPx: 4 / 3,
  /** 첫 줄 기준선은 mapPos 에서 1.14·N + 8 px, 둘째 줄부터 1.1em, 왼쪽 8px 들여 씀 */
  baselinePx: (pt) => 1.14 * pt + 8,
  lineEm: 1.1,
  insetPx: 8,
  /** 글자 상자 위아래(em). 사이트 SVG 는 <img> 라 Noto Sans 를 못 불러 Arial · Helvetica 로 그려진다 */
  ascentEm: 0.9,
  descentEm: 0.21,
  /** 영역 shadow 가 테두리 바깥으로 두르는 띠(모서리는 깎임) */
  areaBand: 0.5,
  /** 아이콘: mapPos 가운데에 바닥에 눕혀 그린다. iconSize → 확대 배율(두 점에서 맞춤: 3 → 0.894, 7.96 → 2.706) */
  iconScale: (size) => 0.3652 * size - 0.2017,
  /** 확대 전 Font Awesome 글리프 높이(글자 평면 px) */
  iconGlyphPx: 32,
}

/**
 * 높이 z 에 있는 점과 화면에서 같은 자리에 보이는 바닥 좌표까지 뒤쪽(-x, -y)으로 옮길 거리.
 * Cloudcraft 는 아이콘 · 글자를 바닥 기준으로 그리므로, 블록 윗면 · 앞면에 붙어 보이게 하려면
 * 이만큼 옮긴다. 아이콘 · 글자는 블록보다 나중에 그려져 가려지지 않는다.
 */
export const lift = (z) => (z * RENDER.isoZ) / (RENDER.isoX[1] + RENDER.isoY[1])

/** 크기. 단위는 격자 칸(화면에 그려지는 크기). 글자 크기(textSize)는 Cloudcraft 값(pt) 그대로다. */
export const SIZE = {
  /** 블록: 폭은 이름에 맞춰 이 범위 안에서, 깊이 · 높이는 고정 */
  blockMinW: 2.4,
  blockMaxW: 3.8,
  blockD: 2.0,
  blockH: 1.0,
  /** 이름: 앞면 폭 - namePad 안에 들어가는 한도에서 name 까지 */
  name: 28,
  nameMin: 20,
  namePad: 0.4,
  /** 블록과 초록 테두리 사이 */
  compPad: 0.35,
  /** 부제(초록 사각형 둘레 바닥), 선 이름표, 영역 제목, 표지판 */
  sub: 28,
  edgeLabel: 30,
  hostTitle: 40,
  tag: 28,
  /** 윗면 아이콘 글리프 높이 / 블록 깊이 */
  iconRatio: 0.55,
  edgeWidth: 2,
  /** 영역 안쪽 여백 */
  hostPad: 0.35,
  zonePad: 0.3,
  /** 호스트 · 앱 영역 테두리를 shadow 띠(0.5)보다 이만큼 더 두껍게. 제목이 띠 안에 들어가게 */
  hostBorder: 0.3,
}

/** 사이트 SVG 에 붙이는 글꼴 목록(finish-svg.mjs 가 붙인다). 로컬 미리보기도 같은 글꼴로 잰다. */
export const FONT_STACK = 'Noto Sans, Helvetica Neue, Helvetica, Arial, Apple SD Gothic Neo, Malgun Gothic, sans-serif'

/* ------------------------------------------------------------------ */
/* 결정적 UUID                                                          */
/* ------------------------------------------------------------------ */
// 이 포트폴리오 전용 네임스페이스. 바꾸면 모든 id 가 바뀌어 Cloudcraft 요소가 새로 만들어진다.
const NAMESPACE = '5b0c7c1e-2f4e-5a3b-9d1f-1f3a8a2f4ea3'

export function uuid(name) {
  const ns = Buffer.from(NAMESPACE.replaceAll('-', ''), 'hex')
  const hash = createHash('sha1').update(ns).update(name, 'utf8').digest()
  const b = hash.subarray(0, 16)
  b[6] = (b[6] & 0x0f) | 0x50 // version 5
  b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant
  const hex = b.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const both = (hex) => ({ isometric: hex, '2d': hex })
const round = (n) => Math.round(n * 1000) / 1000

/* ------------------------------------------------------------------ */
/* 글자 크기                                                             */
/* ------------------------------------------------------------------ */
// Arial Bold 글자 폭(1/1000 em). Helvetica 굵게도 거의 같다. 한글은 대체 글꼴에서 1em.
const LATIN = {
  a: 556, b: 611, c: 556, d: 611, e: 556, f: 333, g: 611, h: 611, i: 278, j: 278, k: 556, l: 278, m: 889,
  n: 611, o: 611, p: 611, q: 611, r: 389, s: 556, t: 333, u: 611, v: 556, w: 778, x: 556, y: 556, z: 500,
  A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 556, K: 722, L: 611, M: 833,
  N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  ' ': 278, '.': 278, ',': 278, ':': 333, '/': 278, '(': 333, ')': 333, '-': 333, _: 556, '·': 333,
}

function charEm(ch) {
  const c = ch.codePointAt(0)
  if ((c >= 0xac00 && c <= 0xd7a3) || (c >= 0x3130 && c <= 0x318f)) return 1 // 한글
  if (ch in LATIN) return LATIN[ch] / 1000
  if (/[0-9]/.test(ch)) return 0.556
  return 1
}

/** 글자 한 em 이 몇 칸인가 */
export const emUnits = (size) => (size * RENDER.ptPx) / RENDER.textPx

/**
 * 글자 상자(격자 칸). 글자 평면에서 w 는 읽는 방향, h 는 줄이 쌓이는 방향 크기.
 * dx · dy 는 mapPos 에서 상자 왼쪽 위까지.
 */
export function textBox(text, size) {
  const em = emUnits(size)
  const lines = text.split('\n')
  const w = Math.max(...lines.map((l) => [...l].reduce((s, ch) => s + charEm(ch), 0))) * em * 1.03
  const h = (RENDER.ascentEm + RENDER.descentEm + (lines.length - 1) * RENDER.lineEm) * em
  const dx = RENDER.insetPx / RENDER.textPx
  const dy = RENDER.baselinePx(size) / RENDER.textPx - RENDER.ascentEm * em
  return { w, h, dx, dy }
}

/* ------------------------------------------------------------------ */
/* 사각형                                                               */
/* ------------------------------------------------------------------ */
// 바닥 사각형은 [x0, y0, x1, y1].
const union = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]
const inflate = (r, m) => [r[0] - m, r[1] - m, r[2] + m, r[3] + m]

/** 축에 나란한 선분 p→q 에서 사각형 안에 드는 구간 [t0, t1] (없으면 null) */
function span(p, q, r) {
  let t0 = 0
  let t1 = 1
  for (const k of [0, 1]) {
    const d = q[k] - p[k]
    if (d === 0) {
      if (p[k] < r[k] || p[k] > r[k + 2]) return null
      continue
    }
    let a = (r[k] - p[k]) / d
    let b = (r[k + 2] - p[k]) / d
    if (a > b) [a, b] = [b, a]
    t0 = Math.max(t0, a)
    t1 = Math.min(t1, b)
  }
  return t0 < t1 ? [t0, t1] : null
}

/** 구간들을 합친다 */
function merge(list) {
  const s = list.filter(Boolean).sort((a, b) => a[0] - b[0])
  const out = []
  for (const [a, b] of s) {
    if (out.length && a <= out.at(-1)[1] + 1e-9) out.at(-1)[1] = Math.max(out.at(-1)[1], b)
    else out.push([a, b])
  }
  return out
}

/* ------------------------------------------------------------------ */
/* 블루프린트 빌더                                                       */
/* ------------------------------------------------------------------ */
/**
 * @param {object} o
 * @param {string} o.key   블루프린트 키 (id 의 씨앗)
 * @param {string} o.name  Cloudcraft 블루프린트 이름 (만들기-또는-고치기의 기준)
 */
export function createBlueprint({ key, name }) {
  const id = (k) => uuid(`${key}/${k}`)
  const nodes = []
  const icons = []
  const text = []
  const connectors = []
  const edges = []
  const surfaces = []
  const elements = new Map()
  const tags = []
  const edgeSpecs = []
  const areaSpecs = []
  const layout = { key, elements: [], edges: [], areas: [], tags: [] }

  const put = (k, mapPos, str, size, color, { standing = false, direction = 'down', outline = false } = {}) => {
    const tid = id(`text:${k}`)
    text.push({
      type: 'isotext',
      id: tid,
      mapPos: [round(mapPos[0]), round(mapPos[1])],
      text: str,
      textSize: size,
      isometric: ISO,
      standing,
      direction,
      outline,
      color: both(color),
    })
    return tid
  }

  /** 세운 글자를 y = faceY 인 앞면에 쓴다. 글자 상자 왼쪽 위가 (x, faceY, zTop) 에 오게. */
  const standOnFace = (k, x, faceY, zTop, str, size, color) => {
    const b = textBox(str, size)
    // 세운 글자는 mapPos 에서 화면 아래로 늘어진다. 상자 위(원점에서 dy 아래)를 zTop 에 맞춘다.
    const d = lift(zTop + b.dy)
    return put(k, [x - b.dx - d, faceY - d], str, size, color, { standing: true })
  }

  /** 바닥에 눕힌 글자. 상자 왼쪽 위(읽는 방향 기준)를 바닥 점 at 에 맞춘다. */
  const lay = (k, at, str, size, color, direction = 'down') => {
    const b = textBox(str, size)
    // 'down': 가로 +x, 줄 +y. 'right': 가로 -y, 줄 +x 이고 at 은 (x 작은 쪽, y 큰 쪽) 모서리.
    const pos = direction === 'right' ? [at[0] - b.dy, at[1] + b.dx] : [at[0] - b.dx, at[1] - b.dy]
    return put(k, pos, str, size, color, { direction, outline: true })
  }

  const api = {
    /**
     * 요소 하나: 초록 사각형 + 흰 블록 + 윗면 로고/아이콘 + 앞면 이름 (+ 바닥 부제).
     * @param {string} k
     * @param {object} o
     * @param {[number, number]} o.at  블록 바닥 가운데 [x, y]
     * @param {string} o.title  앞면에 세워 쓰는 이름
     * @param {string} [o.sub]  초록 사각형 둘레 바닥에 눕혀 쓰는 설명. 줄바꿈은 \n
     * @param {'front'|'back'|'left'|'right'} [o.subSide]  선이 지나지 않는 쪽
     * @param {[number, number]} [o.subShift]  부제를 옮긴다(칸). 가운데로 드는 선을 비켜 갈 때
     * @param {string|string[]} [o.logo]  logos.mjs 이름. 여러 개면 윗면을 나눠 나란히
     * @param {string} [o.icon]  Font Awesome 4.7 아이콘 이름(로고가 없을 때)
     * @param {string} [o.iconColor]
     * @param {number} [o.width]  블록 폭을 직접 정할 때
     * @param {string} [o.link]
     */
    element(k, { at, title, sub, subSide = 'front', subShift = [0, 0], logo, icon, iconColor = COLOR.icon, width, link }) {
      if (elements.has(k)) throw new Error(`요소 키 중복: ${k}`)
      const logos = logo ? [logo].flat() : []
      for (const l of logos) if (!LOGOS[l]) throw new Error(`${k}: logos.mjs 에 없는 로고 ${l}`)
      if (!logos.length && !icon) throw new Error(`${k}: logo 도 icon 도 없음`)
      const want = textBox(title, SIZE.name).w + SIZE.namePad
      const bw = width ?? Math.min(SIZE.blockMaxW, Math.max(SIZE.blockMinW, want))
      const [bd, bh] = [SIZE.blockD, SIZE.blockH]
      const [cx, cy] = at
      const rect = [cx - bw / 2, cy - bd / 2, cx + bw / 2, cy + bd / 2]
      const square = inflate(rect, SIZE.compPad)
      const outer = inflate(square, RENDER.areaBand)
      // 부제는 초록 사각형 띠 바깥 바닥에 눕힌다.
      let subRect = null
      let subAt = null
      if (sub) {
        const b = textBox(sub, SIZE.sub)
        // 뒤(-x · -y) 쪽 바닥은 화면에서 블록이 솟은 부분에 가린다. 그쪽 부제는 그만큼 더 띄운다.
        const behind = Math.max(0.1, lift(SIZE.blockH) - SIZE.compPad - RENDER.areaBand + 0.3)
        if (subSide === 'right' || subSide === 'left') {
          const x = subSide === 'right' ? outer[2] + 0.1 : outer[0] - behind - b.h
          subAt = [x, square[3]]
          subRect = [x, square[3] - b.w, x + b.h, square[3]]
        } else {
          const y = subSide === 'back' ? outer[1] - behind - b.h : outer[3] + 0.1
          subAt = [square[0], y]
          subRect = [square[0], y, square[0] + b.w, y + b.h]
        }
      }
      if (sub) {
        subAt = [subAt[0] + subShift[0], subAt[1] + subShift[1]]
        subRect = [subRect[0] + subShift[0], subRect[1] + subShift[1], subRect[2] + subShift[0], subRect[3] + subShift[1]]
      }
      const box = [outer, subRect].filter(Boolean).reduce(union)
      elements.set(k, { k, cx, cy, rect, square, outer, size: [bw, bd, bh], title, sub, subAt, subRect, subSide, logos, icon, iconColor, link, box })
      return api
    },

    /**
     * 표지판: 얇은 판에 글자를 세운다.
     * @param {string} k
     * @param {object} o
     * @param {[number, number]} o.at  판 앞면 왼쪽 끝 바닥 [x, y]
     * @param {string} o.text
     */
    tag(k, { at, text: str, size = SIZE.tag }) {
      const b = textBox(str, size)
      const w = b.w + 0.4
      const rect = [at[0], at[1] - 0.3, at[0] + w, at[1]]
      tags.push({ k, at, str, size, b, w, rect })
      return api
    },

    /**
     * 선. via 는 꺾이는 자리들(바닥 좌표). 선은 블록 가운데에서 가운데로 가므로
     * 꺾는 자리를 블록 가운데와 같은 x 또는 y 에 두면 직각으로 꺾인다.
     * 화살표는 마지막 토막이 블록 가운데로 곧게 들어갈 때 블록 테두리에 그려진다.
     * @param {string} from
     * @param {string} to
     * @param {object} [o]
     * @param {[number, number][]} [o.via]
     * @param {string} [o.label]
     * @param {number} [o.labelOn]  몇 번째 구간 옆에 이름표를 둘지(0 부터). 없으면 모든 구간에서 고른다
     * @param {'+'|'-'|'auto'} [o.labelSide]  + 는 x 구간이면 앞(+y), y 구간이면 오른쪽(+x). auto 는 둘 다 본다
     * @param {number} [o.labelT]  구간 안에서 이름표 가운데 위치(0–1)
     * @param {boolean} [o.dashed]
     * @param {boolean} [o.both]  양방향. 첫 토막에 반대 방향 화살표를 하나 더 겹친다
     */
    edge(from, to, { via = [], label, labelOn, labelSide = 'auto', labelT = 0.5, dashed = false, both: twoWay = false } = {}) {
      edgeSpecs.push({ from, to, via, label, labelOn, labelSide, labelT, dashed, twoWay })
      return api
    },

    /**
     * 영역. members 는 요소 · 표지판 키 또는 먼저 만든 영역 키.
     * @param {string} k
     * @param {object} o
     * @param {'host'|'client'|'zone'} o.kind
     * @param {string} [o.title]
     * @param {string[]} o.members
     * @param {'back'|'front'} [o.titleEdge]  제목을 뒤(-y) 또는 앞(+y) 테두리 띠에
     * @param {[number, number, number, number]} [o.extend]  -x · -y · +x · +y 로 더 넓힌다
     */
    area(k, { kind, title, members, titleEdge = 'back', extend = [0, 0, 0, 0] }) {
      areaSpecs.push({ k, kind, title, members, titleEdge, extend })
      return api
    },

    build() {
      /* 1. 영역 크기: 안쪽부터 */
      const areaBox = new Map()
      const boxOf = (m) => {
        if (elements.has(m)) return elements.get(m).box
        const t = tags.find((x) => x.k === m)
        if (t) return inflate(t.rect, 0.05)
        if (areaBox.has(m)) return areaBox.get(m).outer
        throw new Error(`영역: 없는 구성원 ${m}`)
      }
      for (const a of areaSpecs) {
        const content = a.members.map(boxOf).reduce(union)
        const zone = a.kind === 'zone'
        const pad = zone ? SIZE.zonePad : SIZE.hostPad
        const inner = [
          content[0] - pad - a.extend[0],
          content[1] - pad - a.extend[1],
          content[2] + pad + a.extend[2],
          content[3] + pad + a.extend[3],
        ]
        if (zone) {
          // zone 은 같은 색 0.5칸 띠가 둘레에 붙는다. 보이는 여백이 zonePad 가 되게 사각형은 그만큼 작게.
          const rect = inflate(inner, -RENDER.areaBand)
          areaBox.set(a.k, { ...a, inner: rect, frame: rect, outer: inner })
          continue
        }
        const frame = inflate(inner, SIZE.hostBorder) // 테두리 색 사각형(0.5칸 띠가 이 밖에 붙는다)
        const outer = inflate(frame, RENDER.areaBand)
        areaBox.set(a.k, { ...a, inner, frame, outer })
      }

      /* 2. 바닥: 큰 영역부터 깔고, 요소마다 초록 사각형 */
      const rectArea = (r) => ({ x: r[0], y: r[1], w: round(r[2] - r[0]), h: round(r[3] - r[1]) })
      const pushArea = (aid, r, fill, border, shadow) => {
        const { x, y, w, h } = rectArea(r)
        surfaces.push({
          type: 'area',
          id: aid,
          mapPos: [round(x), round(y)],
          points: [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h],
          ],
          shadow,
          color: both(fill),
          borderColor: both(border),
        })
      }
      const bySize = [...areaBox.values()].sort(
        (p, q) => (q.outer[2] - q.outer[0]) * (q.outer[3] - q.outer[1]) - (p.outer[2] - p.outer[0]) * (p.outer[3] - p.outer[1]),
      )
      const titleRects = []
      for (const a of bySize) {
        const aid = id(`area:${a.k}`)
        if (a.kind === 'zone') {
          pushArea(aid, a.inner, COLOR.zone, COLOR.zone, false)
        } else {
          const tone = a.kind === 'client' ? COLOR.client : COLOR.host
          // Cloudcraft 는 shadow 와 상관없이 영역 둘레에 borderColor 로 0.5칸 띠를 그린다(shadow 는 그림자만 더한다).
          // 테두리 색 사각형(띠 + 그림자) 위에 흰 사각형(띠도 테두리 색)을 얹어 0.5 + hostBorder 두께를 만든다.
          pushArea(id(`area:${a.k}:frame`), a.frame, tone, tone, true)
          pushArea(aid, a.inner, COLOR.fill, tone, false)
        }
        let tid = null
        if (a.title) {
          const size = SIZE.hostTitle
          const b = textBox(a.title, size)
          const thick = a.kind === 'zone' ? 0 : SIZE.hostBorder + RENDER.areaBand
          const x = a.inner[0] + 0.6
          // 띠 한가운데에. zone 은 띠가 없어 안쪽 모서리에.
          const y =
            a.kind === 'zone'
              ? a.titleEdge === 'front'
                ? a.inner[3] - 0.15 - b.h
                : a.inner[1] + 0.15
              : a.titleEdge === 'front'
                ? a.inner[3] + (thick - b.h) / 2
                : a.inner[1] - thick + (thick - b.h) / 2
          const pos = [x - b.dx, y - b.dy]
          titleRects.push([x, y, x + b.w, y + b.h])
          tid = put(`area:${a.k}`, pos, a.title, size, COLOR.name)
        }
        layout.areas.push({ k: a.k, id: aid, title: tid, kind: a.kind, inner: a.inner, outer: a.outer })
      }
      for (const el of elements.values()) pushArea(id(`comp:${el.k}`), el.square, COLOR.fill, COLOR.comp, true)

      /* 3. 요소: 블록 · 아이콘 · 이름 · 부제 */
      const S = RENDER.blockScale
      for (const el of elements.values()) {
        const [bw, bd, bh] = el.size
        const block = {
          type: 'block',
          id: id(`block:${el.k}`),
          mapPos: [round(el.rect[0]), round(el.rect[1])],
          width: round(bw / S),
          height: round(bh / S),
          depth: round(bd / S),
          color: both(COLOR.block),
        }
        if (el.link) block.link = el.link
        nodes.push(block)
        el.id = block.id

        let glyph = null
        if (!el.logos.length) {
          // 윗면 가운데. 바닥에 그려지므로 높이만큼 뒤로 옮겨 윗면에 얹혀 보이게 한다.
          const d = lift(bh)
          const scale = (bd * SIZE.iconRatio * RENDER.textPx) / RENDER.iconGlyphPx
          glyph = id(`icon:${el.k}`)
          icons.push({
            type: 'icon',
            id: glyph,
            mapPos: [round(el.cx - d), round(el.cy - d)],
            iconSet: 'fa',
            name: el.icon,
            iconSize: round((scale + 0.2017) / 0.3652),
            isometric: ISO,
            standing: false,
            direction: 'down',
            color: both(el.iconColor),
            background: both(COLOR.block),
          })
        }

        // 앞면 이름: 면 폭에 맞춰 크기를 줄인다. 세로로는 면 가운데.
        const room = bw - SIZE.namePad
        const fit = Math.floor((SIZE.name * room) / textBox(el.title, SIZE.name).w)
        const nsize = Math.max(SIZE.nameMin, Math.min(SIZE.name, fit))
        const nb = textBox(el.title, nsize)
        const texts = [standOnFace(`${el.k}:title`, el.cx - nb.w / 2, el.rect[3], bh / 2 + nb.h / 2, el.title, nsize, COLOR.name)]
        if (el.sub) {
          const dir = el.subSide === 'right' || el.subSide === 'left' ? 'right' : 'down'
          texts.push(lay(`${el.k}:sub`, el.subAt, el.sub, SIZE.sub, COLOR.name, dir))
        }
        layout.elements.push({ k: el.k, block: block.id, glyph, logos: el.logos, texts, rect: el.rect, square: el.square, h: bh })
      }

      /* 4. 표지판 */
      for (const t of tags) {
        const height = t.b.h + 0.25
        const bid = id(`tag:${t.k}`)
        nodes.push({
          type: 'block',
          id: bid,
          mapPos: [round(t.rect[0]), round(t.rect[1])],
          width: round(t.w / S),
          height: round(height / S),
          depth: round(0.3 / S),
          color: both(COLOR.tag),
        })
        const tid = standOnFace(`tag:${t.k}`, t.at[0] + 0.2, t.at[1], height / 2 + t.b.h / 2, t.str, t.size, COLOR.name)
        layout.tags.push({ k: t.k, block: bid, text: tid })
      }

      /* 5. 선: 블록 → connector … → 블록. 영역 밖 토막은 밝은 색으로 나눈다. */
      const floors = [...[...areaBox.values()].map((a) => a.outer), ...[...elements.values()].map((el) => el.outer)]
      const nodeId = (k) => elements.get(k)?.id ?? `missing:${k}`
      const labelJobs = []
      for (const e of edgeSpecs) {
        const base = `edge:${e.from}->${e.to}`
        const a = elements.get(e.from)
        const b = elements.get(e.to)
        const route = a && b ? [[a.cx, a.cy], ...e.via, [b.cx, b.cy]] : []
        // 꺾는 점과 색이 바뀌는 점을 모두 connector 로.
        const pts = [] // { p, color } — color 는 p 에서 다음 점까지
        for (let i = 0; i < route.length - 1; i++) {
          const [p, q] = [route[i], route[i + 1]]
          const on = merge(floors.map((r) => span(p, q, r)))
          const cuts = [0, ...on.flat(), 1].filter((t, j, all) => t >= 0 && t <= 1 && (j === 0 || t > all[j - 1] + 1e-6))
          for (let j = 0; j < cuts.length - 1; j++) {
            const mid = (cuts[j] + cuts[j + 1]) / 2
            const inside = on.some(([s, t]) => mid >= s && mid <= t)
            const at = [p[0] + (q[0] - p[0]) * cuts[j], p[1] + (q[1] - p[1]) * cuts[j]]
            pts.push({ p: at, color: inside ? COLOR.line : COLOR.lineOnDark })
          }
        }
        const chain = [nodeId(e.from)]
        const colors = []
        pts.forEach((pt, i) => {
          if (i > 0) {
            const cid = id(`conn:${e.from}->${e.to}:${i}`)
            connectors.push({ type: 'connector', id: cid, mapPos: [round(pt.p[0]), round(pt.p[1])] })
            chain.push(cid)
          }
          colors.push(pt.color)
        })
        chain.push(nodeId(e.to))
        if (!colors.length) colors.push(COLOR.line)
        const segIds = []
        for (let i = 0; i < chain.length - 1; i++) {
          const sid = id(i === 0 ? base : `${base}:${i}`)
          segIds.push(sid)
          const seg = {
            type: 'edge',
            id: sid,
            from: chain[i],
            to: chain[i + 1],
            width: SIZE.edgeWidth,
            dashed: e.dashed,
            color: both(colors[i] ?? COLOR.line),
          }
          if (i === chain.length - 2) seg.endCap = 'arrow'
          edges.push(seg)
        }
        if (e.twoWay) {
          // 첫 토막을 거꾸로 하나 더: 출발 블록 쪽에도 화살표가 생긴다.
          edges.push({
            type: 'edge',
            id: id(`edge:${e.to}->${e.from}`),
            from: chain[1],
            to: chain[0],
            width: SIZE.edgeWidth,
            dashed: e.dashed,
            endCap: 'arrow',
            color: both(colors[0] ?? COLOR.line),
          })
        }

        labelJobs.push({ e, base, route, entry: { from: e.from, to: e.to, ids: segIds, text: null } })
        layout.edges.push(labelJobs.at(-1).entry)
      }

      /* 6. 선 이름표: 고른 구간 옆에서 블록 · 글자 · 다른 선 · 영역 띠와 겹치지 않는 자리 */
      const overlap = (p, q) =>
        Math.max(0, Math.min(p[2], q[2]) - Math.max(p[0], q[0])) * Math.max(0, Math.min(p[3], q[3]) - Math.max(p[1], q[1]))
      const inside = (p, q) => p[0] >= q[0] && p[1] >= q[1] && p[2] <= q[2] && p[3] <= q[3]
      // 블록은 위로 솟아 화면에서 뒤쪽 바닥을 가린다. 그만큼 뒤로 늘린 사각형을 장애물로.
      const solid = [
        ...[...elements.values()].flatMap((el) => [
          [el.outer[0], el.outer[1], el.outer[2], el.outer[3]],
          [el.rect[0] - lift(el.size[2]), el.rect[1] - lift(el.size[2]), el.rect[2], el.rect[3]],
          ...(el.subRect ? [el.subRect] : []),
        ]),
        ...tags.map((t) => [t.rect[0] - lift(t.b.h + 0.25), t.rect[1] - lift(t.b.h + 0.25), t.rect[2], t.rect[3]]),
        ...titleRects,
      ]
      const rings = [...areaBox.values()].filter((a) => a.kind !== 'zone').map((a) => [a.inner, a.outer])
      const lines = labelJobs.flatMap((j) => j.route.slice(1).map((q, i) => ({ p: j.route[i], q, pair: [j.e.from, j.e.to].sort().join('|') })))
      const placed = []
      for (const { e, base, route, entry } of labelJobs) {
        if (!e.label || !route.length) continue
        const lb = textBox(e.label, SIZE.edgeLabel)
        const pair = [e.from, e.to].sort().join('|')
        const segs = route.slice(1).map((q, i) => [route[i], q])
        const pick = e.labelOn === undefined ? segs.map((_, i) => i) : [e.labelOn]
        const sides = e.labelSide === 'auto' ? ['+', '-'] : [e.labelSide]
        let best = null
        for (const si of pick) {
          const [p, q] = segs[si]
          const alongX = Math.abs(q[0] - p[0]) >= Math.abs(q[1] - p[1])
          for (const side of sides) {
            for (let t = 0.04; t <= 0.961; t += 0.02) {
              const m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
              // 눕힌 글자는 화면에서 비스듬히 기울어 선 쪽 테두리가 생각보다 가깝다. 넉넉히 띄운다.
              const gap = 0.3
              // 바닥에서 글자 상자가 차지하는 사각형
              const r = alongX
                ? side === '+'
                  ? [m[0] - lb.w / 2, m[1] + gap, m[0] + lb.w / 2, m[1] + gap + lb.h]
                  : [m[0] - lb.w / 2, m[1] - gap - lb.h, m[0] + lb.w / 2, m[1] - gap]
                : side === '+'
                  ? [m[0] + gap, m[1] - lb.w / 2, m[0] + gap + lb.h, m[1] + lb.w / 2]
                  : [m[0] - gap - lb.h, m[1] - lb.w / 2, m[0] - gap, m[1] + lb.w / 2]
              let cost = Math.abs(t - e.labelT) * 3 + (e.labelOn === undefined ? -Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.02 : 0)
              for (const o of solid) cost += overlap(inflate(r, 0.06), o) * 60
              for (const o of placed) cost += overlap(inflate(r, 0.1), o) * 60
              // 영역 띠를 걸치는 건 되도록 피하되 막지는 않는다. 등각에서 틈을 다 벌리면 그림이 너무 커진다.
              // 걸친 이름표는 밝은 글자에 검은 테라서 주황 · 흰 · 어두운 바탕 어디서나 읽힌다.
              for (const [inner, outer] of rings) if (overlap(r, outer) > 0 && !inside(r, inner)) cost += 3
              for (const l of lines) {
                if (l.pair === pair) continue
                const lr = [Math.min(l.p[0], l.q[0]) - 0.06, Math.min(l.p[1], l.q[1]) - 0.06, Math.max(l.p[0], l.q[0]) + 0.06, Math.max(l.p[1], l.q[1]) + 0.06]
                if (overlap(r, lr) > 0) cost += 30
              }
              if (!best || cost < best.cost) best = { cost, r, alongX }
            }
          }
        }
        placed.push(best.r)
        const at = best.alongX ? [best.r[0], best.r[1]] : [best.r[0], best.r[3]]
        // 대부분 영역(흰 · 하늘색 · 띠) 위면 검은 글자(흰 테), 어두운 바탕에 더 걸치면 밝은 글자(검은 테).
        let hit = 0
        let all = 0
        for (let i = 0; i <= 8; i++) {
          for (let j = 0; j <= 2; j++) {
            const pt = [best.r[0] + ((best.r[2] - best.r[0]) * i) / 8, best.r[1] + ((best.r[3] - best.r[1]) * j) / 2]
            all++
            if (floors.some((f) => pt[0] >= f[0] && pt[0] <= f[2] && pt[1] >= f[1] && pt[1] <= f[3])) hit++
          }
        }
        const onFloor = hit / all >= 0.5
        entry.text = lay(base, at, e.label, SIZE.edgeLabel, onFloor ? COLOR.name : COLOR.textOnDark, best.alongX ? 'down' : 'right')
        entry.cost = round(best.cost)
      }

      const data = {
        name,
        grid: 'infinite',
        projection: PROJECTION,
        theme: { base: 'dark' },
        nodes,
        edges,
        icons,
        images: [],
        text,
        surfaces,
        groups: [],
        connectors,
        disabledLayers: [],
        shareDocs: false,
      }
      // 점검 스크립트 · finish-svg.mjs 용 배치 정보. JSON 으로 보낼 때는 빠진다.
      Object.defineProperty(data, 'layout', { value: layout, enumerable: false })
      return data
    },
  }
  return api
}

/* ------------------------------------------------------------------ */
/* 검증                                                                 */
/* ------------------------------------------------------------------ */
const HEX = /^#[0-9a-f]{6}$/i
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ICON_SETS = ['aws', 'aws2', 'azure', 'fa']

/** 보내기 전에 로컬에서 잡을 수 있는 실수를 모두 모은다. 빈 배열이면 통과. */
export function validate(data) {
  const errors = []
  const err = (where, msg) => errors.push(`${where}: ${msg}`)

  if (typeof data?.name !== 'string' || !data.name.trim()) err('data', 'name 이 비어 있음')
  if (!['infinite', 'standard', 'medium', 'large'].includes(data?.grid)) err('data', `grid 값 이상: ${data?.grid}`)
  if (!['isometric', '2d'].includes(data?.projection)) err('data', `projection 값 이상: ${data?.projection}`)
  for (const k of ['nodes', 'edges', 'icons', 'text', 'surfaces', 'groups', 'images', 'connectors']) {
    if (!Array.isArray(data?.[k])) err('data', `${k} 배열 없음`)
  }
  if (errors.length) return errors

  const ids = new Map()
  const all = [
    ...data.nodes.map((c) => ['nodes', c]),
    ...data.icons.map((c) => ['icons', c]),
    ...data.images.map((c) => ['images', c]),
    ...data.text.map((c) => ['text', c]),
    ...data.surfaces.map((c) => ['surfaces', c]),
    ...data.connectors.map((c) => ['connectors', c]),
    ...data.edges.map((c) => ['edges', c]),
  ]
  for (const [list, c] of all) {
    const where = `${list}[${c.id ?? '?'}]`
    if (!UUID.test(c.id ?? '')) err(where, 'id 가 UUID 가 아님')
    if (ids.has(c.id)) err(where, `id 중복 (${ids.get(c.id)} 와 겹침)`)
    ids.set(c.id, list)
    if (!c.type) err(where, 'type 없음')
    if (list !== 'edges') {
      const ok = Array.isArray(c.mapPos) && c.mapPos.length === 2 && c.mapPos.every(Number.isFinite)
      if (!ok) err(where, 'mapPos 가 [x, y] 숫자 쌍이 아님')
    }
    for (const key of ['color', 'borderColor', 'background']) {
      if (c[key] === undefined) continue
      for (const mode of ['isometric', '2d']) {
        if (!HEX.test(c[key]?.[mode] ?? '')) err(where, `${key}.${mode} 가 #RRGGBB 가 아님: ${c[key]?.[mode]}`)
      }
    }
  }

  for (const n of data.nodes) {
    const where = `nodes[${n.id}]`
    if (n.type !== 'block') err(where, `이 도구는 block 만 씀: ${n.type}`)
    for (const k of ['width', 'height', 'depth']) {
      if (!(Number.isFinite(n[k]) && n[k] > 0)) err(where, `${k} 는 0보다 큰 수여야 함`)
    }
    if (!n.color) err(where, 'color 없음')
  }
  for (const t of data.text) {
    const where = `text[${t.id}]`
    if (t.type !== 'isotext') err(where, `type 은 isotext: ${t.type}`)
    if (typeof t.text !== 'string' || !t.text) err(where, 'text 비어 있음')
    if (!(t.textSize >= 1 && t.textSize <= 112)) err(where, `textSize 는 1–112: ${t.textSize}`)
    if (!['down', 'up', 'left', 'right'].includes(t.direction)) err(where, `direction 값 이상: ${t.direction}`)
  }
  for (const i of data.icons) {
    const where = `icons[${i.id}]`
    if (i.type !== 'icon') err(where, `type 은 icon: ${i.type}`)
    if (!ICON_SETS.includes(i.iconSet)) err(where, `iconSet 은 ${ICON_SETS.join('/')}: ${i.iconSet}`)
    if (typeof i.name !== 'string' || !i.name) err(where, 'name 비어 있음')
    if (!(i.iconSize > 0)) err(where, 'iconSize 는 0보다 커야 함')
  }
  for (const i of data.images) {
    const where = `images[${i.id}]`
    if (i.type !== 'image') err(where, `type 은 image: ${i.type}`)
    if (typeof i.key !== 'string' || !i.key) err(where, 'key 비어 있음')
    if (!(i.scale > 0)) err(where, 'scale 은 0보다 커야 함')
  }
  for (const s of data.surfaces) {
    const where = `surfaces[${s.id}]`
    if (s.type !== 'area') err(where, `type 은 area: ${s.type}`)
    const ok = Array.isArray(s.points) && s.points.length >= 3 && s.points.every((p) => p.length === 2 && p.every(Number.isFinite))
    if (!ok) err(where, 'points 는 [x, y] 3개 이상')
  }
  const ends = new Set([...data.nodes.map((n) => n.id), ...data.connectors.map((c) => c.id)])
  const used = new Set()
  const pairs = new Set()
  for (const e of data.edges) {
    const where = `edges[${e.id}]`
    if (e.type !== 'edge') err(where, `type 은 edge: ${e.type}`)
    if (!ends.has(e.from)) err(where, `from 이 가리키는 블록/connector 가 없음: ${e.from}`)
    if (!ends.has(e.to)) err(where, `to 가 가리키는 블록/connector 가 없음: ${e.to}`)
    if (e.from === e.to) err(where, '자기 자신으로 가는 선')
    const pair = `${e.from}>${e.to}`
    if (pairs.has(pair)) err(where, '같은 두 끝 사이에 같은 방향 선이 두 개')
    pairs.add(pair)
    used.add(e.from)
    used.add(e.to)
    if (!(e.width > 0)) err(where, 'width 는 0보다 커야 함')
  }
  for (const c of data.connectors) if (!used.has(c.id)) err(`connectors[${c.id}]`, '어느 선에도 쓰이지 않음')
  return errors
}

/** 요약: 로그에 찍을 개수. */
export function summarize(data) {
  return {
    blocks: data.nodes.length,
    icons: data.icons.length + data.images.length,
    labels: data.text.length,
    areas: data.surfaces.length,
    edges: data.edges.length,
  }
}
