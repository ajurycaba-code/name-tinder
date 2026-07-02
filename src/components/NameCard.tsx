import type { NameEntry } from '../data/names'

interface Props {
  entry: NameEntry
  dragX?: number
}

export function NameCard({ entry, dragX = 0 }: Props) {
  const likeOpacity = Math.min(Math.max(dragX / 100, 0), 1)
  const nopeOpacity = Math.min(Math.max(-dragX / 100, 0), 1)

  return (
    <div className="name-card">
      <div className="name-card-stamp name-card-stamp-like" style={{ opacity: likeOpacity }}>
        MATCH?
      </div>
      <div className="name-card-stamp name-card-stamp-nope" style={{ opacity: nopeOpacity }}>
        PASSO
      </div>

      <div className={`name-card-badge ${entry.gender === 'F' ? 'badge-f' : 'badge-m'}`}>
        {entry.gender === 'F' ? '♀ Menina' : '♂ Menino'}
        {entry.custom ? ' · sugerido' : ` · #${entry.rank}`}
      </div>

      <h2 className="name-card-name">{entry.name}</h2>

      <div className="name-card-body">
        <p className="name-card-origin">{entry.origin}</p>
        <p className="name-card-meaning">"{entry.meaning}"</p>
        <p className="name-card-fact">💡 {entry.fact}</p>
      </div>
    </div>
  )
}
