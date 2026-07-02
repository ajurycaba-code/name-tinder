import type { NameEntry } from './data/names'

export type Decision = 'like' | 'dislike'

// Mapa: nomeId -> decisão
export type PlayerDecisions = Record<string, Decision>

// Mapa: jogador -> decisões
export type AllDecisions = Record<string, PlayerDecisions>

export interface StoredState {
  decisions: AllDecisions
  customNames: NameEntry[]
}

export const PLAYERS = ['Fabiana', 'Aju'] as const
export type Player = (typeof PLAYERS)[number]
