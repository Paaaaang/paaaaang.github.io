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
import { Identity } from './sections/Identity'
import { Proof } from './sections/Proof'
import { CaseStudySection } from './sections/CaseStudySection'
import { MethodScene } from './sections/MethodScene'
import { Limits } from './sections/Method'
import { Credentials, Contact } from './sections/Credentials'
import { caseStudies } from './content/profile'
import { Reveal } from './components/motion'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useReducedMotion } from './hooks/useMotionPreference'

/**
 * 경험 구간의 시작을 알리는 구분선.
 *
 * 앞 섹션이 끝나자마자 01 이 튀어나오면 이게 한 덩어리라는 신호가 없다.
 * 회사 프로젝트가 아니라 직접 겪은 일들이라 '경험'으로 부른다.
 */
function ExperienceLabel() {
  return (
    <div className="px-6 pt-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="rule flex items-baseline justify-between gap-6 pt-8">
            <p className="font-mono text-[0.7rem] tracking-[0.26em] text-paper-faint uppercase">
              경험 · Experience
            </p>
            <p className="font-mono text-[0.7rem] tracking-[0.2em] tnum text-paper-faint">
              03
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

export default function App() {
  const reduced = useReducedMotion()
  useSmoothScroll(!reduced)

  useEffect(() => {
    // 웹폰트가 늦게 들어오면 줄 수가 바뀌어 트리거 위치가 어긋난다.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
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
        <Identity />
        <Proof />
        <ExperienceLabel />
        {caseStudies.map((study) => (
          <CaseStudySection key={study.id} study={study} />
        ))}
        <MethodScene />
        <Limits />
        <Credentials />
      </main>

      <Contact />
    </>
  )
}
