import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FriendListItem, MyGroup } from '../../../../../@types/OndeHoje'
import type { PublicGroupDetails } from '../../../../../api/ondeHoje'
import { normalizeSearch } from '../../../helpers'

export type ConfirmGroupAction =
  | { type: 'leave' }
  | { type: 'remove'; username: string; name: string }
  | null

export function useGroupDetailState({
  friends,
  group,
  inviteUrl,
  onInvite,
  onLeave,
  onRemove,
}: {
  friends: FriendListItem[]
  group: MyGroup | PublicGroupDetails
  inviteUrl: string
  onInvite?: (username: string) => void
  onLeave?: () => void
  onRemove?: (username: string) => void
}) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isFriendPickerOpen, setIsFriendPickerOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmGroupAction>(null)
  const [inviteFriendSearch, setInviteFriendSearch] = useState('')
  const activeMembers = useMemo(
    () => group.members.filter((member) => member.status === 'ACTIVE'),
    [group.members]
  )
  const pendingMembers = useMemo(
    () => group.members.filter((member) => member.status === 'PENDING'),
    [group.members]
  )
  const memberUsernames = useMemo(
    () => new Set(group.members.map((member) => member.user.username)),
    [group.members]
  )
  const inviteFriends = friends.filter((friendship) => {
    const username = friendship.friend.username

    if (friendship.status !== 'ACCEPTED' || !username || memberUsernames.has(username)) {
      return false
    }

    const query = normalizeSearch(inviteFriendSearch)

    return !query || normalizeSearch(`${friendship.friend.name} ${username}`).includes(query)
  })

  function confirmRemoveMember(username: string) {
    const member = group.members.find((item) => item.user.username === username)

    setConfirmAction({
      type: 'remove',
      username,
      name: member?.user.name ?? `@${username}`,
    })
  }

  function confirmActionSubmit() {
    if (!confirmAction) {
      return
    }

    if (confirmAction.type === 'leave') {
      onLeave?.()
    } else {
      onRemove?.(confirmAction.username)
    }

    setConfirmAction(null)
  }

  async function copyGroupId() {
    try {
      await navigator.clipboard.writeText(group.id)
      toast.success('ID do grupo copiado.')
    } catch {
      toast.error('Nao foi possivel copiar o ID agora.')
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Link do grupo copiado.')
    } catch {
      toast.error('Nao foi possivel copiar o link agora.')
    }
  }

  function callFriend(username: string) {
    onInvite?.(username)
  }

  return {
    activeMembers,
    callFriend,
    confirmAction,
    confirmActionSubmit,
    confirmRemoveMember,
    copyGroupId,
    copyInviteLink,
    inviteFriends,
    inviteFriendSearch,
    isFriendPickerOpen,
    isInviteModalOpen,
    pendingMembers,
    setConfirmAction,
    setInviteFriendSearch,
    setIsFriendPickerOpen,
    setIsInviteModalOpen,
  }
}
