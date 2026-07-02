import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, UserPlus, X } from 'lucide-react'
import type { FormEvent } from 'react'
import type { FriendListItem } from '../../@types/OndeHoje'
import {
  acceptFriendship,
  listFriends,
  rejectFriendship,
  requestFriendship,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useUserStore } from '../../stores/userStore'

export default function FriendsPage() {
  const queryClient = useQueryClient()
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
        <h1 className="text-2xl font-black">Amizades</h1>
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
          <h1 className="text-2xl font-black">Amizades</h1>
          <p className="mt-2 text-sm text-muted">
            Solicite amizade pelo username da pessoa.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={submit}>
            <Input label="Username" name="username" placeholder="amigo_username" required />
            <Button type="submit">
              <UserPlus size={17} />
              Enviar pedido
            </Button>
          </form>
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
      <h2 className="mb-3 font-black">{title}</h2>
      <div className="grid gap-2">
        {items.length === 0 ? (
          <EmptyState title="Nada aqui" description="Quando houver movimento, aparece nesta coluna." />
        ) : (
          items.map((item) => (
            <article key={item.friend.publicId} className="rounded-lg border border-line p-3">
              <strong className="block">{item.friend.name}</strong>
              {item.friend.username && (
                <span className="mt-1 block text-sm font-bold text-teal">@{item.friend.username}</span>
              )}
              {acceptAction && rejectAction && item.friend.username && (
                <div className="mt-3 grid grid-cols-2 gap-2">
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
