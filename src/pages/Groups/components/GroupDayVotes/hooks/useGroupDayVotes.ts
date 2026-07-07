import { useQuery } from '@tanstack/react-query'
import { getTopPlaces } from '../../../../../api/ondeHoje'
import { formatInputDate } from '../../../../../lib/date'

const today = formatInputDate(new Date())

export function useGroupDayVotes(groupId: string) {
  const query = useQuery({
    queryKey: ['group-day-votes', groupId, today],
    queryFn: () => getTopPlaces({ city: '', q: '', day: today, groupPublicId: groupId, limit: 20 }),
  })

  return {
    day: today,
    places: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message,
  }
}
