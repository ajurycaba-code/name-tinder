export type Tab = 'swipe' | 'matches' | 'cup' | 'fullname' | 'torcida'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  matchCount: number
  suggestionCount: number
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'swipe', label: 'Swipe', icon: '🔥' },
  { id: 'matches', label: 'Matches', icon: '💘' },
  { id: 'cup', label: 'Copa', icon: '🏆' },
  { id: 'fullname', label: 'Completo', icon: '🏷️' },
  { id: 'torcida', label: 'Torcida', icon: '💌' },
]

export function TabBar({ active, onChange, matchCount, suggestionCount }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => {
        const badge = tab.id === 'matches' ? matchCount : tab.id === 'torcida' ? suggestionCount : 0
        return (
          <button
            key={tab.id}
            className={`tab-btn ${active === tab.id ? 'tab-btn-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {badge > 0 && <span className="tab-badge">{badge}</span>}
          </button>
        )
      })}
    </nav>
  )
}
