import { useMemo, useState } from 'react'
import type { NameEntry } from '../data/names'
import type { AllDecisions, Decision, Profile } from '../types'
import { countsFor, type NameScore } from '../utils/matches'
import type { GenderFilter } from '../utils/queue'
import { NameDetailModal } from './NameDetailModal'

interface Props {
  scoreboard: NameScore[]
  decisions: AllDecisions
  parents: Profile[]
  profile: Profile
  allNames: NameEntry[]
  onVote: (entry: NameEntry, decision: Decision) => void
  onClearVote: (nameId: string) => void
}

const FILTROS: { key: GenderFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'F', label: '♀ Meninas' },
  { key: 'M', label: '♂ Meninos' },
]

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
  allNames,
  onVote,
  onClearVote,
}: Props) {
  const [aberto, setAberto] = useState<NameEntry | null>(null)
  const [genero, setGenero] = useState<GenderFilter>('all')

  const visivel = useMemo(
    () => (genero === 'all' ? scoreboard : scoreboard.filter((s) => s.entry.gender === genero)),
    [scoreboard, genero],
  )
  // As estatísticas seguem o mesmo filtro, senão os números não batem com a lista.
  const nomesDoFiltro = useMemo(
    () => (genero === 'all' ? allNames : allNames.filter((n) => n.gender === genero)),
    [allNames, genero],
  )

  const fullMatches = visivel.filter((score) => score.isFullMatch).length
  const myVotes = decisions[profile.id] ?? {}

  return (
    <div className="screen">
      <h2 className="screen-title">💘 Placar dos nomes</h2>
      <p className="screen-subtitle">
        Todo nome que alguém curtiu e ninguém vetou, do mais curtido pro menos. Toque num nome para
        ver o card inteiro, ou use o coração para curtir na hora.
      </p>

      <div className="gender-filter">
        {FILTROS.map((filtro) => (
          <button
            key={filtro.key}
            className={`filter-chip ${genero === filtro.key ? 'filter-chip-active' : ''}`}
            onClick={() => setGenero(filtro.key)}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      <div className="stats-row">
        {parents.map((parent) => {
          const c = countsFor(decisions, parent.id, nomesDoFiltro)
          return (
            <div key={parent.id} className="stat-card">
              <p className="stat-value">{c.liked}</p>
              <p className="stat-label">curtidos por {parent.name}</p>
              <p className="stat-sub">
                {c.neutral} tanto faz · {c.decided}/{c.total} avaliados
              </p>
            </div>
          )
        })}
      </div>

      {visivel.length === 0 ? (
        <div className="empty-state">
          <p className="deck-empty-emoji">🤍</p>
          <p>
            {genero === 'all'
              ? 'Ninguém curtiu nenhum nome ainda. Continuem deslizando!'
              : `Nenhum nome de ${genero === 'F' ? 'menina' : 'menino'} curtido ainda.`}
          </p>
        </div>
      ) : (
        <>
          <p className="score-summary">
            {fullMatches > 0
              ? `${fullMatches} ${fullMatches === 1 ? 'nome com match completo' : 'nomes com match completo'} · ${visivel.length} na disputa`
              : `${visivel.length} ${visivel.length === 1 ? 'nome na disputa' : 'nomes na disputa'}`}
          </p>
          <ul className="score-list">
            {visivel.map((score) => (
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
