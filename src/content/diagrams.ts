/**
 * 경험 안에서 코드로 그리는 구조도의 내용.
 *
 * 이력서와 노션에 적힌 사실만 쓴다. 이미지 파일이 아니라 실제 텍스트라서
 * 검색과 스크린리더가 읽고, 사이트와 같은 색과 글꼴로 그려진다.
 * 개발 용어(프레임워크 이름, 통신 방식)는 넣지 않는다. 기획 쪽 결정만 보인다.
 */

export type Actor = 'user' | 'ops' | 'system'

export type FlowNode = {
  who: Actor
  title: string
  note?: string
  /** 핵심 결정이 들어간 단계. 테두리를 챕터 색으로 칠한다. */
  key?: boolean
}

export const actorLabel: Record<Actor, string> = {
  user: '사용자',
  ops: '운영진',
  system: '시스템',
}

/** D1 — 면접 운영 흐름 (경험 01) */
export const interviewFlow: { caption: string; nodes: FlowNode[]; actors: Record<Actor, string> } = {
  caption: '지원부터 최종 선발까지 메신저 없이 한 시스템 안에서 이어지는 흐름',
  actors: { user: '지원자', ops: '운영진', system: '자동 처리' },
  nodes: [
    { who: 'user', title: '웹으로 지원', note: 'SNS 공지와 손 지원서를 대체' },
    {
      who: 'ops',
      title: '서류 심사',
      note: '평가자 7인이 합·불만 입력하면 과반으로 자동 판정. 서로의 평가는 비공개',
      key: true,
    },
    { who: 'user', title: '면접 일정 직접 선택', note: '메신저로 조율하지 않음' },
    { who: 'ops', title: '대기실 호출과 면접 진행', note: '면접실 3곳, 면접관 9명' },
    {
      who: 'system',
      title: '점수 표준화',
      note: '면접관별 평균과 표준편차로 방 배정에 따른 유불리를 걷어냄',
      key: true,
    },
    { who: 'ops', title: '최종 선발', note: '한 시스템 안에서 끝남' },
  ],
}

/** D2 — 체험 시간 (경험 02). 축은 0–80분, 기준선은 그룹당 60분. */
export const experienceTime = {
  caption: '그룹당 체험 시간. 점선은 기준 60분',
  max: 80,
  guide: { value: 60, label: '기준 60분' },
  bars: [
    { label: '개편 전', value: 75, muted: true },
    { label: '개편 후', value: 55 },
  ],
  ticks: [0, 20, 40, 60, 80],
  unit: '분',
}

/** D3 — PRISM 시스템 구성 (경험 03). 처음 설계와 바꾼 설계. */
export const prismArch = {
  caption: '핵심 결정 "판단은 현장에, 기록은 서버에"의 전후',
  before: {
    label: '처음 설계',
    source: { title: '카메라와 센서 4종', note: '온도, 가스, 미세먼지, 불꽃' },
    hub: { title: '서버', note: '판단과 기록을 모두 맡음' },
    out: { title: '경보와 관제 대시보드' },
    issues: ['경보가 7~10초 늦음', 'Wi-Fi가 끊기면 경보도 멈춤'],
  },
  after: {
    label: '바꾼 설계',
    source: { title: '카메라와 센서 4종', note: '센서는 오탐을 줄이는 보조 지표' },
    hub: { title: '현장 장비가 먼저 판단', note: '이상이면 그 자리에서 바로 경보' },
    local: { title: '현장 경보', edge: '즉시' },
    server: { title: '서버는 기록만', note: '끊긴 동안은 장비에 저장했다가 다시 연결되면 맞춤', edge: '연결될 때' },
    results: ['네트워크가 끊겨도 경보 유지 100%', '이상 징후 탐지 20분에서 5분 이내로'],
  },
}

/** D4 — TAP TO ME 사용 흐름 (경험 03). 윗줄은 사용자, 아랫줄은 뒤에서 도는 기술. */
export const ttmFlow = {
  caption: '윗줄은 사용자가 겪는 흐름, 아랫줄은 그 뒤에서 도는 AI',
  steps: [
    { title: '건강 상태 설정', note: '신체 정보, 질병과 알레르기, 운동량, 수면 시간' },
    { title: '음식 촬영', note: '사진 한 장. 갤러리 사진도 가능', key: true },
    { title: '분석 결과 확인', note: '무엇을 얼마나 먹었나. 틀리면 직접 수정', key: true },
    { title: 'AI 코칭', note: '설정한 건강 상태에 맞춘 피드백' },
  ],
  tech: [null, '음식 탐지', '양 추정 (5구간)', '맞춤 코칭 문장'] as (string | null)[],
  latency: '결과를 기다리는 시간 5초 이상에서 2초 이내로',
}
