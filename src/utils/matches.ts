import type { NameEntry } from '../data/names'
import type { AllDecisions, Profile } from '../types'

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

interface ScoreboardOptions {
  // Inclui sugestões mesmo sem nenhuma curtida ainda — é o que a torcida vê,
  // para que um nome recém-sugerido já possa receber votos.
  includeAllSuggestions?: boolean
}

export function computeScoreboard(
  allNames: NameEntry[],
  decisions: AllDecisions,
  profiles: Profile[],
  options: ScoreboardOptions = {},
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

    if (likedBy.length === 0 && !(options.includeAllSuggestions && entry.custom)) continue

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

export interface ProfileCounts {
  liked: number
  neutral: number
  decided: number
  total: number
}

// Estatísticas de uma pessoa restritas a um conjunto de nomes — assim o placar
// pode mostrar números que batem com o filtro de gênero que está na tela.
export function countsFor(
  decisions: AllDecisions,
  profileId: string,
  names: NameEntry[],
): ProfileCounts {
  const votes = decisions[profileId] ?? {}
  let liked = 0
  let neutral = 0
  let decided = 0

  for (const entry of names) {
    const decision = votes[entry.id]
    if (!decision) continue
    decided++
    if (decision === 'like') liked++
    else if (decision === 'neutral') neutral++
  }

  return { liked, neutral, decided, total: names.length }
}
