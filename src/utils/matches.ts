import type { NameEntry } from '../data/names'
import type { AllDecisions, Decision, Profile } from '../types'

// Um match "cheio" é um nome curtido por TODOS os perfis do casal.
export function computeMatches(
  allNames: NameEntry[],
  decisions: AllDecisions,
  parentIds: string[],
): NameEntry[] {
  if (parentIds.length < 2) return []
  return allNames.filter((entry) => parentIds.every((id) => decisions[id]?.[entry.id] === 'like'))
}

// --- Placar dos nomes ---
// O "tanto faz" não vale como voto nem como veto: ele simplesmente não soma um
// like. Então um nome fica na lista com quantos likes tiver — dois se os dois
// curtiram, um se só uma pessoa curtiu — e some da lista se alguém do casal
// vetou (disse não) ou se ninguém curtiu.

export interface NameScore {
  entry: NameEntry
  likedBy: Profile[]
  parentLikes: number
  guestLikes: number
  // Todos os pais curtiram — o match completo.
  isFullMatch: boolean
}

export function computeScoreboard(
  allNames: NameEntry[],
  decisions: AllDecisions,
  profiles: Profile[],
): NameScore[] {
  const parents = profiles.filter((profile) => profile.role === 'parent')
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

  const scores: NameScore[] = []

  for (const entry of allNames) {
    // Veto do casal tira o nome da lista. O "não" da torcida não veta.
    if (parents.some((parent) => decisions[parent.id]?.[entry.id] === 'dislike')) continue

    const likedBy: Profile[] = []
    for (const [profileId, votes] of Object.entries(decisions)) {
      if (votes[entry.id] !== 'like') continue
      const profile = profileById.get(profileId)
      if (profile) likedBy.push(profile)
    }

    if (likedBy.length === 0) continue

    const parentLikes = likedBy.filter((profile) => profile.role === 'parent').length
    scores.push({
      entry,
      likedBy,
      parentLikes,
      guestLikes: likedBy.length - parentLikes,
      isFullMatch: parents.length >= 2 && parentLikes === parents.length,
    })
  }

  return scores.sort(
    (a, b) =>
      b.parentLikes - a.parentLikes ||
      b.guestLikes - a.guestLikes ||
      a.entry.name.localeCompare(b.entry.name, 'pt-BR'),
  )
}

function countOf(decisions: AllDecisions, profileId: string, wanted: Decision): number {
  return Object.values(decisions[profileId] ?? {}).filter((decision) => decision === wanted).length
}

export function likedCount(decisions: AllDecisions, profileId: string): number {
  return countOf(decisions, profileId, 'like')
}

export function neutralCount(decisions: AllDecisions, profileId: string): number {
  return countOf(decisions, profileId, 'neutral')
}

export function decidedCount(decisions: AllDecisions, profileId: string): number {
  return Object.keys(decisions[profileId] ?? {}).length
}
