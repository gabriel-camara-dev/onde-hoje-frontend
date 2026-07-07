import type { MapPlace } from '../../../../@types/OndeHoje'
import { Avatar } from '../../../../components/Avatar'
import { FriendshipButton } from '../../../../components/FriendshipButton'
import { VoteTypeBadge } from '../VoteTypeBadge'

type VotersListProps = {
  currentUserPublicId?: string
  isPending?: boolean
  onAddFriend: (username: string) => void
  requestedUsernames: Set<string>
  voters: MapPlace['voters']
}

export function VotersList({
  currentUserPublicId,
  isPending,
  onAddFriend,
  requestedUsernames,
  voters,
}: VotersListProps) {
  if (voters.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-panel">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase text-teal">Quem votou aqui</h3>
        <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
          {voters.length}
        </span>
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
        {voters.map((voter) => (
          <div
            key={voter.publicId}
            className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-line bg-surface-muted p-2.5"
          >
            <Avatar name={voter.name} src={voter.avatarUrl} className="size-11 rounded-lg" />
            <div className="min-w-0">
              <strong className="block truncate text-sm">{voter.name}</strong>
              {voter.username && (
                <span className="mt-0.5 block truncate text-xs font-medium text-teal">
                  @{voter.username}
                </span>
              )}
              <VoteTypeBadge voteType={voter.voteType} />
              {voter.note && <p className="mt-1 text-sm text-muted">{voter.note}</p>}
            </div>
            {voter.username && voter.publicId !== currentUserPublicId && (
              <FriendshipButton
                friendship={voter.friendship}
                isPending={isPending}
                requested={requestedUsernames.has(voter.username)}
                username={voter.username}
                onAddFriend={onAddFriend}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
