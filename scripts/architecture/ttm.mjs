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
 *
 * 배치: README 의 가로 흐름을 x 축(화면 오른쪽 아래)으로, 위 칸을 -y(화면 오른쪽 위),
 * 아래 칸을 +y(화면 왼쪽 아래)로 옮겼다. 사용자는 Flutter 앞(+y)에 둬 화면 맨 왼쪽에 온다.
 * README 의 분류 이름(협업 도구 · 하드웨어 · 데이터 · 클라우드)은 표지판으로 세웠다.
 */
import { createBlueprint } from './lib.mjs'

export default function ttm({ name }) {
  const bp = createBlueprint({ key: 'ttm', name })
  const [X1, X2, X3, X4] = [0, 5.8, 12.4, 20.4]
  const [BACK, MID, FRONT] = [-5.3, 0, 5.6]
  const HUB = -7.4 // AI Hub 은 한 줄 더 뒤에: 학습 데이터 이름표가 AI 영역 밖 틈에 들어가게
  const USER = 7.6 // 사용자도 앞으로: 요청 / 응답 이름표가 앱 영역 밖 틈에 들어가게

  // 뒷줄: 흐름에 끼어드는 도구와 장비. 표지판은 그 뒤에.
  bp.element('github', { at: [X2, BACK], logo: 'github', title: 'GitHub' })
  bp.tag('github', { at: [X2 - 1.55, BACK - 2.0], text: '협업 도구' })
  bp.element('pi', { at: [X3, BACK], logo: 'raspberrypi', title: 'Raspberry Pi' })
  bp.tag('pi', { at: [X3 - 1.8, BACK - 2.0], text: '하드웨어' })
  bp.element('aihub', { at: [X4, HUB], icon: 'cubes', iconColor: '#1f6feb', title: 'AI Hub' })
  bp.tag('aihub', { at: [X4 - 1.55, HUB - 2.0], text: '데이터' })

  // 가운데 줄: 요청이 흐르는 길
  bp.element('flutter', { at: [X1, MID], logo: 'flutter', title: 'Flutter' })
  bp.element('render', { at: [X2, MID], logo: 'render', title: 'Render' })
  // Render 앞(+y) 초록 띠 바깥에. 뒤쪽은 GitHub 에서 오는 선이 지난다.
  bp.tag('render', { at: [X2 - 1.55, MID + 2.45], text: '클라우드' })
  bp.element('backend', { at: [X3, MID], logo: ['nodedotjs', 'fastapi'], title: 'Node.js · FastAPI' })
  bp.element('model', {
    at: [X4, MID],
    logo: ['pytorch', 'ultralytics'],
    title: 'PyTorch 모델',
    sub: 'YOLO 11 (Ultralytics)\nResNet',
    subSide: 'right',
    // 뒤로 길게 뻗으면 AI 영역이 AI Hub 쪽으로 커진다. 앞쪽으로 내린다.
    subShift: [0, 1.4],
  })

  // 앞줄
  bp.element('user', { at: [X1, USER], icon: 'user', title: '사용자' })
  bp.element('mysql', { at: [X3, FRONT], logo: 'mysql', title: 'MySQL' })
  bp.element('gemini', { at: [X4, FRONT], logo: 'googlegemini', title: 'Gemini API' })

  bp.edge('user', 'flutter', { label: '요청 / 응답', both: true })
  bp.edge('flutter', 'render', { both: true })
  bp.edge('github', 'render', { label: '배포' })
  bp.edge('render', 'backend', { both: true })
  bp.edge('backend', 'mysql', { label: 'DB 연결', both: true })
  bp.edge('pi', 'backend', { dashed: true })
  bp.edge('backend', 'model', { both: true })
  bp.edge('model', 'gemini', { dashed: true })
  bp.edge('aihub', 'model', { label: '학습 데이터' })

  bp.area('app', { kind: 'client', title: '앱 · 프론트엔드', members: ['flutter'], titleEdge: 'back' })
  bp.area('backend', { kind: 'host', title: '백엔드', members: ['backend', 'mysql'], titleEdge: 'front' })
  bp.area('ai', { kind: 'host', title: 'AI', members: ['model', 'gemini'], titleEdge: 'front' })

  return bp.build()
}
