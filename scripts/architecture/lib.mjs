/**
 * Cloudcraft 블루프린트를 코드로 짓는 도구.
 *
 * 연결할 수 있는 요소는 모두 block 노드로 만들고, 그 위에 아이콘을 얹고
 * 앞(또는 옆)에 이름표(isotext)를 깐다. 선(edge)은 block 끼리만 잇는다.
 * 아이콘에도 선을 이을 수 있는지 문서로 확인하지 못해서다.
 *
 * 좌표: Cloudcraft 등각 격자. x 는 화면 오른쪽 아래, y 는 왼쪽 아래로 뻗는다.
 * 요소는 (열, 줄) 로 놓는다. 열은 x 축(흐름 방향), 줄은 y 축이다.
 * 그래서 왼쪽 위에서 오른쪽 아래로 읽히는 흐름이 된다.
 *
 * id 는 블루프린트 키와 요소 키로 만든 UUID v5 라서 다시 돌려도 같다.
 * Cloudcraft 쪽에서 같은 요소가 새로 생기지 않고 제자리에서 바뀐다.
 */
import { createHash } from 'node:crypto'

/* ------------------------------------------------------------------ */
/* 사이트 종이 테마 색                                                   */
/* ------------------------------------------------------------------ */
export const COLOR = {
  paper: '#f4f1ea',
  raised: '#ece8df',
  line: '#d9d3c6',
  ink: '#17181b',
  inkDim: '#4a4843',
  inkFaint: '#6b675f',
  blue: '#1f3a8a',
  blue2: '#2f4ea3',
  blue3: '#4a66b5',
  white: '#ffffff',
}

/** 요소 역할별 블록 색. 등각 뷰에서는 옆면을 Cloudcraft 가 알아서 어둡게 칠한다. */
export const ROLE = {
  client: { block: COLOR.ink, icon: COLOR.white },
  app: { block: COLOR.blue, icon: COLOR.white },
  data: { block: COLOR.blue2, icon: COLOR.white },
  external: { block: COLOR.blue3, icon: COLOR.white },
}

/**
 * 크기. 단위는 격자 칸. 글자 크기(textSize)는 Cloudcraft 값 그대로다.
 * Cloudcraft 기본값(블록 2×2×1, 아이콘 3, 글자 25)에 맞춰 비례를 잡았다.
 * 실제 렌더를 보고 어긋나면 여기 숫자만 고치면 된다.
 */
export const SIZE = {
  block: { width: 2.2, depth: 2.2, height: 0.6 },
  icon: 3,
  // 사이트에서는 그림이 폭 930px 안팎으로 줄어든다(원본의 약 1/3).
  // 처음 값(28 · 21 · 19 · 26)은 실제 렌더에서 6px 안팎으로 찍혀 읽히지 않았다.
  title: 50,
  sub: 38,
  edgeLabel: 34,
  areaTitle: 44,
  edgeWidth: 2,
  /** 글자 크기 몇이 격자 한 칸인가. 이름표 길이를 어림해 영역 크기를 잡을 때만 쓴다. */
  textPerUnit: 50,
  /** 영역 테두리와 안쪽 요소 사이 여백 */
  areaPad: 0.6,
  /** 블록 윗면이 화면에서 뒤쪽 바닥을 가리는 비율. 뒤쪽 이름표를 그만큼 더 띄운다. */
  heightShadow: 0.82,
}

/** isotext·icon 방향. 'down' 은 Cloudcraft 기본값으로, x 축을 따라 읽힌다고 가정한다. */
export const TEXT_DIRECTION = 'down'

/**
 * 투영. 처음에는 Cloudcraft 다운 등각(isometric)으로 그렸다. 실제 렌더를 사이트 폭(930px)에서
 * 보니 이름표가 대각선으로 밀려 옆 블록에 붙어 읽혔고, 아이콘은 블록 아래 작은 점이 됐다.
 * 평면(2d)에서는 이름표가 블록 바로 아래 가로로 놓이고 아이콘이 블록 위에 올라간다.
 */
