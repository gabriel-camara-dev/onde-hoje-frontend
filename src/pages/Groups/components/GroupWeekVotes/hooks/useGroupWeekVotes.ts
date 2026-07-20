import { useQuery } from '@tanstack/react-query'
import { getMapHistory } from '../../../../../api/ondeHoje'
import { formatInputDate } from '../../../../../lib/date'
import type { MapHistoryDay } from '../../../../../@types/OndeHoje'

export const WEEK_DAYS = 7

/** The next 7 days starting today, as `YYYY-MM-DD`. */
function weekDayKeys() {
  const today = new Date()

  return Array.from({ length: WEEK_DAYS }, (_, offset) => {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)

    return formatInputDate(date)
  })
}

export function useGroupWeekVotes(groupId: string, enabled: boolean) {
  const days = weekDayKeys()
  const from = days[0]
  const to = days[days.length - 1]

  const query = useQuery({
    queryKey: ['group-week-votes', groupId, from, to],
    // Only fetched once the dialog opens — the group page itself doesn't need it.
    enabled,
    // memberVotes: a member voting on the public map still counts as group activity.
    queryFn: () =>
      getMapHistory({ city: '', day: from, q: '', groupPublicId: groupId, from, to, memberVotes: true }),
  })

  const votesByDay = new Map((query.data ?? []).map((entry) => [entry.day.slice(0, 10), entry]))

  // The endpoint only returns days that actually have votes, and orders them
  // newest-first (it serves the history view). Rebuild the full window in
  // chronological order so the dialog always shows all 7 days.
  const week: MapHistoryDay[] = days.map((day) => votesByDay.get(day) ?? { day, places: [] })

  return {
    week,
    totalVotes: week.reduce((total, day) => total + day.places.reduce((sum, place) => sum + place.voteCount, 0), 0),
    isLoading: query.isLoading,
    error: query.error?.message,
  }
}
