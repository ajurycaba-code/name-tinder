import type { Gender } from './data/names'

// 'neutral' = "tanto faz": não veta o nome nem o tira da disputa, mas não é um sim.
export type Decision = 'like' | 'dislike' | 'neutral'

// Mapa: nomeId -> decisão
export type PlayerDecisions = Record<string, Decision>

// Mapa: id do perfil -> decisões
export type AllDecisions = Record<string, PlayerDecisions>

export type ProfileRole = 'parent' | 'guest'

export interface Profile {
  id: string
  name: string
  phone: string | null
  role: ProfileRole
}

export interface Suggestion {
  id: string
  profileId: string | null
  authorName: string
  name: string
  gender: Gender
  origin: string
  meaning: string
  fact: string
  note: string
  createdAt: string
}

export interface SuggestionInput {
  name: string
  gender: Gender
  origin: string
  meaning: string
  fact: string
  note: string
}

// Nomes dos pais, usados tanto no modo local quanto para criar os perfis na nuvem.
export const PARENT_NAMES = ['Fabiana', 'Aju'] as const
export type ParentName = (typeof PARENT_NAMES)[number]

// No modo local (sem nuvem configurada) os dois perfis do casal têm id fixo igual
// ao nome, para continuar lendo os dados que já estavam salvos no navegador.
export const LOCAL_PROFILES: Profile[] = PARENT_NAMES.map((name) => ({
  id: name,
  name,
  phone: null,
  role: 'parent' as const,
}))
