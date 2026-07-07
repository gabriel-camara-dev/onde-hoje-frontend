import type { VoteType } from '../../../../@types/OndeHoje'
import { Panel } from '../../../../components/ui/Panel'
import { StatusBanner } from '../../../../components/ui/StatusBanner'
import { MetricList } from '../MetricList'
import { MiniBars } from '../MiniBars'
import { StatCard } from '../StatCard'
import { useAdminOverview } from './hooks/useAdminOverview'

const voteTypeLabels: Record<VoteType, string> = {
  GENERAL: 'Geral',
  MUSIC: 'Música',
  FOOD: 'Comida',
  DRINK: 'Bebida',
  SPORTS: 'Esporte',
}

export function OverviewTab() {
  const { overview, isLoading, error } = useAdminOverview()

  if (!overview) {
    return <StatusBanner error={error} loading={isLoading} />
  }

  const { users, votes, places, groups, friendships, reports } = overview

  return (
    <div className="grid gap-4">
      <StatusBanner error={error} loading={isLoading} />

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Pessoas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Usuários no total" value={users.total} />
          <StatCard label="Logaram hoje" value={users.activeToday} accent hint="Login registrado hoje" />
          <StatCard label="Ativos em 7 dias" value={users.activeLast7Days} />
          <StatCard label="Novos hoje" value={users.newToday} hint={`${users.newLast7Days} nos últimos 7 dias`} />
          <StatCard label="E-mail verificado" value={users.verified} />
          <StatCard label="Entram com Google" value={users.withGoogle} />
          <StatCard label="Admins" value={users.admins} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Atividade do sistema</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Votos hoje" value={votes.today} accent />
          <StatCard label="Votos ativos (total)" value={votes.activeTotal} />
          <StatCard label="Votos em 7 dias" value={votes.last7Days} />
          <StatCard label="Votos cancelados" value={votes.cancelledTotal} />
          <StatCard label="Lugares ativos" value={places.activeTotal} hint={`${places.newToday} novos hoje`} />
          <StatCard label="Grupos" value={groups.total} hint={`${groups.newToday} novos hoje`} />
          <StatCard label="Amizades" value={friendships.accepted} hint={`${friendships.pending} pendentes`} />
          <StatCard
            label="Reports abertos"
            value={reports.open}
            hint={`${reports.total} no total`}
            accent={reports.open > 0}
          />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Tendências (14 dias)</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <MiniBars title="Votos por dia" data={overview.votesPerDay} />
          <MiniBars title="Cadastros por dia" data={overview.signupsPerDay} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <MetricList
            title="Tipos de voto hoje"
            rows={overview.voteTypesToday.map((item) => ({
              key: item.voteType,
              primary: voteTypeLabels[item.voteType] ?? item.voteType,
              value: item.count,
              valueLabel: 'votos',
            }))}
            emptyLabel="Nenhum voto hoje"
          />
        </Panel>
        <Panel>
          <MetricList
            title="Cidades mais votadas hoje"
            rows={overview.topCitiesToday.map((item) => ({
              key: item.city,
              primary: item.city,
              value: item.votes,
              valueLabel: 'votos',
            }))}
            emptyLabel="Nenhuma cidade hoje"
          />
        </Panel>
      </div>
    </div>
  )
}
