import { useState } from 'react'
import type { NameEntry } from '../data/names'
import type { AllDecisions, Decision, Profile } from '../types'
import { decidedCount, likedCount, neutralCount, type NameScore } from '../utils/matches'
import { NameDetailModal } from './NameDetailModal'

interface Props {
  scoreboard: NameScore[]
  decisions: AllDecisions
  parents: Profile[]
  profile: Profile
  totalNames: number
  onVote: (entry: NameEntry, decision: Decision) => void
  onClearVote: (nameId: string) => void
}

interface RowProps {
  score: NameScore
  myVote?: Decision
  onOpen: () => void
  onToggleLike: () => void
}

function ScoreRow({ score, myVote, onOpen, onToggleLike }: RowProps) {
  const { entry, likedBy, parentLikes, guestLikes, isFullMatch } = score

  const parentNames = likedBy.filter((profile) => profile.role === 'parent').map((p) => p.name)
  const guestNames = likedBy.filter((profile) => profile.role === 'guest').map((p) => p.name)

  return (
    <li className={`score-item ${isFullMatch ? 'score-item-match' : ''}`}>
      <button className="score-open" onClick={onOpen} aria-label={`Abrir ${entry.name}`}>
        <div className={`match-avatar ${entry.gender === 'F' ? 'badge-f' : 'badge-m'}`}>
          {entry.gender === 'F' ? '♀' : '♂'}
        </div>

        <div className="score-body">
          <p className="match-name">
            {entry.name}
            {isFullMatch && <span className="score-match-tag">💘 match</span>}
          </p>
          <p className="match-meaning">{entry.meaning}</p>
          <p className="score-who">
            {parentNames.length > 0 && <span className="score-who-parents">{parentNames.join(' · ')}</span>}
            {guestNames.length > 0 && (
              <span className="score-who-guests">
                {parentNames.length > 0 ? ' · ' : ''}
                {guestNames.length <= 2 ? guestNames.join(' · ') : `${guestNames.length} da torcida`}
              </span>
            )}
          </p>
        </div>

        <div className="score-likes">
          <span className="score-hearts">{'❤️'.repeat(Math.min(parentLikes, 2)) || '🤍'}</span>
          <span className="score-count">
            {likedBy.length}
            {guestLikes > 0 && <small>+{guestLikes} torcida</small>}
          </span>
        </div>
      </button>

      <button
        className={`score-like-btn ${myVote === 'like' ? 'score-like-btn-on' : ''}`}
        onClick={onToggleLike}
        aria-label={myVote === 'like' ? 'Remover sua curtida' : 'Curtir esse nome'}
        aria-pressed={myVote === 'like'}
        title={myVote === 'like' ? 'Remover sua curtida' : 'Curtir esse nome'}
      >
        {myVote === 'like' ? '❤️' : '🤍'}
      </button>
    </li>
  )
}

export function MatchesScreen({
  scoreboard,
  decisions,
  parents,
  profile,
  totalNames,
  onVote,
  onClearVote,
}: Props) {
  const [aberto, setAberto] = useState<NameEntry | null>(null)

  const fullMatches = scoreboard.filter((score) => score.isFullMatch).length
  const myVotes = decisions[profile.id] ?? {}

  return (
    <div className="screen">
      <h2 className="screen-title">💘 Placar dos nomes</h2>
      <p className="screen-subtitle">
        Todo nome que alguém curtiu e ninguém vetou, do mais curtido pro menos. Toque num nome para
        ver o card inteiro, ou use o coração para curtir na hora.
      </p>

      <div className="stats-row">
        {parents.map((parent) => (
          <div key={parent.id} className="stat-card">
            <p className="stat-value">{likedCount(decisions, parent.id)}</p>
            <p className="stat-label">curtidos por {parent.name}</p>
            <p className="stat-sub">
              {neutralCount(decisions, parent.id)} tanto faz ·{' '}
              {decidedCount(decisions, parent.id)}/{totalNames} avaliados
            </p>
          </div>
        ))}
      </div>

      {scoreboard.length === 0 ? (
        <div className="empty-state">
          <p className="deck-empty-emoji">🤍</p>
          <p>Ninguém curtiu nenhum nome ainda. Continuem deslizando!</p>
        </div>
      ) : (
        <>
          <p className="score-summary">
            {fullMatches > 0
              ? `${fullMatches} ${fullMatches === 1 ? 'nome com match completo' : 'nomes com match completo'} · ${scoreboard.length} na disputa`
              : `${scoreboard.length} ${scoreboard.length === 1 ? 'nome na disputa' : 'nomes na disputa'}`}
          </p>
          <ul className="score-list">
            {scoreboard.map((score) => (
              <ScoreRow
                key={score.entry.id}
                score={score}
                myVote={myVotes[score.entry.id]}
                onOpen={() => setAberto(score.entry)}
                onToggleLike={() =>
                  myVotes[score.entry.id] === 'like'
                    ? onClearVote(score.entry.id)
                    : onVote(score.entry, 'like')
                }
              />
            ))}
          </ul>
        </>
      )}

      {aberto && (
        <NameDetailModal
          entry={aberto}
          myVote={myVotes[aberto.id]}
          onVote={(decision) => onVote(aberto, decision)}
          onClear={() => onClearVote(aberto.id)}
          onClose={() => setAberto(null)}
        />
      )}
    </div>
  )
}
