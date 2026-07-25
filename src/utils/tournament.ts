export interface TournamentSnapshot {
  current: string[]
  pointer: number
  nextRoundWinners: string[]
  round: number
  champion: string | null
}

export interface TournamentState extends TournamentSnapshot {
  previous: TournamentSnapshot | null
}

export type Matchup = { type: 'pair'; a: string; b: string } | { type: 'bye'; a: string }

function shuffle<T>(list: T[]): T[] {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createTournament(ids: string[]): TournamentState {
  return {
    current: shuffle(ids),
    pointer: 0,
    nextRoundWinners: [],
    round: 1,
    champion: null,
    previous: null,
  }
}

// Confrontos são formados de dois em dois na ordem do baralho atual. Se sobrar um nome sem
// par, ele passa direto de rodada (bye) sem precisar de escolha.
export function getCurrentMatchup(state: TournamentState): Matchup | null {
  if (state.champion) return null
  if (state.pointer >= state.current.length) return null
  const a = state.current[state.pointer]
  const b = state.current[state.pointer + 1]
  if (b === undefined) return { type: 'bye', a }
  return { type: 'pair', a, b }
}

export function totalMatchupsInRound(state: TournamentState): number {
  return Math.ceil(state.current.length / 2)
}

export function pickWinner(state: TournamentState, winnerId: string): TournamentState {
  const matchup = getCurrentMatchup(state)
  if (!matchup) return state

  const snapshot: TournamentSnapshot = {
    current: state.current,
    pointer: state.pointer,
    nextRoundWinners: state.nextRoundWinners,
    round: state.round,
    champion: state.champion,
  }

  const step = matchup.type === 'pair' ? 2 : 1
  const nextPointer = state.pointer + step
  const nextRoundWinners = [...state.nextRoundWinners, winnerId]

  if (nextPointer >= state.current.length) {
    if (nextRoundWinners.length === 1) {
      return {
        current: state.current,
        pointer: nextPointer,
        nextRoundWinners,
        round: state.round,
        champion: nextRoundWinners[0],
        previous: snapshot,
      }
    }
    return {
      current: nextRoundWinners,
      pointer: 0,
      nextRoundWinners: [],
      round: state.round + 1,
      champion: null,
      previous: snapshot,
    }
  }

  return {
    current: state.current,
    pointer: nextPointer,
    nextRoundWinners,
    round: state.round,
    champion: null,
    previous: snapshot,
  }
}

export function undoLastPick(state: TournamentState): TournamentState {
  if (!state.previous) return state
  return { ...state.previous, previous: null }
}
