import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useReducedMotion } from '../hooks/useMotionPreference'

/**
 * 커서를 따라 살짝 끌려오는 링크.
 *
 * 스크롤 연출은 GSAP + ScrollTrigger가 전담하고, 포인터 단위의 미세한 반응은
 * Motion이 맡는다. 스프링 물리를 직접 적분할 필요가 없어서 이 층은 Motion이 짧다.
 * 두 엔진이 같은 대상을 건드리지 않도록 역할을 갈라 둔 것이다.
 *
 * 끌림 폭은 의도적으로 작다(최대 ±10px). 크게 움직이면 클릭을 방해한다.
 */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const config = { stiffness: 260, damping: 22, mass: 0.6 }
  const springX = useSpring(x, config)
  const springY = useSpring(y, config)

  // 끌림 한계를 두어 버튼이 커서를 쫓아 달아나지 않게 한다.
  const clampedX = useTransform(springX, (v) => Math.max(-10, Math.min(10, v)))
  const clampedY = useTransform(springY, (v) => Math.max(-10, Math.min(10, v)))

  if (reduced) {
    return <span className={className}>{children}</span>
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x: clampedX, y: clampedY, display: 'inline-block' }}
      onPointerMove={(event) => {
        // 터치 입력에는 적용하지 않는다. 호버 개념이 없다.
        if (event.pointerType !== 'mouse') return
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
        y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}
