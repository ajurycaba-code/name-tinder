import { useRef, useState } from 'react'
import type { NameEntry } from '../data/names'
import type { Decision } from '../types'
import { NameCard } from './NameCard'

interface Props {
  queue: NameEntry[]
  onDecision: (entry: NameEntry, decision: Decision) => void
  onUndo?: () => void
  canUndo: boolean
}

const SWIPE_THRESHOLD = 100

export function SwipeDeck({ queue, onDecision, onUndo, canUndo }: Props) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flyDirection, setFlyDirection] = useState<Decision | null>(null)
  const startX = useRef(0)
  const pointerId = useRef<number | null>(null)

  const top = queue[0]
  const second = queue[1]

  function handlePointerDown(e: React.PointerEvent) {
    if (!top) return
    pointerId.current = e.pointerId
    startX.current = e.clientX
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || pointerId.current !== e.pointerId) return
    setDragX(e.clientX - startX.current)
  }

  function finishDrag() {
    if (!dragging || !top) return
    setDragging(false)
    if (dragX > SWIPE_THRESHOLD) {
      commit('like')
    } else if (dragX < -SWIPE_THRESHOLD) {
      commit('dislike')
    } else {
      setDragX(0)
    }
  }

  function commit(decision: Decision) {
    if (!top) return
    setFlyDirection(decision)
    setTimeout(() => {
      onDecision(top, decision)
      setDragX(0)
      setFlyDirection(null)
    }, 220)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    finishDrag()
  }

  if (!top) {
    return (
      <div className="deck-empty">
        <p className="deck-empty-emoji">🎉</p>
        <p>Você avaliou todos os nomes disponíveis por enquanto!</p>
        <p className="deck-empty-hint">Adicione novos nomes ou confira seus matches.</p>
      </div>
    )
  }

  const rotation = (flyDirection === 'like' ? 400 : flyDirection === 'dislike' ? -400 : dragX) / 18
  const translateX = flyDirection === 'like' ? 600 : flyDirection === 'dislike' ? -600 : dragX

  return (
    <div className="deck">
      <div className="deck-stack">
        {second && (
          <div className="deck-card deck-card-behind">
            <NameCard entry={second} />
          </div>
        )}
        <div
          className="deck-card deck-card-top"
          style={{
            transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
            transition: dragging ? 'none' : 'transform 0.25s ease',
            touchAction: 'pan-y',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <NameCard entry={top} dragX={dragX} />
        </div>
      </div>

      <div className="deck-actions">
        <button className="deck-btn deck-btn-undo" onClick={onUndo} disabled={!canUndo} aria-label="Desfazer">
          ↺
        </button>
        <button className="deck-btn deck-btn-nope" onClick={() => commit('dislike')} aria-label="Passar">
          ✕
        </button>
        <button className="deck-btn deck-btn-like" onClick={() => commit('like')} aria-label="Curtir">
          ♥
        </button>
      </div>
    </div>
  )
}
