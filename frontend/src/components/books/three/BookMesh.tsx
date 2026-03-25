'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import type * as THREE from 'three'
import { MathUtils } from 'three'
import { useMotionValue, useSpring } from 'framer-motion'
import type { MutableRefObject } from 'react'

import type { BookResponse } from '../../../utils/api'

export type BookMeshProps = {
  book: BookResponse
  position: [number, number, number]
  hovered: boolean
  parallaxRef: MutableRefObject<{ x: number; y: number }>
  onHoverChange: (bookId: string | null) => void
  onSelect: (bookId: string) => void
}

function seededColor(seed: string): string {
  // Deterministic but varied pastel-ish palette.
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000
  const hue = hash % 360
  return `hsl(${hue} 70% 55%)`
}

function BookCoverMaterial({ textureUrl, hovered, baseColor }: { textureUrl: string; hovered: boolean; baseColor: string }) {
  const texture = useTexture(textureUrl)

  return (
    <meshStandardMaterial
      map={texture}
      color={baseColor}
      roughness={0.55}
      metalness={0.04}
      emissive={hovered ? '#1f2937' : '#000000'}
      emissiveIntensity={hovered ? 0.42 : 0}
    />
  )
}

export default function BookMesh({ book, position, hovered, parallaxRef, onHoverChange, onSelect }: BookMeshProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)

  const baseColor = useMemo(() => seededColor(book.id), [book.id])
  const coverTextureUrl = book.imageUrl ?? book.thumbnailUrl ?? null

  const hoverScale = useMotionValue(1)
  const hoverScaleSpring = useSpring(hoverScale, { stiffness: 180, damping: 18, mass: 0.4 })

  const hoverRotY = useMotionValue(0)
  const hoverRotYSpring = useSpring(hoverRotY, { stiffness: 180, damping: 18, mass: 0.4 })

  useEffect(() => {
    hoverScale.set(hovered ? 1.14 : 1)
    hoverRotY.set(hovered ? 0.18 : 0)
  }, [hovered, hoverRotYSpring, hoverScale])

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return
    const parallax = parallaxRef.current

    const t = 1 - Math.pow(0.001, delta) // frame-rate independent smoothing

    // Parallax movement from pointer position.
    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, parallax.y * -0.18, t)
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, parallax.x * 0.22, t)

    meshRef.current.scale.setScalar(hoverScaleSpring.get())

    // Hover rotation (slightly toward camera).
    meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, hoverRotYSpring.get(), t)

    // Subtle lift on hover.
    meshRef.current.position.y = MathUtils.lerp(meshRef.current.position.y, hovered ? 0.15 : 0, t)
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverChange(book.id)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHoverChange(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(book.id)
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1.4, 0.18]} />
        {coverTextureUrl ? (
          <BookCoverMaterial textureUrl={coverTextureUrl} hovered={hovered} baseColor={baseColor} />
        ) : (
          <meshStandardMaterial
            color={baseColor}
            roughness={0.58}
            metalness={0.06}
            emissive={hovered ? '#1f2937' : '#000000'}
            emissiveIntensity={hovered ? 0.45 : 0}
          />
        )}
      </mesh>
    </group>
  )
}

