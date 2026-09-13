import type { NameEntry } from '../data/names'

interface Props {
  entry: NameEntry
  dragX?: number
  dragY?: number
}

export function NameCard({ entry, dragX = 0, dragY = 0 }: Props) {
  // O gesto vertical só "vence" o horizontal quando é claramente para cima.
  const vertical = Math.abs(dragY) > Math.abs(dragX)
  const likeOpacity = vertical ? 0 : Math.min(Math.max(dragX / 100, 0), 1)
  const nopeOpacity = vertical ? 0 : Math.min(Math.max(-dragX / 100, 0), 1)
  const maybeOpacity = vertical ? Math.min(Math.max(-dragY / 90, 0), 1) : 0

  return (
    <div className="name-card">
      <div className="name-card-stamp name-card-stamp-like" style={{ opacity: likeOpacity }}>
        MATCH?
      </div>
      <div className="name-card-stamp name-card-stamp-nope" style={{ opacity: nopeOpacity }}>
        PASSO
      </div>
      <div className="name-card-stamp name-card-stamp-maybe" style={{ opacity: maybeOpacity }}>
        TANTO FAZ
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
