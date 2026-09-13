import type { AllDecisions, Decision, Profile, Suggestion, SuggestionInput } from '../types'
import { LOCAL_PROFILES } from '../types'
import * as api from '../utils/supabase'
import { cloudEnabled } from '../utils/supabase'
import { loadCustomNames, loadDecisions, saveCustomNames, saveDecisions } from '../utils/storage'
import type { Gender, NameEntry } from './names'

export interface Snapshot {
  profiles: Profile[]
  decisions: AllDecisions
  suggestions: Suggestion[]
}

export interface Repo {
  mode: 'cloud' | 'local'
  loadSnapshot(): Promise<Snapshot>
  findProfileByPhone(phone: string): Promise<Profile | null>
  createGuest(name: string, phone: string): Promise<Profile>
  claimParent(parentName: string, phone: string): Promise<Profile>
  saveVote(profileId: string, nameId: string, decision: Decision): Promise<void>
  saveVotesBulk(profileId: string, decisions: Record<string, Decision>): Promise<void>
  deleteVote(profileId: string, nameId: string): Promise<void>
  addSuggestion(profile: Profile, input: SuggestionInput): Promise<Suggestion>
  deleteSuggestion(id: string): Promise<void>
}

// Um nome sugerido vira um card normal do baralho, marcado como "custom".
export function suggestionToEntry(suggestion: Suggestion): NameEntry {
  return {
    id: suggestion.id,
    name: suggestion.name,
    gender: suggestion.gender,
    rank: 0,
    origin: suggestion.origin || 'Sugestão da torcida',
    meaning: suggestion.meaning || 'Sem significado cadastrado ainda',
    fact: suggestion.fact || suggestion.note || 'Nome sugerido pela torcida.',
    custom: true,
    suggestedBy: suggestion.authorName || undefined,
  }
}

// ------------------------------------------------------------------
// Nuvem (Supabase)
// ------------------------------------------------------------------

interface ProfileRow {
  id: string
  name: string
  phone: string | null
  role: 'parent' | 'guest'
}

interface VoteRow {
  profile_id: string
  name_id: string
  decision: Decision
}

interface SuggestionRow {
  id: string
  profile_id: string | null
  name: string
  gender: Gender
  origin: string | null
  meaning: string | null
  fact: string | null
  note: string | null
  created_at: string
}

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, name: row.name, phone: row.phone, role: row.role }
}

const cloudRepo: Repo = {
  mode: 'cloud',

  async loadSnapshot() {
    const [profileRows, voteRows, suggestionRows] = await Promise.all([
      api.select<ProfileRow>('profiles'),
      api.select<VoteRow>('votes'),
      api.select<SuggestionRow>('suggestions', { order: 'created_at.desc' }),
    ])

    const profiles = profileRows.map(toProfile)
    const nameByProfileId = new Map(profiles.map((profile) => [profile.id, profile.name]))

    const decisions: AllDecisions = {}
    for (const vote of voteRows) {
      const current = decisions[vote.profile_id] ?? {}
      current[vote.name_id] = vote.decision
      decisions[vote.profile_id] = current
    }

    const suggestions: Suggestion[] = suggestionRows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      authorName: (row.profile_id && nameByProfileId.get(row.profile_id)) || 'Alguém da torcida',
      name: row.name,
      gender: row.gender,
      origin: row.origin ?? '',
      meaning: row.meaning ?? '',
      fact: row.fact ?? '',
      note: row.note ?? '',
      createdAt: row.created_at,
    }))

    return { profiles, decisions, suggestions }
  },

  async findProfileByPhone(phone) {
    const rows = await api.select<ProfileRow>('profiles', { phone: `eq.${phone}`, limit: '1' })
    return rows[0] ? toProfile(rows[0]) : null
  },

  async createGuest(name, phone) {
    const rows = await api.insert<ProfileRow>('profiles', { name, phone, role: 'guest' })
    return toProfile(rows[0])
  },

  async claimParent(parentName, phone) {
    const existing = await api.select<ProfileRow>('profiles', {
      name: `eq.${parentName}`,
      role: 'eq.parent',
      limit: '1',
    })

    const row = existing[0]
    if (!row) {
      const created = await api.insert<ProfileRow>('profiles', { name: parentName, phone, role: 'parent' })
      return toProfile(created[0])
    }

    if (row.phone && row.phone !== phone) {
      throw new Error(`O perfil de ${parentName} já está ligado a outro telefone.`)
    }

    const updated = await api.update<ProfileRow>('profiles', { id: `eq.${row.id}` }, { phone })
    return toProfile(updated[0] ?? row)
  },

  async saveVote(profileId, nameId, decision) {
    await api.upsert(
      'votes',
      { profile_id: profileId, name_id: nameId, decision, updated_at: new Date().toISOString() },
      'profile_id,name_id',
    )
  },

  async saveVotesBulk(profileId, decisions) {
    const now = new Date().toISOString()
    const rows = Object.entries(decisions).map(([nameId, decision]) => ({
      profile_id: profileId,
      name_id: nameId,
      decision,
      updated_at: now,
    }))
    if (rows.length === 0) return
    // Em blocos, para não estourar o tamanho da requisição.
    for (let i = 0; i < rows.length; i += 200) {
      await api.upsert('votes', rows.slice(i, i + 200), 'profile_id,name_id')
    }
  },

  async deleteVote(profileId, nameId) {
    await api.remove('votes', { profile_id: `eq.${profileId}`, name_id: `eq.${nameId}` })
  },

  async addSuggestion(profile, input) {
    const rows = await api.insert<SuggestionRow>('suggestions', {
      profile_id: profile.id,
      name: input.name,
      gender: input.gender,
      origin: input.origin,
      meaning: input.meaning,
      fact: input.fact,
      note: input.note,
    })
    const row = rows[0]
    return {
      id: row.id,
      profileId: row.profile_id,
      authorName: profile.name,
      name: row.name,
      gender: row.gender,
      origin: row.origin ?? '',
      meaning: row.meaning ?? '',
      fact: row.fact ?? '',
      note: row.note ?? '',
      createdAt: row.created_at,
    }
  },

  async deleteSuggestion(id) {
    await api.remove('suggestions', { id: `eq.${id}` })
    await api.remove('votes', { name_id: `eq.${id}` })
  },
}

