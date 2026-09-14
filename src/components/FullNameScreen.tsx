import { useMemo, useState } from 'react'
import type { Gender, NameEntry } from '../data/names'
import { useTournament } from '../hooks/useTournament'
import {
  composeFullName,
  DRAFT_PRESETS,
  EMPTY_DRAFT,
  FAMILY_SURNAMES,
  initialsOf,
  loadExtraSurnames,
  loadSavedFullNames,
  PARENT_LABELS,
  saveExtraSurnames,
  saveFullNames,
  wordCount,
  type FullNameDraft,
  type SavedFullName,
  type SurnameOption,
} from '../utils/fullName'

interface Props {
  // Nomes do placar — é de onde saem as sugestões de primeiro nome e de onde
  // o campeão da copa precisa ser encontrado.
  names: NameEntry[]
}

const GENDERS: { key: Gender; label: string; emoji: string }[] = [
  { key: 'F', label: 'Meninas', emoji: '♀' },
  { key: 'M', label: 'Meninos', emoji: '♂' },
]

function slugifyExtra(word: string) {
  return `extra-${word
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`
}

export function FullNameScreen({ names }: Props) {
  const { byGender } = useTournament()
  const [gender, setGender] = useState<Gender>('F')
  const [draft, setDraft] = useState<FullNameDraft>(EMPTY_DRAFT)
  const [extras, setExtras] = useState<SurnameOption[]>(() => loadExtraSurnames())
  const [saved, setSaved] = useState<SavedFullName[]>(() => loadSavedFullNames())
  const [newSurname, setNewSurname] = useState('')

  const available = useMemo(() => [...FAMILY_SURNAMES, ...extras], [extras])
  const fullName = composeFullName(draft, available)

  const championId = byGender[gender]?.champion ?? null
  const suggestions = useMemo(() => {
    const forGender = names.filter((entry) => entry.gender === gender)
    const champion = forGender.find((entry) => entry.id === championId)
    const rest = forGender.filter((entry) => entry.id !== championId)
    return champion ? [champion, ...rest] : rest
  }, [names, gender, championId])

  function update(patch: Partial<FullNameDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function toggleSurname(id: string) {
    setDraft((prev) => ({
      ...prev,
      surnameIds: prev.surnameIds.includes(id)
        ? prev.surnameIds.filter((current) => current !== id)
        : [...prev.surnameIds, id],
    }))
  }

  function addExtraSurname() {
    const word = newSurname.trim()
    if (!word) return
    const option: SurnameOption = { id: slugifyExtra(word), word, from: 'extra' }
    if (available.some((current) => current.id === option.id)) {
      setNewSurname('')
      return
    }
    const next = [...extras, option]
    setExtras(next)
    saveExtraSurnames(next)
    setDraft((prev) => ({ ...prev, surnameIds: [...prev.surnameIds, option.id] }))
    setNewSurname('')
  }

  function handleSave() {
    if (!fullName || !draft.firstName.trim()) return
    if (saved.some((item) => item.fullName === fullName)) return
    const next = [
      { id: `${Date.now()}`, fullName, gender, createdAt: new Date().toISOString() },
      ...saved,
    ]
    setSaved(next)
    saveFullNames(next)
  }

  function handleRemove(id: string) {
    const next = saved.filter((item) => item.id !== id)
    setSaved(next)
    saveFullNames(next)
  }

  const alreadySaved = Boolean(fullName) && saved.some((item) => item.fullName === fullName)

  return (
    <div className="screen">
      <h2 className="screen-title">🏷️ Nome completo</h2>
      <p className="screen-subtitle">
        Junte o primeiro nome com os sobrenomes da família e veja como fica no registro.
      </p>

      <div className="gender-filter">
        {GENDERS.map((option) => (
          <button
            key={option.key}
            className={`filter-chip ${gender === option.key ? 'filter-chip-active' : ''}`}
            onClick={() => setGender(option.key)}
          >
            {option.emoji} {option.label}
          </button>
        ))}
      </div>

      <div className="fn-preview">
        <p className="fn-preview-label">Como vai ficar</p>
        <p className="fn-preview-name">
          {draft.firstName.trim() ? fullName : 'Escolha um primeiro nome'}
        </p>
        {fullName && draft.firstName.trim() && (
          <p className="fn-preview-meta">
            {initialsOf(fullName)} · {wordCount(fullName)} palavras · {fullName.length} caracteres
          </p>
        )}
        <button className="primary-btn" onClick={handleSave} disabled={!draft.firstName.trim() || alreadySaved}>
          {alreadySaved ? '✓ Já está salvo' : '💾 Salvar esse'}
        </button>
      </div>

      <section className="fn-section">
        <label className="fn-label" htmlFor="fn-first">
          Primeiro nome
        </label>
        <input
          id="fn-first"
          className="fn-input"
          value={draft.firstName}
          onChange={(event) => update({ firstName: event.target.value })}
          placeholder="Ex: Alice"
        />
        {suggestions.length > 0 && (
          <div className="fn-chips">
            {suggestions.slice(0, 12).map((entry) => (
              <button
                key={entry.id}
                className={`fn-chip ${draft.firstName === entry.name ? 'fn-chip-active' : ''}`}
                onClick={() => update({ firstName: entry.name })}
              >
                {entry.id === championId ? '🏆 ' : ''}
                {entry.name}
              </button>
            ))}
          </div>
        )}
        {suggestions.length === 0 && (
          <p className="fn-hint">
            Nenhum nome de {gender === 'F' ? 'menina' : 'menino'} no placar ainda — digite à mão.
          </p>
        )}
      </section>

      <section className="fn-section">
        <label className="fn-label" htmlFor="fn-middle">
          Nome do meio <span className="fn-optional">(opcional)</span>
        </label>
        <input
          id="fn-middle"
          className="fn-input"
          value={draft.middleName}
          onChange={(event) => update({ middleName: event.target.value })}
          placeholder="Ex: Maria"
        />
      </section>

      <section className="fn-section">
        <p className="fn-label">Sobrenomes</p>

        {(['mae', 'pai'] as const).map((source) => (
          <div key={source} className="fn-surname-group">
            <p className="fn-group-label">
              {source === 'mae' ? 'Da mãe' : 'Do pai'} · <span>{PARENT_LABELS[source]}</span>
            </p>
            <div className="fn-chips">
              {available
                .filter((option) => option.from === source)
                .map((option) => (
                  <button
                    key={option.id}
                    className={`fn-chip ${draft.surnameIds.includes(option.id) ? 'fn-chip-active' : ''}`}
                    onClick={() => toggleSurname(option.id)}
                  >
                    {option.word}
                  </button>
                ))}
            </div>
          </div>
        ))}

        {extras.length > 0 && (
          <div className="fn-surname-group">
            <p className="fn-group-label">Outros</p>
            <div className="fn-chips">
              {extras.map((option) => (
                <button
                  key={option.id}
                  className={`fn-chip ${draft.surnameIds.includes(option.id) ? 'fn-chip-active' : ''}`}
                  onClick={() => toggleSurname(option.id)}
                >
                  {option.word}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="fn-add-row">
          <input
            className="fn-input"
            value={newSurname}
            onChange={(event) => setNewSurname(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addExtraSurname()
            }}
            placeholder="Adicionar outro sobrenome"
          />
          <button className="fn-add-btn" onClick={addExtraSurname} disabled={!newSurname.trim()}>
            +
          </button>
        </div>
      </section>

      <section className="fn-section">
        <p className="fn-label">Ordem e estilo</p>
        <div className="gender-filter">
          <button
            className={`filter-chip ${draft.order === 'mae-primeiro' ? 'filter-chip-active' : ''}`}
            onClick={() => update({ order: 'mae-primeiro' })}
          >
            Mãe primeiro
          </button>
          <button
            className={`filter-chip ${draft.order === 'pai-primeiro' ? 'filter-chip-active' : ''}`}
            onClick={() => update({ order: 'pai-primeiro' })}
          >
            Pai primeiro
          </button>
        </div>
        <label className="fn-checkbox">
          <input
            type="checkbox"
            checked={draft.useParticles}
            onChange={(event) => update({ useParticles: event.target.checked })}
          />
          Usar &quot;de&quot; (de Sousa, de Lucena)
        </label>

        <p className="fn-label">Atalhos</p>
        <div className="fn-chips">
          {DRAFT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className="fn-chip"
              onClick={() => update({ surnameIds: preset.surnameIds, order: preset.order })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {saved.length > 0 && (
        <section className="fn-section">
          <p className="fn-label">Salvos ({saved.length})</p>
          <ul className="fn-saved-list">
            {saved.map((item) => (
              <li key={item.id} className="fn-saved-item">
                <div>
                  <p className="fn-saved-name">{item.fullName}</p>
                  <p className="fn-saved-meta">
                    {item.gender === 'F' ? '♀ Menina' : '♂ Menino'} · {initialsOf(item.fullName)}
                  </p>
                </div>
                <button className="fn-remove-btn" onClick={() => handleRemove(item.id)} aria-label="Remover">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
