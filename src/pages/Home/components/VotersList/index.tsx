import type { MapPlace } from '../../../../@types/OndeHoje'
import { Avatar } from '../../../../components/Avatar'
import { FriendshipButton } from '../../../../components/FriendshipButton'
import { voteTypeOptions } from '../../homeVoteTypeOptions'

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
    <section className="rounded-lg border border-line bg-surface-muted p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase text-muted">Quem votou aqui</h3>
        <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal">
          {voters.length}
        </span>
      </div>
      <div className="grid max-h-52 gap-1.5 overflow-y-auto pr-1">
        {voters.map((voter) => {
          const going = voter.going !== false
          const typeLabel = voteTypeOptions.find((option) => option.value === voter.voteType)?.label
          const meta = [voter.voteTime, typeLabel].filter(Boolean).join(' · ')

          return (
            <div
              key={voter.publicId}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5"
            >
              <Avatar name={voter.name} src={voter.avatarUrl} className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-sm">{voter.name}</strong>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      going
                        ? 'bg-teal-soft text-teal'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200'
                    }`}
                  >
                    {going ? 'vai' : 'não vai'}
                  </span>
                </div>
                <p className="truncate text-xs text-muted">
                  {voter.username && <span className="font-medium text-teal">@{voter.username}</span>}
                  {meta && (
                    <span>
                      {voter.username ? ' · ' : ''}
                      {meta}
                    </span>
                  )}
                </p>
                {voter.note && (
                  <p className="mt-0.5 truncate text-xs italic text-muted">&ldquo;{voter.note}&rdquo;</p>
                )}
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
          )
        })}
      </div>
    </section>
  )
}
