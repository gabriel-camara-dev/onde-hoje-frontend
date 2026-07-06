import { useMutation } from '@tanstack/react-query'
import type { ChangeEvent, FormEvent } from 'react'
import { useRef } from 'react'
import { Camera, Plus } from 'lucide-react'
import { deleteUser, updateUser, uploadAvatar } from '../../api/ondeHoje'
import { resolveApiUrl } from '../../api/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useAuth } from '../../hooks/useAuth'
import { useUserStore } from '../../stores/userStore'

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = useUserStore((state) => state.user)
  const updateStoredUser = useUserStore((state) => state.updateUser)
  const { logout } = useAuth()

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      if (updatedUser && typeof updatedUser === 'object') {
        updateStoredUser(updatedUser)
      }
    },
  })
  const updateMutation = useMutation({
    mutationFn: (form: FormData) =>
      updateUser(user!.id, {
        name: String(form.get('name') || '') || undefined,
        username: String(form.get('username') || '') || undefined,
      }),
    onSuccess: (updatedUser) => updateStoredUser(updatedUser),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user!.id),
    onSuccess: logout,
  })

  if (!user) {
    return (
      <section className="grid min-h-[calc(100vh-140px)] place-items-center px-4">
        <Panel className="w-full max-w-xl text-center">
          <h1 className="text-2xl font-semibold">Perfil</h1>
          <p className="mt-2 text-sm text-muted">Entre para ver e editar suas informacoes.</p>
        </Panel>
      </section>
    )
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    if (file) {
      avatarMutation.mutate(file)
    }

    event.currentTarget.value = ''
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate(new FormData(event.currentTarget))
  }

  const avatarSrc = resolveApiUrl(user.avatarUrl)
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <section className="grid min-h-[calc(100vh-140px)] place-items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <StatusBanner
          error={
            avatarMutation.error?.message ??
            updateMutation.error?.message ??
            deleteMutation.error?.message
          }
          loading={avatarMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          message={
            avatarMutation.isSuccess
              ? 'Foto atualizada.'
              : updateMutation.isSuccess
                ? 'Perfil atualizado.'
                : undefined
          }
        />

        <Panel className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase text-teal">Minha conta</p>
          <h1 className="text-3xl font-semibold text-ink">Perfil</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Atualize suas informacoes publicas e a foto que aparece nos votos.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{user.email}</p>
          {user.username && (
            <span className="mt-4 inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
              @{user.username}
            </span>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="group relative grid h-32 w-32 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-surface bg-contrast text-4xl font-semibold text-on-contrast shadow-[var(--shadow-panel)] outline-none ring-2 ring-line transition hover:scale-[1.02] hover:ring-teal focus-visible:ring-4 focus-visible:ring-teal"
              aria-label="Alterar foto de perfil"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`Foto de ${user.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials || <Camera size={36} />}</span>
              )}
              <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-teal text-on-teal shadow-lg">
                  <Plus size={30} strokeWidth={3} />
                </span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              name="file"
              type="file"
              onChange={handleAvatarChange}
            />
          </div>

          <form className="mx-auto mt-8 grid max-w-xl gap-4 text-left" onSubmit={handleUpdate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nome" name="name" defaultValue={user.name} />
              <Input
                label="Username"
                maxLength={30}
                minLength={3}
                name="username"
                pattern="[a-z0-9_]+"
                defaultValue={user.username ?? ''}
              />
            </div>
            <Button type="submit">
              Salvar perfil
            </Button>
          </form>

          <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={logout}>
              Sair
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (window.confirm('Remover sua conta? Esta acao nao pode ser desfeita.')) {
                  deleteMutation.mutate()
                }
              }}
            >
              Remover conta
            </Button>
          </div>
        </Panel>
      </div>
    </section>
  )
}

