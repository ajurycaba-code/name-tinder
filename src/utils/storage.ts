import { BASE_NAMES, type Gender, type NameEntry } from '../data/names'
import type { AllDecisions, Player, StoredState } from '../types'
import type { TournamentState } from './tournament'

const DECISIONS_KEY = 'nt_decisions_v1'
const CUSTOM_NAMES_KEY = 'nt_custom_names_v1'
const CURRENT_PLAYER_KEY = 'nt_current_player_v1'
const LAST_SYNC_KEY = 'nt_last_sync_v1'
const TOURNAMENT_KEY = 'nt_tournament_v1'

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

export function loadCurrentPlayer(): Player | null {
  const raw = localStorage.getItem(CURRENT_PLAYER_KEY)
  return raw as Player | null
}

export function saveCurrentPlayer(player: Player) {
  localStorage.setItem(CURRENT_PLAYER_KEY, player)
}

export function loadLastSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY)
}

export function saveLastSync(iso: string) {
  localStorage.setItem(LAST_SYNC_KEY, iso)
}

export function getAllNames(customNames: NameEntry[]): NameEntry[] {
  return [...BASE_NAMES, ...customNames]
}

// --- Sincronização entre dispositivos (sem backend) ---
// Gera um código texto (base64) com as decisões e nomes customizados locais,
// para o parceiro colar no dispositivo dele e mesclar os dados.

export function exportSyncCode(state: StoredState): string {
  const json = JSON.stringify(state)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

export function parseSyncCode(code: string): StoredState {
  const binary = atob(code.trim())
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = new TextDecoder().decode(bytes)
  const parsed = JSON.parse(json)
  if (!parsed || typeof parsed !== 'object' || !parsed.decisions || !parsed.customNames) {
    throw new Error('Código inválido')
  }
  return parsed as StoredState
}

export function mergeDecisions(local: AllDecisions, incoming: AllDecisions): AllDecisions {
  const merged: AllDecisions = { ...local }
  for (const player of Object.keys(incoming)) {
    merged[player] = { ...(merged[player] ?? {}), ...incoming[player] }
  }
  return merged
}

export function mergeCustomNames(local: NameEntry[], incoming: NameEntry[]): NameEntry[] {
  const byId = new Map<string, NameEntry>()
  for (const n of local) byId.set(n.id, n)
  for (const n of incoming) if (!byId.has(n.id)) byId.set(n.id, n)
  return [...byId.values()]
}