// ------------------------------------------------------------------
// Local (navegador) — modo de reserva quando a nuvem não está configurada
// ------------------------------------------------------------------

function entryToSuggestion(entry: NameEntry): Suggestion {
  return {
    id: entry.id,
    profileId: null,
    authorName: entry.suggestedBy ?? 'Casal',
    name: entry.name,
    gender: entry.gender,
    origin: entry.origin,
    meaning: entry.meaning,
    fact: entry.fact,
    note: '',
    createdAt: new Date(0).toISOString(),
  }
}

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const localRepo: Repo = {
  mode: 'local',

  async loadSnapshot() {
    return {
      profiles: LOCAL_PROFILES,
      decisions: loadDecisions(),
      suggestions: loadCustomNames().map(entryToSuggestion),
    }
  },

  async findProfileByPhone() {
    return null
  },

  async createGuest(name) {
    throw new Error(`Modo local não tem cadastro de convidados (${name}).`)
  },

  async claimParent(parentName) {
    const profile = LOCAL_PROFILES.find((candidate) => candidate.name === parentName)
    if (!profile) throw new Error(`Perfil ${parentName} não existe no modo local.`)
    return profile
  },

  async saveVote(profileId, nameId, decision) {
    const decisions = loadDecisions()
    saveDecisions({ ...decisions, [profileId]: { ...(decisions[profileId] ?? {}), [nameId]: decision } })
  },

  async saveVotesBulk(profileId, incoming) {
    const decisions = loadDecisions()
    saveDecisions({ ...decisions, [profileId]: { ...(decisions[profileId] ?? {}), ...incoming } })
  },

  async deleteVote(profileId, nameId) {
    const decisions = loadDecisions()
    const forProfile = { ...(decisions[profileId] ?? {}) }
    delete forProfile[nameId]
    saveDecisions({ ...decisions, [profileId]: forProfile })
  },

  async addSuggestion(profile, input) {
    const entry: NameEntry = {
      id: `custom-${input.gender.toLowerCase()}-${slugify(input.name)}`,
      name: input.name,
      gender: input.gender,
      rank: 0,
      origin: input.origin || 'Sugestão do casal',
      meaning: input.meaning || 'Sem significado cadastrado ainda',
      fact: input.fact || input.note || 'Nome sugerido manualmente.',
      custom: true,
      suggestedBy: profile.name,
    }
    const current = loadCustomNames()
    if (current.some((candidate) => candidate.id === entry.id)) {
      throw new Error('Esse nome já está na lista!')
    }
    saveCustomNames([...current, entry])
    return entryToSuggestion(entry)
  },

  async deleteSuggestion(id) {
    saveCustomNames(loadCustomNames().filter((entry) => entry.id !== id))
  },
}

export const repo: Repo = cloudEnabled ? cloudRepo : localRepo
