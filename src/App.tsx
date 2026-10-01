import { lazy, Suspense, useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// three.js 번들은 본문보다 뒤에 온다. 배경 레이어라서 조금 늦게 떠도 되고,
// 첫 화면의 글이 three.js 파싱을 기다릴 이유가 없다.
const SceneCanvas = lazy(() =>
  import('./scene/SceneCanvas').then((m) => ({ default: m.SceneCanvas })),
)
import { Nav } from './components/Nav'
import { Cursor } from './components/scroll'
import { Hero } from './sections/Hero'
import { About } from './sections/About'
import { SelectedWork } from './sections/SelectedWork'
import { MethodScene } from './sections/MethodScene'
import { Toolkit, Contact } from './sections/Credentials'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useReducedMotion } from './hooks/useMotionPreference'

/**
 * 챕터 순서. 각 챕터가 한 가지 질문에 답한다.
 *
 * 00 Hero          누구인가 · 연락처
 *    StatBand      규모 (팀 프로젝트 · 수상 · 자격증). 히어로 첫 화면 맨 아래에 붙는다
 * 01 About         어떻게 일하는가
 * 02 Experience   무엇을 해 왔나 (연도별 경험 목록)
 * 03 Case         증거는 무엇인가 (경험 넷을 자세히, 한 번에 하나만 펼친다)
 * 04 How I Work   일하는 순서
 * 05 Toolkit      무엇을 다루나
 * 06 Contact      연락
 */
export default function App() {
  const reduced = useReducedMotion()
  useSmoothScroll(!reduced)

  useEffect(() => {
    // 웹폰트가 늦게 들어오면 줄 수가 바뀌어 트리거 위치가 어긋난다.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    // 이미지 지연 로딩이나 자료 추가로 문서 높이가 바뀌면 핀 구간의 시작점이
    // 옛 위치에 남아, 앞 섹션이 아직 화면에 있는데 핀이 걸려 겹쳐 보인다.
    // 높이가 달라질 때마다 (몰아서 한 번) 트리거 위치를 다시 잰다.
    let timer = 0
    let lastHeight = document.documentElement.scrollHeight
    const observer = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight
      if (Math.abs(h - lastHeight) < 2) return
      lastHeight = h
      window.clearTimeout(timer)
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    observer.observe(document.body)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <>
      {/* 배경 3층: 챕터 색 워시 · 비네트 · 필름 그레인.
          3D 파티클(SceneCanvas)은 이 위, 본문 아래에 놓인다. */}
      <div className="backdrop-layers" aria-hidden="true">
        <div className="backdrop-wash" />
        <div className="backdrop-vignette" />
        <div className="backdrop-grain" />
      </div>

      <Suspense fallback={null}>
        <SceneCanvas />
      </Suspense>
      <Nav />
      <Cursor />

      <main>
        <Hero />
        <About />
        <SelectedWork />
        <MethodScene />
        <Toolkit />
      </main>

      <Contact />
    </>
  )
}
