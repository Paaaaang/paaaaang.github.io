#!/usr/bin/env node
/**
 * 포트폴리오 사이트를 그대로 PDF 로 내보낸다.
 *
 *   npm run build && npm run pdf
 *   npm run pdf -- --out dist/pioh-portfolio.pdf
 *
 * 따로 만든 이력서 PDF 가 아니라 사이트 자체를 인쇄한다. 그래서 내용은 늘
 * src/content/profile.ts 와 같고, 사이트가 공개하지 않는 정보(휴대폰 번호 ·
 * 상세 주소)는 PDF 에도 없다.
 *
 * 순서
 *   1. 빌드된 dist/ 를 Vite preview 로 빈 포트에 띄운다.
 *   2. Chromium 을 모션 축소(prefers-reduced-motion: reduce)로 연다.
 *      사이트는 이 설정에서 3D · 스무스 스크롤 · 핀 · 리빌을 끄고 정적 문서로 그린다.
 *   3. 접힌 경험을 모두 펼치고, 지연 로딩 이미지를 다 받고, 웹폰트를 기다린다.
 *   4. 인쇄 스타일(src/styles/index.css 의 @media print)로 A4 PDF 를 만든다.
 *
 * 폰트가 Pretendard 로 뜨지 않았거나, 이미지가 깨졌거나, 모션이 꺼지지 않았으면
 * PDF 를 만들지 않고 실패한다. 대체 글꼴이나 두부(□)로 찍힌 PDF 는 없느니만 못하다.
 *
 * 환경 변수
 *   CHROME_PATH      Chromium/Chrome 실행 파일. 없으면 설치된 Google Chrome(channel: chrome).
 *   PRETENDARD_DIR   cdn.jsdelivr.net 을 못 쓰는 환경에서 Pretendard 를 로컬에서 대 준다.
 *                    pretendard 패키지의 dist/web/variable/ 경로.
 *   HTTPS_PROXY      있으면 브라우저에 --proxy-server 로 넘긴다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { chromium } from 'playwright-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/* ------------------------------------------------------------------ */
/* 설정                                                                */
/* ------------------------------------------------------------------ */

/** A4 세로. 여백은 위아래를 조금 더 둔다(쪽 번호 자리). */
const PAGE = { widthMm: 210, heightMm: 297 }
const MARGIN = { top: 14, right: 13, bottom: 16, left: 13 } // mm

/**
 * 인쇄할 때의 레이아웃 폭(CSS px).
 * A4 인쇄 영역(약 695px)에 그대로 찍으면 모바일 레이아웃이 나온다.
 * 조금 넓게 잡고 축소해 태블릿 레이아웃(md, 2열 카드)으로 찍는다.
 * 본문 16px 이 약 9pt 로 인쇄된다. 1024 이상이면 데스크톱 레이아웃이지만 글자가 8pt 아래로 준다.
 */
const LAYOUT_WIDTH = 900

const FONT_FAMILY = 'Pretendard Variable'

/* ------------------------------------------------------------------ */

const args = parseArgs(process.argv.slice(2))
const outFile = path.resolve(process.cwd(), args.out ?? path.join(root, 'public/pioh-portfolio.pdf'))
const distDir = path.join(root, 'dist')

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  die('dist/index.html 이 없습니다. 먼저 npm run build 를 실행하세요.')
}

const mmToPx = (mm) => (mm / 25.4) * 96
const printableWidth = mmToPx(PAGE.widthMm - MARGIN.left - MARGIN.right)
const printableHeight = mmToPx(PAGE.heightMm - MARGIN.top - MARGIN.bottom)
const scale = round(printableWidth / LAYOUT_WIDTH, 4)
// 화면 레이아웃과 인쇄 레이아웃이 같은 폭 · 같은 쪽 높이를 보게 한다.
const viewport = { width: LAYOUT_WIDTH, height: Math.round(printableHeight / scale) }

let server
let browser

