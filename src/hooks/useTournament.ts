import { useCallback, useState } from 'react'
import type { Gender } from '../data/names'
import { loadTournaments, saveTournaments, type TournamentsByGender } from '../utils/storage'
import { createTournament, pickWinner, undoLastPick } from '../utils/tournament'

export function useTournament() {
  const [byGender, setByGender] = useState<TournamentsByGender>(() => loadTournaments())

  const start = useCallback((gender: Gender, ids: string[]) => {
    setByGender((prev) => {
      const next = { ...prev, [gender]: createTournament(ids) }
      saveTournaments(next)
      return next
    })
  }, [])

  const pick = useCallback((gender: Gender, winnerId: string) => {
    setByGender((prev) => {
      const current = prev[gender]
      if (!current) return prev
      const next = { ...prev, [gender]: pickWinner(current, winnerId) }
      saveTournaments(next)
      return next
    })
  }, [])

  const undo = useCallback((gender: Gender) => {
    setByGender((prev) => {
      const current = prev[gender]
      if (!current) return prev
      const next = { ...prev, [gender]: undoLastPick(current) }
      saveTournaments(next)
      return next
    })
  }, [])

  const reset = useCallback((gender: Gender) => {
    setByGender((prev) => {
      const next = { ...prev }
      delete next[gender]
      saveTournaments(next)
      return next
    })
  }, [])

  return { byGender, start, pick, undo, reset }
}
