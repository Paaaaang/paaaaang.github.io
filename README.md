# 오평일 · 서비스 기획자 포트폴리오

이력서(2026-09-20 최종본)를 바탕으로 만든 개인 포트폴리오 사이트입니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입체크 + 프로덕션 빌드
npm run preview    # 빌드 결과 확인
```

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 빌드 | Vite 8 + React 19 + TypeScript | 정적 빌드로 GitHub Pages에 그대로 올라감 |
| 스타일 | Tailwind CSS v4 | `@theme` 토큰으로 색·타이포를 한 곳에서 관리 |
| 3D | three.js 0.186 + React Three Fiber 9 | 배경 파티클 한 장. 지연 로딩되어 첫 화면을 막지 않음 |
| 스크롤 모션 | GSAP 3.15 + ScrollTrigger | 스크롤 연출 전담. Webflow 인수 후 전 플러그인 무료 |
| 스무스 스크롤 | Lenis 1.3 | GSAP ticker에 물려 한 루프에서 돌림 |
| 포인터 모션 | Motion 13 | 스프링 물리 기반 마이크로 인터랙션만 담당 |

애니메이션 엔진을 둘 쓰는 이유는 역할이 다르기 때문입니다.
스크롤 연출은 GSAP이, 포인터 단위 반응은 Motion이 맡고 같은 대상을 건드리지 않습니다.

## 구조

```
src/
  content/profile.ts     ← 모든 텍스트와 수치의 단일 진실 소스
  sections/              히어로 · 강점 · 증거 · 케이스 3종 · 방법 · 역량 · 연락
  scene/                 배경 3D 파티클 (흩어짐 → 격자 정렬)
  components/            모션 유틸, 자료 프레임, 목차
  hooks/                 스무스 스크롤, 모션 축소 감지, 성능 등급
