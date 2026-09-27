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
 *
 * 배치: README 의 가로를 x 축(화면 오른쪽 아래)으로, 위 칸을 -y(화면 오른쪽 위)로 옮겼다.
 * 사용자는 대시보드 앞(+y)에 둬 화면 왼쪽 아래에 온다. GitHub · Vercel 은 README 처럼 대시보드 뒤에 나란히.
 */
import { createBlueprint } from './lib.mjs'

export default function prism({ name }) {
  const bp = createBlueprint({ key: 'prism', name })
  const D = 0 // 대시보드
  const K = 10.8 // 백엔드
  const R = 18.4 // Render · Orange Pi
  const Y = 23.6 // YOLOv5 · Raspberry Pi
  const [BACK, MID, FRONT] = [-6.2, 0, 5.8]
  const USER = 7.6 // 요청 이름표가 대시보드 영역 밖 틈에 들어가게
  const IOT = 5.0 // Raspberry Pi 줄

  // 대시보드 묶음: README 처럼 GitHub · Vercel 이 대시보드 위(뒤)에 나란히.
  // 대시보드에서 나가는 두 선은 블록 밑에서 좌우로 비켜 나와 두 갈래로 올라간다.
  bp.element('github', { at: [D - 3.2, BACK], logo: 'github', title: 'GitHub' })
  bp.element('vercel', { at: [D + 3.2, BACK], logo: 'vercel', title: 'Vercel' })
  bp.element('dashboard', {
    at: [D, MID],
    logo: ['html5', 'css', 'javascript'],
    title: 'HTML · CSS · JS',
    sub: '관제 대시보드',
    // 앞면 가운데로 사용자 선이 들어온다. 부제는 그 오른쪽으로.
    subShift: [2.6, 0],
  })
  bp.element('user', { at: [D, USER], icon: 'user', title: '사용자' })

  // 백엔드 묶음
  bp.element('fastapi', { at: [K, BACK], logo: 'fastapi', title: 'FastAPI', sub: 'WebSocket', subSide: 'back' })
  bp.element('express', { at: [K, MID], logo: ['nodedotjs', 'express'], title: 'Node.js · Express' })
  bp.element('mysql', { at: [K, FRONT], logo: 'mysql', title: 'MySQL' })

  // API 서버
  bp.element('render', { at: [R, BACK], logo: 'render', title: 'Render', sub: 'API 서버', subSide: 'back' })

  // IoT 묶음
  bp.element('orangepi', { at: [R, MID], icon: 'microchip', iconColor: '#f08c00', title: 'Orange Pi' })
  bp.element('yolo', { at: [Y, MID], logo: 'ultralytics', title: 'YOLOv5', sub: '현장 추론', subSide: 'right' })
  bp.element('raspi', { at: [(R + Y) / 2, IOT], logo: 'raspberrypi', title: 'Raspberry Pi', sub: '센서', subSide: 'right' })

  bp.edge('user', 'dashboard', { label: '요청' })
  const fork = BACK / 2
  bp.edge('dashboard', 'github', { via: [[D - 0.55, MID], [D - 0.55, fork], [D - 3.2, fork]], label: '로컬 푸시' })
  bp.edge('dashboard', 'vercel', { via: [[D + 0.55, MID], [D + 0.55, fork], [D + 3.2, fork]], label: '배포 (Prod)' })
  bp.edge('dashboard', 'express', { both: true })
  bp.edge('fastapi', 'express', { label: '요청 / 응답', both: true })
  bp.edge('express', 'mysql', { label: 'DB 연결', both: true })
  // README 의 "API Server" 는 Render 이름표(sub)에 이미 있다. 선에는 다시 적지 않는다.
  bp.edge('fastapi', 'render', { dashed: true })
  bp.edge('render', 'orangepi', { both: true })
  bp.edge('express', 'orangepi', { both: true })
  bp.edge('orangepi', 'yolo', { both: true })

  bp.area('dashboard', { kind: 'client', title: '대시보드', members: ['github', 'vercel', 'dashboard'], titleEdge: 'front' })
  bp.area('backend', { kind: 'host', title: '백엔드', members: ['fastapi', 'express', 'mysql'], titleEdge: 'front' })
  bp.area('render', { kind: 'host', title: 'Render', members: ['render'] })
  bp.area('iot', { kind: 'host', title: 'IoT', members: ['orangepi', 'yolo', 'raspi'], titleEdge: 'front' })

  return bp.build()
}
