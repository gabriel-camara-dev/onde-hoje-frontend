import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Link2, UserPlus, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { FriendListItem } from '../../@types/OndeHoje'
import {
  acceptFriendship,
  listFriends,
  rejectFriendship,
  requestFriendship,
} from '../../api/ondeHoje'
import { resolveApiUrl } from '../../api/api'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useUserStore } from '../../stores/userStore'

export default function FriendsPage() {
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
  const requestMutation = useMutation({
    mutationFn: requestFriendship,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
  const acceptMutation = useMutation({
    mutationFn: acceptFriendship,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
  const rejectMutation = useMutation({
    mutationFn: rejectFriendship,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = String(new FormData(event.currentTarget).get('username') || '')
      .trim()
      .replace(/^@/, '')

    if (username) {
      requestMutation.mutate(username)
      event.currentTarget.reset()
    }
  }

  if (!user) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Amizades</h1>
        <p className="mt-2 text-sm text-muted">Entre para listar, solicitar e aceitar amizades.</p>
      </Panel>
    )
  }

  const friends = friendsQuery.data ?? []
  const received = friends.filter((item) => item.status === 'PENDING' && item.direction === 'received')
  const accepted = friends.filter((item) => item.status === 'ACCEPTED')
  const sent = friends.filter((item) => item.status === 'PENDING' && item.direction === 'sent')

  return (
    <>
      <StatusBanner
        error={
          friendsQuery.error?.message ??
          requestMutation.error?.message ??
          acceptMutation.error?.message ??
          rejectMutation.error?.message
        }
        loading={
          friendsQuery.isLoading ||
          requestMutation.isPending ||
          acceptMutation.isPending ||
          rejectMutation.isPending
        }
        message={
          requestMutation.isSuccess
            ? 'Solicitacao enviada.'
            : acceptMutation.isSuccess
              ? 'Amizade aceita.'
              : rejectMutation.isSuccess
                ? 'Pedido recusado.'
              : undefined
        }
      />
      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Panel>
          <h1 className="text-2xl font-semibold">Amizades</h1>
          <p className="mt-2 text-sm text-muted">
            Solicite amizade pelo username da pessoa.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={submit}>
            <Input label="Username" name="username" placeholder="username" required />
            <Button type="submit">
              <UserPlus size={17} />
              Enviar pedido
            </Button>
          </form>
          <Button className="mt-3 w-full" disabled={!user.username} type="button" variant="secondary" onClick={() => setIsLinkModalOpen(true)}>
            <Link2 size={17} />
            Meu link de amizade
          </Button>
        </Panel>
        <Panel>
          <div className="grid gap-5 xl:grid-cols-3">
            <FriendColumn
              acceptAction={(username) => acceptMutation.mutate(username)}
              items={received}
              rejectAction={(username) => rejectMutation.mutate(username)}
              title="Recebidos"
            />
            <FriendColumn items={accepted} title="Amigos" />
            <FriendColumn items={sent} title="Enviados" />
          </div>
        </Panel>
      </section>

      {isLinkModalOpen && (
        <Modal title="Meu link de amizade" onClose={() => setIsLinkModalOpen(false)}>
          <div className="grid gap-3">
            <p className="text-sm text-muted">
              Envie este link para alguem abrir seu perfil de amizade e mandar um pedido para voce.
            </p>
            <div className="grid gap-2 rounded-lg border border-line bg-surface-muted p-3">
              <span className="text-xs font-semibold uppercase text-muted">Seu username</span>
              <code className="truncate rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink">
                @{user.username ?? 'sem-username'}
              </code>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <code className="truncate rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
                {friendshipLink}
              </code>
              <Button type="button" variant="secondary" onClick={copyFriendshipLink}>
                <Copy size={16} />
                Copiar link
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

type FriendColumnProps = {
  acceptAction?: (username: string) => void
  rejectAction?: (username: string) => void
  items: FriendListItem[]
  title: string
}

function FriendColumn({
  acceptAction,
  items,
  rejectAction,
  title,
}: FriendColumnProps) {
  return (
    <div>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="grid gap-2">
        {items.length === 0 ? (
          <EmptyState title="Nada aqui" description="Quando houver movimento, aparece nesta coluna." />
        ) : (
          items.map((item) => (
            <article key={item.friend.publicId} className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-3">
                <FriendAvatar name={item.friend.name} src={item.friend.avatarUrl} />
                <div className="min-w-0">
                  <strong className="block truncate">{item.friend.name}</strong>
                  {item.friend.username && (
                    <span className="block truncate text-sm font-medium text-teal">
                      @{item.friend.username}
                    </span>
                  )}
                </div>
              </div>
              {acceptAction && rejectAction && item.friend.username && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => acceptAction(item.friend.username!)}
                  >
                    <Check size={16} />
                    Aceitar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => rejectAction(item.friend.username!)}
                  >
                    <X size={16} />
                    Recusar
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}

function FriendAvatar({ name, src }: { name: string; src?: string | null }) {
  const avatarSrc = resolveApiUrl(src)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (avatarSrc) {
    return (
      <img
        alt=""
        className="size-10 shrink-0 rounded-full border border-line object-cover"
        referrerPolicy="no-referrer"
        src={avatarSrc}
      />
    )
  }

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal text-xs font-semibold text-on-teal">
      {initials || 'U'}
    </span>
  )
}

