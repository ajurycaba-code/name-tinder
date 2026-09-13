// Pronúncia dos nomes usando a síntese de voz do próprio navegador
// (Web Speech API). Não depende de nenhum serviço externo.

export type SpeechLang = 'pt-BR' | 'en-US'

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang: SpeechLang): SpeechSynthesisVoice | undefined {
  const wanted = lang.toLowerCase()
  const voices = window.speechSynthesis.getVoices()
  return (
    // Voz exatamente do idioma pedido (pt-BR, en-US)
    voices.find((voice) => voice.lang.replace('_', '-').toLowerCase() === wanted) ??
    // Senão, qualquer voz do mesmo idioma (pt-PT serve para português)
    voices.find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith(wanted.slice(0, 2)))
  )
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
