import type { Gender, NameEntry } from '../data/names'
import type { AllDecisions, Player } from '../types'

export type GenderFilter = 'all' | Gender

// Intercala nomes femininos e masculinos (por rank) para o baralho ficar equilibrado,
// e deixa os nomes sugeridos pelo casal (custom) por último, também intercalados.
export function buildOrderedNames(allNames: NameEntry[]): NameEntry[] {
  const base = allNames.filter((n) => !n.custom)
  const custom = allNames.filter((n) => n.custom)

  const interleave = (list: NameEntry[]) => {
    const female = list.filter((n) => n.gender === 'F').sort((a, b) => a.rank - b.rank)
    const male = list.filter((n) => n.gender === 'M').sort((a, b) => a.rank - b.rank)
    const out: NameEntry[] = []
    const max = Math.max(female.length, male.length)
    for (let i = 0; i < max; i++) {
      if (female[i]) out.push(female[i])
      if (male[i]) out.push(male[i])
    }
    return out
  }

  return [...interleave(base), ...interleave(custom)]
}

export function buildSwipeQueue(
  orderedNames: NameEntry[],
  decisions: AllDecisions,
  player: Player,
  genderFilter: GenderFilter,
): NameEntry[] {
  const playerDecisions = decisions[player] ?? {}
  return orderedNames.filter((n) => {
    if (genderFilter !== 'all' && n.gender !== genderFilter) return false
    return !(n.id in playerDecisions)
  })
}
