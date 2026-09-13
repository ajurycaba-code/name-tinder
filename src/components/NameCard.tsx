import type { NameEntry } from '../data/names'
import { famousImagesUrl, speakName, speechSupported } from '../utils/speech'

interface Props {
  entry: NameEntry
  dragX?: number
  dragY?: number
  likeStamp?: string
}

// Impede que tocar num botão/link do card comece a arrastar a carta.
function swallow(event: React.PointerEvent) {
  event.stopPropagation()
}

export function NameCard({ entry, dragX = 0, dragY = 0, likeStamp = 'MATCH?' }: Props) {
  // O gesto vertical só "vence" o horizontal quando é claramente para cima.
  const vertical = Math.abs(dragY) > Math.abs(dragX)
  const likeOpacity = vertical ? 0 : Math.min(Math.max(dragX / 100, 0), 1)
  const nopeOpacity = vertical ? 0 : Math.min(Math.max(-dragX / 100, 0), 1)
  const maybeOpacity = vertical ? Math.min(Math.max(-dragY / 90, 0), 1) : 0

  return (
    <div className={`name-card ${entry.crosslingual ? 'name-card-cross' : ''}`}>
      <div className="name-card-stamp name-card-stamp-like" style={{ opacity: likeOpacity }}>
        {likeStamp}
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

      {entry.crosslingual && (
        <div className="name-card-cross-badge">🇧🇷 🇺🇸 funciona nos dois idiomas</div>
      )}
      {entry.bicultural && <div className="name-card-bicultural">🇧🇷 + 🇺🇸 nome bicultural</div>}
      {entry.creative && <div className="name-card-creative">✨ nome exclusivo da família</div>}
      {entry.suggestedBy && <div className="name-card-suggested">💌 sugerido por {entry.suggestedBy}</div>}

      <h2 className="name-card-name">{entry.name}</h2>

      {speechSupported() && (
        <div className="name-card-speak">
          <span className="name-card-speak-label">ouvir:</span>
          <button
            type="button"
            className="speak-btn"
            onPointerDown={swallow}
            onClick={() => speakName(entry.name, 'pt-BR')}
            aria-label={`Ouvir ${entry.name} em português`}
          >
            🔊 português
          </button>
          <button
            type="button"
            className="speak-btn"
            onPointerDown={swallow}
            onClick={() => speakName(entry.name, 'en-US')}
            aria-label={`Ouvir ${entry.name} em inglês`}
          >
            🔊 inglês
          </button>
        </div>
      )}

      <div className="name-card-body">
        <p className="name-card-origin">{entry.origin}</p>
        <p className="name-card-meaning">"{entry.meaning}"</p>
        {entry.famous && <p className="name-card-famous">⭐ {entry.famous}</p>}
        <p className="name-card-fact">💡 {entry.fact}</p>

        <a
          className="name-card-images"
          href={famousImagesUrl(entry.name)}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={swallow}
        >
          🔎 Ver famosos com esse nome
        </a>
      </div>
    </div>
  )
}
