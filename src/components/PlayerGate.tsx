import { PLAYERS, type Player } from '../types'

interface Props {
  onSelect: (player: Player) => void
}

export function PlayerGate({ onSelect }: Props) {
  return (
    <div className="gate">
      <div className="gate-card">
        <p className="gate-emoji">👶💕</p>
        <h1>Name Tinder</h1>
        <p className="gate-subtitle">Deslize os nomes, dê match no favorito de vocês dois!</p>
        <p className="gate-question">Quem está jogando agora?</p>
        <div className="gate-buttons">
          {PLAYERS.map((player) => (
            <button key={player} className="gate-btn" onClick={() => onSelect(player)}>
              {player}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
