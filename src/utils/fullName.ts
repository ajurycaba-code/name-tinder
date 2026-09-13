import type { Gender } from '../data/names'

export type SurnameSource = 'mae' | 'pai' | 'extra'

export interface SurnameOption {
  id: string
  word: string
  // Partícula que acompanha o sobrenome quando o casal escolhe usá-la (ex: "de" Sousa).
  particle?: string
  from: SurnameSource
}

// Sobrenomes dos pais: Fabiana Ferreira de Sousa e Ajurycaba Cortez de Lucena Júnior.
export const FAMILY_SURNAMES: SurnameOption[] = [
  { id: 'ferreira', word: 'Ferreira', from: 'mae' },
  { id: 'sousa', word: 'Sousa', particle: 'de', from: 'mae' },
  { id: 'cortez', word: 'Cortez', from: 'pai' },
  { id: 'lucena', word: 'Lucena', particle: 'de', from: 'pai' },
]

export const PARENT_LABELS: Record<Exclude<SurnameSource, 'extra'>, string> = {
  mae: 'Fabiana Ferreira de Sousa',
  pai: 'Ajurycaba Cortez de Lucena Júnior',
}

export type SurnameOrder = 'mae-primeiro' | 'pai-primeiro'

export interface FullNameDraft {
  firstName: string
  middleName: string
  surnameIds: string[]
  useParticles: boolean
  order: SurnameOrder
}

export const EMPTY_DRAFT: FullNameDraft = {
  firstName: '',
  middleName: '',
  surnameIds: ['ferreira', 'lucena'],
  useParticles: true,
  order: 'mae-primeiro',
}

// Atalhos com as combinações mais comuns no registro civil brasileiro.
export const DRAFT_PRESETS: { id: string; label: string; surnameIds: string[]; order: SurnameOrder }[] = [
  { id: 'tradicional', label: 'Tradicional', surnameIds: ['ferreira', 'lucena'], order: 'mae-primeiro' },
  { id: 'completo', label: 'Completo', surnameIds: ['ferreira', 'sousa', 'cortez', 'lucena'], order: 'mae-primeiro' },
  { id: 'so-pai', label: 'Só do pai', surnameIds: ['cortez', 'lucena'], order: 'pai-primeiro' },
  { id: 'so-mae', label: 'Só da mãe', surnameIds: ['ferreira', 'sousa'], order: 'mae-primeiro' },
]

export function orderedSurnames(draft: FullNameDraft, available: SurnameOption[]): SurnameOption[] {
  const selected = available.filter((option) => draft.surnameIds.includes(option.id))
  const groups: SurnameSource[] =
    draft.order === 'mae-primeiro' ? ['mae', 'pai', 'extra'] : ['pai', 'mae', 'extra']
  return groups.flatMap((group) => selected.filter((option) => option.from === group))
}

export function composeFullName(draft: FullNameDraft, available: SurnameOption[]): string {
  const parts = [draft.firstName.trim(), draft.middleName.trim()].filter(Boolean)
  for (const surname of orderedSurnames(draft, available)) {
    parts.push(draft.useParticles && surname.particle ? `${surname.particle} ${surname.word}` : surname.word)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

const PARTICLE_WORDS = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'di', 'du'])

export function initialsOf(fullName: string): string {
  const letters = fullName
    .split(/\s+/)
    .filter((word) => word && !PARTICLE_WORDS.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
  return letters.length ? `${letters.join('.')}.` : ''
}

export function wordCount(fullName: string): number {
  return fullName.split(/\s+/).filter(Boolean).length
}

// --- Nomes completos salvos ---

export interface SavedFullName {
  id: string
  fullName: string
  gender: Gender | null
  createdAt: string
}

const SAVED_KEY = 'nt_full_names_v1'
const EXTRA_SURNAMES_KEY = 'nt_extra_surnames_v1'

export function loadExtraSurnames(): SurnameOption[] {
  try {
    const raw = localStorage.getItem(EXTRA_SURNAMES_KEY)
    return raw ? (JSON.parse(raw) as SurnameOption[]) : []
  } catch {
    return []
  }
}

export function saveExtraSurnames(list: SurnameOption[]) {
  localStorage.setItem(EXTRA_SURNAMES_KEY, JSON.stringify(list))
}

export function loadSavedFullNames(): SavedFullName[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    return raw ? (JSON.parse(raw) as SavedFullName[]) : []
  } catch {
    return []
  }
}

export function saveFullNames(list: SavedFullName[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list))
}
