import type { VoteType } from '../../../../@types/OndeHoje'
import { voteTypeOptions } from '../../homeVoteTypeOptions'

export function VoteTypeBadge({ voteType }: { voteType: VoteType }) {
  const option = voteTypeOptions.find((item) => item.value === voteType) ?? voteTypeOptions[0]
  const Icon = option.icon

  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${option.badgeClassName}`}
    >
      <Icon size={13} />
      {option.label}
    </span>
  )
}
