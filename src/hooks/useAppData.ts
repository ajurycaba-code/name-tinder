import { useCallback, useEffect, useMemo, useState } from 'react'
import { BASE_NAMES, type NameEntry } from '../data/names'
import { repo, suggestionToEntry, type Snapshot } from '../data/repo'
import type { Decision, Profile, SuggestionInput } from '../types'
import { computeMatches, computeMaybes } from '../utils/matches'
import {
  clearProfile,
  legacyDecisionsFor,
  loadProfile,
  markMigrated,
  saveProfile,
  wasMigrated,
} from '../utils/storage'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface LoginInput {
  phone: string
  name?: string
  // Quando a pessoa se identifica como um dos pais, assume aquele perfil.
  parentName?: string
}

const EMPTY_SNAPSHOT: Snapshot = { profiles: [], decisions: {}, suggestions: [] }

export function useAppData() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile())
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await repo.loadSnapshot())
      setStatus('ready')
      setError(null)
    } catch (cause) {
      setStatus('error')
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Sobe para a nuvem, uma única vez por perfil, os swipes que já estavam
  // guardados só neste navegador antes de existir banco de dados.
  const migrateLegacyVotes = useCallback(async (target: Profile) => {
    if (repo.mode !== 'cloud' || target.role !== 'parent' || wasMigrated(target.id)) return
    const legacy = legacyDecisionsFor(target.name)
    if (Object.keys(legacy).length > 0) {
      await repo.saveVotesBulk(target.id, legacy)
    }
    markMigrated(target.id)
  }, [])

  const login = useCallback(
    async ({ phone, name, parentName }: LoginInput): Promise<Profile> => {
      const next = parentName
        ? await repo.claimParent(parentName, phone)
        : ((await repo.findProfileByPhone(phone)) ?? (await repo.createGuest(name ?? 'Convidado', phone)))

      saveProfile(next)
      setProfile(next)
      try {
        await migrateLegacyVotes(next)
      } catch {
        // Migração é um extra: se falhar, o app segue normalmente.
      }
      await refresh()
      return next
    },
    [migrateLegacyVotes, refresh],
  )

  const lookupPhone = useCallback((phone: string) => repo.findProfileByPhone(phone), [])

  const logout = useCallback(() => {
    clearProfile()
    setProfile(null)
  }, [])

  const decide = useCallback(
    (nameId: string, decision: Decision) => {
      if (!profile) return
      setSnapshot((prev) => ({
        ...prev,
        decisions: {
          ...prev.decisions,
          [profile.id]: { ...(prev.decisions[profile.id] ?? {}), [nameId]: decision },
        },
      }))
      void repo.saveVote(profile.id, nameId, decision).catch(() => {
        setError('Não deu para salvar esse voto na nuvem. Confira a conexão.')
      })
    },
    [profile],
  )

  const undoDecide = useCallback(
    (nameId: string) => {
      if (!profile) return
      setSnapshot((prev) => {
        const forProfile = { ...(prev.decisions[profile.id] ?? {}) }
        delete forProfile[nameId]
        return { ...prev, decisions: { ...prev.decisions, [profile.id]: forProfile } }
      })
      void repo.deleteVote(profile.id, nameId).catch(() => {
        setError('Não deu para desfazer na nuvem. Confira a conexão.')
      })
    },
    [profile],
  )

  const addSuggestion = useCallback(
    async (input: SuggestionInput) => {
      if (!profile) throw new Error('Faça login antes de sugerir um nome.')
      const created = await repo.addSuggestion(profile, input)
      setSnapshot((prev) => ({ ...prev, suggestions: [created, ...prev.suggestions] }))
      return created
    },
    [profile],
  )

  const removeSuggestion = useCallback(async (id: string) => {
    await repo.deleteSuggestion(id)
    setSnapshot((prev) => ({ ...prev, suggestions: prev.suggestions.filter((item) => item.id !== id) }))
  }, [])

  const parents = useMemo(
    () => snapshot.profiles.filter((candidate) => candidate.role === 'parent'),
    [snapshot.profiles],
  )

  const allNames = useMemo<NameEntry[]>(
    () => [...BASE_NAMES, ...snapshot.suggestions.map(suggestionToEntry)],
    [snapshot.suggestions],
  )

  const matches = useMemo(
    () => computeMatches(allNames, snapshot.decisions, parents.map((parent) => parent.id)),
    [allNames, snapshot.decisions, parents],
  )

  const maybes = useMemo(
    () => computeMaybes(allNames, snapshot.decisions, parents.map((parent) => parent.id)),
    [allNames, snapshot.decisions, parents],
  )

  // Nomes já curtidos por OUTRA pessoa — são os candidatos a virar match, então
  // ganham prioridade no baralho de quem ainda não avaliou.
  const likedByOthers = useMemo(() => {
    const ids = new Set<string>()
    if (!profile) return ids
    for (const [otherId, votes] of Object.entries(snapshot.decisions)) {
      if (otherId === profile.id) continue
      for (const [nameId, decision] of Object.entries(votes)) {
        if (decision === 'like') ids.add(nameId)
      }
    }
    return ids
  }, [snapshot.decisions, profile])

  // Quantas pessoas curtiram cada nome (usado no placar da torcida).
  const likesByNameId = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const forProfile of Object.values(snapshot.decisions)) {
      for (const [nameId, decision] of Object.entries(forProfile)) {
        if (decision === 'like') counts[nameId] = (counts[nameId] ?? 0) + 1
      }
    }
    return counts
  }, [snapshot.decisions])

  return {
    mode: repo.mode,
    status,
    error,
    profile,
    profiles: snapshot.profiles,
    parents,
    decisions: snapshot.decisions,
    suggestions: snapshot.suggestions,
    allNames,
    matches,
    maybes,
    likedByOthers,
    likesByNameId,
    login,
    lookupPhone,
    logout,
    decide,
    undoDecide,
    addSuggestion,
    removeSuggestion,
    refresh,
  }
}
