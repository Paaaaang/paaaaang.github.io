/**
 * Cloudcraft 블루프린트를 SVG 로 내려받아 public/media 에 저장한다.
 *
 * API 키는 환경 변수 CLOUDCRAFT_API_KEY 로만 읽는다. 사이트는 GitHub Pages 의
 * 정적 파일이라 브라우저 코드에 키를 넣으면 누구나 볼 수 있다. 그래서 키는
 * 빌드 전에 이 스크립트에서만 쓰고, 결과 SVG 파일만 사이트에 들어간다.
 *
 * 실행: CLOUDCRAFT_API_KEY=... node scripts/export-architecture.mjs
 * 키가 없거나 ID가 비어 있으면 아무것도 하지 않고 성공으로 끝난다.
 * 이미 저장된 SVG 가 있으면 내려받기에 실패해도 그 파일을 그대로 쓴다.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const API = 'https://api.cloudcraft.co'
const key = process.env.CLOUDCRAFT_API_KEY
const config = JSON.parse(await readFile(new URL('./architecture.config.json', import.meta.url), 'utf8'))
const targets = config.blueprints.filter((b) => b.id)

// Claude Code 클라우드 환경의 'API credentials' 에 키를 넣으면 프록시가 헤더를 붙여 준다.
// 그때는 CLOUDCRAFT_VIA_PROXY=1 로 실행하면 키 없이 요청한다.
const viaProxy = process.env.CLOUDCRAFT_VIA_PROXY === '1'
if (!key && !viaProxy) {
  console.log('[architecture] CLOUDCRAFT_API_KEY 없음 — 저장된 파일을 그대로 씁니다.')
  process.exit(0)
}
if (targets.length === 0) {
  console.log('[architecture] 블루프린트 ID가 비어 있음 — scripts/architecture.config.json 을 채우세요.')
  process.exit(0)
}

let failed = 0
for (const bp of targets) {
  // 종이 바탕 위에 얹을 것이라 배경은 투명, 격자는 끈다.
  const url = `${API}/blueprint/${encodeURIComponent(bp.id)}/svg?grid=false&transparent=true`
  try {
    const res = await fetch(url, { headers: key ? { Authorization: `Bearer ${key}` } : {} })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const svg = await res.text()
    await mkdir(dirname(bp.out), { recursive: true })
    await writeFile(bp.out, svg)
    console.log(`[architecture] ${bp.label} → ${bp.out} (${svg.length.toLocaleString()} bytes)`)
  } catch (err) {
    failed++
    console.warn(`[architecture] ${bp.label} 실패: ${err.message}`)
  }
}
// 한 장이 실패해도 배포는 막지 않는다. 경고만 남긴다.
if (failed) console.warn(`[architecture] ${failed}개 실패 — 저장된 파일이 있으면 그대로 씁니다.`)
