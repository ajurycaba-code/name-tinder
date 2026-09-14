import { useEffect } from 'react'
import type { NameEntry } from '../data/names'
import type { Decision } from '../types'
import { NameCard } from './NameCard'

interface Props {
  entry: NameEntry
  // Voto atual de quem está olhando, para destacar o botão escolhido.
  myVote?: Decision
  onVote: (decision: Decision) => void
  onClear: () => void
  onClose: () => void
}

export function NameDetailModal({ entry, myVote, onVote, onClear, onClose }: Props) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Tocar de novo no voto que já está marcado desfaz.
  function toggle(decision: Decision) {
    if (myVote === decision) onClear()
    else onVote(decision)
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(event) => event.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Fechar">
          ✕
        </button>

        <div className="detail-card">
          <NameCard entry={entry} />
        </div>

        <div className="detail-actions">
          <button
            className={`deck-btn deck-btn-nope ${myVote === 'dislike' ? 'detail-btn-on' : ''}`}
            onClick={() => toggle('dislike')}
            aria-label="Não"
            aria-pressed={myVote === 'dislike'}
          >
            ✕
          </button>
          <button
            className={`deck-btn deck-btn-maybe ${myVote === 'neutral' ? 'detail-btn-on' : ''}`}
            onClick={() => toggle('neutral')}
            aria-label="Tanto faz"
            aria-pressed={myVote === 'neutral'}
          >
            ~
          </button>
          <button
            className={`deck-btn deck-btn-like ${myVote === 'like' ? 'detail-btn-on' : ''}`}
            onClick={() => toggle('like')}
            aria-label="Curtir"
            aria-pressed={myVote === 'like'}
          >
            ♥
          </button>
        </div>

        <p className="detail-hint">
          {myVote === 'like'
            ? 'Você curtiu esse nome — toque no ♥ de novo para desfazer.'
            : myVote === 'dislike'
              ? 'Você vetou esse nome — toque no ✕ de novo para desfazer.'
              : myVote === 'neutral'
                ? 'Você marcou "tanto faz" — toque no ~ de novo para desfazer.'
                : 'Você ainda não avaliou esse nome.'}
        </p>
      </div>
    </div>
  )
}
