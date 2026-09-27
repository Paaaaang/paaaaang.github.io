/**
 * Cloudcraft 가 내보낸 SVG 를 사이트에 쓰기 전에 손본다. 같은 입력이면 늘 같은 결과가 나온다.
 *
 * 1. 글꼴: Cloudcraft 는 font-family="Noto Sans" 만 적는다. 사이트는 SVG 를 <img> 로 띄워
 *    웹 글꼴을 못 불러오므로 영문이 명조(Times)로 바뀐다. 산세리프 대체 글꼴을 뒤에 붙인다.
 * 2. 로고: Cloudcraft API 로는 이미지를 올릴 수 없다. 그래서 요소의 logo 를 SVG 에서 그 블록의
 *    윗면(마름모)에 직접 그린다. 블록 <g id="블록 id"> 바로 뒤에 넣어서, 나중에 그려지는 앞쪽 블록이
 *    로고를 제대로 가린다. 윗면 네 꼭짓점에서 아핀 변환을 구하므로 투영 값을 가정하지 않는다.
 */
import { FONT_STACK, LOGOS } from './lib.mjs'

/** 로고가 윗면에서 차지하는 비율(한 칸 안의 여백을 뺀 나머지) */
const LOGO_FILL = 0.64

/** 문자열에서 <g ... id="id" ...> 로 시작하는 요소 전체의 [시작, 끝) */
function groupSpan(svg, id) {
  const at = svg.indexOf(`id="${id}"`)
  if (at < 0) return null
  const start = svg.lastIndexOf('<g', at)
  if (start < 0) return null
  const tag = /<\/?g\b[^>]*>/g
  tag.lastIndex = start
  let depth = 0
  for (let m; (m = tag.exec(svg)); ) {
    if (m[0].startsWith('</')) depth--
    else if (!m[0].endsWith('/>')) depth++
    if (depth === 0) return [start, m.index + m[0].length]
  }
  return null
}

/** 블록 요소 안의 다각형 가운데 윗면: 꼭짓점 네 개, 가장 위에 있는 것. 중첩 <svg x y> 오프셋을 더한다. */
function topFace(fragment) {
  // Cloudcraft 는 블록을 <svg x=".." y=".."> 안에 그리기도 한다. 오프셋을 모두 더해 절대 좌표로.
  let ox = 0
  let oy = 0
  const off = fragment.match(/<svg\b[^>]*\sx="(-?[\d.]+)"[^>]*\sy="(-?[\d.]+)"/)
  if (off) {
    ox = Number(off[1])
    oy = Number(off[2])
  }
  let best = null
  for (const m of fragment.matchAll(/<polygon\b[^>]*\spoints="([^"]+)"/g)) {
    const nums = m[1].split(/[\s,]+/).filter(Boolean).map(Number)
    const pts = []
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i] + ox, nums[i + 1] + oy])
    // 닫는 점이 첫 점과 같으면 뺀다.
    if (pts.length > 4 && pts.at(-1)[0] === pts[0][0] && pts.at(-1)[1] === pts[0][1]) pts.pop()
    if (pts.length !== 4) continue
    const cy = pts.reduce((s, p) => s + p[1], 0) / 4
    if (!best || cy < best.cy) best = { pts, cy }
  }
  return best?.pts ?? null
}

const fmt = (n) => (Math.round(n * 1000) / 1000).toString()

/**
 * 윗면 마름모의 꼭짓점: 위(바닥 -x -y 모서리) · 오른쪽(+x) · 아래 · 왼쪽(+y).
 * 로고의 가로를 바닥 +x 쪽, 세로를 +y 쪽에 맞춘다(바닥에 눕힌 'down' 글자와 같은 방향).
 */
function logoMarkup(face, block, slugs) {
  const top = face.reduce((a, p) => (p[1] < a[1] ? p : a))
  const right = face.reduce((a, p) => (p[0] > a[0] ? p : a))
  const left = face.reduce((a, p) => (p[0] < a[0] ? p : a))
  // 한 칸당 화면 벡터
  const ux = [(right[0] - top[0]) / block.width, (right[1] - top[1]) / block.width]
  const uy = [(left[0] - top[0]) / block.depth, (left[1] - top[1]) / block.depth]
  const n = slugs.length
  const slot = block.width / n
  const side = Math.min(slot, block.depth) * LOGO_FILL
  const out = []
  slugs.forEach((slug, i) => {
    const logo = LOGOS[slug]
    if (!logo) return
    // 칸 가운데(바닥 좌표, 윗면 왼쪽 위 모서리 기준)
    const cx = slot * (i + 0.5)
    const cy = block.depth / 2
    const x0 = cx - side / 2
    const y0 = cy - side / 2
    const k = side / 24
    const a = ux[0] * k
    const b = ux[1] * k
    const c = uy[0] * k
    const d = uy[1] * k
    const e = top[0] + ux[0] * x0 + uy[0] * y0
    const f = top[1] + ux[1] * x0 + uy[1] * y0
    out.push(
      `<g class="portfolio-logo" data-logo="${slug}" transform="matrix(${[a, b, c, d, e, f].map(fmt).join(' ')})">` +
        `<path fill="${logo.hex}" d="${logo.path}"/></g>`,
    )
  })
  return out.join('')
}

/**
 * @param {string} svg  Cloudcraft 가 내보낸 SVG
 * @param {object} data  보낸 블루프린트 data (layout 이 붙은 것)
 * @returns {{ svg: string, missing: string[] }}
 */
export function finishSvg(svg, data) {
  let out = svg.replaceAll('font-family="Noto Sans"', `font-family="${FONT_STACK}"`)
  const missing = []
  const blocks = new Map(data.nodes.map((n) => [n.id, n]))
  // 뒤에서부터 끼워 넣어야 앞쪽 위치가 밀리지 않는다.
  const jobs = []
  for (const el of data.layout?.elements ?? []) {
    if (!el.logos?.length) continue
    const span = groupSpan(out, el.block)
    const face = span && topFace(out.slice(span[0], span[1]))
    if (!face) {
      missing.push(el.k)
      continue
    }
    jobs.push({ at: span[1], markup: logoMarkup(face, blocks.get(el.block), el.logos) })
  }
  jobs.sort((p, q) => q.at - p.at)
  for (const j of jobs) out = out.slice(0, j.at) + j.markup + out.slice(j.at)
  return { svg: out, missing }
}