export const PROJECTION = '2d'
const ISO = PROJECTION === 'isometric'

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
const round = (n) => Math.round(n * 100) / 100

/* ------------------------------------------------------------------ */
/* 글자 길이 어림                                                        */
/* ------------------------------------------------------------------ */
function charEm(ch) {
  const c = ch.codePointAt(0)
  if ((c >= 0xac00 && c <= 0xd7a3) || (c >= 0x3130 && c <= 0x318f)) return 1 // 한글
  if (ch === ' ' || ch === '·') return 0.32
  if (ch === '→' || ch === '↔') return 1
  if (/[A-Z]/.test(ch)) return 0.66
  return 0.56
}

/** 여러 줄 글자의 [가로, 세로] 크기(격자 칸). */
export function textExtent(text, size) {
  const em = size / SIZE.textPerUnit
  const lines = text.split('\n')
  const width = Math.max(...lines.map((l) => [...l].reduce((s, ch) => s + charEm(ch), 0))) * em
  return [width, lines.length * em * 1.3]
}

/* ------------------------------------------------------------------ */
/* 블루프린트 빌더                                                       */
/* ------------------------------------------------------------------ */
/**
 * @param {object} o
 * @param {string} o.key   블루프린트 키 (id 의 씨앗)
 * @param {string} o.name  Cloudcraft 블루프린트 이름 (만들기-또는-고치기의 기준)
 * @param {number} [o.col] 열 간격(칸)
 * @param {number} [o.lane] 줄 간격(칸)
 */
