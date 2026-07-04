import { useQuery } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { getAdminDashboard, listUsers } from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useUserStore } from '../../stores/userStore'

export default function AdminPage() {
  const user = useUserStore((state) => state.user)
  const [userFilters, setUserFilters] = useState({ name: '', email: '' })
  const dashboardQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  })
  const usersQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['admin-users', userFilters],
    queryFn: () => listUsers({ ...userFilters, page: 1 }),
  })

  function filterUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setUserFilters({
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
    })
  }

  if (!user) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted">Entre com uma conta ADMIN para visualizar o dashboard.</p>
      </Panel>
    )
  }

  const dashboard = dashboardQuery.data

  return (
    <>
      <StatusBanner
        error={dashboardQuery.error?.message ?? usersQuery.error?.message}
        loading={dashboardQuery.isLoading || usersQuery.isLoading}
      />
      {dashboard && (
        <section className="grid gap-4">
          <Panel>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Metric label="Usuarios" value={dashboard.usersCount} />
              <Metric label="Lugares ativos" value={dashboard.placesCount} />
              <Metric label="Grupos" value={dashboard.groupsCount} />
              <Metric label="Votos hoje" value={dashboard.todayVotesCount} />
              <Metric label="Reports abertos" value={dashboard.openReportsCount} />
            </div>
          </Panel>
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Panel>
              <h2 className="mb-4 text-lg font-semibold">Top lugares hoje</h2>
              <div className="grid gap-2">
                {dashboard.topPlaces.map((place, index) => (
                  <article
                    key={place.publicId}
                    className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-lg border border-line p-3"
                  >
                    <b className="grid size-8 place-items-center rounded-lg bg-amber">{index + 1}</b>
                    <span className="text-sm font-medium">{place.name}</span>
                    <em className="text-sm font-semibold not-italic text-teal">{place.votesCount}</em>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">UsuÃ¡rios</h2>
                  <p className="text-sm text-muted">
                    {usersQuery.data?.totalCount ?? 0} encontrados
                  </p>
                </div>
                <form className="grid gap-2 md:grid-cols-3" onSubmit={filterUsers}>
                  <Input label="Nome" name="name" />
                  <Input label="Email" name="email" />
                  <Button className="self-end" type="submit">
                    Buscar
                  </Button>
                </form>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr>
                      <th className="px-3">Nome</th>
                      <th className="px-3">Email</th>
                      <th className="px-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usersQuery.data?.data ?? []).map((listedUser) => (
                      <tr key={listedUser.id} className="bg-teal-soft">
                        <td className="rounded-l-lg px-3 py-3 font-medium">{listedUser.name}</td>
                        <td className="px-3 py-3">{listedUser.email}</td>
                        <td className="rounded-r-lg px-3 py-3 font-semibold text-teal">
                          {listedUser.role}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </section>
      )}
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <strong className="block text-3xl">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}

