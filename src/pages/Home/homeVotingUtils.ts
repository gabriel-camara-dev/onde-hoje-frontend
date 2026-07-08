import type { VoteHistoryItem } from '../../@types/OndeHoje'

export function countUserActiveVotesForDay(votes: VoteHistoryItem[] | undefined, day: string) {
  if (!votes) {
    return 0
  }

  return votes.filter((vote) => dateOnly(vote.day) === day).length
}

// Counts the user's votes within the Mon-Sun week that contains `day`,
// matching the backend weekly vote limit.
export function countUserActiveVotesForWeek(votes: VoteHistoryItem[] | undefined, day: string) {
  if (!votes) {
    return 0
  }

  const { start, end } = weekRange(day)

  return votes.filter((vote) => {
    const voteDay = dateOnly(vote.day)
    return voteDay >= start && voteDay <= end
  }).length
}

function weekRange(day: string) {
  const date = new Date(`${day}T00:00:00Z`)
  const offsetToMonday = (date.getUTCDay() + 6) % 7
  const start = new Date(date)
  start.setUTCDate(start.getUTCDate() - offsetToMonday)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)

  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function dateOnly(value: string) {
  return value.slice(0, 10)
}

export function addMonths(date: Date, months: number) {
  const nextDate = new Date(date)
  nextDate.setMonth(nextDate.getMonth() + months)
  return nextDate
}

export function isAllowedVoteDay(day: string, minDay: string, maxDay: string) {
  return day >= minDay && day <= maxDay
}
