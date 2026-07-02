import type { NameEntry } from '../data/names'
import { PLAYERS, type AllDecisions } from '../types'

export function computeMatches(allNames: NameEntry[], decisions: AllDecisions): NameEntry[] {
  return allNames.filter((entry) => PLAYERS.every((player) => decisions[player]?.[entry.id] === 'like'))
}

export function likedCount(decisions: AllDecisions, player: string): number {
  const playerDecisions = decisions[player] ?? {}
  return Object.values(playerDecisions).filter((d) => d === 'like').length
}

export function decidedCount(decisions: AllDecisions, player: string): number {
  return Object.keys(decisions[player] ?? {}).length
}
