import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import {
  deleteUser,
  listFriends,
  listMyVotes,
  updateUser,
  uploadAvatar,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useAuth } from '../../hooks/useAuth'
import { useUserStore } from '../../stores/userStore'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const updateStoredUser = useUserStore((state) => state.updateUser)
  const { logout } = useAuth()

  const votesQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['my-votes'],
    queryFn: listMyVotes,
  })
  const friendsQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['friends'],
    queryFn: listFriends,
  })
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-votes'] }),
  })
  const updateMutation = useMutation({
    mutationFn: (form: FormData) =>
      updateUser(user!.id, {
        name: String(form.get('name') || '') || undefined,
        username: String(form.get('username') || '') || undefined,
        email: String(form.get('email') || '') || undefined,
        cpf: String(form.get('cpf') || '') || undefined,
        password: String(form.get('password') || '') || undefined,
      }),
    onSuccess: (updatedUser) => updateStoredUser(updatedUser),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user!.id),
    onSuccess: logout,
  })

  if (!user) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-black">Perfil</h1>
        <p className="mt-2 text-sm text-muted">Entre para ver seu perfil e historico de votos.</p>
      </Panel>
    )
  }

  function handleAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('file')

    if (file instanceof File && file.size > 0) {
      avatarMutation.mutate(file)
    }
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate(new FormData(event.currentTarget))
  }

  const votes = votesQuery.data ?? []
  const friends = friendsQuery.data ?? []

  return (
    <>
      <StatusBanner
        error={
          votesQuery.error?.message ??
          friendsQuery.error?.message ??
          avatarMutation.error?.message ??
          updateMutation.error?.message ??
          deleteMutation.error?.message
        }
        loading={
          votesQuery.isLoading ||
          friendsQuery.isLoading ||
          avatarMutation.isPending ||
          updateMutation.isPending ||
          deleteMutation.isPending
        }
        message={
          avatarMutation.isSuccess
            ? 'Foto atualizada.'
            : updateMutation.isSuccess
              ? 'Perfil atualizado.'
              : undefined
        }
      />
      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Panel>
          <p className="mb-2 text-xs font-black uppercase text-coral">Minha conta</p>
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <div className="my-4 grid gap-2">
            <Metric label="votos recentes" value={votes.length} />
            <Metric label="amizades e pedidos" value={friends.length} />
          </div>
          <form className="grid gap-3" onSubmit={handleAvatar}>
            <Input accept="image/png,image/jpeg,image/webp" label="Foto de perfil" name="file" type="file" />
            <Button type="submit" variant="secondary">
              Atualizar foto
            </Button>
          </form>
          <form className="mt-4 grid gap-3 border-t border-line pt-4" onSubmit={handleUpdate}>
            <h2 className="font-black">Editar dados</h2>
            <Input label="Nome" name="name" defaultValue={user.name} />
            <Input label="Username" name="username" defaultValue={user.username} />
            <Input label="Email" name="email" type="email" defaultValue={user.email} />
            <Input label="CPF" name="cpf" />
            <Input label="Nova senha" minLength={6} name="password" type="password" />
            <Button type="submit" variant="secondary">
              Salvar perfil
            </Button>
          </form>
          <Button className="mt-3 w-full" type="button" variant="danger" onClick={logout}>
            Sair
          </Button>
          <Button
            className="mt-2 w-full"
            type="button"
            variant="ghost"
            onClick={() => {
              if (window.confirm('Remover sua conta? Esta acao nao pode ser desfeita.')) {
                deleteMutation.mutate()
              }
            }}
          >
            Remover conta
          </Button>
        </Panel>
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Historico de votos</h2>
            <strong className="text-muted">{votes.length}</strong>
          </div>
          <div className="grid gap-2">
            {votes.map((vote) => (
              <article key={vote.id} className="rounded-lg border border-line p-3">
                <span className="text-xs font-bold text-coral">{vote.day}</span>
                <strong className="mt-1 block">{vote.place.name}</strong>
                <small className="text-muted">{vote.group?.name ?? vote.scopeKey}</small>
                {vote.note && <p className="mt-2 text-sm text-muted">{vote.note}</p>}
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-line p-3 text-sm">
      <strong className="block text-2xl">{value}</strong>
      {label}
    </span>
  )
}
