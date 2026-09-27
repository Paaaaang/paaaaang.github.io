/**
 * TAP TO ME (케이스 edge-ai)
 *
 * 원본은 TTM 저장소 README 의 "시스템 아키텍처" 그림이다. 거기 있는 상자와 화살표만 옮긴다.
 * - 사용자 ↔ [프론트엔드 · 앱] Flutter ↔ [클라우드] Render ↔ [백엔드] Node.js · FastAPI
 * - GitHub(협업 도구) → Render (배포)
 * - 백엔드 안: Node.js · FastAPI ↔ MySQL (DB 연결)
 * - [하드웨어] Raspberry Pi ⇢ 백엔드 (점선)
 * - 백엔드 ↔ [AI] PyTorch 모델(YOLO 11 · ResNet) ⇢ Gemini API (점선)
 * - [데이터] AI Hub → PyTorch (학습 데이터)
 * IDE 상자(VS Code · Colab · Xcode)는 구성 요소가 아니라 뺐다.
 */
import { createBlueprint } from './lib.mjs'

export default function ttm({ name }) {
  const bp = createBlueprint({ key: 'ttm', name, col: 8, lane: 7 })

  // 뒷줄: 흐름에 끼어드는 도구와 장비
  bp.element('github', { at: [1, 0], role: 'external', icon: 'github', title: 'GitHub', sub: '협업 도구' })
  bp.element('pi', {
    at: [2, 0],
    role: 'external',
    icon: 'microchip',
    title: 'Raspberry Pi',
    sub: '하드웨어',
    labelSide: 'right',
  })
  bp.element('aihub', {
    at: [4, 0],
    role: 'external',
    icon: 'database',
    title: 'AI Hub',
    sub: '데이터',
    labelSide: 'right',
  })

  // 가운데 줄: 요청이 흐르는 길
  bp.element('user', { at: [0, 1], role: 'client', icon: 'user', title: '사용자' })
  bp.element('flutter', { at: [1, 1], role: 'app', icon: 'mobile', title: 'Flutter', sub: '앱 · 프론트엔드' })
  bp.element('render', { at: [2, 1], role: 'app', icon: 'cloud', title: 'Render', sub: '클라우드' })
  bp.element('backend', {
    at: [3, 1],
    role: 'app',
    icon: 'server',
    title: 'Node.js · FastAPI',
    labelSide: 'back',
  })
  bp.element('model', {
    at: [4, 1],
    role: 'app',
    icon: 'cogs',
    title: 'PyTorch 모델',
    sub: 'YOLO 11 (Ultralytics)\nResNet',
    labelSide: 'right',
  })

  // 앞줄: 백엔드와 AI 가 기대는 것
  bp.element('mysql', { at: [3, 2], role: 'data', icon: 'database', title: 'MySQL' })
  bp.element('gemini', { at: [4, 2], role: 'external', icon: 'comments', title: 'Gemini API' })

  bp.edge('user', 'flutter', { label: '요청 / 응답', both: true })
  bp.edge('flutter', 'render', { both: true })
  bp.edge('github', 'render', { label: '배포' })
  bp.edge('render', 'backend', { both: true })
  bp.edge('backend', 'mysql', { label: 'DB 연결', both: true })
  bp.edge('pi', 'backend', { dashed: true })
  bp.edge('backend', 'model', { both: true })
  bp.edge('model', 'gemini', { dashed: true })
  bp.edge('aihub', 'model', { label: '학습 데이터' })

  bp.area('backend', { title: '백엔드', members: ['backend', 'mysql'] })
  bp.area('ai', { title: 'AI', members: ['model', 'gemini'] })

  return bp.build()
}
