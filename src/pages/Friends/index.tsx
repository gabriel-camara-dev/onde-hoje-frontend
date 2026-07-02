import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import type { FriendListItem } from '../../@types/OndeHoje'
import {
  acceptFriendship,
  listFriends,
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const publicId = String(new FormData(event.currentTarget).get('publicId') || '')

    if (publicId) {
      requestMutation.mutate(publicId)
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
        error={friendsQuery.error?.message ?? requestMutation.error?.message ?? acceptMutation.error?.message}
        loading={friendsQuery.isLoading || requestMutation.isPending || acceptMutation.isPending}
        message={
          requestMutation.isSuccess
            ? 'Solicitacao enviada.'
            : acceptMutation.isSuccess
              ? 'Amizade aceita.'
              : undefined
        }
      />
      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Panel>
          <h1 className="text-2xl font-black">Amizades</h1>
          <p className="mt-2 text-sm text-muted">
            Solicite por publicId. O backend ainda nao expoe busca publica de usuarios.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={submit}>
            <Input label="PublicId do usuario" name="publicId" required />
            <Button type="submit">Enviar pedido</Button>
          </form>
        </Panel>
        <Panel>
          <div className="grid gap-5 xl:grid-cols-3">
            <FriendColumn
              action={(publicId) => acceptMutation.mutate(publicId)}
              actionLabel="Aceitar"
              items={received}
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
  action?: (publicId: string) => void
  actionLabel?: string
  items: FriendListItem[]
  title: string
}

function FriendColumn({
  action,
  actionLabel,
  items,
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
              {action && actionLabel && (
                <Button
                  className="mt-3 w-full"
                  type="button"
                  variant="secondary"
                  onClick={() => action(item.friend.publicId)}
                >
                  {actionLabel}
                </Button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
