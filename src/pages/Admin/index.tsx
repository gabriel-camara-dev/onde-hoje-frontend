import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { DashboardOverview, TopPlacesPanel, UsersPanel } from './components'
import { useAdmin } from './hooks/useAdmin'

export default function AdminPage() {
  const { user, dashboard, users, usersTotal, error, isLoading, onFilter } = useAdmin()

  if (!user) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted">
          Entre com uma conta ADMIN para visualizar o dashboard.
        </p>
      </Panel>
    )
  }

  return (
    <>
      <StatusBanner error={error} loading={isLoading} />
      {dashboard && (
        <section className="grid gap-4">
          <DashboardOverview dashboard={dashboard} />
          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <TopPlacesPanel places={dashboard.topPlaces} />
            <UsersPanel users={users} total={usersTotal} onFilter={onFilter} />
          </div>
        </section>
      )}
    </>
  )
}
