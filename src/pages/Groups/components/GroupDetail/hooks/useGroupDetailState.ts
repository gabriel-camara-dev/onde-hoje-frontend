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
  const [confirmAction, setConfirmAction] = useState<ConfirmGroupAction>(null)
  const [inviteFriendSearch, setInviteFriendSearch] = useState('')
  const [selectedInviteUsernames, setSelectedInviteUsernames] = useState<Set<string>>(new Set())
  const activeMembers = useMemo(
    () => group.members.filter((member) => member.status === 'ACTIVE'),
    [group.members]
  )
  const pendingMembers = useMemo(
    () => group.members.filter((member) => member.status === 'PENDING'),
    [group.members]
  )
  const activeMemberUsernames = useMemo(
    () => new Set(activeMembers.map((member) => member.user.username)),
    [activeMembers]
  )
  const inviteFriends = friends.filter((friendship) => {
    const username = friendship.friend.username

    if (friendship.status !== 'ACCEPTED' || !username || activeMemberUsernames.has(username)) {
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

  function toggleInviteUsername(username: string) {
    setSelectedInviteUsernames((current) => {
      const next = new Set(current)

      if (next.has(username)) {
        next.delete(username)
      } else {
        next.add(username)
      }

      return next
    })
  }

  function sendSelectedInvites() {
    if (!onInvite || selectedInviteUsernames.size === 0) {
      return
    }

    for (const username of selectedInviteUsernames) {
      onInvite(username)
    }

    setSelectedInviteUsernames(new Set())
    setIsInviteModalOpen(false)
  }

  return {
    activeMembers,
    confirmAction,
    confirmActionSubmit,
    confirmRemoveMember,
    copyGroupId,
    copyInviteLink,
    inviteFriends,
    inviteFriendSearch,
    isInviteModalOpen,
    pendingMembers,
    selectedInviteUsernames,
    sendSelectedInvites,
    setConfirmAction,
    setInviteFriendSearch,
    setIsInviteModalOpen,
    toggleInviteUsername,
  }
}
