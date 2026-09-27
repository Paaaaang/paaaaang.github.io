import type { MediaSlot } from './profile'

/**
 * Cloudcraft 로 만든 시스템 아키텍처 그림.
 *
 * `npm run architecture` (CI 에서는 배포 단계) 가 `src/assets/architecture/<key>.svg` 와
 * 원본 크기 `<key>.size.json` 을 쓴다. 파일이 있을 때만 해당 경험의 자료에 끼워 넣고,
 * 없으면 아무것도 더하지 않는다. 빈 프레임도 그리지 않는다.
 *
 * 그림의 원본은 각 저장소 README 의 "시스템 아키텍처" 그림(전대주주는 저장소 코드)이고,
 * 아래 캡션과 대체 텍스트도 거기 있는 상자와 화살표만 적는다.
 */

const files = import.meta.glob<string>('../assets/architecture/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const sizes = import.meta.glob<{ width: number; height: number }>('../assets/architecture/*.size.json', {
  eager: true,
  import: 'default',
})

type Entry = {
  /** scripts/architecture.config.json 의 key */
  key: string
  caption: string
  alt: string
  /** 어디에 끼울지. 캡션이 이 말로 시작하는 자료 바로 앞. 없으면 맨 앞. */
  before?: string
}

const byCase: Record<string, Entry[]> = {
  'interview-ops': [
    {
      key: 'interview-ops',
      caption: '전대주주 플랫폼 시스템 아키텍처 — Vercel · Supabase · Cloudflare R2',
      alt: '전대주주 플랫폼 시스템 아키텍처. 지원자·운영진·면접관 태블릿의 브라우저가 Vercel Edge Middleware(국내 접속만 허용)를 거쳐 React SPA를 받고, Supabase의 Postgres·Auth에 HTTPS로 요청하며 Realtime에서 WebSocket으로 면접 보드 변경을 받는다(연결되면 30초, 끊기면 3초 보조 폴링). 파일은 Edge Function r2-presign이 발급한 presigned URL로 브라우저가 Cloudflare R2에 직접 올리고, pg_cron이 매일 storage-gc로 R2를 정리하며, contact-submit은 Resend로 메일을 보낸다.',
    },
  ],
  'edge-ai': [
    {
      key: 'ttm',
      caption: 'TAP TO ME — 시스템 아키텍처',
      alt: 'TAP TO ME 시스템 아키텍처. 사용자가 Flutter 앱으로 요청하고 응답을 받는다. 앱은 Render 클라우드를 거쳐 Node.js·FastAPI 백엔드와 주고받고, 백엔드는 MySQL에 연결된다. GitHub는 Render로 배포하고, Raspberry Pi 하드웨어가 백엔드에 연결된다. 백엔드는 PyTorch 모델(YOLO 11, ResNet)과 주고받고, 모델은 Gemini API로 이어진다. AI Hub 데이터가 학습 데이터로 들어간다.',
    },
    {
      key: 'prism',
      caption: 'PRISM — 시스템 아키텍처',
      alt: 'PRISM 시스템 아키텍처. 사용자는 HTML·CSS·JavaScript 관제 대시보드로 요청한다. 대시보드는 GitHub에 푸시하고 Vercel로 배포되며 Node.js·Express 백엔드와 주고받는다. 백엔드 안에서 FastAPI·WebSocket이 Express와 요청과 응답을 주고받고, Express는 MySQL에 연결되며, FastAPI는 Render API 서버로 이어진다. 현장 IoT의 Orange Pi는 YOLOv5로 직접 추론하며 백엔드·Render와 주고받고, 센서를 맡은 Raspberry Pi도 IoT에 속한다.',
      before: 'PRISM',
    },
  ],
}

function slotFor(entry: Entry): MediaSlot | undefined {
  const src =
    files[`../assets/architecture/${entry.key}.svg`] ?? files[`../assets/architecture/${entry.key}.png`]
  if (!src) return undefined
  const size = sizes[`../assets/architecture/${entry.key}.size.json`]
  return {
    kind: '아키텍처',
    // 원본 비율 그대로. 크기 파일이 있으면 이미지가 늦게 떠도 자리가 먼저 잡혀
    // 핀 구간 위치가 흔들리지 않는다. 가로로 긴 그림이라 폭을 다 쓴다.
    ratio: 'natural',
    span: 'full',
    // 3D 도식은 16:7 로 줄이면 글자가 안 읽힌다. 원본 비율로 폭을 다 쓰고,
    // 틀 바탕을 도식 배경(#121212)과 맞춰 양옆 띠가 보이지 않게 한다.
    uncapped: true,
    backdrop: '#121212',
    src,
    caption: entry.caption,
    alt: entry.alt,
    ...(size ? { size: [size.width, size.height] as [number, number] } : {}),
  }
}

/** 경험의 자료 목록에 내보낸 아키텍처 그림을 끼운다. 파일이 없으면 받은 목록을 그대로 돌려준다. */
export function withArchitecture(caseId: string, media: MediaSlot[]): MediaSlot[] {
  let out = media
  for (const entry of byCase[caseId] ?? []) {
    const slot = slotFor(entry)
    if (!slot) continue
    const at = entry.before ? out.findIndex((m) => m.caption.startsWith(entry.before!)) : 0
    const i = at < 0 ? out.length : at
    out = [...out.slice(0, i), slot, ...out.slice(i)]
  }
  return out
}
