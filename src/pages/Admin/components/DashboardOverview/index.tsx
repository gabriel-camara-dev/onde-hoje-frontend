import type { AdminDashboard } from '../../../../@types/OndeHoje'
import { Panel } from '../../../../components/ui/Panel'
import { Metric } from '../Metric'

export function DashboardOverview({ dashboard }: { dashboard: AdminDashboard }) {
  return (
    <Panel>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Metric label="Usuarios" value={dashboard.usersCount} />
        <Metric label="Lugares ativos" value={dashboard.placesCount} />
        <Metric label="Grupos" value={dashboard.groupsCount} />
        <Metric label="Votos hoje" value={dashboard.todayVotesCount} />
        <Metric label="Reports abertos" value={dashboard.openReportsCount} />
      </div>
    </Panel>
  )
}
