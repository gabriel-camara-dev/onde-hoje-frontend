import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { listMyVotes } from '../../../api/ondeHoje'
import { formatInputDate } from '../../../lib/date'
import { useUserStore } from '../../../stores/userStore'
import { dateOnly, groupVotesByDay } from '../helpers'

const today = new Date()
const defaultToDate = formatInputDate(today)
const defaultFromDate = formatInputDate(new Date(today.getTime() - 30 * 86_400_000))

export function useHistory() {
  const accessToken = useUserStore((state) => state.accessToken)
  const [range, setRange] = useState({ from: defaultFromDate, to: defaultToDate })

  const myVotesQuery = useQuery({
    enabled: Boolean(accessToken),
    queryKey: ['my-votes'],
    queryFn: listMyVotes,
  })

  const votes = useMemo(
    () =>
      (myVotesQuery.data ?? []).filter((vote) => {
        const day = dateOnly(vote.day)
        return day >= range.from && day <= range.to
      }),
    [myVotesQuery.data, range.from, range.to]
  )
  const history = useMemo(() => groupVotesByDay(votes), [votes])

  return {
    isLoggedIn: Boolean(accessToken),
    range,
    onRangeChange: setRange,
    totalVotes: votes.length,
    history,
    error: myVotesQuery.error?.message,
    isLoading: myVotesQuery.isLoading,
  }
}
