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
 */
import { createBlueprint } from './lib.mjs'

export default function interviewOps({ name }) {
  const bp = createBlueprint({ key: 'interview-ops', name, col: 8, lane: 7 })

  bp.element('browser', {
    at: [0, 2],
    role: 'client',
    icon: 'users',
    title: '브라우저',
    sub: '지원자 · 운영진\n면접관 태블릿',
    labelSide: 'left',
  })

  // Vercel
  bp.element('middleware', {
    at: [1, 0],
    role: 'app',
    icon: 'globe',
    title: 'Edge Middleware',
    sub: '국내 접속만 허용',
  })
  bp.element('spa', {
    at: [2, 0],
    role: 'app',
    icon: 'code',
    title: 'React SPA',
    sub: 'jeondaejuju.com\nadmin.jeondaejuju.com',
    link: 'https://jeondaejuju.com',
  })

  // Supabase
  bp.element('pg', {
    at: [1, 1],
    role: 'data',
    icon: 'database',
    title: 'Postgres · Auth',
    sub: 'RLS · RPC',
  })
  // pg_cron 은 Edge Functions 바로 옆. 매일 부르는 선이 짧고 다른 이름표를 지나지 않는다.
  bp.element('cron', {
    at: [2, 3],
    role: 'data',
    icon: 'calendar',
    title: 'pg_cron',
    sub: '매일 정리 예약',
  })
  // 앞쪽으로는 브라우저 → Edge Functions 선이 지나가서 이름표를 오른쪽 빈칸에 둔다.
  bp.element('realtime', {
    at: [1, 2],
    role: 'data',
    icon: 'bolt',
    title: 'Realtime',
    sub: '면접 보드 실시간 반영\n보조 폴링 30초 · 끊기면 3초',
    labelSide: 'right',
  })
  bp.element('fn', {
    at: [1, 3],
    role: 'app',
    icon: 'cogs',
    title: 'Edge Functions',
    sub: 'r2-presign\ncontact-submit\nstorage-gc',
  })

  // Cloudflare
  bp.element('r2', {
    at: [0, 4],
    role: 'data',
    icon: 'cloud',
    title: 'R2 버킷',
    sub: '공개 URL로 파일 제공',
  })

  // 외부 API
  bp.element('resend', {
    at: [2, 4],
    role: 'external',
    icon: 'envelope',
    title: 'Resend',
    sub: '메일 발송',
  })

  bp.edge('browser', 'middleware', { label: 'HTTPS' })
  bp.edge('middleware', 'spa', { label: '국내 접속만 통과' })
  bp.edge('browser', 'pg', { label: 'HTTPS · REST/RPC' })
  bp.edge('realtime', 'browser', { label: 'WebSocket' })
  bp.edge('browser', 'fn', { label: 'presigned URL 요청' })
  bp.edge('browser', 'r2', { label: '파일 직접 PUT' })
  bp.edge('cron', 'fn', { label: '매일 storage-gc', dashed: true })
  bp.edge('fn', 'r2', { label: '오래된 파일 정리', dashed: true })
  bp.edge('fn', 'resend', { label: 'contact-submit' })

  bp.area('vercel', { title: 'Vercel', members: ['middleware', 'spa'] })
  bp.area('supabase', { title: 'Supabase', members: ['pg', 'cron', 'realtime', 'fn'] })
  bp.area('cloudflare', { title: 'Cloudflare R2', members: ['r2'] })
  bp.area('external', { title: '외부 API', members: ['resend'] })

  return bp.build()
}
