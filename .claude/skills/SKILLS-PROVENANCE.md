# 설치된 스킬 출처 및 선정 근거

이 디렉터리의 스킬은 외부 오픈소스 스킬 컬렉션에서 **선별 설치(vendoring)** 한 것입니다.
모두 MIT 라이선스이며, 실행 훅(hook)이 없는 순수 문서형 스킬입니다.

## 1. MengTo/Skills — MIT, ⭐6.1k
출처: https://github.com/MengTo/Skills (Meng To / Design+Code 창업자)
선정 근거: 디자이너 출신이 만든 스킬로, "AI가 만든 티 나는 디자인"을 방지하는
품질 게이트와 Awwwards급 모션 레시피가 실전 코드 단위로 정리되어 있음.

| 스킬 | 용도 |
|---|---|
| `no-ai-design-slop` | 제네릭한 AI 디자인 방지 (상시 품질 게이트) |
| `audit-ai-design-slop` | 완성 후 디자인 감사 |
| `awwwards-quality-sites` | 어워드급 사이트 완성도 기준 |
| `cinematic-gsap-lenis-motion` | GSAP + Lenis 시네마틱 모션 시스템 |
| `threejs-scroll-worlds` | 스크롤 연동 three.js 씬 (데모 자산 제외) |
| `editorial-portfolio-chapters` | 에디토리얼 포트폴리오 챕터 구조 |
| `animation-on-scroll` | 스크롤 진입 애니메이션 패턴 |
| `scroll-scrubbed-word-reveal` | 스크롤 스크럽 텍스트 리빌 |
| `tailwindcss-v4` | Tailwind CSS v4 문법/토큰 |

## 2. freshtechbro/claudedesignskills — MIT, ⭐915
출처: https://github.com/freshtechbro/claudedesignskills
선정 근거: Claude Code 플러그인 마켓플레이스 규격(.claude-plugin/marketplace.json)을
갖춘 27개 플러그인 중, 이 프로젝트 스택에 해당하는 4개만 설치.
각 스킬은 500~1000줄 규모의 API 레퍼런스를 동반함.

| 스킬 | 용도 |
|---|---|
| `threejs-webgl` | three.js 코어 / 머티리얼 / 최적화 체크리스트 |
| `react-three-fiber` | R3F 선언형 씬 구성 + drei |
| `gsap-scrolltrigger` | ScrollTrigger 타임라인/이징 |
| `motion-framer` | Motion(구 Framer Motion) 제스처/레이아웃 애니메이션 |

## 설치하지 않은 것과 그 이유
- `21st.dev Magic MCP` (⭐4.9k): API 키와 외부 호출이 필요하고, 생성 결과가
  shadcn 기반 범용 컴포넌트라 이 포트폴리오의 커스텀 모션 요구와 맞지 않음.
- `claudedesignskills`의 나머지 23개(Babylon.js, PixiJS, A-Frame, Rive, Spline 등):
  이 프로젝트 스택에 불필요. 컨텍스트만 차지함.
- `sickn33/agentic-awesome-skills`(⭐46k), `VoltAgent/awesome-agent-skills`(⭐34k):
  큐레이션 인덱스이지 이 도메인의 실행 지식이 아님.

## 업스트림에서 직접 설치하려면
`.claude/settings.json`에 마켓플레이스가 등록되어 있습니다. 로컬 Claude Code에서:
```
/plugin marketplace add freshtechbro/claudedesignskills
/plugin install core-3d-animation@claude-design-skillstack
```
