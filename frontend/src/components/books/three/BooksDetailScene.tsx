'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import { Suspense, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import { Color, MathUtils } from 'three'

import type { BookResponse } from '../../../utils/api'
import BookMesh from './BookMesh'

export type BooksDetailSceneProps = {
  book: BookResponse
  scrollProgress: MotionValue<number>
}

function DetailContent({ book, scrollProgress }: BooksDetailSceneProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const parallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const { camera } = useThree()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = scrollProgress.get()

    const targetX = state.pointer.x
    const targetY = state.pointer.y

    const s = 1 - Math.pow(0.001, delta)
    parallaxRef.current.x = MathUtils.lerp(parallaxRef.current.x, targetX, s)
    parallaxRef.current.y = MathUtils.lerp(parallaxRef.current.y, targetY, s)

    // Scroll-driven rotation (smooth, not linear-janky).
    const rotY = (t - 0.5) * 0.65
    const rotX = (t - 0.5) * -0.12 + parallaxRef.current.y * -0.08

    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, rotY + parallaxRef.current.x * 0.08, s)
    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, rotX, s)

    // Move camera slightly for depth.
    camera.position.x = MathUtils.lerp(camera.position.x, parallaxRef.current.x * 0.25, s)
    camera.position.y = MathUtils.lerp(camera.position.y, 1.75 + parallaxRef.current.y * 0.08, s)
    camera.position.z = MathUtils.lerp(camera.position.z, 5.2 + (1 - t) * 0.6, s)
    camera.lookAt(0, 0.9, 0)
  })

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 10, 8]} intensity={1.25} />
      <pointLight position={[-4, -2, -5]} intensity={0.75} />

      <group scale={[1.6, 1.6, 1.6]}>
        <BookMesh
          book={book}
          position={[0, 0, 0]}
          hovered={false}
          parallaxRef={parallaxRef}
          onHoverChange={() => {}}
          onSelect={() => {}}
        />
      </group>
    </group>
  )
}

export default function BooksDetailScene({ book, scrollProgress }: BooksDetailSceneProps) {
  const bg = useMemo(() => new Color('#070A12'), [])

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.8, 6.2], fov: 38 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.setClearColor(bg, 1)
      }}
    >
      <Suspense fallback={null}>
        <DetailContent book={book} scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  )
}

