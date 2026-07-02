import { useState } from 'react'
import type { Gender, NameEntry } from '../data/names'

interface Props {
  onAdd: (entry: NameEntry) => void
  existingIds: Set<string>
}

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AddNameScreen({ onAdd, existingIds }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('F')
  const [origin, setOrigin] = useState('')
  const [meaning, setMeaning] = useState('')
  const [fact, setFact] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    const id = `custom-${gender.toLowerCase()}-${slugify(trimmed)}`
    if (existingIds.has(id)) {
      setMessage('Esse nome já está na lista!')
      return
    }

    onAdd({
      id,
      name: trimmed,
      gender,
      rank: 0,
      origin: origin.trim() || 'Sugestão do casal',
      meaning: meaning.trim() || 'Sem significado cadastrado ainda',
      fact: fact.trim() || 'Nome sugerido manualmente — sem curiosidade cadastrada.',
      custom: true,
    })

    setName('')
    setOrigin('')
    setMeaning('')
    setFact('')
    setMessage(`"${trimmed}" adicionado à lista! Ele já vai aparecer no swipe de vocês dois.`)
  }

  return (
    <div className="screen">
      <h2 className="screen-title">➕ Adicionar nome</h2>
      <p className="screen-subtitle">Não achou o nome perfeito na lista? Adicione o de vocês!</p>

      <form className="add-form" onSubmit={handleSubmit}>
        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maitê" required />
        </label>

        <div className="gender-toggle">
          <button
            type="button"
            className={`gender-btn ${gender === 'F' ? 'gender-btn-active-f' : ''}`}
            onClick={() => setGender('F')}
          >
            ♀ Menina
          </button>
          <button
            type="button"
            className={`gender-btn ${gender === 'M' ? 'gender-btn-active-m' : ''}`}
            onClick={() => setGender('M')}
          >
            ♂ Menino
          </button>
        </div>

        <label>
          Origem (opcional)
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ex: Hebraico, Tupi..." />
        </label>

        <label>
          Significado (opcional)
          <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Ex: Aquele que é amado" />
        </label>

        <label>
          Curiosidade / estatística (opcional)
          <textarea
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            placeholder="Ex: É o nome da avó da Fabiana"
            rows={3}
          />
        </label>

        <button type="submit" className="primary-btn">
          Adicionar à lista
        </button>

        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  )
}
