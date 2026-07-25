export type Tab = 'swipe' | 'matches' | 'cup' | 'add' | 'sync'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  matchCount: number
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'swipe', label: 'Swipe', icon: '🔥' },
  { id: 'matches', label: 'Matches', icon: '💘' },
  { id: 'cup', label: 'Copa', icon: '🏆' },
  { id: 'add', label: 'Add nome', icon: '➕' },
  { id: 'sync', label: 'Sincronizar', icon: '🔄' },
]

export function TabBar({ active, onChange, matchCount }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${active === tab.id ? 'tab-btn-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.id === 'matches' && matchCount > 0 && <span className="tab-badge">{matchCount}</span>}
        </button>
      ))}
    </nav>
  )
}
