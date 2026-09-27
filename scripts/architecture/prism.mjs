/**
 * PRISM (케이스 edge-ai)
 *
 * 원본은 PRISM 저장소 README 의 "시스템 아키텍처" 그림이다. 거기 있는 상자와 화살표만 옮긴다.
 * - 사용자 → [대시보드] HTML · CSS · JavaScript
 * - 대시보드 → GitHub (로컬 푸시), → Vercel (배포, Prod)
 * - 대시보드 ↔ [백엔드] Node.js · Express. 그 위 FastAPI · WebSocket 과 요청 / 응답
 * - Express ↔ MySQL (DB 연결), FastAPI ⇢ Render (API 서버, 점선)
 * - 백엔드 ↔ [IoT], Render ↔ [IoT]. IoT 안: Orange Pi ↔ YOLOv5 (현장 추론), Raspberry Pi
 * Work Space 상자(VS Code · Python)는 구성 요소가 아니라 뺐다.
 *
 * README 는 백엔드·Render 화살표를 IoT 상자 전체에 잇는다. Cloudcraft 선은 블록끼리만
 * 이으므로 현장 추론을 맡은 Orange Pi 에 붙였다.
 */
import { createBlueprint } from './lib.mjs'

export default function prism({ name }) {
  const bp = createBlueprint({ key: 'prism', name, col: 8, lane: 6 })

  // 대시보드 묶음
  bp.element('github', { at: [0, 0], role: 'external', icon: 'github', title: 'GitHub' })
  bp.element('vercel', { at: [1, 0], role: 'app', icon: 'globe', title: 'Vercel', labelSide: 'right' })
  // 사용자는 대시보드 영역 밖(앞줄)에 둔다. 영역이 사각형이라 같은 칸에 두면 안에 들어가 버린다.
  bp.element('user', { at: [0, 2], role: 'client', icon: 'user', title: '사용자' })
  bp.element('dashboard', {
    at: [1, 1],
    role: 'app',
    icon: 'desktop',
    title: 'HTML · CSS · JS',
    sub: '관제 대시보드',
  })

  // 백엔드 묶음
  bp.element('fastapi', {
    at: [2, 0],
    role: 'app',
    icon: 'bolt',
    title: 'FastAPI',
    sub: 'WebSocket',
    labelSide: 'back',
  })
  bp.element('express', {
    at: [2, 1],
    role: 'app',
    icon: 'server',
    title: 'Node.js · Express',
    labelSide: 'right',
  })
  bp.element('mysql', { at: [2, 2], role: 'data', icon: 'database', title: 'MySQL' })

  // API 서버
  bp.element('render', { at: [3, 0], role: 'app', icon: 'cloud', title: 'Render', sub: 'API 서버', labelSide: 'right' })

  // IoT 묶음
  bp.element('orangepi', { at: [3, 2], role: 'data', icon: 'microchip', title: 'Orange Pi' })
  bp.element('yolo', { at: [4, 2], role: 'app', icon: 'eye', title: 'YOLOv5', sub: '현장 추론' })
  bp.element('raspi', { at: [4, 3], role: 'data', icon: 'microchip', title: 'Raspberry Pi', sub: '센서' })

  bp.edge('user', 'dashboard', { label: '요청' })
  bp.edge('dashboard', 'github', { label: '로컬 푸시' })
  bp.edge('dashboard', 'vercel', { label: '배포 (Prod)' })
  bp.edge('dashboard', 'express', { both: true })
  bp.edge('fastapi', 'express', { label: '요청 / 응답', both: true })
  bp.edge('express', 'mysql', { label: 'DB 연결', both: true })
  // README 의 "API Server" 는 Render 이름표(sub)에 이미 있다. 선에는 다시 적지 않는다.
  bp.edge('fastapi', 'render', { dashed: true })
  bp.edge('render', 'orangepi', { both: true })
  bp.edge('express', 'orangepi', { both: true })
  bp.edge('orangepi', 'yolo', { both: true })

  bp.area('dashboard', { title: '대시보드', members: ['github', 'vercel', 'dashboard'] })
  bp.area('backend', { title: '백엔드', members: ['fastapi', 'express', 'mysql'] })
  bp.area('iot', { title: 'IoT', members: ['orangepi', 'yolo', 'raspi'] })

  return bp.build()
}
