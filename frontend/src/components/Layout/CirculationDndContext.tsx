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

const CirculationDndCtx = createContext<{
  registerDropHandler: (h: DropHandler | null) => void
} | null>(null)

export function useCirculationDndRegistration(): (h: DropHandler | null) => void {
  const c = useContext(CirculationDndCtx)
  if (!c) {
    return () => {}
  }
  return c.registerDropHandler
}

export function CirculationDndProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<DropHandler | null>(null)
  const registerDropHandler = useCallback((h: DropHandler | null) => {
    handlerRef.current = h
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    }),
  )

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
    <CirculationDndCtx.Provider value={{ registerDropHandler }}>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {children}
      </DndContext>
    </CirculationDndCtx.Provider>
  )
}
