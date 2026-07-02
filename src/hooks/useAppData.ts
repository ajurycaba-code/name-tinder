import { useCallback, useMemo, useState } from 'react'
import type { NameEntry } from '../data/names'
import type { AllDecisions, Decision, Player } from '../types'
import {
  getAllNames,
  loadCustomNames,
  loadDecisions,
  loadLastSync,
  mergeCustomNames,
  mergeDecisions,
  saveCustomNames,
  saveDecisions,
  saveLastSync,
} from '../utils/storage'

export function useAppData() {
  const [decisions, setDecisions] = useState<AllDecisions>(() => loadDecisions())
  const [customNames, setCustomNames] = useState<NameEntry[]>(() => loadCustomNames())
  const [lastSync, setLastSync] = useState<string | null>(() => loadLastSync())

  const allNames = useMemo(() => getAllNames(customNames), [customNames])

  const decide = useCallback((player: Player, nameId: string, decision: Decision) => {
    setDecisions((prev) => {
      const next: AllDecisions = { ...prev, [player]: { ...(prev[player] ?? {}), [nameId]: decision } }
      saveDecisions(next)
      return next
    })
  }, [])

  const undoDecide = useCallback((player: Player, nameId: string) => {
    setDecisions((prev) => {
      const playerDecisions = { ...(prev[player] ?? {}) }
      delete playerDecisions[nameId]
      const next: AllDecisions = { ...prev, [player]: playerDecisions }
      saveDecisions(next)
      return next
    })
  }, [])

  const addCustomName = useCallback((entry: NameEntry) => {
    setCustomNames((prev) => {
      const next = [...prev, entry]
      saveCustomNames(next)
      return next
    })
  }, [])

  const importSync = useCallback((incomingDecisions: AllDecisions, incomingCustomNames: NameEntry[]) => {
    setDecisions((prev) => {
      const next = mergeDecisions(prev, incomingDecisions)
      saveDecisions(next)
      return next
    })
    setCustomNames((prev) => {
      const next = mergeCustomNames(prev, incomingCustomNames)
      saveCustomNames(next)
      return next
    })
    const now = new Date().toISOString()
    saveLastSync(now)
    setLastSync(now)
  }, [])

  return { decisions, customNames, allNames, decide, undoDecide, addCustomName, importSync, lastSync }
}
