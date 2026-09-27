/**
 * 블루프린트 data 를 로컬에서 대강 그려 보는 SVG.
 *
 * Cloudcraft 렌더러를 흉내 낸 근사치다. 배치가 겹치지 않는지, 선이
 * 이름표를 가로지르지 않는지 API 키 없이 확인하려고 만들었다.
 * 사이트에는 넣지 않는다. 실제 그림은 Cloudcraft 가 내보낸 SVG 를 쓴다.
 *
 * 가정: x 축은 화면 오른쪽 아래, y 축은 왼쪽 아래. isotext 의 mapPos 는
 * 글자 시작점(기준선). 글자 크기 50 이 격자 한 칸.
 */
import { SIZE } from './lib.mjs'

const S = 34 // 격자 한 칸의 화면 픽셀
const COS = Math.cos(Math.PI / 6)
const SIN = 0.5
const Z = 0.82

const P = (x, y, z = 0) => [(x - y) * S * COS, (x + y) * S * SIN - z * S * Z]
const pts = (list) => list.map((p) => P(...p).map((n) => n.toFixed(1)).join(',')).join(' ')

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f))
  return `rgb(${c.join(',')})`
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 선분을 사각형(블록 바닥) 경계에서 자른다. 들어가는/나오는 t 를 돌려준다. */
function clipT(ax, ay, bx, by, rect, leaving) {
  const [x0, y0, x1, y1] = rect
  let tmin = 0
  let tmax = 1
  const dx = bx - ax
  const dy = by - ay
  for (const [p, q] of [
    [-dx, ax - x0],
    [dx, x1 - ax],
    [-dy, ay - y0],
    [dy, y1 - ay],
  ]) {
    if (p === 0) continue
    const t = q / p
    if (p < 0) tmin = Math.max(tmin, t)
    else tmax = Math.min(tmax, t)
  }
  return leaving ? tmax : tmin
}

