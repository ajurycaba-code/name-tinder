import { useState } from 'react'
import type { Gender } from '../data/names'
import type { AllDecisions, Profile, Suggestion, SuggestionInput } from '../types'

interface Props {
  profile: Profile
  suggestions: Suggestion[]
  decisions: AllDecisions
  likesByNameId: Record<string, number>
  onAdd: (input: SuggestionInput) => Promise<unknown>
  onRemove: (id: string) => Promise<void>
  onVote: (nameId: string) => void
  onUndoVote: (nameId: string) => void
}

const EMPTY_FORM = {
  name: '',
  gender: 'F' as Gender,
  origin: '',
  meaning: '',
  fact: '',
  note: '',
}

export function TorcidaScreen({
  profile,
  suggestions,
  decisions,
  likesByNameId,
  onAdd,
  onRemove,
  onVote,
  onUndoVote,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const myVotes = decisions[profile.id] ?? {}
  const isGuest = profile.role === 'guest'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) return

    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await onAdd({
        name,
        gender: form.gender,
        origin: form.origin.trim(),
        meaning: form.meaning.trim(),
        fact: form.fact.trim(),
        note: form.note.trim(),
      })
      setForm(EMPTY_FORM)
      setMessage(`"${name}" foi sugerido! Agora ele aparece no baralho da Fabiana e do Aju.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não deu para salvar a sugestão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <h2 className="screen-title">💌 Torcida</h2>
      <p className="screen-subtitle">
        {isGuest
          ? 'Sugira um nome para o bebê! Sua sugestão vai direto pro baralho da Fabiana e do Aju.'
          : 'Nomes sugeridos por amigos e família — todos já entram no baralho de vocês.'}
      </p>

      <form className="add-form" onSubmit={handleSubmit}>
        <label>
          Nome
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex: Maitê"
            required
          />
        </label>

        <div className="gender-toggle">
          <button
            type="button"
            className={`gender-btn ${form.gender === 'F' ? 'gender-btn-active-f' : ''}`}
            onClick={() => setForm({ ...form, gender: 'F' })}
          >
            ♀ Menina
          </button>
          <button
            type="button"
            className={`gender-btn ${form.gender === 'M' ? 'gender-btn-active-m' : ''}`}
            onClick={() => setForm({ ...form, gender: 'M' })}
          >
            ♂ Menino
          </button>
        </div>

        <label>
          Por que esse nome? <span className="fn-optional">(opcional)</span>
          <textarea
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            placeholder="Ex: era o nome da minha avó, sempre achei lindo"
            rows={2}
          />
        </label>

        <details className="torcida-more">
          <summary>Detalhes do nome (opcional)</summary>
          <label>
            Origem
            <input
              value={form.origin}
              onChange={(event) => setForm({ ...form, origin: event.target.value })}
              placeholder="Ex: Hebraico, Tupi..."
            />
          </label>
          <label>
            Significado
            <input
              value={form.meaning}
              onChange={(event) => setForm({ ...form, meaning: event.target.value })}
              placeholder="Ex: Aquele que é amado"
            />
          </label>
          <label>
            Curiosidade
            <input
              value={form.fact}
              onChange={(event) => setForm({ ...form, fact: event.target.value })}
              placeholder="Ex: é o nome de uma personagem que eu amo"
            />
          </label>
        </details>

        <button type="submit" className="primary-btn" disabled={busy || !form.name.trim()}>
          {busy ? 'Enviando…' : 'Sugerir esse nome'}
        </button>

        {message && <p className="form-message">{message}</p>}
        {error && <p className="form-error">{error}</p>}
      </form>

      <h3 className="torcida-heading">
        {suggestions.length === 0 ? 'Nenhuma sugestão ainda' : `Sugestões (${suggestions.length})`}
      </h3>

      {suggestions.length === 0 ? (
        <div className="empty-state">
          <p className="deck-empty-emoji">💌</p>
          <p>Seja a primeira pessoa a sugerir um nome!</p>
        </div>
      ) : (
        <ul className="torcida-list">
          {suggestions.map((suggestion) => {
            const liked = myVotes[suggestion.id] === 'like'
            const likes = likesByNameId[suggestion.id] ?? 0
            return (
              <li key={suggestion.id} className="torcida-item">
                <div className={`match-avatar ${suggestion.gender === 'F' ? 'badge-f' : 'badge-m'}`}>
                  {suggestion.gender === 'F' ? '♀' : '♂'}
                </div>

                <div className="torcida-body">
                  <p className="match-name">{suggestion.name}</p>
                  <p className="torcida-author">sugerido por {suggestion.authorName}</p>
                  {suggestion.note && <p className="torcida-note">“{suggestion.note}”</p>}
                  {suggestion.meaning && <p className="match-meaning">{suggestion.meaning}</p>}
                </div>

                <div className="torcida-actions">
                  <button
                    className={`torcida-like ${liked ? 'torcida-like-on' : ''}`}
                    onClick={() => (liked ? onUndoVote(suggestion.id) : onVote(suggestion.id))}
                    aria-label={liked ? 'Remover curtida' : 'Curtir'}
                  >
                    {liked ? '❤️' : '🤍'} {likes}
                  </button>
                  {suggestion.profileId === profile.id && (
                    <button
                      className="fn-remove-btn"
                      onClick={() => void onRemove(suggestion.id)}
                      aria-label="Remover sugestão"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