public/media/            자료 이미지 넣는 곳 (폴더별 README 참고)
docs/                    개선 계획서와 아트디렉션 기록
.claude/skills/          이 프로젝트용으로 선별 설치한 스킬 13종
```

## 내가 채워야 할 것

| 무엇 | 어디에 | 안내 |
|---|---|---|
| 이력서 사진 | `public/media/profile/` | [README](public/media/profile/README.md) |
| 프로젝트 자료 (아키텍처·화면설계·PPT·현장사진) | `public/media/<케이스 id>/` | [README](public/media/README.md) |

사진과 자료가 없어도 사이트는 정상 동작합니다.
빈 자리에는 "여기에 무엇이 들어갈 자리인지"가 적힌 프레임이 그려지고,
파일을 넣어도 크기가 같아서 레이아웃이 움직이지 않습니다.

## 시스템 아키텍처 (Cloudcraft)

세 경험(전대주주 · TAP TO ME · PRISM)의 아키텍처 그림은 Cloudcraft 블루프린트를 **코드로** 만듭니다.
그림의 원본은 각 저장소 README 의 시스템 아키텍처 그림이고(전대주주는 README 에 그림이 없어 저장소 코드 기준),
`scripts/architecture/*.mjs` 에 블록 · 선 · 이름표로 옮겨 두었습니다.

모양은 등각(isometric) · 어두운 바탕입니다. 요소마다 흰 블록 윗면에 로고, 앞면에 이름을 세우고 초록 테두리로 두릅니다.
호스트(Vercel · Supabase …)는 주황, 앱 · 클라이언트는 노랑 테두리 영역, 그 안의 묶음은 하늘색이고, 선은 직각으로 꺾입니다.
배치를 잡는 도구와 Cloudcraft 렌더 실측값(블록은 절반 크기로 그려짐, 글자 · 아이콘 위치 등)은 `scripts/architecture/lib.mjs` 에 있습니다.

**키 넣기** — Cloudcraft 앱의 Manage API keys › Create API Key 에서 쓰기 권한이 있는 키를 만든 뒤

- 배포에서 자동으로: 저장소 Settings › Secrets and variables › Actions 에 `CLOUDCRAFT_API_KEY` 를 추가합니다.
  `main` 에 푸시할 때마다 빌드 전에 블루프린트를 고치고 그림을 새로 받습니다.
- 내 컴퓨터에서: `CLOUDCRAFT_API_KEY=... npm run architecture` 한 번이면 됩니다. 받은 파일을 커밋해 두면 API 가 실패해도 그 그림을 씁니다.
- 프록시가 키를 붙여 주는 환경(Claude Code 클라우드의 API credentials 등): `NODE_USE_ENV_PROXY=1 CLOUDCRAFT_VIA_PROXY=1 npm run architecture`.
  Node 의 `fetch` 는 `NODE_USE_ENV_PROXY=1` 이 없으면 `HTTPS_PROXY` 를 쓰지 않아 요청이 나가지 않습니다(빠뜨리면 스크립트가 한 줄로 알려 줍니다).

**무엇이 생기나**

| 무엇 | 어디에 |
|---|---|
| Cloudcraft 블루프린트 "포트폴리오 · …" 3개 | 내 Cloudcraft 계정. 이름이 같으면 고치고(PUT) 없으면 만듭니다(POST). 여러 번 돌려도 늘어나지 않습니다 |
| 그림 `<key>.svg` 와 원본 크기 `<key>.size.json` | `src/assets/architecture/` |
| 사이트 | 파일이 있는 경험의 자료 맨 앞(PRISM 은 PRISM 사진 앞)에 `아키텍처` 프레임으로 들어갑니다. 없으면 아무것도 그리지 않습니다 |

- 키 없이 검사만: `npm run architecture -- --dry-run` — id 중복, 없는 블록 · connector 를 가리키는 선, 색 형식을 확인하고
  보낼 JSON 과 근사 등각 미리보기 SVG 를 `scripts/architecture/out/` 에 씁니다(커밋하지 않음).
- Cloudcraft 화면에서 손본 그림을 지키려면 `scripts/architecture.config.json` 에서 그 항목의 `update` 를 `false` 로 둡니다. 코드가 원본이라 그대로 두면 다음 배포에서 덮어씁니다.
- API 가 data 를 거절하면 이유가 로그에 찍히고, 거절된 JSON 이 `scripts/architecture/out/<key>.rejected.json` 에 남습니다. 실패해도 배포는 계속됩니다.
- 로고: Cloudcraft API 로는 이미지를 올릴 수 없어서, 내려받은 SVG 의 블록 윗면에 스크립트가 직접 그려 넣습니다
  (`scripts/architecture/finish-svg.mjs`). 로고 모양은 simple-icons(CC0)에서 쓰는 것만 `scripts/architecture/logos.mjs` 로 옮겼고,
  로고가 없는 요소는 Font Awesome 4.7 아이콘을 씁니다. 같은 손질에서 영문이 명조로 바뀌지 않게 산세리프 대체 글꼴도 붙입니다.
  Cloudcraft 가 준 그대로의 SVG 는 `scripts/architecture/out/<key>.raw.svg` 에 남습니다(커밋하지 않음).
- SVG 에서 한글이 네모로 보이면 설정의 `format` 을 `png` 로 바꿔 다시 받습니다(로고 합성은 SVG 에만 됩니다).

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 빌드해 GitHub Pages로 올립니다.

레포 이름이 `Paaaaang.github.io` 이면 `https://paaaaang.github.io/` 루트로 배포됩니다.
다른 이름이라면 `.github/workflows/deploy.yml` 의 `VITE_BASE` 를 `/레포이름/` 으로 바꿔야 합니다.

## PDF 내보내기

헤더의 PDF 버튼이 받는 `pioh-portfolio.pdf` 는 따로 만든 문서가 아니라 이 사이트를 그대로 인쇄한 것입니다.
내용은 늘 `profile.ts` 와 같고, 사이트에 없는 휴대폰 번호와 주소는 PDF에도 없습니다.

```bash
npm run build
npm run pdf                              # public/pioh-portfolio.pdf 갱신
npm run pdf -- --out dist/pioh-portfolio.pdf
```

`scripts/export-pdf.mjs` 가 빌드 결과를 Vite preview 로 띄우고 Chrome을 모션 축소 설정으로 엽니다.
3D·핀·리빌이 꺼진 정적 문서 상태에서 경험을 모두 펼치고, 이미지와 Pretendard를 다 받은 뒤 A4로 찍습니다.
인쇄 규칙은 `src/styles/index.css` 맨 아래 `@media print` 에 있습니다.
화면에만 필요한 요소에는 `data-print="hide"` 를 달면 PDF에서 빠집니다.

- Pretendard가 안 뜨면 PDF를 만들지 않고 실패합니다. 대체 글꼴로 찍힌 PDF는 쓰지 않습니다
- 배포할 때마다 Actions가 `dist/` 에 새로 찍습니다. 실패하면 커밋된 `public/` 사본이 대신 올라갑니다
- 내용을 바꿨다면 `npm run pdf` 로 `public/` 사본도 갱신해 커밋해 두는 게 안전합니다
- Chrome 경로는 `CHROME_PATH`, jsDelivr를 못 쓰는 환경에서는 `PRETENDARD_DIR`(pretendard 패키지의 `dist/web/variable/`)로 지정합니다

## 스크롤 인터랙션

| 구간 | 동작 |
|---|---|
| 히어로 | 사진 마스크 리빌 → 이름 → 문장 → 칩 → CTA 순서로 등장. 스크롤하면 뒤로 물러남 |
| 배경 3D | 흩어진 점이 격자로 정렬. 문서 7%에서 완료되고 13%까지 옅어짐 |
| 증거 문장 | 스크롤에 맞춰 어절 단위로 또렷해짐 (scrub) |
| 케이스 제목 | 줄 단위 마스크 리빌. 어절 경계에서만 줄바꿈 |
| 자료 프레임 | 클립 리빌 + 본문보다 느린 패럴랙스 |
| **일하는 순서** | **화면 고정 후 5단계를 가로로 통과. 이 사이트의 유일한 핀 구간** |
| **수상 6회** | **화면 고정 후 가로로 흐르는 띠** |
| 지표 숫자 | 뷰포트 진입 시 카운트업 |
| 포인터 | 커스텀 커서 + 링크 자석 효과 (마우스 전용) |

핀 구간은 두 곳뿐입니다. 순서가 있는 내용에만 걸었습니다.
좁은 화면과 `prefers-reduced-motion` 에서는 핀을 걸지 않고 평범하게 쌓입니다.

## 검색·봇 차단

`robots.txt` 로 검색엔진과 AI 학습 크롤러(GPTBot·ClaudeBot·CCBot 등)를 차단하고,
`noindex` 메타 태그를 함께 걸었습니다. 이메일은 런타임에 조합합니다.

**다만 GitHub Pages 에서는 진짜 차단이 불가능합니다.**
robots.txt 를 무시하는 스크래퍼는 막히지 않고, 레포도 공개 상태여야 합니다.
전제와 한계, 그리고 Cloudflare Access 전환 절차는 [docs/봇-차단.md](docs/봇-차단.md) 에 정리했습니다.

## 접근성 · 성능

- 모든 본문 텍스트가 배경 대비 4.5:1 이상 (WCAG 2.2 AA). 측정 근거는 [아트디렉션 문서](docs/아트디렉션-사진-배경-컬러.md)
- `prefers-reduced-motion` 에서 3D·스무스 스크롤·리빌이 모두 꺼지고 정적 문서로 동작
- WebGL을 못 쓰는 환경에서는 3D 없이 렌더
- 기기 성능에 따라 파티클 수와 픽셀 비율을 조절 (1400 / 3200 / 6000)
- 휴대폰 번호와 상세 주소는 공개하지 않음. 이메일은 런타임에 조합해 스크래퍼를 막음
