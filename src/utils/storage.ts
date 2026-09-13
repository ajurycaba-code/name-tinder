import { type Gender, type NameEntry } from '../data/names'
import type { AllDecisions, Profile } from '../types'
import type { TournamentState } from './tournament'

const DECISIONS_KEY = 'nt_decisions_v1'
const CUSTOM_NAMES_KEY = 'nt_custom_names_v1'
const PROFILE_KEY = 'nt_profile_v1'
const TOURNAMENT_KEY = 'nt_tournament_v1'
const MIGRATED_KEY = 'nt_cloud_migrated_v1'

export type TournamentsByGender = Partial<Record<Gender, TournamentState>>

export function loadTournaments(): TournamentsByGender {
  try {
    const raw = localStorage.getItem(TOURNAMENT_KEY)
    return raw ? (JSON.parse(raw) as TournamentsByGender) : {}
  } catch {
    return {}
  }
}

export function saveTournaments(state: TournamentsByGender) {
  localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(state))
}

export function loadDecisions(): AllDecisions {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY)
    return raw ? (JSON.parse(raw) as AllDecisions) : {}
  } catch {
    return {}
  }
}

export function saveDecisions(decisions: AllDecisions) {
  localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions))
}

export function loadCustomNames(): NameEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_NAMES_KEY)
    return raw ? (JSON.parse(raw) as NameEntry[]) : []
  } catch {
    return []
  }
}

export function saveCustomNames(names: NameEntry[]) {
  localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(names))
}

// --- Sessão: qual perfil está usando o app neste aparelho ---

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

// --- Migração única dos dados locais antigos para a nuvem ---

export function wasMigrated(profileId: string): boolean {
  try {
    const raw = localStorage.getItem(MIGRATED_KEY)
    const done = raw ? (JSON.parse(raw) as string[]) : []
    return done.includes(profileId)
  } catch {
    return false
  }
}

export function markMigrated(profileId: string) {
  try {
    const raw = localStorage.getItem(MIGRATED_KEY)
    const done = raw ? (JSON.parse(raw) as string[]) : []
    if (!done.includes(profileId)) {
      localStorage.setItem(MIGRATED_KEY, JSON.stringify([...done, profileId]))
    }
  } catch {
    localStorage.setItem(MIGRATED_KEY, JSON.stringify([profileId]))
  }
}

// Decisões antigas ficavam guardadas pelo nome do jogador ("Fabiana" / "Aju"),
// que no modo nuvem vira o id do perfil.
export function legacyDecisionsFor(playerName: string): Record<string, 'like' | 'dislike'> {
  return loadDecisions()[playerName] ?? {}
}
