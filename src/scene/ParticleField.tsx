import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { PerfTier } from '../hooks/useMotionPreference'

/**
 * 흩어진 점들이 격자로 정렬되는 파티클 필드.
 *
 * 이 씬은 장식이 아니라 이 포트폴리오의 주제를 그대로 나타낸다.
 * 스크롤 진행도(uProgress)가 0이면 점들은 무작위로 흩어져 있고,
 * 1에 가까워질수록 각자의 격자 자리로 이동한다.
 * "한 사람에게 묶여 있던 운영을 여럿이 쓸 수 있는 구조로 바꾼다"는 문장의 시각화다.
 *
 * 정렬은 입자마다 시차를 두고 일어난다. 전부 동시에 딱 맞춰지면
 * 기계적으로 보이고, 실제로 구조가 잡히는 과정과도 다르다.
 */

const COUNT_BY_TIER: Record<PerfTier, number> = {
  low: 1400,
  mid: 3200,
  high: 6000,
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uSize;
  uniform vec2  uPointer;

  attribute vec3  aChaos;
  attribute vec3  aGrid;
  attribute float aSeed;

  varying float vAlign;
  varying float vSeed;

  void main() {
    // 입자마다 정렬 시점을 어긋나게 한다. 0.0~0.45 만큼 늦게 출발한다.
    float delay  = aSeed * 0.45;
    float local  = clamp((uProgress - delay) / (1.0 - delay), 0.0, 1.0);
    // easeInOutCubic
    float eased  = local < 0.5
      ? 4.0 * local * local * local
      : 1.0 - pow(-2.0 * local + 2.0, 3.0) / 2.0;

    vec3 pos = mix(aChaos, aGrid, eased);

    // 흩어져 있을 때만 떠다닌다. 정렬될수록 흔들림이 잦아든다.
    float drift = (1.0 - eased) * 0.35;
    pos.x += sin(uTime * 0.32 + aSeed * 12.0) * drift;
    pos.y += cos(uTime * 0.27 + aSeed * 9.0)  * drift;
    pos.z += sin(uTime * 0.21 + aSeed * 7.0)  * drift * 0.6;

    // 포인터 시차. 깊이가 먼 입자가 덜 움직여서 공간감이 생긴다.
    float depth = (pos.z + 6.0) / 12.0;
    pos.x += uPointer.x * depth * 0.9;
    pos.y += uPointer.y * depth * 0.9;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // 원근에 따른 크기. 카메라가 z=9 에 있으므로 9.0/-mv.z 가 기준 배율 1.0 이다.
    // 여기서 더 키우면 점이 아니라 얼룩으로 보인다.
    gl_PointSize = uSize * (0.8 + eased * 0.4) * (9.0 / -mv.z);

    vAlign = eased;
    vSeed  = aSeed;
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3  uColorIdle;
  uniform vec3  uColorAligned;
  uniform float uOpacity;

  varying float vAlign;
  varying float vSeed;

  void main() {
    // 사각 픽셀을 부드러운 원으로. 하드 엣지는 점이 아니라 노이즈로 보인다.
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    float mask = smoothstep(0.5, 0.26, d);
    if (mask < 0.01) discard;

    // 정렬돼도 강조색으로 완전히 가지 않는다. 전부 강조색이 되면
    // 본문 위에서 붉은 노이즈처럼 읽혀 글을 방해한다.
    vec3 color = mix(uColorIdle, uColorAligned, vAlign * 0.62);

    // 일부 입자만 밝게 남겨 균일한 안개처럼 보이지 않게 한다.
    float pop = step(0.93, vSeed) * 0.35;
    float alpha = mask * uOpacity * (0.34 + vAlign * 0.28 + pop);

    gl_FragColor = vec4(color, alpha);
  }
`

type Props = {
  /** 0 = 흩어짐, 1 = 완전 정렬. 스크롤이 이 값을 밀어올린다. */
  progressRef: React.MutableRefObject<number>
  /** 배경의 존재감. 정렬이 끝나면 내려가 본문에 자리를 내준다. */
  visibilityRef: React.MutableRefObject<number>
  /** 현재 챕터 색. 정렬된 입자의 색이 된다. */
  accentRef: React.MutableRefObject<THREE.Color>
  tier: PerfTier
  animate: boolean
}

export function ParticleField({
  progressRef,
  visibilityRef,
  accentRef,
  tier,
  animate,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const pointer = useRef(new THREE.Vector2())
  const { viewport } = useThree()

  const count = COUNT_BY_TIER[tier]

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const chaos = new Float32Array(count * 3)
    const grid = new Float32Array(count * 3)
    const seed = new Float32Array(count)

    // 격자는 정사각형이 아니라 가로로 넓은 판이다. 화면 비율과 맞고,
    // "정렬된 표"처럼 읽힌다.
    const cols = Math.ceil(Math.sqrt(count * 1.9))
    const rows = Math.ceil(count / cols)
    const gapX = 11.5 / cols
    const gapY = 6.2 / rows

    for (let i = 0; i < count; i++) {
      // 흩어진 상태: 구 안에 균일하게 뿌린다.
      const r = 4.2 + Math.random() * 3.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62
      chaos[i * 3 + 2] = r * Math.cos(phi) * 0.5

      // 정렬된 상태: 격자 위 한 자리.
      const col = i % cols
      const row = Math.floor(i / cols)
      grid[i * 3] = (col - cols / 2) * gapX
      grid[i * 3 + 1] = (row - rows / 2) * gapY
      // 완전한 평면은 인쇄물처럼 납작하다. 깊이를 아주 조금 남긴다.
      grid[i * 3 + 2] = Math.sin(col * 0.35) * 0.22 + Math.cos(row * 0.4) * 0.22

      seed[i] = Math.random()
    }

    geo.setAttribute('position', new THREE.BufferAttribute(chaos.slice(), 3))
    geo.setAttribute('aChaos', new THREE.BufferAttribute(chaos, 3))
    geo.setAttribute('aGrid', new THREE.BufferAttribute(grid, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)

    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSize: { value: tier === 'low' ? 7.0 : 6.0 },
      uPointer: { value: new THREE.Vector2() },
      uColorIdle: { value: new THREE.Color('#63636f') },
      uColorAligned: { value: new THREE.Color('#e8542f') },
      uOpacity: { value: 0 },
    }),
    [tier],
  )

  // 지오메트리는 메모이즈되어 있으므로 언마운트 시 직접 해제한다.
  useMemo(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) return

    const u = material.uniforms

    // 첫 프레임에 튀어나오지 않도록 페이드 인하고, 이후에는 스크롤이 정한
    // 존재감을 따라간다.
    u.uOpacity!.value = THREE.MathUtils.damp(
      u.uOpacity!.value,
      visibilityRef.current,
      2.2,
      delta,
    )

    if (animate) {
      u.uTime!.value = state.clock.elapsedTime
    }

    // 스크롤 진행도를 그대로 넣지 않고 damp 로 따라가게 해서
    // 스크롤을 튕겼을 때 입자가 덜컥거리지 않게 한다.
    u.uProgress!.value = THREE.MathUtils.damp(
      u.uProgress!.value,
      progressRef.current,
      3.5,
      delta,
    )

    ;(u.uColorAligned!.value as THREE.Color).lerp(accentRef.current, 1 - Math.exp(-2.5 * delta))

    if (animate) {
      // 포인터는 화면 밖 -1..1 로 정규화된 값이다.
      pointer.current.lerp(state.pointer, 1 - Math.exp(-3 * delta))
      ;(u.uPointer!.value as THREE.Vector2).copy(pointer.current)
    }

    // 정렬될수록 판이 정면을 향한다.
    if (pointsRef.current) {
      const aligned = u.uProgress!.value
      pointsRef.current.rotation.y = (1 - aligned) * 0.42 + pointer.current.x * 0.06
      pointsRef.current.rotation.x = (1 - aligned) * -0.18 + pointer.current.y * -0.04
    }
  })

  // 화면이 좁으면 판을 조금 당겨서 격자가 잘리지 않게 한다.
  const scale = Math.min(1, Math.max(0.62, viewport.width / 11))

  return (
    <points ref={pointsRef} geometry={geometry} scale={scale} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}
