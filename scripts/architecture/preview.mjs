/**
 * 블루프린트 data 를 로컬에서 그려 보는 SVG (등각).
 *
 * Cloudcraft 등각 렌더를 흉내 낸다. lib.mjs 의 RENDER 실측값(바닥 한 칸 = (64, 37) · (-64, 37) px,
 * 높이 한 칸 = 73.9px, 글자 평면 한 칸 = 90.5px)을 그대로 쓴다. 배치가 겹치지 않는지,
 * 선이 이름표를 지나지 않는지 API 키 없이 보려는 것이다. 로고는 이름만 적은 자리표시다.
 * 사이트에는 넣지 않는다. 실제 그림은 Cloudcraft 가 내보낸 SVG 를 쓴다.
 */
import { RENDER, FONT_STACK } from './lib.mjs'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n = (v) => Math.round(v * 10) / 10
const P = (x, y, z = 0) => [RENDER.isoX[0] * x + RENDER.isoY[0] * y, RENDER.isoX[1] * x + RENDER.isoY[1] * y - RENDER.isoZ * z]
const pts = (list) => list.map((p) => P(...p).map(n).join(' ')).join(', ')

function shade(hex, f) {
  const v = parseInt(hex.slice(1), 16)
  return `rgb(${[(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => Math.round(c * f)).join(',')})`
}

export function renderPreview(data) {
  const out = []
  const xs = []
  const ys = []
  const grow = (...ps) => ps.forEach(([x, y]) => (xs.push(x), ys.push(y)))
  const band = RENDER.areaBand

  for (const s of data.surfaces) {
    const [x0, y0] = s.mapPos
    const [w, h] = s.points[2]
    const ring = (m) => [[x0 - m, y0 - m], [x0 + w + m, y0 - m], [x0 + w + m, y0 + h + m], [x0 - m, y0 + h + m]]
    if (s.shadow) out.push(`<g id="${s.id}"><polygon points="${pts(ring(band))}" fill="${s.borderColor.isometric}"/>`)
    else out.push(`<g id="${s.id}">`)
    out.push(`<polygon points="${pts(ring(0))}" fill="${s.color.isometric}"/></g>`)
    grow(...ring(s.shadow ? band : 0).map((p) => P(...p)))
  }

  const k = RENDER.blockScale
  const ends = new Map([...data.nodes.map((b) => [b.id, [b.mapPos[0] + (b.width * k) / 2, b.mapPos[1] + (b.depth * k) / 2]]), ...data.connectors.map((c) => [c.id, c.mapPos])])
  for (const e of data.edges) {
    const a = ends.get(e.from)
    const b = ends.get(e.to)
    if (!a || !b) continue
    const [p, q] = [P(...a), P(...b)]
    out.push(`<g id="${e.id}"><line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${e.color.isometric}" stroke-width="${e.width * 2}"${e.dashed ? ' stroke-dasharray="10,8"' : ''}/></g>`)
  }

  // 블록은 절반 크기로 그려진다(RENDER.blockScale).
  const blocks = [...data.nodes].sort((a, b) => a.mapPos[0] + a.mapPos[1] - (b.mapPos[0] + b.mapPos[1]))
  for (const b of blocks) {
    const [x0, y0] = b.mapPos
    const [x1, y1, h] = [x0 + b.width * k, y0 + b.depth * k, b.height * k]
    const c = b.color.isometric
    out.push(
      `<g id="${b.id}"><polygon points="${pts([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]])}" fill="${shade(c, 0.86)}"/>` +
        `<polygon points="${pts([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]])}" fill="${shade(c, 0.74)}"/>` +
        `<polygon points="${pts([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]])}" fill="${c}"/></g>`,
    )
    grow(P(x0, y0, h), P(x1, y0, 0), P(x0, y1, 0), P(x1, y1, 0))
  }

  for (const i of data.icons) {
    const [x, y] = P(...i.mapPos)
    out.push(`<g id="${i.id}"><text x="${n(x)}" y="${n(y)}" font-size="22" text-anchor="middle" fill="${i.color.isometric}">${esc(i.name)}</text></g>`)
  }

  const MAT = { down: '0.707 0.409 -0.707 0.409', right: '0.707 -0.409 0.707 0.409' }
  for (const t of data.text) {
    const [x, y] = P(...t.mapPos)
    const m = t.standing ? (t.direction === 'right' ? '0.707 -0.409 0 0.8165' : '0.707 0.409 0 0.8165') : MAT[t.direction] ?? MAT.down
    const tspans = t.text
      .split('\n')
      .map((l, k) => `<tspan x="${RENDER.insetPx}" dy="${k ? `${RENDER.lineEm}em` : 0}">${esc(l)}</tspan>`)
      .join('')
    out.push(
      `<g id="${t.id}"><svg x="${n(x)}" y="${n(y)}" overflow="visible"><text${t.outline ? ' stroke="#ffffff" stroke-width="4"' : ''} font-family="${FONT_STACK}" y="${n(RENDER.baselinePx(t.textSize))}" font-size="${t.textSize}pt" fill="${t.color.isometric}" font-weight="bold" transform="matrix(${m} 0 0)" paint-order="stroke" xml:space="preserve">${tspans}</text></svg></g>`,
    )
    grow([x, y])
  }

  const pad = 40
  const [bx, by] = [Math.min(...xs) - pad, Math.min(...ys) - pad]
  const w = Math.ceil(Math.max(...xs) + pad - bx)
  const h = Math.ceil(Math.max(...ys) + pad - by)
  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${n(bx)} ${n(by)} ${w} ${h}" style="background:#000">
<!-- 로컬 미리보기 (scripts/architecture/preview.mjs). Cloudcraft 실제 렌더가 아님. -->
${out.join('\n')}
</svg>
`
}
