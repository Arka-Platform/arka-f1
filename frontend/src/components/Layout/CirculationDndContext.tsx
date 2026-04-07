'use client'

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

export type CirculationDragPayload = {
  bookId: string
  title: string
  author: string
  price: number
  imageUrl?: string | null
}

type DropHandler = (target: 'wishlist' | 'shelf' | 'cart', payload: CirculationDragPayload) => void | Promise<void>
type PassHandler = () => void | Promise<void>

const CirculationDndCtx = createContext<{
  registerDropHandler: (h: DropHandler | null) => void
  setActivePayload: (p: CirculationDragPayload | null) => void
  getActivePayload: () => CirculationDragPayload | null
  triggerDrop: (target: 'wishlist' | 'shelf' | 'cart') => void
  registerPassHandler: (h: PassHandler | null) => void
  triggerPass: () => void
} | null>(null)

export function useCirculationDndRegistration(): (h: DropHandler | null) => void {
  const c = useContext(CirculationDndCtx)
  if (!c) {
    return () => {}
  }
  return c.registerDropHandler
}

export function useCirculationActivePayload(): (p: CirculationDragPayload | null) => void {
  const c = useContext(CirculationDndCtx)
  if (!c) return () => {}
  return c.setActivePayload
}

export function useCirculationQuickActions(): {
  getActivePayload: () => CirculationDragPayload | null
  triggerDrop: (target: 'wishlist' | 'shelf' | 'cart') => void
  triggerPass: () => void
  registerPassHandler: (h: PassHandler | null) => void
} {
  const c = useContext(CirculationDndCtx)
  if (!c) {
    return {
      getActivePayload: () => null,
      triggerDrop: () => {},
      triggerPass: () => {},
      registerPassHandler: () => {},
    }
  }
  return {
    getActivePayload: c.getActivePayload,
    triggerDrop: c.triggerDrop,
    triggerPass: c.triggerPass,
    registerPassHandler: c.registerPassHandler,
  }
}

export function CirculationDndProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<DropHandler | null>(null)
  const activePayloadRef = useRef<CirculationDragPayload | null>(null)
  const passHandlerRef = useRef<PassHandler | null>(null)
  const registerDropHandler = useCallback((h: DropHandler | null) => {
    handlerRef.current = h
  }, [])
  const setActivePayload = useCallback((p: CirculationDragPayload | null) => {
    activePayloadRef.current = p
  }, [])
  const getActivePayload = useCallback(() => activePayloadRef.current, [])
  const registerPassHandler = useCallback((h: PassHandler | null) => {
    passHandlerRef.current = h
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    }),
  )

  const triggerDrop = useCallback((target: 'wishlist' | 'shelf' | 'cart') => {
    const payload = activePayloadRef.current
    if (!payload?.bookId) return
    void handlerRef.current?.(target, payload)
  }, [])

  const triggerPass = useCallback(() => {
    void passHandlerRef.current?.()
  }, [])

  const onDragEnd = useCallback((e: DragEndEvent) => {
    const overId = e.over?.id
    if (!overId) return
    const payload = e.active.data.current as CirculationDragPayload | undefined
    if (!payload?.bookId) return
    const map: Record<string, 'wishlist' | 'shelf' | 'cart'> = {
      'circulation-drop-wishlist': 'wishlist',
      'circulation-drop-shelf': 'shelf',
      'circulation-drop-cart': 'cart',
    }
    const t = map[String(overId)]
    if (!t) return
    void handlerRef.current?.(t, payload)
  }, [])

  return (
    <CirculationDndCtx.Provider
      value={{
        registerDropHandler,
        setActivePayload,
        getActivePayload,
        triggerDrop,
        registerPassHandler,
        triggerPass,
      }}
    >
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {children}
      </DndContext>
    </CirculationDndCtx.Provider>
  )
}
