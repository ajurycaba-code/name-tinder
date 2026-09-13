import type { NameEntry } from '../data/names'
import type { AllDecisions, Decision } from '../types'

function decisionsOf(entry: NameEntry, decisions: AllDecisions, parentIds: string[]) {
  return parentIds.map((id) => decisions[id]?.[entry.id])
}

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

// Um "talvez" é um nome que os dois já avaliaram, ninguém vetou, mas pelo menos
// um deles marcou "tanto faz" — ou seja, continua na disputa sem ser um sim.
export function computeMaybes(
  allNames: NameEntry[],
  decisions: AllDecisions,
  parentIds: string[],
): NameEntry[] {
  if (parentIds.length < 2) return []
  return allNames.filter((entry) => {
    const taken = decisionsOf(entry, decisions, parentIds)
    if (taken.some((decision) => decision === undefined)) return false
    if (taken.some((decision) => decision === 'dislike')) return false
    return taken.some((decision) => decision === 'neutral')
  })
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
