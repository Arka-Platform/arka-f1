'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import type * as THREE from 'three'
import { MathUtils } from 'three'
import { useMotionValue, useSpring } from 'framer-motion'

import type { ListingResponse } from '../../../utils/api'

export type ListingMeshProps = {
  listing: ListingResponse
  position: [number, number, number]
  hovered: boolean
  parallaxRef: MutableRefObject<{ x: number; y: number }>
  onHoverChange: (listingId: string | null) => void
  onSelect: (listingId: string) => void
}

function seededSpineColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000
  const hue = hash % 360
  return `hsl(${hue} 35% 32%)`
}

function TexturedFrontMaterial({ textureUrl, hovered }: { textureUrl: string; hovered: boolean }) {
  const texture = useTexture(textureUrl)
  texture.anisotropy = 8

  return (
    <meshStandardMaterial
      attach="material-4"
      map={texture}
      roughness={0.6}
      metalness={0.02}
      emissive={hovered ? '#111827' : '#000000'}
      emissiveIntensity={hovered ? 0.35 : 0}
    />
  )
}

export default function ListingMesh({
  listing,
  position,
  hovered,
  parallaxRef,
  onHoverChange,
  onSelect,
}: ListingMeshProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)

  const spineColor = useMemo(() => seededSpineColor(listing.listingId), [listing.listingId])
  const coverUrl = listing.coverUrl

  const hoverScale = useMotionValue(1)
  const hoverScaleSpring = useSpring(hoverScale, { stiffness: 190, damping: 18, mass: 0.5 })

  const hoverRotY = useMotionValue(0)
  const hoverRotYSpring = useSpring(hoverRotY, { stiffness: 190, damping: 18, mass: 0.5 })

  useEffect(() => {
    hoverScale.set(hovered ? 1.12 : 1)
    hoverRotY.set(hovered ? 0.22 : 0.08)
  }, [hoverRotY, hoverScale, hovered])

  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return
    const parallax = parallaxRef.current
    const t = 1 - Math.pow(0.001, delta)

    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, parallax.y * -0.16, t)
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, parallax.x * 0.18, t)

    meshRef.current.scale.setScalar(hoverScaleSpring.get())
    meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, hoverRotYSpring.get(), t)
    meshRef.current.position.y = MathUtils.lerp(meshRef.current.position.y, hovered ? 0.12 : 0, t)
  })

  // Box face order: +X, -X, +Y, -Y, +Z, -Z. Treat +Z as the front cover.
  const sideMaterialProps = useMemo(
    () => ({ color: spineColor, roughness: 0.85, metalness: 0.02 } as const),
    [spineColor]
  )

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverChange(listing.listingId)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHoverChange(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(listing.listingId)
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1.45, 0.22]} />
        {/* +X */}
        <meshStandardMaterial attach="material-0" {...sideMaterialProps} />
        {/* -X */}
        <meshStandardMaterial attach="material-1" {...sideMaterialProps} />
        {/* +Y */}
        <meshStandardMaterial attach="material-2" {...sideMaterialProps} />
        {/* -Y */}
        <meshStandardMaterial attach="material-3" {...sideMaterialProps} />

        {/* +Z front cover */}
        {coverUrl ? (
          <Suspense
            fallback={
              <meshStandardMaterial
                attach="material-4"
                color="#111827"
                roughness={0.75}
                metalness={0.02}
                emissive={hovered ? '#111827' : '#000000'}
                emissiveIntensity={hovered ? 0.3 : 0}
              />
            }
          >
            <TexturedFrontMaterial textureUrl={coverUrl} hovered={hovered} />
          </Suspense>
        ) : (
          <meshStandardMaterial attach="material-4" color="#111827" roughness={0.75} metalness={0.02} />
        )}

        {/* -Z back */}
        <meshStandardMaterial attach="material-5" color="#0b1220" roughness={0.9} metalness={0.02} />
      </mesh>
    </group>
  )
}