export function createBlueprint({ key, name, col = 8, lane = 7 }) {
  const id = (k) => uuid(`${key}/${k}`)
  const nodes = []
  const icons = []
  const text = []
  const surfaces = []
  const edges = []
  /** 요소 키 → { id, cx, cy, box } */
  const elements = new Map()
  const areas = []
  const { width: W, depth: D } = SIZE.block

  const label = (k, pos, str, size, color, outline = false) => {
    text.push({
      type: 'isotext',
      id: id(`text:${k}`),
      mapPos: [round(pos[0]), round(pos[1])],
      text: str,
      textSize: size,
      isometric: ISO,
      standing: false,
      direction: TEXT_DIRECTION,
      outline,
      color: both(color),
    })
  }

  const api = {
    /**
     * 요소 하나: 블록 + 아이콘 + 이름표.
     * @param {string} k
     * @param {object} o
     * @param {[number, number]} o.at  [열, 줄]
     * @param {'client'|'app'|'data'|'external'} o.role
     * @param {string} o.icon  Font Awesome 아이콘 이름
     * @param {string} o.title
     * @param {string} [o.sub]  둘째 줄부터. 줄바꿈은 \n
     * @param {'front'|'right'|'back'|'left'} [o.labelSide]  선이 이름표를 지나가지 않게 고른다
     * @param {[number, number]} [o.labelShift]  이름표 위치 미세 조정(칸)
     * @param {string} [o.link]
     */
    element(k, { at, role, icon, title, sub, labelSide = 'front', labelShift = [0, 0], link }) {
      if (elements.has(k)) throw new Error(`요소 키 중복: ${k}`)
      const cx = at[0] * col
      const cy = at[1] * lane
      const colors = ROLE[role]
      if (!colors) throw new Error(`알 수 없는 role: ${role}`)
      const block = {
        type: 'block',
        id: id(`block:${k}`),
        mapPos: [round(cx - W / 2), round(cy - D / 2)],
        width: W,
        height: SIZE.block.height,
        depth: D,
        color: both(colors.block),
      }
      if (link) block.link = link
      nodes.push(block)

      icons.push({
        type: 'icon',
        id: id(`icon:${k}`),
        mapPos: [round(cx), round(cy)],
        iconSet: 'fa',
        name: icon,
        iconSize: SIZE.icon,
        isometric: ISO,
        standing: false,
        direction: TEXT_DIRECTION,
        color: both(colors.icon),
        background: both(colors.block),
      })

      // 이름표. isotext 의 mapPos 는 글자의 시작점이라고 가정한다.
      const [tw] = textExtent(title, SIZE.title)
      const [sw, sh] = sub ? textExtent(sub, SIZE.sub) : [0, 0]
      const gap = 0.35
      let titlePos
      let subPos
      if (labelSide === 'right' || labelSide === 'left') {
        const x = labelSide === 'right' ? cx + W / 2 + 0.6 : cx - W / 2 - 0.6 - Math.max(tw, sw)
        titlePos = [x, cy - 0.15]
        subPos = [x, cy - 0.15 + gap + SIZE.sub / SIZE.textPerUnit]
      } else if (labelSide === 'back') {
        const x = cx - W / 2
        const lift = ISO ? SIZE.block.height * SIZE.heightShadow : 0
        subPos = [x, cy - D / 2 - 0.35 - lift - sh + SIZE.sub / SIZE.textPerUnit]
        titlePos = [x, subPos[1] - SIZE.sub / SIZE.textPerUnit - gap]
      } else {
        const x = cx - W / 2
        titlePos = [x, cy + D / 2 + 0.35 + SIZE.title / SIZE.textPerUnit]
        subPos = [x, titlePos[1] + gap + SIZE.sub / SIZE.textPerUnit]
      }
      titlePos = [titlePos[0] + labelShift[0], titlePos[1] + labelShift[1]]
      subPos = [subPos[0] + labelShift[0], subPos[1] + labelShift[1]]
      label(`${k}:title`, titlePos, title, SIZE.title, COLOR.ink, true)
      if (sub) label(`${k}:sub`, subPos, sub, SIZE.sub, COLOR.inkDim, true)

      // 영역 크기를 잡을 때 쓰는 요소의 대략적 테두리 (블록 + 이름표).
      const topY = titlePos[1] - SIZE.title / SIZE.textPerUnit
      const bottomY = sub ? subPos[1] - SIZE.sub / SIZE.textPerUnit + sh : titlePos[1]
      const box = [
        Math.min(cx - W / 2, titlePos[0]),
        Math.min(cy - D / 2, topY),
        Math.max(cx + W / 2, titlePos[0] + Math.max(tw, sw)),
        Math.max(cy + D / 2, bottomY + 0.1),
      ]
      elements.set(k, { id: block.id, cx, cy, box })
      return api
    },

    /**
     * 선. 이름표(프로토콜·용도)는 선 가운데 옆에 작게 깐다.
     * @param {string} from
     * @param {string} to
     * @param {object} [o]
     * @param {string} [o.label]
     * @param {boolean} [o.dashed]  예약·비동기 흐름
     * @param {boolean} [o.both]  양방향. 반대 방향 선을 하나 더 겹쳐 양끝에 화살표가 보이게 한다.
     * @param {[number, number]} [o.nudge]  이름표 위치 미세 조정(칸)
     */
    edge(from, to, { label: str, dashed = false, both: twoWay = false, nudge = [0, 0] } = {}) {
      edges.push({ from, to, str, dashed, nudge })
      // 반대 방향 선은 이름표 없이. 같은 두 블록 중심을 이어서 정확히 겹친다.
      if (twoWay) edges.push({ from: to, to: from, str: undefined, dashed, nudge })
      return api
    },

    /**
     * 호스트 영역. 구성원 요소(블록 + 이름표)를 감싸는 사각형을 깔고
     * 뒤쪽 모서리 바깥에 제목을 둔다.
     */
    area(k, { title, members, color = COLOR.paper, border = COLOR.line }) {
      areas.push({ k, title, members, color, border })
      return api
    },

    build() {
      for (const a of areas) {
        const boxes = a.members.map((m) => {
          const el = elements.get(m)
          if (!el) throw new Error(`영역 ${a.k}: 없는 요소 ${m}`)
          return el.box
        })
        const p = SIZE.areaPad
        const x0 = Math.min(...boxes.map((b) => b[0])) - p
        const y0 = Math.min(...boxes.map((b) => b[1])) - p
        const x1 = Math.max(...boxes.map((b) => b[2])) + p
        const y1 = Math.max(...boxes.map((b) => b[3])) + p
        const w = round(x1 - x0)
        const h = round(y1 - y0)
        surfaces.push({
          type: 'area',
          id: id(`area:${a.k}`),
          mapPos: [round(x0), round(y0)],
          points: [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h],
          ],
          shadow: true,
          color: both(a.color),
          borderColor: both(a.border),
        })
        label(`area:${a.k}`, [x0 + 0.2, y0 - 0.3], a.title, SIZE.areaTitle, COLOR.blue)
      }

      const out = []
      for (const e of edges) {
        const a = elements.get(e.from)
        const b = elements.get(e.to)
        // 없는 요소는 여기서 막지 않고 검증 단계에서 잡는다. 어떤 선이 틀렸는지 보여 주려고.
        const eid = id(`edge:${e.from}->${e.to}`)
        out.push({
          type: 'edge',
          id: eid,
          from: a ? a.id : `missing:${e.from}`,
          to: b ? b.id : `missing:${e.to}`,
          width: SIZE.edgeWidth,
          dashed: e.dashed,
          endCap: 'arrow',
          color: both(COLOR.inkDim),
        })
        if (!e.str || !a || !b) continue
        const mx = (a.cx + b.cx) / 2
        const my = (a.cy + b.cy) / 2
        const dx = b.cx - a.cx
        const dy = b.cy - a.cy
        const em = SIZE.edgeLabel / SIZE.textPerUnit
        const [lw] = textExtent(e.str, SIZE.edgeLabel)
        let pos
        if (Math.abs(dy) <= Math.abs(dx) * 0.35) pos = [mx - lw / 2, my - 0.4] // x 축을 따라가는 선: 선 위에
        else if (Math.abs(dx) <= Math.abs(dy) * 0.35) pos = [mx + 0.5, my + em / 2] // y 축: 선 오른쪽
        else if (dx * dy > 0) pos = [mx + 0.45, my - 0.2] // 오른쪽 아래로 가는 대각선
        else pos = [mx + 0.45, my + 0.25 + em] // 오른쪽 위로 가는 대각선
        label(`edge:${e.from}->${e.to}`, [pos[0] + e.nudge[0], pos[1] + e.nudge[1]], e.str, SIZE.edgeLabel, COLOR.blue, true)
      }

      return {
        name,
        grid: 'infinite',
        projection: PROJECTION,
        theme: { base: 'light' },
        nodes,
        edges: out,
        icons,
        text,
        surfaces,
        groups: [],
        images: [],
        connectors: [],
        disabledLayers: [],
        shareDocs: false,
      }
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
    ...data.text.map((c) => ['text', c]),
    ...data.surfaces.map((c) => ['surfaces', c]),
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
  for (const s of data.surfaces) {
    const where = `surfaces[${s.id}]`
    if (s.type !== 'area') err(where, `type 은 area: ${s.type}`)
    const ok = Array.isArray(s.points) && s.points.length >= 3 && s.points.every((p) => p.length === 2 && p.every(Number.isFinite))
    if (!ok) err(where, 'points 는 [x, y] 3개 이상')
  }
  const nodeIds = new Set(data.nodes.map((n) => n.id))
  const pairs = new Set()
  for (const e of data.edges) {
    const where = `edges[${e.id}]`
    if (e.type !== 'edge') err(where, `type 은 edge: ${e.type}`)
    if (!nodeIds.has(e.from)) err(where, `from 이 가리키는 블록이 없음: ${e.from}`)
    if (!nodeIds.has(e.to)) err(where, `to 가 가리키는 블록이 없음: ${e.to}`)
    if (e.from === e.to) err(where, '자기 자신으로 가는 선')
    const pair = `${e.from}>${e.to}`
    if (pairs.has(pair)) err(where, '같은 두 블록 사이에 같은 방향 선이 두 개')
    pairs.add(pair)
    if (!(e.width > 0)) err(where, 'width 는 0보다 커야 함')
  }
  return errors
}

/** 요약: 로그에 찍을 개수. */
export function summarize(data) {
  return {
    blocks: data.nodes.length,
    icons: data.icons.length,
    labels: data.text.length,
    areas: data.surfaces.length,
    edges: data.edges.length,
  }
}
