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

// Distância (px) a partir da qual soltar o card já conta como decisão.
const SWIPE_THRESHOLD = 95
const UP_THRESHOLD = 85
// Velocidade (px/ms) a partir da qual um peteleco curto e rápido também conta.
const FLING_SPEED = 0.45
// Quanto o card viaja ao sair de cena.
const FLY_DISTANCE = 1100
const FLY_MS = 300

interface Point {
  x: number
  y: number
}

const ORIGIN: Point = { x: 0, y: 0 }

export function SwipeDeck({ queue, onDecision, onUndo, canUndo }: Props) {
  const [drag, setDrag] = useState<Point>(ORIGIN)
  const [dragging, setDragging] = useState(false)
  const [flyTo, setFlyTo] = useState<Point | null>(null)

  const start = useRef<Point>(ORIGIN)
  const last = useRef({ x: 0, y: 0, t: 0 })
  const velocity = useRef<Point>(ORIGIN)
  const pointerId = useRef<number | null>(null)
  const committing = useRef(false)

  const top = queue[0]
  const second = queue[1]
  const third = queue[2]

  function handlePointerDown(event: React.PointerEvent) {
    if (!top || committing.current) return
    pointerId.current = event.pointerId
    start.current = { x: event.clientX, y: event.clientY }
    last.current = { x: event.clientX, y: event.clientY, t: performance.now() }
    velocity.current = ORIGIN
    setDragging(true)
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!dragging || pointerId.current !== event.pointerId) return

    const now = performance.now()
    const elapsed = Math.max(1, now - last.current.t)
    velocity.current = {
      x: (event.clientX - last.current.x) / elapsed,
      y: (event.clientY - last.current.y) / elapsed,
    }
    last.current = { x: event.clientX, y: event.clientY, t: now }

    setDrag({ x: event.clientX - start.current.x, y: event.clientY - start.current.y })
  }

  function decisionFromGesture(offset: Point, speed: Point): Decision | null {
    const horizontal = Math.abs(offset.x) > Math.abs(offset.y)

    if (horizontal) {
      if (offset.x > SWIPE_THRESHOLD || (speed.x > FLING_SPEED && offset.x > 20)) return 'like'
      if (offset.x < -SWIPE_THRESHOLD || (speed.x < -FLING_SPEED && offset.x < -20)) return 'dislike'
      return null
    }

    // Só para cima vale como "tanto faz" — para baixo o card volta pro lugar.
    if (offset.y < -UP_THRESHOLD || (speed.y < -FLING_SPEED && offset.y < -20)) return 'neutral'
    return null
  }

  function finishDrag() {
    if (!dragging || !top) return
    setDragging(false)

    const decision = decisionFromGesture(drag, velocity.current)
    if (decision) {
      commit(decision, true)
    } else {
      setDrag(ORIGIN)
    }
  }

  // `fromGesture` = o card sai seguindo a direção do arremesso; nos botões,
  // usa uma trajetória padrão bonitinha.
  function commit(decision: Decision, fromGesture = false) {
    if (!top || committing.current) return
    committing.current = true

    const speed = velocity.current
    const magnitude = Math.hypot(speed.x, speed.y)

    let dx: number
    let dy: number
    if (fromGesture && magnitude > 0.15) {
      dx = speed.x / magnitude
      dy = speed.y / magnitude
    } else if (decision === 'neutral') {
      dx = 0
      dy = -1
    } else {
      dx = decision === 'like' ? 1 : -1
      dy = -0.2
    }

    setFlyTo({ x: drag.x + dx * FLY_DISTANCE, y: drag.y + dy * FLY_DISTANCE })

    window.setTimeout(() => {
      onDecision(top, decision)
      setDrag(ORIGIN)
      setFlyTo(null)
      velocity.current = ORIGIN
      committing.current = false
    }, FLY_MS)
  }

  function handlePointerUp(event: React.PointerEvent) {
    if (pointerId.current !== event.pointerId) return
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

  const offset = flyTo ?? drag
  const rotation = offset.x / 18 + (flyTo ? Math.sign(offset.x) * 8 : 0)

  // O quanto o card do topo já "saiu do caminho" — usado para o card de baixo subir.
  const progress = flyTo ? 1 : Math.min(1, Math.hypot(drag.x, drag.y) / SWIPE_THRESHOLD)

  const transition = dragging
    ? 'none'
    : flyTo
      ? `transform ${FLY_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${FLY_MS}ms ease-out`
      : 'transform 0.55s cubic-bezier(0.18, 0.89, 0.32, 1.28)'

  function behindStyle(depth: number): React.CSSProperties {
    // depth 0 = logo atrás do topo, depth 1 = o seguinte
    const lift = Math.max(0, progress - depth * 0.35)
    return {
      transform: `scale(${0.94 - depth * 0.04 + lift * 0.06}) translateY(${(depth + 1) * 10 - lift * 10}px)`,
      opacity: 0.75 - depth * 0.3 + lift * 0.25,
      transition: dragging ? 'none' : 'transform 0.35s ease-out, opacity 0.35s ease-out',
    }
  }

  return (
    <div className="deck">
      <div className="deck-stack">
        {third && (
          <div className="deck-card" style={behindStyle(1)}>
            <NameCard entry={third} />
          </div>
        )}
        {second && (
          <div className="deck-card" style={behindStyle(0)}>
            <NameCard entry={second} />
          </div>
        )}
        <div
          className={`deck-card deck-card-top ${dragging ? 'deck-card-grabbed' : ''}`}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg)`,
            opacity: flyTo ? 0 : 1,
            transition,
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <NameCard entry={top} dragX={drag.x} dragY={drag.y} />
        </div>
      </div>

      <div className="deck-actions">
        <button className="deck-btn deck-btn-undo" onClick={onUndo} disabled={!canUndo} aria-label="Desfazer">
          ↺
        </button>
        <button className="deck-btn deck-btn-nope" onClick={() => commit('dislike')} aria-label="Passar">
          ✕
        </button>
        <button
          className="deck-btn deck-btn-maybe"
          onClick={() => commit('neutral')}
          aria-label="Tanto faz"
          title="Tanto faz — não veta o nome, mas também não é um sim"
        >
          ~
        </button>
        <button className="deck-btn deck-btn-like" onClick={() => commit('like')} aria-label="Curtir">
          ♥
        </button>
      </div>

      <p className="deck-hint">Arraste para os lados, ou para cima se tanto faz</p>
    </div>
  )
}