export function renderPreview(data) {
  const out = []
  const bounds = [Infinity, Infinity, -Infinity, -Infinity]
  const grow = ([x, y]) => {
    bounds[0] = Math.min(bounds[0], x)
    bounds[1] = Math.min(bounds[1], y)
    bounds[2] = Math.max(bounds[2], x)
    bounds[3] = Math.max(bounds[3], y)
  }

  // 1. 영역
  for (const s of data.surfaces) {
    const poly = s.points.map(([px, py]) => [s.mapPos[0] + px, s.mapPos[1] + py])
    poly.forEach((p) => grow(P(...p)))
    out.push(
      `<polygon points="${pts(poly)}" fill="${s.color.isometric}" stroke="${s.borderColor.isometric}" stroke-width="2"/>`,
    )
  }

  // 2. 선 — 블록 모서리에서 잘라 블록 위에 그린다. 화살촉이 블록에 가리지 않게.
  const lines = []
  const byId = new Map(data.nodes.map((n) => [n.id, n]))
  const rect = (n) => [n.mapPos[0], n.mapPos[1], n.mapPos[0] + n.width, n.mapPos[1] + n.depth]
  const center = (n) => [n.mapPos[0] + n.width / 2, n.mapPos[1] + n.depth / 2]
  for (const e of data.edges) {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    if (!a || !b) continue
    const [ax, ay] = center(a)
    const [bx, by] = center(b)
    const t0 = clipT(ax, ay, bx, by, rect(a), true)
    const t1 = clipT(ax, ay, bx, by, rect(b), false)
    const s = P(ax + (bx - ax) * t0, ay + (by - ay) * t0, a.height / 2)
    const t = P(ax + (bx - ax) * t1, ay + (by - ay) * t1, b.height / 2)
    const ang = Math.atan2(t[1] - s[1], t[0] - s[0])
    const head = [
      [t[0], t[1]],
      [t[0] - 11 * Math.cos(ang - 0.4), t[1] - 11 * Math.sin(ang - 0.4)],
      [t[0] - 11 * Math.cos(ang + 0.4), t[1] - 11 * Math.sin(ang + 0.4)],
    ]
    const col = e.color.isometric
    lines.push(
      `<line x1="${s[0].toFixed(1)}" y1="${s[1].toFixed(1)}" x2="${t[0].toFixed(1)}" y2="${t[1].toFixed(1)}" stroke="${col}" stroke-width="${e.width}"${e.dashed ? ' stroke-dasharray="7 5"' : ''}/>`,
      `<polygon points="${head.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${col}"/>`,
    )
  }

  // 3. 블록 (뒤에서 앞으로)
  const blocks = [...data.nodes].sort((a, b) => a.mapPos[0] + a.mapPos[1] - (b.mapPos[0] + b.mapPos[1]))
  for (const n of blocks) {
    const [x0, y0] = n.mapPos
    const x1 = x0 + n.width
    const y1 = y0 + n.depth
    const h = n.height
    const c = n.color.isometric
    ;[P(x0, y0, h), P(x1, y1, 0), P(x0, y1, 0), P(x1, y0, 0)].forEach(grow)
    out.push(
      `<polygon points="${pts([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]])}" fill="${shade(c, 0.72)}"/>`,
      `<polygon points="${pts([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]])}" fill="${shade(c, 0.55)}"/>`,
      `<polygon points="${pts([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]])}" fill="${c}"/>`,
    )
  }

  out.push(...lines)

  // 4. 아이콘 — 이름만 적은 자리표시. 실제 모양은 Cloudcraft 가 그린다.
  const heightAt = (x, y) => {
    for (const n of data.nodes) {
      const [x0, y0, x1, y1] = rect(n)
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return n.height
    }
    return 0
  }
  for (const i of data.icons) {
    const [x, y] = i.mapPos
    const z = heightAt(x, y)
    const [sx, sy] = P(x, y, z)
    const r = 0.55
    out.push(
      `<polygon points="${pts([[x - r, y - r, z], [x + r, y - r, z], [x + r, y + r, z], [x - r, y + r, z]])}" fill="none" stroke="${i.color.isometric}" stroke-width="1.2" opacity="0.8"/>`,
      `<text x="${sx.toFixed(1)}" y="${(sy + 3).toFixed(1)}" font-size="8" text-anchor="middle" fill="${i.color.isometric}" font-family="JetBrains Mono, monospace">${esc(i.name)}</text>`,
    )
  }

  // 5. 글자 — 바닥에 눕혀 x 축을 따라 읽힌다.
  for (const t of data.text) {
    const [sx, sy] = P(...t.mapPos)
    const size = (t.textSize / SIZE.textPerUnit) * S
    const lines = t.text.split('\n')
    const width = Math.max(...lines.map((l) => l.length)) * size
    grow([sx, sy - size])
    grow(P(t.mapPos[0] + width / S, t.mapPos[1] + (lines.length * 1.3 * t.textSize) / SIZE.textPerUnit))
    const tspans = lines
      .map((l, i) => `<tspan x="0" dy="${i === 0 ? 0 : (size * 1.3).toFixed(1)}">${esc(l)}</tspan>`)
      .join('')
    out.push(
      `<text transform="matrix(${COS.toFixed(4)},${SIN},${(-COS).toFixed(4)},${SIN},${sx.toFixed(1)},${sy.toFixed(1)})" font-size="${size.toFixed(1)}" fill="${t.color.isometric}"${t.outline ? ' stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"' : ''} font-family="Pretendard Variable, Pretendard, sans-serif" font-weight="${t.textSize >= 18 ? 700 : 500}">${tspans}</text>`,
    )
  }

  const pad = 24
  const [bx0, by0, bx1, by1] = [bounds[0] - pad, bounds[1] - pad, bounds[2] + pad, bounds[3] + pad]
  const w = Math.round(bx1 - bx0)
  const h = Math.round(by1 - by0)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${bx0.toFixed(1)} ${by0.toFixed(1)} ${w} ${h}">
<!-- 근사 미리보기 (scripts/architecture/preview.mjs). Cloudcraft 실제 렌더가 아님. -->
${out.join('\n')}
</svg>
`
}
