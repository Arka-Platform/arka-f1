'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import type * as THREE from 'three'
import { Color, MathUtils } from 'three'

import type { BookResponse } from '../../../utils/api'
import BookMesh from './BookMesh'

export type BooksBrowseSceneProps = {
  books: BookResponse[]
  activeBookId: string | null
  onHoverChange: (bookId: string | null) => void
  onSelectBook: (bookId: string) => void
}

function SceneContent({
  books,
  activeBookId,
  onHoverChange,
  onSelectBook,
}: {
  books: BookResponse[]
  activeBookId: string | null
  onHoverChange: (bookId: string | null) => void
  onSelectBook: (bookId: string) => void
}) {
  const groupRef = useRef<THREE.Group | null>(null)
  const parallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useFrame((state, delta) => {
    if (!groupRef.current) return
    // state.pointer is normalized [-1,1] for the canvas.
    const targetX = state.pointer.x
    const targetY = state.pointer.y

    const t = 1 - Math.pow(0.001, delta)
    parallaxRef.current.x = MathUtils.lerp(parallaxRef.current.x, targetX, t)
    parallaxRef.current.y = MathUtils.lerp(parallaxRef.current.y, targetY, t)

    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, parallaxRef.current.y * -0.08, t)
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, parallaxRef.current.x * 0.12, t)
  })

  const positions = useMemo(() => {
    // Place books in a curved arc (3D space) instead of a flat grid.
    const count = books.length
    const radius = 3.4
    const spread = Math.PI / Math.max(3, count - 1)
    const yBase = 0.15
    return books.map((_, i) => {
      const center = (count - 1) / 2
      const angle = (i - center) * spread
      const x = Math.sin(angle) * radius
      const z = -Math.cos(angle) * radius
      const y = yBase + Math.abs(i - center) * -0.02
      return [x, y, z] as [number, number, number]
    })
  }, [books])

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} />
      <pointLight position={[-4, -2, -5]} intensity={0.65} />

      {books.map((book, i) => (
        <BookMesh
          key={book.id}
          book={book}
          position={positions[i]}
          hovered={activeBookId === book.id}
          parallaxRef={parallaxRef as MutableRefObject<{ x: number; y: number }>}
          onHoverChange={onHoverChange}
          onSelect={onSelectBook}
        />
      ))}
    </group>
  )
}

export default function BooksBrowseScene({ books, activeBookId, onHoverChange, onSelectBook }: BooksBrowseSceneProps) {
  // Background color for the canvas.
  const bg = useMemo(() => new Color('#070A12'), [])

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.35, 8], fov: 42 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.setClearColor(bg, 1)
      }}
    >
      <Suspense fallback={null}>
        <SceneContent books={books} activeBookId={activeBookId} onHoverChange={onHoverChange} onSelectBook={onSelectBook} />
      </Suspense>
    </Canvas>
  )
}

