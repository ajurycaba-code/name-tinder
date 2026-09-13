import { useMemo, useState } from 'react'
import { AddNameScreen } from './components/AddNameScreen'
import { CupScreen } from './components/CupScreen'
import { FullNameScreen } from './components/FullNameScreen'
import { MatchesScreen } from './components/MatchesScreen'
import { PlayerGate } from './components/PlayerGate'
import { SwipeDeck } from './components/SwipeDeck'
import { SyncScreen } from './components/SyncScreen'
import { TabBar, type Tab } from './components/TabBar'
import { useAppData } from './hooks/useAppData'
import type { Player } from './types'
import { computeMatches } from './utils/matches'
import { buildOrderedNames, buildSwipeQueue, type GenderFilter } from './utils/queue'
import { loadCurrentPlayer, saveCurrentPlayer } from './utils/storage'

export default function App() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => loadCurrentPlayer())
  const [tab, setTab] = useState<Tab>('swipe')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [lastUndo, setLastUndo] = useState<string | null>(null)

  const { decisions, customNames, allNames, decide, undoDecide, addCustomName, importSync, lastSync } = useAppData()

  const orderedNames = useMemo(() => buildOrderedNames(allNames), [allNames])

  const queue = useMemo(
    () => (currentPlayer ? buildSwipeQueue(orderedNames, decisions, currentPlayer, genderFilter) : []),
    [orderedNames, decisions, currentPlayer, genderFilter],
  )

  const matches = useMemo(() => computeMatches(allNames, decisions), [allNames, decisions])

  function handleSelectPlayer(player: Player) {
    setCurrentPlayer(player)
    saveCurrentPlayer(player)
    setTab('swipe')
  }

  function handleSwitchPlayer() {
    setCurrentPlayer(null)
  }

  if (!currentPlayer) {
    return <PlayerGate onSelect={handleSelectPlayer} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-title">👶 Name Tinder</p>
          <p className="app-player">
            Jogando como <strong>{currentPlayer}</strong>
          </p>
        </div>
        <button className="switch-btn" onClick={handleSwitchPlayer}>
          Trocar
        </button>
      </header>

      <main className="app-main">
        {tab === 'swipe' && (
          <div className="screen">
            <div className="gender-filter">
              {(['all', 'F', 'M'] as GenderFilter[]).map((f) => (
                <button
                  key={f}
                  className={`filter-chip ${genderFilter === f ? 'filter-chip-active' : ''}`}
                  onClick={() => setGenderFilter(f)}
                >
                  {f === 'all' ? 'Todos' : f === 'F' ? '♀ Meninas' : '♂ Meninos'}
                </button>
              ))}
            </div>
            <p className="queue-count">{queue.length} nomes restantes</p>
            <SwipeDeck
              queue={queue}
              canUndo={Boolean(lastUndo)}
              onDecision={(entry, decision) => {
                decide(currentPlayer, entry.id, decision)
                setLastUndo(entry.id)
              }}
              onUndo={() => {
                if (lastUndo) {
                  undoDecide(currentPlayer, lastUndo)
                  setLastUndo(null)
                }
              }}
            />
          </div>
        )}

        {tab === 'matches' && (
          <MatchesScreen matches={matches} decisions={decisions} totalNames={allNames.length} />
        )}

        {tab === 'cup' && <CupScreen matches={matches} />}

        {tab === 'fullname' && <FullNameScreen matches={matches} />}

        {tab === 'add' && (
          <AddNameScreen onAdd={addCustomName} existingIds={new Set(allNames.map((n) => n.id))} />
        )}

        {tab === 'sync' && (
          <SyncScreen decisions={decisions} customNames={customNames} onImport={importSync} lastSync={lastSync} />
        )}
      </main>

      <TabBar active={tab} onChange={setTab} matchCount={matches.length} />
    </div>
  )
}
