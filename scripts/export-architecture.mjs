/**
 * Cloudcraft 아키텍처를 코드에서 만들고 SVG 로 내려받는다.
 *
 * 1. scripts/architecture/*.mjs 가 블루프린트 data 를 만든다 (그림의 원본).
 * 2. Cloudcraft 에서 같은 이름의 블루프린트를 찾아 고치고(PUT), 없으면 만든다(POST).
 *    그래서 CI 에서 몇 번을 돌려도 블루프린트가 늘어나지 않고, id 를 커밋할 필요도 없다.
 * 3. SVG(격자 끔, dark 테마 바탕 그대로)를 받아 finish-svg.mjs 로 손본다.
 *    영문 글꼴 대체(산세리프)를 붙이고, 로고(logos.mjs)를 블록 윗면에 그려 넣는다.
 *    Cloudcraft API 로는 이미지를 올릴 수 없어서다. 받은 그대로는 out/<key>.raw.svg 에 남긴다.
 * 4. 결과를 src/assets/architecture/<key>.svg 로 쓰고, 원본 크기를 <key>.size.json 에 적는다.
 *    사이트는 이 크기로 자리를 먼저 잡는다.
 *
 * API 키는 환경 변수 CLOUDCRAFT_API_KEY 로만 읽는다. 사이트는 GitHub Pages 의
 * 정적 파일이라 브라우저 코드에 키를 넣으면 누구나 볼 수 있다. 그래서 키는
 * 빌드 전에 이 스크립트에서만 쓰고, 결과 파일만 사이트에 들어간다.
 *
 * 실행:
 *   CLOUDCRAFT_API_KEY=... npm run architecture
 *   NODE_USE_ENV_PROXY=1 CLOUDCRAFT_VIA_PROXY=1 npm run architecture
 *                                       프록시가 키를 붙여 주는 환경. Node 의 fetch 는
 *                                       NODE_USE_ENV_PROXY=1 이 있어야 HTTPS_PROXY 를 쓴다.
 *   npm run architecture -- --dry-run   키 없이 검사만. 보낼 JSON 과 근사 미리보기를
 *                                       scripts/architecture/out/ 에 쓴다.
 *
 * 키가 없으면 아무것도 보내지 않고 성공으로 끝난다. 한 장이 실패해도 배포는 막지 않는다.
 * 이미 저장된 파일이 있으면 내려받기에 실패해도 그 파일을 그대로 쓴다.
 */
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { validate, summarize } from './architecture/lib.mjs'
import { renderPreview } from './architecture/preview.mjs'
import { finishSvg } from './architecture/finish-svg.mjs'

// 주소를 바꾸는 건 로컬 가짜 서버로 흐름을 시험할 때뿐이다.
const API = process.env.CLOUDCRAFT_API_URL ?? 'https://api.cloudcraft.co'
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ASSET_DIR = join(ROOT, 'src/assets/architecture')
const OUT_DIR = join(ROOT, 'scripts/architecture/out')
const FORMATS = ['svg', 'png']

const dryRun = process.argv.includes('--dry-run')
const inCI = process.env.GITHUB_ACTIONS === 'true'
const log = (msg) => console.log(`[architecture] ${msg}`)
const warn = (msg) => {
  console.warn(`[architecture] ${msg}`)
  // Actions 요약 화면에 노란 경고로 남긴다. 단계는 실패시키지 않는다.
  if (inCI) console.log(`::warning title=Cloudcraft::${msg.replaceAll('\n', '%0A')}`)
}

/* ------------------------------------------------------------------ */
/* 1. 블루프린트 data 만들기 + 검증                                       */
/* ------------------------------------------------------------------ */
const config = JSON.parse(await readFile(new URL('./architecture.config.json', import.meta.url), 'utf8'))
const blueprints = []
for (const bp of config.blueprints) {
  const format = bp.format ?? 'svg'
  let data = null
  let errors = []
  try {
    if (!/^[a-z0-9-]+$/.test(bp.key ?? '')) throw new Error(`key 는 소문자·숫자·하이픈만: ${bp.key}`)
    if (!FORMATS.includes(format)) throw new Error(`format 은 ${FORMATS.join(' 또는 ')}: ${format}`)
    const mod = await import(new URL(bp.module, import.meta.url).href)
    data = mod.default({ name: bp.name })
    errors = validate(data)
  } catch (err) {
    errors = [`정의를 만들지 못함: ${err.message}`]
  }
  blueprints.push({ ...bp, format, data, errors })
}