try {
  server = await preview({
    root,
    logLevel: 'warn',
    preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false },
  })
  const url = server.resolvedUrls?.local[0]
  if (!url) fail('preview 서버 주소를 알 수 없습니다.')

  browser = await chromium.launch({
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : { channel: 'chrome' }),
    args: process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`] : [],
  })

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: 'light',
    locale: 'ko-KR',
  })
  const page = await context.newPage()

  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  if (process.env.PRETENDARD_DIR) await routePretendard(page, process.env.PRETENDARD_DIR)

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
  if (pageErrors.length) fail(`페이지 오류:\n  ${pageErrors.join('\n  ')}`)

  await expandCases(page)
  await assertStaticDocument(page)
  await page.emulateMedia({ media: 'print' })
  await loadImages(page)
  await assertFonts(page)
  await checkLayout(page)
  await rewriteLocalLinks(page, url)

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    scale,
    margin: mapValues(MARGIN, (mm) => `${mm}mm`),
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    // 머리글 · 바닥글은 페이지 폰트를 못 쓴다. 두부가 생기지 않게 라틴 문자만 쓴다.
    footerTemplate: `
      <div style="width:100%;padding:0 ${MARGIN.left}mm;display:flex;justify-content:space-between;
        font:7px/1 ui-monospace,Menlo,'DejaVu Sans Mono',monospace;letter-spacing:.12em;color:#6b675f;">
        <span>OH PYEONGIL · SERVICE PLANNER PORTFOLIO</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
    // 목차(outline)는 만들지 않는다. 제목이 줄 단위 마스크(aria-hidden)로 쪼개져 있어
    // 챕터 제목은 빠지고 "문제 · 목표" 같은 행 머리만 남아 오히려 헷갈린다.
    tagged: true,
  })

  // 다 만든 다음 한 번에 바꿔 넣는다. 도중에 실패해도 기존 파일(배포 시 대체본)이 남는다.
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(`${outFile}.tmp`, pdf)
  fs.renameSync(`${outFile}.tmp`, outFile)

  const bytes = pdf.length
  const pages = countPdfPages(pdf)
  const shown = path.relative(process.cwd(), outFile)
  console.log(
    `PDF ${shown.startsWith('..') ? outFile : shown} · ${pages}쪽 · ${(bytes / 1024 / 1024).toFixed(2)} MB`,
  )
} catch (error) {
  console.error(`\n[export-pdf] ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
}

/* ------------------------------------------------------------------ */
/* 단계                                                                */
/* ------------------------------------------------------------------ */

/**
 * cdn.jsdelivr.net 요청을 로컬 pretendard 패키지로 돌린다.
 * 사이트는 jsDelivr 의 dynamic-subset CSS 를 쓰고, 그 CSS 는
 * ./woff2-dynamic-subset/*.woff2 를 상대 경로로 부른다.
 */
async function routePretendard(page, dir) {
  const cssFile = ['pretendardvariable-dynamic-subset.min.css', 'pretendardvariable-dynamic-subset.css']
    .map((name) => path.join(dir, name))
    .find((file) => fs.existsSync(file))
  if (!cssFile) fail(`PRETENDARD_DIR 에 pretendardvariable-dynamic-subset.css 가 없습니다: ${dir}`)
  const css = fs.readFileSync(cssFile, 'utf8')

  await page.route('https://cdn.jsdelivr.net/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname.endsWith('.css')) {
      // 상대 경로는 요청한 CSS 주소 기준으로 풀린다. 그대로 두면 아래 woff2 분기로 들어온다.
      return route.fulfill({ contentType: 'text/css', body: css })
    }
    const file = path.join(dir, 'woff2-dynamic-subset', path.basename(pathname))
    if (!pathname.endsWith('.woff2') || !fs.existsSync(file)) {
      return route.fulfill({ status: 404, body: '' })
    }
    return route.fulfill({
      contentType: 'font/woff2',
      headers: { 'access-control-allow-origin': '*' },
      body: fs.readFileSync(file),
    })
  })
}

/** 모션 축소가 실제로 걸려 정적 문서로 그려졌는지 확인한다. */
async function assertStaticDocument(page) {
  const state = await page.evaluate(() => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    // ScrollTrigger 의 pin 은 대상 요소를 .pin-spacer 로 감싼다.
    pins: document.querySelectorAll('.pin-spacer').length,
    // Lenis 는 동작 중이면 <html> 에 lenis 클래스를 붙인다.
    lenis: document.documentElement.classList.contains('lenis'),
    // 리빌이 돌기 전 상태(투명)로 남은 글자. 장식용 격자처럼 글자가 없는 요소는 뺀다.
    hidden: [...document.body.querySelectorAll('*')]
      .filter((el) => el.textContent?.trim() && Number(getComputedStyle(el).opacity) < 0.5)
      .map((el) => el.textContent.trim().slice(0, 30)),
  }))
  if (!state.reduced) fail('prefers-reduced-motion: reduce 가 적용되지 않았습니다.')
  if (state.pins) fail(`모션 축소인데 핀 구간이 ${state.pins}개 걸려 있습니다.`)
  if (state.lenis) fail('모션 축소인데 스무스 스크롤(Lenis)이 켜져 있습니다.')
  if (state.hidden.length) {
    fail(`리빌 전 상태(투명)로 남은 글자가 있습니다:\n  ${state.hidden.slice(0, 10).join('\n  ')}`)
  }
}

/** 접힌 경험을 모두 펼친다. 펼치는 버튼 자체는 인쇄 스타일에서 숨긴다. */
async function expandCases(page) {
  const selector = 'button[aria-expanded="false"][aria-controls$="-detail"]'
  const count = await page.locator(selector).count()
  for (let i = 0; i < count; i++) {
    // 누를 때마다 목록이 줄어든다. 늘 첫 번째 것을 누른다.
    await page.locator(selector).first().click()
  }
  await page.waitForFunction(
    (sel) =>
      !document.querySelector(sel) &&
      [...document.querySelectorAll('[id$="-detail"]')].every((el) => !el.hasAttribute('hidden')),
    selector,
    { timeout: 10_000 },
  )
  await page.evaluate(() => window.scrollTo(0, 0))
}

/** 지연 로딩 이미지를 모두 받는다. 하나라도 깨지면 실패한다. */
async function loadImages(page) {
  await page.evaluate(() => {
    for (const img of document.images) {
      img.loading = 'eager'
      img.decoding = 'sync'
    }
  })
  try {
    await page.waitForFunction(
      () => [...document.images].every((img) => img.complete),
      null,
      { timeout: 30_000 },
    )
  } catch {
    // 아래에서 어떤 이미지인지 보고한다.
  }
  const broken = await page.evaluate(async () => {
    const bad = []
    for (const img of document.images) {
      if (!img.complete || img.naturalWidth === 0) {
        bad.push(img.currentSrc || img.src)
        continue
      }
      await img.decode().catch(() => {})
    }
    return bad
  })
  if (broken.length) fail(`이미지를 불러오지 못했습니다:\n  ${broken.join('\n  ')}`)
}

/**
 * Pretendard 가 실제로 쓰였는지 확인한다.
 *
 * document.fonts.check() 는 해당 이름의 @font-face 가 아예 없어도 true 를 준다
 * (그리면 시스템 글꼴로 대체되기 때문). 그래서 세 가지를 같이 본다.
 *   - Pretendard 의 FontFace 가 등록돼 있고 일부가 loaded 인지
 *   - 페이지의 모든 글자에 대해 check() 가 true 인지 (필요한 서브셋이 다 받아졌는지)
 *   - 한글이 들어간 모든 요소의 font-family 에 Pretendard 가 있는지
 *     (없으면 시스템 CJK 글꼴이나 두부로 찍힌다)
 */
async function assertFonts(page) {
  await page.evaluate(() => document.fonts.ready)
  const result = await page.evaluate(async (family) => {
    const text = document.body.innerText
    // 글자가 새로 보이면 그 서브셋을 늦게 받는다. 한 번 더 기다린다.
    await document.fonts.load(`16px "${family}"`, text)
    await document.fonts.ready

    const faces = [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === family)
    const loaded = faces.filter((f) => f.status === 'loaded').length
    const failed = faces.filter((f) => f.status === 'error').length
    const covered = document.fonts.check(`16px "${family}"`) && document.fonts.check(`16px "${family}"`, text)

    const hangul = /[ᄀ-ᇿ㄰-㆏가-힯]/
    const offenders = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement
      if (!el || !hangul.test(node.data) || !el.getClientRects().length) continue
      if (!getComputedStyle(el).fontFamily.includes(family)) {
        offenders.push(`<${el.tagName.toLowerCase()} class="${el.className}"> ${node.data.trim().slice(0, 30)}`)
      }
    }
    return { faces: faces.length, loaded, failed, covered, offenders }
  }, FONT_FAMILY)

  if (!result.faces) fail(`"${FONT_FAMILY}" @font-face 가 없습니다. 폰트 CSS 를 못 받았습니다.`)
  if (!result.loaded || !result.covered) {
    fail(
      `"${FONT_FAMILY}" 를 다 받지 못했습니다 (loaded ${result.loaded} / error ${result.failed} / ${result.faces}).` +
        ' 네트워크를 확인하거나 PRETENDARD_DIR 을 지정하세요.',
    )
  }
  if (result.offenders.length) {
    fail(`한글이 Pretendard 밖의 글꼴로 찍힙니다:\n  ${result.offenders.slice(0, 10).join('\n  ')}`)
  }
}

/**
 * 인쇄 레이아웃에서 가로로 넘치는 요소나 반복되는 고정 요소가 없는지 본다.
 * 고정 요소가 남아 있으면 모든 쪽에 되풀이해 찍히므로 여기서 숨긴다.
 */
async function checkLayout(page) {
  const report = await page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const fixed = []
    const overflow = []
    for (const el of document.body.querySelectorAll('*')) {
      const style = getComputedStyle(el)
      if (style.display === 'none') continue
      if (style.position === 'fixed') {
        el.setAttribute('data-print', 'hide')
        fixed.push(el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''))
        continue
      }
      const rect = el.getBoundingClientRect()
      if (rect.width && rect.right > width + 1 && !el.closest('.sr-only')) {
        overflow.push(`<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> +${Math.round(rect.right - width)}px`)
      }
    }
    return { fixed, overflow, scrollWidth: document.documentElement.scrollWidth, width }
  })
  if (report.fixed.length) {
    console.warn(`[export-pdf] 인쇄에서 숨기지 않은 고정 요소를 숨겼습니다: ${report.fixed.join(', ')}`)
    console.warn('             data-print="hide" 를 달아 두면 이 경고가 사라집니다.')
  }
  if (report.overflow.length) {
    fail(`인쇄 폭(${report.width}px)을 넘는 요소가 있습니다:\n  ${report.overflow.slice(0, 10).join('\n  ')}`)
  }
}

/**
 * PDF 안의 링크가 로컬 preview 서버(127.0.0.1)를 가리키지 않게 한다.
 * 사이트 안 경로(자료 원본 이미지 등)는 canonical 주소 기준으로 바꾸고,
 * 문서 안 앵커(#about)는 그대로 둬 PDF 내부 링크가 되게 한다.
 */
async function rewriteLocalLinks(page, serverUrl) {
  const result = await page.evaluate((base) => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href
    let rewritten = 0
    let removed = 0
    for (const a of document.querySelectorAll('a[href]')) {
      if (a.getAttribute('href')?.startsWith('#') || !a.href.startsWith(base)) continue
      if (canonical) {
        a.href = new URL(a.href.slice(base.length), canonical).href
        rewritten++
      } else {
        a.removeAttribute('href')
        removed++
      }
    }
    return { canonical, rewritten, removed }
  }, serverUrl)
  if (result.removed) {
    console.warn(`[export-pdf] canonical 주소가 없어 사이트 안 링크 ${result.removed}개를 뺐습니다.`)
  }
}

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const [key, inline] = argv[i].split('=', 2)
    if (key === '--out') out.out = inline ?? argv[++i] ?? ''
    else if (key === '--help' || key === '-h') {
      console.log('usage: node scripts/export-pdf.mjs [--out <file.pdf>]')
      process.exit(0)
    } else die(`알 수 없는 인자: ${argv[i]}`)
  }
  if ('out' in out && !out.out) die('--out 뒤에 파일 경로가 필요합니다.')
  return out
}

/** PDF 의 페이지 트리에서 쪽 수를 센다. 의존성을 늘리지 않으려고 직접 읽는다. */
function countPdfPages(buffer) {
  const text = buffer.toString('latin1')
  const counts = [...text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]))
  if (counts.length) return Math.max(...counts)
  return (text.match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length
}

function mapValues(object, fn) {
  return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, fn(v)]))
}

function round(value, digits) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

/** 단계 안에서의 실패. 브라우저와 서버를 정리한 뒤 non-zero 로 끝난다. */
function fail(message) {
  throw new Error(message)
}

/** 시작 전 실패. 정리할 것이 없으니 바로 끝낸다. */
function die(message) {
  console.error(`[export-pdf] ${message}`)
  process.exit(1)
}
