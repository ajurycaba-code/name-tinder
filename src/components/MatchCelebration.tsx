import { useEffect, useRef } from 'react'
import type { NameEntry } from '../data/names'

const CORES = ['#ff5d7a', '#7c5cff', '#ffd166', '#38b26f', '#5eb3ff', '#ff8fab']
const DURACAO = 2800

function prefereMenosMovimento() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

// Confete em canvas, sem biblioteca externa.
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const largura = canvas.clientWidth
    const altura = canvas.clientHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = largura * dpr
    canvas.height = altura * dpr
    ctx.scale(dpr, dpr)

    const papeis = Array.from({ length: 110 }, () => ({
      x: largura / 2 + (Math.random() - 0.5) * largura * 0.55,
      y: altura * 0.44,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 11 - 4,
      tamanho: 6 + Math.random() * 7,
      giro: Math.random() * Math.PI,
      velGiro: (Math.random() - 0.5) * 0.3,
      cor: CORES[Math.floor(Math.random() * CORES.length)],
    }))

    const inicio = performance.now()
    let frameId = 0

    function desenhar(agora: number) {
      const t = agora - inicio
      ctx!.clearRect(0, 0, largura, altura)

      // Some suavemente no último terço da animação.
      const opacidade = Math.max(0, 1 - Math.max(0, t - DURACAO * 0.65) / (DURACAO * 0.35))

      for (const papel of papeis) {
        papel.vy += 0.28 // gravidade
        papel.vx *= 0.995
        papel.x += papel.vx
        papel.y += papel.vy
        papel.giro += papel.velGiro

        ctx!.save()
        ctx!.globalAlpha = opacidade
        ctx!.translate(papel.x, papel.y)
        ctx!.rotate(papel.giro)
        ctx!.fillStyle = papel.cor
        ctx!.fillRect(-papel.tamanho / 2, -papel.tamanho / 4, papel.tamanho, papel.tamanho / 2)
        ctx!.restore()
      }

      if (t < DURACAO) frameId = requestAnimationFrame(desenhar)
    }

    frameId = requestAnimationFrame(desenhar)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}

interface Props {
  entry: NameEntry
  onDone: () => void
}

export function MatchCelebration({ entry, onDone }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, DURACAO)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div className="match-overlay" onClick={onDone} role="button" tabIndex={-1}>
      {!prefereMenosMovimento() && <Confetti />}
      <div className="match-overlay-card">
        <p className="match-overlay-emoji">💘</p>
        <p className="match-overlay-title">MATCH!</p>
        <p className="match-overlay-name">{entry.name}</p>
        <p className="match-overlay-sub">Vocês dois curtiram esse nome</p>
      </div>
    </div>
  )
}