/* ------------------------------------------------------------------ */
/* 2-a. --dry-run: 보내지 않고 검사와 미리보기만                            */
/* ------------------------------------------------------------------ */
if (dryRun) {
  await mkdir(OUT_DIR, { recursive: true })
  let bad = 0
  for (const bp of blueprints) {
    if (bp.errors.length) {
      bad++
      console.error(`[architecture] ${bp.key} 검증 실패 ${bp.errors.length}건\n  - ${bp.errors.join('\n  - ')}`)
      continue
    }
    const s = summarize(bp.data)
    await writeFile(join(OUT_DIR, `${bp.key}.json`), `${JSON.stringify({ data: bp.data }, null, 2)}\n`)
    await writeFile(join(OUT_DIR, `${bp.key}.preview.svg`), renderPreview(bp.data))
    log(
      `${bp.key} 통과 — 블록 ${s.blocks} · 선 ${s.edges} · 아이콘 ${s.icons} · 글자 ${s.labels} · 영역 ${s.areas}` +
        ` → scripts/architecture/out/${bp.key}.json, ${bp.key}.preview.svg`,
    )
  }
  await measureAll()
  process.exit(bad ? 1 : 0)
}

/* ------------------------------------------------------------------ */
/* 2-b. Cloudcraft 로 보내고 내려받기                                      */
/* ------------------------------------------------------------------ */
const key = process.env.CLOUDCRAFT_API_KEY
// Claude Code 클라우드 환경의 'API credentials' 에 키를 넣으면 프록시가 헤더를 붙여 준다.
// 그때는 CLOUDCRAFT_VIA_PROXY=1 로 실행하면 키 없이 요청한다.
const viaProxy = process.env.CLOUDCRAFT_VIA_PROXY === '1'
// Node 의 fetch 는 HTTPS_PROXY 를 스스로 따르지 않는다. 프록시 뒤에서는 NODE_USE_ENV_PROXY=1 이 있어야 나간다.
if (viaProxy && !process.env.NODE_USE_ENV_PROXY) {
  log('힌트: 프록시 뒤라면 NODE_USE_ENV_PROXY=1 을 함께 주세요 — Node 의 fetch 는 그것 없이 HTTPS_PROXY 를 쓰지 않습니다.')
}
if (!key && !viaProxy) {
  log('CLOUDCRAFT_API_KEY 없음 — 저장된 파일을 그대로 씁니다.')
  await measureAll()
  process.exit(0)
}

class ApiError extends Error {
  constructor(method, path, status, body) {
    // Cloudcraft 가 data 를 거절하면 이유가 본문에 온다. 잘라서라도 그대로 보여 준다.
    super(`${method} ${path} → HTTP ${status}${body ? `\n    ${body.slice(0, 800)}` : ''}`)
    this.status = status
  }
}

async function call(method, path, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    // 요청 한도(10초에 20번)에 걸리면 알려 준 만큼 기다렸다가 두 번까지 다시 한다.
    if (res.status === 429 && attempt < 2) {
      await sleep((Number(res.headers.get('retry-after')) || 5) * 1000)
      continue
    }
    if (!res.ok) throw new ApiError(method, path, res.status, await res.text().catch(() => ''))
    return res
  }
}

// 이름으로 찾기 위해 목록을 한 번만 받는다.
let listed = null
try {
  const json = await (await call('GET', '/blueprint')).json()
  listed = Array.isArray(json?.blueprints) ? json.blueprints : []
} catch (err) {
  warn(`블루프린트 목록을 받지 못함 — id 가 적힌 것만 진행합니다.\n    ${err.message}`)
}

let failed = 0
for (const bp of blueprints) {
  try {
    if (bp.errors.length) throw new Error(`검증 실패 — 보내지 않음\n  - ${bp.errors.join('\n  - ')}`)
    const id = await upsert(bp)
    await download(bp, id)
  } catch (err) {
    failed++
    warn(`${bp.key} 실패: ${err.message}`)
  }
}
await measureAll()
// 한 장이 실패해도 배포는 막지 않는다. 경고만 남긴다.
if (failed) warn(`${failed}개 실패 — 저장된 파일이 있으면 그대로 씁니다.`)

/** 이름이 같은 블루프린트를 고치거나, 없으면 만든다. 쓸 id 를 돌려준다. */
async function upsert(bp) {
  let id = bp.id || ''
  if (!id) {
    if (listed === null) throw new Error('목록을 못 받아 같은 이름이 있는지 모름 — 중복을 막으려고 만들지 않음')
    const same = listed
      .filter((b) => (b.name ?? b.data?.name) === bp.name)
      .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    if (same.length > 1) warn(`${bp.key}: 이름이 같은 블루프린트가 ${same.length}개 — 가장 최근 것(${same[0].id})을 씁니다.`)
    id = same[0]?.id ?? ''
  }

  if (id && bp.update === false) {
    log(`${bp.key}: update=false — Cloudcraft 쪽 그림을 그대로 두고 내보내기만 합니다 (${id})`)
    return id
  }
  try {
    if (id) {
      await call('PUT', `/blueprint/${encodeURIComponent(id)}`, { data: bp.data })
      log(`${bp.key}: 고침 (${id})`)
      return id
    }
    const created = await (await call('POST', '/blueprint', { data: bp.data })).json()
    if (!created?.id) throw new Error(`만들기 응답에 id 가 없음: ${JSON.stringify(created).slice(0, 200)}`)
    log(`${bp.key}: 새로 만듦 (${created.id}) — 다음부터는 이름 "${bp.name}" 으로 찾아 고칩니다.`)
    return created.id
  } catch (err) {
    // 거절된 data 를 남겨 두면 무엇이 문제였는지 Cloudcraft 화면에 붙여 넣어 볼 수 있다.
    if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 403) {
      await mkdir(OUT_DIR, { recursive: true })
      const file = join(OUT_DIR, `${bp.key}.rejected.json`)
      await writeFile(file, `${JSON.stringify({ data: bp.data }, null, 2)}\n`)
      err.message += `\n    거절된 data: scripts/architecture/out/${bp.key}.rejected.json`
    }
    throw err
  }
}

