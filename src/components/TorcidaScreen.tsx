import { useMemo, useState } from 'react'
import type { Gender, NameEntry } from '../data/names'
import type { AllDecisions, Decision, Profile, SuggestionInput } from '../types'
import type { NameScore } from '../utils/matches'
import { SwipeDeck } from './SwipeDeck'

interface Props {
  profile: Profile
  // Todos os nomes em jogo: os que o casal curtiu + as sugestões da torcida.
  pool: NameScore[]
  decisions: AllDecisions
  // Sugestões feitas por esta pessoa — só ela pode apagar as próprias.
  mySuggestionIds: Set<string>
  onAdd: (input: SuggestionInput) => Promise<unknown>
  onRemove: (id: string) => Promise<void>
  onVote: (nameId: string, decision: Decision) => void
  onUndoVote: (nameId: string) => void
}

type Vista = 'lista' | 'swipe'

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
  pool,
  decisions,
  mySuggestionIds,
  onAdd,
  onRemove,
  onVote,
  onUndoVote,
}: Props) {
  const [vista, setVista] = useState<Vista>('lista')
  const [form, setForm] = useState(EMPTY_FORM)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastUndo, setLastUndo] = useState<string | null>(null)

  const myVotes = useMemo(() => decisions[profile.id] ?? {}, [decisions, profile.id])
  const isGuest = profile.role === 'guest'

  // No modo swipe só entram os nomes que esta pessoa ainda não avaliou.
  const queue = useMemo<NameEntry[]>(
    () => pool.filter((score) => !(score.entry.id in myVotes)).map((score) => score.entry),
    [pool, myVotes],
  )

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
          ? 'Curta os nomes que a Fabiana e o Aju estão considerando, e sugira os seus.'
          : 'Os nomes em jogo e as sugestões de amigos e família.'}
      </p>

      <div className="gender-filter">
        <button
          className={`filter-chip ${vista === 'lista' ? 'filter-chip-active' : ''}`}
          onClick={() => setVista('lista')}
        >
          📋 Lista
        </button>
        <button
          className={`filter-chip ${vista === 'swipe' ? 'filter-chip-active' : ''}`}
          onClick={() => setVista('swipe')}
        >
          🔥 Swipe
        </button>
      </div>

      {vista === 'swipe' ? (
        queue.length === 0 ? (
          <div className="empty-state">
            <p className="deck-empty-emoji">🎉</p>
            <p>Você já passou por todos os nomes!</p>
            <p className="deck-empty-hint">Volte na lista para rever ou mudar suas curtidas.</p>
          </div>
        ) : (
          <>
            <p className="queue-count">{queue.length} nomes para você opinar</p>
            <SwipeDeck
              queue={queue}
              allowNeutral={false}
              likeStamp="CURTI"
              hint="Arraste para a direita se curtir. Para a esquerda, só passa."
              canUndo={Boolean(lastUndo)}
              onDecision={(entry, decision) => {
                // Passar não veta nada: guardamos como "tanto faz" só para o
                // nome não voltar a aparecer para esta pessoa.
                onVote(entry.id, decision === 'like' ? 'like' : 'neutral')
                setLastUndo(entry.id)
              }}
              onUndo={() => {
                if (lastUndo) {
                  onUndoVote(lastUndo)
                  setLastUndo(null)
                }
              }}
            />
          </>
        )
      ) : (
        <>
          <form className="add-form" onSubmit={handleSubmit}>
            <label>
              Sugerir um nome
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
            {pool.length === 0 ? 'Nenhum nome em jogo ainda' : `Nomes em jogo (${pool.length})`}
          </h3>

          {pool.length === 0 ? (
            <div className="empty-state">
              <p className="deck-empty-emoji">💌</p>
              <p>Assim que a Fabiana e o Aju curtirem algum nome, ele aparece aqui.</p>
            </div>
          ) : (
            <ul className="torcida-list">
              {pool.map((score) => {
                const liked = myVotes[score.entry.id] === 'like'
                return (
                  <li key={score.entry.id} className="torcida-item">
                    <div
                      className={`match-avatar ${score.entry.gender === 'F' ? 'badge-f' : 'badge-m'}`}
                    >
                      {score.entry.gender === 'F' ? '♀' : '♂'}
                    </div>

                    <div className="torcida-body">
                      <p className="match-name">
                        {score.entry.name}
                        {score.isFullMatch && <span className="score-match-tag">💘 match</span>}
                      </p>
                      <p className="torcida-author">
                        {score.likedBy.length > 0
                          ? `curtido por ${score.likedBy.map((p) => p.name).join(' · ')}`
                          : 'ainda sem curtidas'}
                        {score.entry.suggestedBy ? ` · sugerido por ${score.entry.suggestedBy}` : ''}
                      </p>
                      {score.entry.meaning && <p className="match-meaning">{score.entry.meaning}</p>}
                    </div>

                    <div className="torcida-actions">
                      <button
                        className={`torcida-like ${liked ? 'torcida-like-on' : ''}`}
                        onClick={() =>
                          liked ? onUndoVote(score.entry.id) : onVote(score.entry.id, 'like')
                        }
                        aria-label={liked ? 'Remover curtida' : 'Curtir'}
                      >
                        {liked ? '❤️' : '🤍'} {score.likedBy.length}
                      </button>
                      {mySuggestionIds.has(score.entry.id) && (
                        <button
                          className="fn-remove-btn"
                          onClick={() => void onRemove(score.entry.id)}
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
        </>
      )}
    </div>
  )
}
