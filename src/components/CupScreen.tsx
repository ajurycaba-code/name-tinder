import { useEffect, useMemo, useState } from 'react'
import type { Gender, NameEntry } from '../data/names'
import { useTournament } from '../hooks/useTournament'
import type { NameScore } from '../utils/matches'
import { computeStandings, getCurrentMatchup, totalMatchupsInRound, type Standing } from '../utils/tournament'

interface Props {
  // Todo o placar, não só os matches completos: qualquer nome que alguém
  // curtiu e ninguém vetou pode disputar.
  scoreboard: NameScore[]
}

const GENDERS: { key: Gender; label: string; emoji: string }[] = [
  { key: 'F', label: 'Meninas', emoji: '♀' },
  { key: 'M', label: 'Meninos', emoji: '♂' },
]

export function CupScreen({ scoreboard }: Props) {
  const { byGender, start, pick, undo, reset } = useTournament()
  const [activeGender, setActiveGender] = useState<Gender>('F')

  const byId = useMemo(
    () => new Map(scoreboard.map((score) => [score.entry.id, score.entry])),
    [scoreboard],
  )
  // Mais curtidos primeiro: se a copa for recomeçada, entram na mesma ordem.
  const doGenero = useMemo(
    () => scoreboard.filter((score) => score.entry.gender === activeGender),
    [scoreboard, activeGender],
  )

  const state = byGender[activeGender]
  const matchup = state ? getCurrentMatchup(state) : null

  // Nomes que sobraram sozinhos (bye) passam direto de rodada, sem precisar de escolha.
  useEffect(() => {
    if (matchup?.type === 'bye') {
      const timer = setTimeout(() => pick(activeGender, matchup.a), 650)
      return () => clearTimeout(timer)
    }
  }, [matchup, activeGender, pick])

  return (
    <div className="screen">
      <h2 className="screen-title">🏆 Copa dos Nomes</h2>
      <p className="screen-subtitle">
        Todos os nomes do placar se enfrentam até sobrar só um campeão — um de menina e um de menino.
      </p>

      <div className="gender-filter">
        {GENDERS.map((g) => (
          <button
            key={g.key}
            className={`filter-chip ${activeGender === g.key ? 'filter-chip-active' : ''}`}
            onClick={() => setActiveGender(g.key)}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      {!state && (
        <CupStart
          count={doGenero.length}
          genderLabel={GENDERS.find((g) => g.key === activeGender)!.label}
          onStart={() => start(activeGender, doGenero.map((score) => score.entry.id))}
        />
      )}

      {state && state.poolSize !== undefined && doGenero.length > state.poolSize && (
        <p className="cup-stale">
          O placar cresceu desde que essa copa começou ({state.poolSize} → {doGenero.length} nomes).
          Recomece para incluir os novos.
        </p>
      )}

      {state && !state.champion && matchup?.type === 'pair' && (
        <Matchup
          entryA={byId.get(matchup.a)!}
          entryB={byId.get(matchup.b)!}
          round={state.round}
          matchNumber={state.nextRoundWinners.length + 1}
          totalMatches={totalMatchupsInRound(state)}
          canUndo={Boolean(state.previous)}
          onPick={(id) => pick(activeGender, id)}
          onUndo={() => undo(activeGender)}
          onRestart={() => reset(activeGender)}
        />
      )}

      {state && !state.champion && matchup?.type === 'bye' && (
        <div className="bye-notice">
          <p className="deck-empty-emoji">🎟️</p>
          <p>
            <strong>{byId.get(matchup.a)?.name}</strong> não tem par nessa rodada e passa direto pra próxima!
          </p>
        </div>
      )}

      {state?.champion && (
        <ChampionCard
          entry={byId.get(state.champion)!}
          standings={computeStandings(state)}
          byId={byId}
          onRestart={() => reset(activeGender)}
        />
      )}
    </div>
  )
}

function CupStart({ count, genderLabel, onStart }: { count: number; genderLabel: string; onStart: () => void }) {
  if (count < 2) {
    return (
      <div className="empty-state">
        <p className="deck-empty-emoji">🏆</p>
        <p>
          Precisam de pelo menos 2 nomes de {genderLabel.toLowerCase()} no placar pra começar a copa. Vocês têm{' '}
          {count} até agora — continuem no Swipe!
        </p>
      </div>
    )
  }

  return (
    <div className="cup-start">
      <p className="cup-start-count">{count}</p>
      <p className="screen-subtitle">nomes de {genderLabel.toLowerCase()} na disputa</p>
      <button className="primary-btn" onClick={onStart}>
        Começar copa
      </button>
    </div>
  )
}

function Matchup({
  entryA,
  entryB,
  round,
  matchNumber,
  totalMatches,
  canUndo,
  onPick,
  onUndo,
  onRestart,
}: {
  entryA: NameEntry
  entryB: NameEntry
  round: number
  matchNumber: number
  totalMatches: number
  canUndo: boolean
  onPick: (id: string) => void
  onUndo: () => void
  onRestart: () => void
}) {
  return (
    <div className="cup-round">
      <p className="cup-round-label">
        Rodada {round} · Confronto {matchNumber} de {totalMatches}
      </p>

      <div className="versus">
        <button className="versus-card" onClick={() => onPick(entryA.id)}>
          <p className="versus-name">{entryA.name}</p>
          <p className="versus-meaning">{entryA.meaning}</p>
        </button>
        <span className="versus-divider">VS</span>
        <button className="versus-card" onClick={() => onPick(entryB.id)}>
          <p className="versus-name">{entryB.name}</p>
          <p className="versus-meaning">{entryB.meaning}</p>
        </button>
      </div>

      <div className="cup-controls">
        <button className="deck-btn-undo cup-undo" onClick={onUndo} disabled={!canUndo} aria-label="Desfazer">
          ↺ Desfazer
        </button>
        <button className="deck-btn-undo cup-undo" onClick={onRestart}>
          ⟳ Recomeçar
        </button>
      </div>
    </div>
  )
}

const MEDALHAS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function ChampionCard({
  entry,
  standings,
  byId,
  onRestart,
}: {
  entry: NameEntry
  standings: Standing[]
  byId: Map<string, NameEntry>
  onRestart: () => void
}) {
  const feminino = entry.gender === 'F'

  return (
    <>
      <div className="champion-card">
        <p className="champion-trophy">🏆</p>
        <p className="champion-label">{feminino ? 'Campeã da copa' : 'Campeão da copa'}</p>
        <h3 className="champion-name">{entry.name}</h3>
        <p className="name-card-origin">{entry.origin}</p>
        <p className="name-card-meaning">"{entry.meaning}"</p>
        <p className="name-card-fact">💡 {entry.fact}</p>
        <button className="primary-btn" onClick={onRestart}>
          Recomeçar copa
        </button>
      </div>

      {standings.length > 1 && (
        <section className="standings">
          <h3 className="torcida-heading">🏅 Classificação</h3>
          <p className="screen-subtitle">
            Quem chegou mais longe na copa. Nomes que caíram na mesma fase dividem a posição.
          </p>
          <ol className="standings-list">
            {standings.map((standing) => {
              const nome = byId.get(standing.id)
              if (!nome) return null
              return (
                <li key={standing.id} className={`standings-item ${standing.position === 1 ? 'standings-item-top' : ''}`}>
                  <span className="standings-pos">
                    {MEDALHAS[standing.position] ?? `${standing.position}º`}
                  </span>
                  <span className="standings-name">{nome.name}</span>
                  <span className="standings-label">
                    {standing.position === 1
                      ? nome.gender === 'F'
                        ? 'campeã'
                        : 'campeão'
                      : standing.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </>
  )
}
