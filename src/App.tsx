import { useMemo, useState } from 'react'
import { CupScreen } from './components/CupScreen'
import { FullNameScreen } from './components/FullNameScreen'
import { LoginGate } from './components/LoginGate'
import { MatchesScreen } from './components/MatchesScreen'
import { NewNamesBanner } from './components/NewNamesBanner'
import { SwipeDeck } from './components/SwipeDeck'
import { TabBar, type Tab } from './components/TabBar'
import { TorcidaScreen } from './components/TorcidaScreen'
import { useAppData } from './hooks/useAppData'
import { buildOrderedNames, buildSwipeQueue, pendingSuggestions, type GenderFilter } from './utils/queue'

export default function App() {
  const data = useAppData()
  const [tab, setTab] = useState<Tab>('swipe')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [lastUndo, setLastUndo] = useState<string | null>(null)

  const orderedNames = useMemo(() => buildOrderedNames(data.allNames), [data.allNames])

  const queue = useMemo(
    () =>
      data.profile
        ? buildSwipeQueue(orderedNames, data.decisions, data.profile.id, genderFilter)
        : [],
    [orderedNames, data.decisions, data.profile, genderFilter],
  )

  const novidades = useMemo(
    () => (data.profile ? pendingSuggestions(data.allNames, data.decisions, data.profile.id) : []),
    [data.allNames, data.decisions, data.profile],
  )

  if (data.status === 'loading') {
    return (
      <div className="gate">
        <div className="gate-card">
          <p className="gate-emoji">👶</p>
          <p className="gate-subtitle">Carregando os nomes…</p>
        </div>
      </div>
    )
  }

  if (data.status === 'error') {
    return (
      <div className="gate">
        <div className="gate-card">
          <p className="gate-emoji">😕</p>
          <h1>Deu ruim na conexão</h1>
          <p className="gate-subtitle">{data.error}</p>
          <button className="gate-btn gate-btn-wide" onClick={() => void data.refresh()}>
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }

  if (!data.profile) {
    return <LoginGate mode={data.mode} onLogin={data.login} lookupPhone={data.lookupPhone} />
  }

  const profile = data.profile

  const header = (
    <header className="app-header">
      <div>
        <p className="app-title">👶 Name Tinder</p>
        <p className="app-player">
          {profile.role === 'parent' ? 'Jogando como ' : 'Torcida · '}
          <strong>{profile.name}</strong>
        </p>
      </div>
      <button className="switch-btn" onClick={data.logout}>
        Sair
      </button>
    </header>
  )

  const torcida = (
    <TorcidaScreen
      profile={profile}
      suggestions={data.suggestions}
      decisions={data.decisions}
      likesByNameId={data.likesByNameId}
      onAdd={data.addSuggestion}
      onRemove={data.removeSuggestion}
      onVote={(nameId) => data.decide(nameId, 'like')}
      onUndoVote={data.undoDecide}
    />
  )

  // Amigos e familiares só veem o módulo da torcida.
  if (profile.role === 'guest') {
    return (
      <div className="app">
        {header}
        {data.error && <p className="app-error">{data.error}</p>}
        <main className="app-main app-main-guest">{torcida}</main>
      </div>
    )
  }

  return (
    <div className="app">
      {header}
      {data.error && <p className="app-error">{data.error}</p>}

      {novidades.length > 0 && (
        <NewNamesBanner
          count={novidades.length}
          authors={novidades.map((entry) => entry.suggestedBy ?? '')}
          onGo={() => setTab('swipe')}
        />
      )}

      <main className="app-main">
        {tab === 'swipe' && (
          <div className="screen">
            <div className="gender-filter">
              {(['all', 'F', 'M'] as GenderFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={`filter-chip ${genderFilter === filter ? 'filter-chip-active' : ''}`}
                  onClick={() => setGenderFilter(filter)}
                >
                  {filter === 'all' ? 'Todos' : filter === 'F' ? '♀ Meninas' : '♂ Meninos'}
                </button>
              ))}
            </div>
            <p className="queue-count">{queue.length} nomes restantes</p>
            <SwipeDeck
              queue={queue}
              canUndo={Boolean(lastUndo)}
              onDecision={(entry, decision) => {
                data.decide(entry.id, decision)
                setLastUndo(entry.id)
              }}
              onUndo={() => {
                if (lastUndo) {
                  data.undoDecide(lastUndo)
                  setLastUndo(null)
                }
              }}
            />
          </div>
        )}

        {tab === 'matches' && (
          <MatchesScreen
            matches={data.matches}
            maybes={data.maybes}
            decisions={data.decisions}
            parents={data.parents}
            totalNames={data.allNames.length}
          />
        )}

        {tab === 'cup' && <CupScreen matches={data.matches} />}

        {tab === 'fullname' && <FullNameScreen matches={data.matches} />}

        {tab === 'torcida' && torcida}
      </main>

      <TabBar
        active={tab}
        onChange={setTab}
        matchCount={data.matches.length}
        newNamesCount={novidades.length}
      />
    </div>
  )
}