/** 이미지를 내려받아 src/assets/architecture/<key>.<format> 에 쓴다. */
async function download(bp, id) {
  // 참고 그림처럼 검은 바탕(dark 테마)을 그대로 받는다. 격자는 끈다. 설정에서 transparent: true 로 바꿀 수 있다.
  const params = new URLSearchParams({ grid: 'false', transparent: String(bp.transparent === true) })
  if (bp.scale) params.set('scale', String(bp.scale))
  const res = await call('GET', `/blueprint/${encodeURIComponent(id)}/${bp.format}?${params}`)
  let buf = Buffer.from(await res.arrayBuffer())
  if (bp.format === 'svg') {
    if (!buf.subarray(0, 2048).toString('utf8').includes('<svg')) {
      throw new Error(`SVG 가 아닌 응답 (${res.headers.get('content-type')})`)
    }
    // 받은 그대로도 남겨 둔다(커밋하지 않음). 로고 · 글꼴 손질만 다시 해 볼 때 쓴다.
    await mkdir(OUT_DIR, { recursive: true })
    await writeFile(join(OUT_DIR, `${bp.key}.raw.svg`), buf)
    const done = finishSvg(buf.toString('utf8'), bp.data)
    if (done.missing.length) warn(`${bp.key}: 윗면을 못 찾아 로고를 못 붙인 요소 — ${done.missing.join(', ')}`)
    buf = Buffer.from(done.svg, 'utf8')
  }
  await mkdir(ASSET_DIR, { recursive: true })
  await writeFile(join(ASSET_DIR, `${bp.key}.${bp.format}`), buf)
  // 형식을 바꿨으면 예전 파일을 지운다. 사이트가 둘 중 무엇을 쓸지 헷갈리지 않게.
  for (const other of FORMATS.filter((f) => f !== bp.format)) {
    await rm(join(ASSET_DIR, `${bp.key}.${other}`), { force: true })
  }
  log(`${bp.key} → src/assets/architecture/${bp.key}.${bp.format} (${buf.length.toLocaleString()} bytes)`)
}

/* ------------------------------------------------------------------ */
/* 3. 원본 크기 기록                                                     */
/* ------------------------------------------------------------------ */
/**
 * src/assets/architecture 의 이미지마다 <key>.size.json 을 맞춘다.
 * 손으로 넣은 SVG 도 CI 에서 크기가 잡힌다. 짝 잃은 크기 파일은 지운다.
 */
async function measureAll() {
  if (!existsSync(ASSET_DIR)) return
  const names = await readdir(ASSET_DIR)
  const images = new Map()
  for (const n of names) {
    const m = n.match(/^([a-z0-9-]+)\.(svg|png)$/)
    if (m) images.set(m[1], n)
  }
  for (const [k, file] of images) {
    try {
      const buf = await readFile(join(ASSET_DIR, file))
      const size = file.endsWith('.png') ? pngSize(buf) : svgSize(buf.toString('utf8'))
      if (!size) throw new Error('크기를 읽지 못함')
      const json = `${JSON.stringify(size)}\n`
      const target = join(ASSET_DIR, `${k}.size.json`)
      const prev = existsSync(target) ? await readFile(target, 'utf8') : ''
      if (prev !== json) {
        await writeFile(target, json)
        log(`${file} 크기 ${size.width}×${size.height} → ${k}.size.json`)
      }
    } catch (err) {
      warn(`${file}: ${err.message} — 사이트에서 자리를 미리 잡지 못합니다.`)
    }
  }
  for (const n of names) {
    const m = n.match(/^([a-z0-9-]+)\.size\.json$/)
    if (m && !images.has(m[1])) await rm(join(ASSET_DIR, n), { force: true })
  }
}

function svgSize(text) {
  const tag = text.match(/<svg\b[^>]*>/i)?.[0]
  if (!tag) return null
  const attr = (name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1]
  const px = (v) => (v && /^\s*[\d.]+\s*(px)?\s*$/.test(v) ? parseFloat(v) : NaN)
  let width = px(attr('width'))
  let height = px(attr('height'))
  if (!(width > 0 && height > 0)) {
    const vb = attr('viewBox')?.trim().split(/[\s,]+/).map(Number)
    if (vb?.length === 4) [, , width, height] = vb
  }
  return width > 0 && height > 0 ? { width: Math.round(width), height: Math.round(height) } : null
}

function pngSize(buf) {
  if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}
