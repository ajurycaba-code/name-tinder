import type { NameEntry } from '../data/names'
import { PLAYERS, type AllDecisions } from '../types'
import { decidedCount, likedCount } from '../utils/matches'

interface Props {
  matches: NameEntry[]
  decisions: AllDecisions
  totalNames: number
}

export function MatchesScreen({ matches, decisions, totalNames }: Props) {
  return (
    <div className="screen">
      <h2 className="screen-title">💘 Matches</h2>
      <p className="screen-subtitle">Nomes que Fabiana e Aju curtiram os dois</p>

      <div className="stats-row">
        {PLAYERS.map((player) => (
          <div key={player} className="stat-card">
            <p className="stat-value">{likedCount(decisions, player)}</p>
            <p className="stat-label">curtidos por {player}</p>
            <p className="stat-sub">
              {decidedCount(decisions, player)}/{totalNames} avaliados
            </p>
          </div>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <p className="deck-empty-emoji">🤍</p>
          <p>Ainda não há matches. Continuem deslizando!</p>
        </div>
      ) : (
        <ul className="match-list">
          {matches.map((entry) => (
            <li key={entry.id} className="match-item">
              <div className={`match-avatar ${entry.gender === 'F' ? 'badge-f' : 'badge-m'}`}>
                {entry.gender === 'F' ? '♀' : '♂'}
              </div>
              <div>
                <p className="match-name">{entry.name}</p>
                <p className="match-meaning">{entry.meaning}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
