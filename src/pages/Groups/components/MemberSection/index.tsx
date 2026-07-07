import { Check, Trash2 } from 'lucide-react'
import type { FriendListItem } from '../../../../@types/OndeHoje'
import type { GroupMemberSummary } from '../../../../api/ondeHoje'
import { Avatar } from '../../../../components/Avatar'
import Button from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { FriendshipButton } from '../../../../components/FriendshipButton'

export function MemberSection({
  currentUserPublicId,
  friendByUsername,
  isRequestingFriend,
  members,
  onAccept,
  onRemove,
  onRequestFriend,
  requestedFriendUsernames,
  title,
}: {
  currentUserPublicId?: string
  friendByUsername: Map<string, FriendListItem>
  isRequestingFriend?: boolean
  members: GroupMemberSummary[]
  onAccept?: (username: string) => void
  onRemove?: (username: string) => void
  onRequestFriend: (username: string) => void
  requestedFriendUsernames: Set<string>
  title: string
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase text-muted">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {members.length === 0 ? (
          <EmptyState title="Nada aqui" description="Quando houver membros, eles aparecem nesta area." />
        ) : (
          members.map((member) => (
            <div
              key={member.user.publicId}
              className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-line p-3"
            >
              <Avatar
                name={member.user.name}
                src={member.user.avatarUrl}
                className="size-10 rounded-md"
              />
              <span className="min-w-0">
                <strong className="block truncate text-sm">{member.user.name}</strong>
                <small className="text-teal">@{member.user.username}</small>
              </span>
              <span className="inline-flex gap-2">
                {member.user.publicId !== currentUserPublicId && (
                  <FriendshipButton
                    friendship={friendByUsername.get(member.user.username)}
                    isPending={isRequestingFriend}
                    requested={requestedFriendUsernames.has(member.user.username)}
                    username={member.user.username}
                    onAddFriend={onRequestFriend}
                  />
                )}
                {onAccept && (
                  <Button
                    className="size-9 p-0"
                    type="button"
                    variant="secondary"
                    onClick={() => onAccept(member.user.username)}
                  >
                    <Check size={16} />
                  </Button>
                )}
                {onRemove && member.role !== 'OWNER' && (
                  <Button
                    className="size-9 p-0"
                    type="button"
                    variant="danger"
                    onClick={() => onRemove(member.user.username)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
