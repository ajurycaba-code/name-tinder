// Pronúncia dos nomes usando a síntese de voz do próprio navegador
// (Web Speech API). Não depende de nenhum serviço externo.

export type SpeechLang = 'pt-BR' | 'en-US' | 'es-US'

// Ordem de preferência de voz por idioma, da melhor para a aceitável. Cada sistema
// instala um conjunto diferente de vozes, então pedir só um código exato falha com
// frequência. No espanhol, as variantes da América Latina vêm antes da europeia:
// é o espanhol que a criança ouviria no dia a dia daqui.
const PREFERENCIA_DE_VOZ: Record<SpeechLang, string[]> = {
  'pt-BR': ['pt-br', 'pt-pt'],
  'en-US': ['en-us', 'en-gb'],
  'es-US': ['es-us', 'es-mx', 'es-419', 'es-es'],
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function tag(voice: SpeechSynthesisVoice): string {
  return voice.lang.replace('_', '-').toLowerCase()
}

function pickVoice(lang: SpeechLang): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()

  for (const desejada of PREFERENCIA_DE_VOZ[lang]) {
    const exata = voices.find((voice) => tag(voice) === desejada)
    if (exata) return exata
  }

  // Última tentativa: qualquer voz do mesmo idioma, qualquer que seja a região.
  const prefixo = lang.slice(0, 2).toLowerCase()
  return voices.find((voice) => tag(voice).startsWith(prefixo))
}

export function speakName(name: string, lang: SpeechLang) {
  if (!speechSupported()) return

  // Corta qualquer fala anterior, para não empilhar se tocar nos dois botões.
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(name)
  utterance.lang = lang
  // Um pouco mais devagar que o padrão: é um nome solto, não uma frase.
  utterance.rate = 0.85

  const voice = pickVoice(lang)
  if (voice) utterance.voice = voice

  window.speechSynthesis.speak(utterance)
}

// Busca no Google Imagens por pessoas conhecidas com aquele nome. Preferimos o
// link a embutir fotos: nada é baixado até a pessoa realmente querer ver.
export function famousImagesUrl(name: string): string {
  const query = `"${name}" famosos`
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
}
