/**
 * 전대주주 플랫폼 · 면접 운영 시스템 (케이스 interview-ops)
 *
 * 저장소 코드에서 확인한 구성만 그린다.
 * - 브라우저(지원자 · 운영진 · 면접관 태블릿) → Vercel Edge Middleware(국내 접속만) → React SPA
 * - 브라우저 → Supabase REST/RPC + Auth (HTTPS)
 * - Supabase Realtime → 브라우저 (WebSocket, 면접 보드. 연결되면 30초, 끊기면 3초 폴링)
 * - 업로드: Edge Function r2-presign 이 presigned URL 발급 → 브라우저가 R2 에 직접 PUT
 * - pg_cron → storage-gc → R2 정리 (매일), contact-submit → Resend (메일)
 * 시세 프록시, Sentry, 채널톡은 읽기 쉽게 뺐다.
 *
 * 배치: 요청 흐름을 x 축(화면 오른쪽 아래)으로. 브라우저에서 나가는 선은 블록 밑에서 먼저
 * 옆으로 비켜 나와(블록에 가려 보이지 않는다) 서로 겹치지 않게 갈라진다.
 * Supabase 안은 서비스(Realtime · Edge Functions)와 데이터베이스(Postgres · pg_cron) 두 칸.
 */
import { createBlueprint } from './lib.mjs'

export default function interviewOps({ name }) {
  const bp = createBlueprint({ key: 'interview-ops', name })
  const [X0, X1, X2, X3] = [0, 7.8, 14.4, 22.8]
  const [TOP, MID, LOW, RES] = [-8.4, 0, 7.5, 6.6]
  const laneFn = -4.0 // Vercel 과 Supabase 사이: 브라우저 → Edge Functions
  const laneR2 = -4.8 // 그보다 뒤: 브라우저 → R2
  const turn = X2 + 4.75 // Supabase 와 R2 · Resend 사이에서 꺾는 자리

  bp.element('browser', {
    at: [X0, MID],
    icon: 'desktop',
    title: '브라우저',
    sub: '지원자 · 운영진\n면접관 태블릿',
    subSide: 'left',
  })

  // Vercel
  bp.element('middleware', { at: [X1, TOP], logo: 'vercel', title: 'Edge Middleware', sub: '국내 접속만 허용', subSide: 'back' })
  bp.element('spa', {
    // Vercel 줄은 선 이름표(국내 접속만 통과)가 들어가게 조금 더 벌린다.
    at: [X2 + 2.4, TOP],
    logo: 'react',
    title: 'React SPA',
    sub: 'jeondaejuju.com\nadmin.jeondaejuju.com',
    subSide: 'back',
    link: 'https://jeondaejuju.com',
  })

  // Supabase: 서비스 줄
  bp.element('realtime', {
    at: [X1, MID],
    logo: 'supabase',
    title: 'Realtime',
    sub: '면접 보드 실시간 반영\n보조 폴링 30초 · 끊기면 3초',
  })
  // 부제는 앞쪽, pg_cron 에서 올라오는 선 오른쪽에.
  bp.element('fn', { at: [X2, MID], logo: 'deno', title: 'Edge Functions', sub: 'r2-presign\ncontact-submit\nstorage-gc', subShift: [2.5, 0] })
  // Supabase: 데이터베이스 줄
  bp.element('pg', { at: [X1, LOW], logo: 'postgresql', title: 'Postgres · Auth', sub: 'RLS · RPC' })
  bp.element('cron', { at: [X2, LOW], logo: 'postgresql', title: 'pg_cron', sub: '매일 정리 예약' })

  // Cloudflare · 외부 API
  bp.element('r2', { at: [X3, MID], logo: 'cloudflare', title: 'R2 버킷', sub: '공개 URL로 파일 제공', subSide: 'right' })
  bp.element('resend', { at: [X3, RES], logo: 'resend', title: 'Resend', sub: '메일 발송', subSide: 'right' })

  bp.edge('browser', 'middleware', { via: [[X0 - 0.5, MID], [X0 - 0.5, TOP]], label: 'HTTPS' })
  bp.edge('middleware', 'spa', { label: '국내 접속만 통과' })
  bp.edge('browser', 'pg', { via: [[X0 + 0.5, MID], [X0 + 0.5, LOW]], label: 'HTTPS · REST/RPC' })
  bp.edge('realtime', 'browser', { label: 'WebSocket' })
  bp.edge('browser', 'fn', { via: [[X0 + 0.9, MID], [X0 + 0.9, laneFn], [X2, laneFn]], label: 'presigned URL 요청' })
  bp.edge('browser', 'r2', { via: [[X0 + 0.5, MID], [X0 + 0.5, laneR2], [X3, laneR2]], label: '파일 직접 PUT', labelT: 0.78 })
  bp.edge('cron', 'fn', { label: '매일 storage-gc', dashed: true })
  bp.edge('fn', 'r2', { label: '오래된 파일 정리', dashed: true })
  bp.edge('fn', 'resend', { via: [[X2, MID + 0.5], [turn, MID + 0.5], [turn, RES]], label: 'contact-submit' })

  bp.area('app', { kind: 'client', members: ['browser'] })
  bp.area('vercel', { kind: 'host', title: 'Vercel', members: ['middleware', 'spa'] })
  bp.area('services', { kind: 'zone', members: ['realtime', 'fn'] })
  bp.area('db', { kind: 'zone', members: ['pg', 'cron'] })
  bp.area('supabase', { kind: 'host', title: 'Supabase', members: ['services', 'db'], titleEdge: 'front' })
  bp.area('cloudflare', { kind: 'host', title: 'Cloudflare R2', members: ['r2'] })
  bp.area('external', { kind: 'host', title: '외부 API', members: ['resend'], titleEdge: 'front' })

  return bp.build()
}
