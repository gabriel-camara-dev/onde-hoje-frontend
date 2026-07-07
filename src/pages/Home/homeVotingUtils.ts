import type { VoteHistoryItem } from '../../@types/OndeHoje'

export function countUserActiveVotesForDay(votes: VoteHistoryItem[] | undefined, day: string) {
  if (!votes) {
    return 0
  }

  return votes.filter((vote) => dateOnly(vote.day) === day).length
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
