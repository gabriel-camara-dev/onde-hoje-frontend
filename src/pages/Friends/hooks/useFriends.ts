import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  acceptFriendship,
  listFriends,
  rejectFriendship,
  removeFriendship,
  requestFriendship,
} from '../../../api/ondeHoje'
import { useUserStore } from '../../../stores/userStore'

export function useFriends() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const handledInviteLinkRef = useRef(false)
  const user = useUserStore((state) => state.user)

  const friendsQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['friends'],
    queryFn: listFriends,
  })

  function invalidateFriends() {
    queryClient.invalidateQueries({ queryKey: ['friends'] })
  }

  const requestMutation = useMutation({
    mutationFn: requestFriendship,
    onSuccess: () => {
      invalidateFriends()
      toast.success('Solicitacao de amizade enviada.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const acceptMutation = useMutation({
    mutationFn: acceptFriendship,
    onSuccess: () => {
      invalidateFriends()
      toast.success('Amizade aceita.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const rejectMutation = useMutation({
    mutationFn: rejectFriendship,
    onSuccess: () => {
      invalidateFriends()
      toast.success('Pedido recusado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const removeMutation = useMutation({
    mutationFn: removeFriendship,
    onSuccess: () => {
      invalidateFriends()
      toast.success('Amizade removida.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  useEffect(() => {
    if (friendsQuery.error) {
      toast.error(friendsQuery.error.message)
    }
  }, [friendsQuery.error])

  const friendInviteUsername = searchParams.get('add')?.trim().replace(/^@/, '') ?? ''
  const friendshipLink = user?.username
    ? `${window.location.origin}/friends?add=${encodeURIComponent(user.username)}`
    : ''

  useEffect(() => {
    if (!user || !friendInviteUsername || handledInviteLinkRef.current) {
      return
    }

    handledInviteLinkRef.current = true
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('add')

    if (friendInviteUsername === user.username) {
      setSearchParams(nextSearchParams, { replace: true })
      return
    }

    requestMutation.mutate(friendInviteUsername, {
      onSettled: () => setSearchParams(nextSearchParams, { replace: true }),
    })
  }, [friendInviteUsername, requestMutation, searchParams, setSearchParams, user])

  async function copyFriendshipLink() {
    if (!friendshipLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(friendshipLink)
      toast.success('Link de amizade copiado.')
    } catch {
      toast.error('Nao foi possivel copiar o link agora.')
    }
  }

  function requestFriend(username: string) {
    const normalized = username.trim().replace(/^@/, '')

    if (normalized) {
      requestMutation.mutate(normalized)
    }
  }

  const friends = friendsQuery.data ?? []

  return {
    user,
    isLinkModalOpen,
    setIsLinkModalOpen,
    friendshipLink,
    copyFriendshipLink,
    requestFriend,
    accept: (username: string) => acceptMutation.mutate(username),
    reject: (username: string) => rejectMutation.mutate(username),
    remove: (username: string) => removeMutation.mutate(username),
    received: friends.filter((item) => item.status === 'PENDING' && item.direction === 'received'),
    accepted: friends.filter((item) => item.status === 'ACCEPTED'),
    sent: friends.filter((item) => item.status === 'PENDING' && item.direction === 'sent'),
    isLoading: friendsQuery.isLoading,
  }
}
