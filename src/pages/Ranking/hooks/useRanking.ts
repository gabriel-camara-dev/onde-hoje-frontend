import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  getGlobalRanking,
  getTopPlaces,
  type GlobalRankingFilters,
  type MapFilters,
} from '../../../api/ondeHoje'
import { formatInputDate } from '../../../lib/date'
import { resolveCurrentCity, totalVotes } from '../helpers'

export type RankingFilters = {
  city: string
  state: string
  day: string
}

const today = formatInputDate(new Date())

export function useRanking() {
  const [filters, setFilters] = useState<RankingFilters>({ city: '', state: '', day: today })
  const [draftFilters, setDraftFilters] = useState<RankingFilters>(filters)

  useEffect(() => {
    resolveCurrentCity()
      .then((location) => {
        if (!location?.city) {
          return
        }

        const city = location.city

        setFilters((current) => ({
          ...current,
          city,
          state: location.state ?? current.state,
        }))
        setDraftFilters((current) => ({
          ...current,
          city,
          state: location.state ?? current.state,
        }))
      })
      .catch(() => {})
  }, [])

  const globalFilters: GlobalRankingFilters = {
    city: filters.city,
    state: filters.state,
  }
  const dayFilters: MapFilters = {
    city: filters.city,
    state: filters.state,
    day: filters.day,
    q: '',
  }

  const globalRankingQuery = useQuery({
    queryKey: ['global-ranking', globalFilters],
    queryFn: () => getGlobalRanking(globalFilters),
  })
  const dayRankingQuery = useQuery({
    queryKey: ['top-places', dayFilters],
    queryFn: () => getTopPlaces(dayFilters),
  })

  const globalPlaces = globalRankingQuery.data ?? []
  const dayPlaces = dayRankingQuery.data ?? []

  function changeDraft(patch: Partial<RankingFilters>) {
    setDraftFilters((current) => ({ ...current, ...patch }))
  }

  function submit() {
    setFilters({
      city: draftFilters.city.trim(),
      state: draftFilters.state.trim().toUpperCase(),
      day: draftFilters.day || today,
    })
  }

  return {
    draftFilters,
    changeDraft,
    submit,
    globalPlaces,
    dayPlaces,
    totalGlobalVotes: totalVotes(globalPlaces),
    totalDayVotes: totalVotes(dayPlaces),
    error: globalRankingQuery.error?.message ?? dayRankingQuery.error?.message,
    isLoading: globalRankingQuery.isLoading || dayRankingQuery.isLoading,
  }
}
