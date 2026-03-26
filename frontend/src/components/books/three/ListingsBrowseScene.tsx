'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import type * as THREE from 'three'
import { Color, MathUtils } from 'three'

import type { ListingResponse } from '../../../utils/api'
import ListingMesh from './ListingMesh'

export type ListingsBrowseSceneProps = {
  listings: ListingResponse[]
  activeListingId: string | null
  onHoverChange: (listingId: string | null) => void
  onSelectListing: (listingId: string) => void
}

function SceneContent({ listings, activeListingId, onHoverChange, onSelectListing }: ListingsBrowseSceneProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const parallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = 1 - Math.pow(0.001, delta)
    parallaxRef.current.x = MathUtils.lerp(parallaxRef.current.x, state.pointer.x, t)
    parallaxRef.current.y = MathUtils.lerp(parallaxRef.current.y, state.pointer.y, t)

    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, parallaxRef.current.x * 0.12, t)
    groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, parallaxRef.current.y * -0.06, t)
  })

  const positions = useMemo(() => {
    const count = listings.length
    const radius = 3.6
    const spread = Math.PI / Math.max(3, count - 1)
    const yBase = 0.15
    return listings.map((_, i) => {
      const center = (count - 1) / 2
      const angle = (i - center) * spread
      const x = Math.sin(angle) * radius
      const z = -Math.cos(angle) * radius
      const y = yBase + Math.abs(i - center) * -0.02
      return [x, y, z] as [number, number, number]
    })
  }, [listings])

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.32} />
      <directionalLight position={[5, 10, 6]} intensity={1.2} castShadow />
      <pointLight position={[-4, -2, -6]} intensity={0.7} />

      {listings.map((listing, i) => (
        <ListingMesh
          key={listing.listingId}
          listing={listing}
          position={positions[i]}
          hovered={activeListingId === listing.listingId}
          parallaxRef={parallaxRef}
          onHoverChange={onHoverChange}
          onSelect={onSelectListing}
        />
      ))}
    </group>
  )
}

export default function ListingsBrowseScene(props: ListingsBrowseSceneProps) {
  const bg = useMemo(() => new Color('#070A12'), [])

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.3, 8], fov: 42 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.setClearColor(bg, 1)
      }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  )
}

