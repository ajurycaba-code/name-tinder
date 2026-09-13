import type { AllDecisions, Profile } from '../types'
import { decidedCount, likedCount, neutralCount, type NameScore } from '../utils/matches'

interface Props {
  scoreboard: NameScore[]
  decisions: AllDecisions
  parents: Profile[]
  totalNames: number
}

function ScoreRow({ score }: { score: NameScore }) {
  const { entry, likedBy, parentLikes, guestLikes, isFullMatch } = score

  const parentNames = likedBy.filter((profile) => profile.role === 'parent').map((p) => p.name)
  const guestNames = likedBy.filter((profile) => profile.role === 'guest').map((p) => p.name)

  return (
    <li className={`score-item ${isFullMatch ? 'score-item-match' : ''}`}>
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

      <div className="score-likes" title={`${likedBy.length} curtida(s)`}>
        <span className="score-hearts">{'❤️'.repeat(Math.min(parentLikes, 2)) || '🤍'}</span>
        <span className="score-count">
          {likedBy.length}
          {guestLikes > 0 && <small>+{guestLikes} torcida</small>}
        </span>
      </div>
    </li>
  )
}

export function MatchesScreen({ scoreboard, decisions, parents, totalNames }: Props) {
  const fullMatches = scoreboard.filter((score) => score.isFullMatch).length

  return (
    <div className="screen">
      <h2 className="screen-title">💘 Placar dos nomes</h2>
      <p className="screen-subtitle">
        Todo nome que alguém curtiu e ninguém vetou, do mais curtido pro menos. &quot;Tanto faz&quot;
        não soma nem tira — só não conta como curtida.
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
              <ScoreRow key={score.entry.id} score={score} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
