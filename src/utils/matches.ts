import type { NameEntry } from '../data/names'
import type { AllDecisions } from '../types'

// Um match é um nome curtido por TODOS os perfis do casal. Se ainda não existem
// dois pais cadastrados, não há match possível.
export function computeMatches(
  allNames: NameEntry[],
  decisions: AllDecisions,
  parentIds: string[],
): NameEntry[] {
  if (parentIds.length < 2) return []
  return allNames.filter((entry) => parentIds.every((id) => decisions[id]?.[entry.id] === 'like'))
}

export function likedCount(decisions: AllDecisions, profileId: string): number {
  return Object.values(decisions[profileId] ?? {}).filter((decision) => decision === 'like').length
}

export function decidedCount(decisions: AllDecisions, profileId: string): number {
  return Object.keys(decisions[profileId] ?? {}).length
}
