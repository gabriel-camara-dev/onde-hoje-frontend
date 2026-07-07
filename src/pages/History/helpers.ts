import type { VoteHistoryItem } from '../../@types/OndeHoje'

export type HistoryDay = {
  day: string
  votes: VoteHistoryItem[]
}

export function dateOnly(value: string) {
  return value.slice(0, 10)
}

export function groupVotesByDay(votes: VoteHistoryItem[]): HistoryDay[] {
  const groups = new Map<string, VoteHistoryItem[]>()

  for (const vote of votes) {
    const day = dateOnly(vote.day)
    groups.set(day, [...(groups.get(day) ?? []), vote])
  }

  return Array.from(groups.entries())
    .map(([day, dayVotes]) => ({ day, votes: dayVotes }))
    .sort((a, b) => b.day.localeCompare(a.day))
}
