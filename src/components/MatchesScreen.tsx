import type { NameEntry } from '../data/names'
import type { AllDecisions, Profile } from '../types'
import { decidedCount, likedCount, neutralCount } from '../utils/matches'

interface Props {
  matches: NameEntry[]
  maybes: NameEntry[]
  decisions: AllDecisions
  parents: Profile[]
  totalNames: number
}

function NameList({ entries }: { entries: NameEntry[] }) {
  return (
    <ul className="match-list">
      {entries.map((entry) => (
        <li key={entry.id} className="match-item">
          <div className={`match-avatar ${entry.gender === 'F' ? 'badge-f' : 'badge-m'}`}>
            {entry.gender === 'F' ? '♀' : '♂'}
          </div>
          <div>
            <p className="match-name">{entry.name}</p>
            <p className="match-meaning">{entry.meaning}</p>
            {entry.suggestedBy && <p className="torcida-author">sugerido por {entry.suggestedBy}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function MatchesScreen({ matches, maybes, decisions, parents, totalNames }: Props) {
  return (
    <div className="screen">
      <h2 className="screen-title">💘 Matches</h2>
      <p className="screen-subtitle">
        Nomes que {parents.map((parent) => parent.name).join(' e ') || 'o casal'} curtiram os dois
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

      {matches.length === 0 ? (
        <div className="empty-state">
          <p className="deck-empty-emoji">🤍</p>
          <p>Ainda não há matches. Continuem deslizando!</p>
        </div>
      ) : (
        <NameList entries={matches} />
      )}

      {maybes.length > 0 && (
        <section className="maybe-section">
          <h3 className="torcida-heading">🤔 Talvez ({maybes.length})</h3>
          <p className="screen-subtitle">
            Ninguém vetou, mas pelo menos um de vocês marcou &quot;tanto faz&quot; — seguem na disputa.
          </p>
          <NameList entries={maybes} />
        </section>
      )}
    </div>
  )
}
