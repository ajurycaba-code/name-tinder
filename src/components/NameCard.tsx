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

      {entry.bicultural && <div className="name-card-bicultural">🇧🇷 + 🇺🇸 nome bicultural</div>}
      {entry.creative && <div className="name-card-creative">✨ nome exclusivo da família</div>}
      {entry.suggestedBy && <div className="name-card-suggested">💌 sugerido por {entry.suggestedBy}</div>}

      <h2 className="name-card-name">{entry.name}</h2>

      <div className="name-card-body">
        <p className="name-card-origin">{entry.origin}</p>
        <p className="name-card-meaning">"{entry.meaning}"</p>
        <p className="name-card-fact">💡 {entry.fact}</p>
      </div>
    </div>
  )
}
