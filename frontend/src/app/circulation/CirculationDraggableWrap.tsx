'use client'

import { useDraggable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { CirculationDragPayload } from '../../components/Layout/CirculationDndContext'
import styles from './circulation.module.css'

export function CirculationDraggableWrap({
  id,
  payload,
  disabled,
  children,
}: {
  id: string
  payload: CirculationDragPayload
  disabled: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: payload,
    disabled,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.dragWrap} ${isDragging ? styles.dragging : ''}`.trim()}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
