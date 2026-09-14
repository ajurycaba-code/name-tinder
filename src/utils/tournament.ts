// Quem caiu, e em que altura da copa. É daqui que sai a classificação final:
// num mata-mata, o ranking é "quem chegou mais longe".
export interface Elimination {
  id: string
  round: number
  // Quantos nomes disputavam a rodada em que este caiu — é o que diferencia
  // uma final (2 na disputa) de uma semifinal (3 ou 4).
  roundSize: number
}

export interface TournamentSnapshot {
  current: string[]
  pointer: number
  nextRoundWinners: string[]
  round: number
  champion: string | null
  // Opcional: copas salvas antes desta versão não têm a lista.
  eliminated?: Elimination[]
}

export interface TournamentState extends TournamentSnapshot {
  previous: TournamentSnapshot | null
  // Quantos nomes entraram quando a copa começou. Serve para avisar que o
  // placar cresceu desde então. Opcional: copas salvas antes disso não têm.
  poolSize?: number
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
    eliminated: [],
    previous: null,
    poolSize: ids.length,
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
    eliminated: state.eliminated,
  }

  const step = matchup.type === 'pair' ? 2 : 1
  const nextPointer = state.pointer + step
  const nextRoundWinners = [...state.nextRoundWinners, winnerId]

  // Num bye ninguém é eliminado; num confronto, quem perdeu cai aqui.
  const perdedor = matchup.type === 'pair' ? (matchup.a === winnerId ? matchup.b : matchup.a) : null
  const eliminated: Elimination[] = perdedor
    ? [...(state.eliminated ?? []), { id: perdedor, round: state.round, roundSize: state.current.length }]
    : (state.eliminated ?? [])

  if (nextPointer >= state.current.length) {
    if (nextRoundWinners.length === 1) {
      return {
        current: state.current,
        pointer: nextPointer,
        nextRoundWinners,
        round: state.round,
        champion: nextRoundWinners[0],
        eliminated,
        previous: snapshot,
      }
    }
    return {
      current: nextRoundWinners,
      pointer: 0,
      nextRoundWinners: [],
      round: state.round + 1,
      champion: null,
      eliminated,
      previous: snapshot,
    }
  }

  return {
    current: state.current,
    pointer: nextPointer,
    nextRoundWinners,
    round: state.round,
    champion: null,
    eliminated,
    previous: snapshot,
  }
}

export function undoLastPick(state: TournamentState): TournamentState {
  if (!state.previous) return state
  return { ...state.previous, previous: null }
}

// --- Classificação final ---

export interface Standing {
  id: string
  // Posição no pódio. Empates compartilham o número (1, 2, 3, 3, 5, 5, 5, 5...).
  position: number
  label: string
}

function faseLabel(roundSize: number): string {
  if (roundSize <= 2) return 'perdeu a final'
  if (roundSize <= 4) return 'caiu na semifinal'
  if (roundSize <= 8) return 'caiu nas quartas'
  if (roundSize <= 16) return 'caiu nas oitavas'
  return `caiu na rodada de ${roundSize}`
}

// Num mata-mata a classificação é por quão longe cada um chegou: o campeão,
// depois quem perdeu a final, depois os semifinalistas (empatados), e assim por
// diante. Quem cai na mesma fase divide a mesma posição.
export function computeStandings(state: TournamentState): Standing[] {
  const standings: Standing[] = []

  if (state.champion) {
    // A tela ajusta para "campeã" quando o nome é feminino.
    standings.push({ id: state.champion, position: 1, label: 'campeão' })
  }

  const porRodada = new Map<number, Elimination[]>()
  for (const eliminado of state.eliminated ?? []) {
    const grupo = porRodada.get(eliminado.round) ?? []
    grupo.push(eliminado)
    porRodada.set(eliminado.round, grupo)
  }

  // Rodadas mais altas primeiro: quem caiu por último chegou mais longe.
  const rodadas = [...porRodada.keys()].sort((a, b) => b - a)
  for (const rodada of rodadas) {
    const grupo = porRodada.get(rodada)!
    const position = standings.length + 1
    for (const eliminado of grupo) {
      standings.push({ id: eliminado.id, position, label: faseLabel(eliminado.roundSize) })
    }
  }

  return standings
}
