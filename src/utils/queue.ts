import type { Gender, NameEntry } from '../data/names'
import type { AllDecisions } from '../types'

export type GenderFilter = 'all' | Gender

// Intercala nomes femininos e masculinos (por rank) para o baralho ficar equilibrado,
// e deixa os nomes sugeridos (pelo casal ou pela torcida) por último, também intercalados.
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

// Hash determinístico de uma string para um número entre 0 e 1. Serve de
// "sorteio estável": embaralha o baralho, mas sempre da mesma forma para a
// mesma pessoa, então a fila não fica pulando a cada recarga da página.
function sorteioEstavel(chave: string): number {
  let hash = 2166136261
  for (let i = 0; i < chave.length; i++) {
    hash ^= chave.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 100000) / 100000
}

// Quanto menor a pontuação, mais cedo o nome aparece.
const PESO_SUGESTAO = 2 // sugestões da torcida vão direto pra frente
const PESO_CURTIDO = 0.55 // curtido por outra pessoa: boa chance de vir cedo

export function buildSwipeQueue(
  orderedNames: NameEntry[],
  decisions: AllDecisions,
  profileId: string,
  genderFilter: GenderFilter,
  // Nomes que outra pessoa já curtiu — candidatos a virar match.
  curtidosPorOutros?: Set<string>,
): NameEntry[] {
  const profileDecisions = decisions[profileId] ?? {}
  const pendentes = orderedNames.filter((n) => {
    if (genderFilter !== 'all' && n.gender !== genderFilter) return false
    return !(n.id in profileDecisions)
  })

  return pendentes
    .map((entry) => {
      let pontuacao = sorteioEstavel(entry.id + profileId)
      if (entry.custom) pontuacao -= PESO_SUGESTAO
      else if (curtidosPorOutros?.has(entry.id)) pontuacao -= PESO_CURTIDO
      return { entry, pontuacao }
    })
    .sort((a, b) => a.pontuacao - b.pontuacao)
    .map((item) => item.entry)
}

// Sugestões que este perfil ainda não avaliou — vira o aviso de "novos nomes".
export function pendingSuggestions(
  allNames: NameEntry[],
  decisions: AllDecisions,
  profileId: string,
): NameEntry[] {
  const profileDecisions = decisions[profileId] ?? {}
  return allNames.filter((n) => n.custom && !(n.id in profileDecisions))
}
