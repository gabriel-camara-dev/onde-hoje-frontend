import { Panel } from '../../components/ui/Panel'
import { useUserStore } from '../../stores/userStore'
import { ProfileActions, ProfileAvatar, ProfileForm } from './components'

export default function ProfilePage() {
  const user = useUserStore((state) => state.user)

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

  return (
    <section className="grid min-h-[calc(100vh-140px)] place-items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <Panel className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase text-teal">Minha conta</p>
          <h1 className="text-3xl font-semibold text-ink">Perfil</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Você pode atualizar suas informações e foto de perfil.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{user.email}</p>
          {user.username && (
            <span className="mt-4 inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
              @{user.username}
            </span>
          )}

          <ProfileAvatar name={user.name} avatarUrl={user.avatarUrl} />
          <ProfileForm userId={user.id} name={user.name} username={user.username} />
          <ProfileActions userId={user.id} />
        </Panel>
      </div>
    </section>
  )
}
