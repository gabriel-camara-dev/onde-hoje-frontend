import { Panel } from '../../../../components/ui/Panel'
import { StatusBanner } from '../../../../components/ui/StatusBanner'
import { MetricList } from '../MetricList'
import { useAdminAbuse } from './hooks/useAdminAbuse'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'nunca'
  }

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AbuseTab() {
  const { report, isLoading, error } = useAdminAbuse()

  if (!report) {
    return <StatusBanner error={error} loading={isLoading} />
  }

  return (
    <div className="grid gap-4">
      <StatusBanner error={error} loading={isLoading} />

      <Panel>
        <h2 className="mb-1 text-lg font-semibold">Fiscalização de votos</h2>
        <p className="mb-4 text-sm text-muted">
          Usuários com muitos votos ou cancelamentos podem indicar comportamento abusivo.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricList
            title="Mais votaram hoje"
            rows={report.topVotersToday.map((voter) => ({
              key: voter.publicId || voter.username,
              primary: voter.name,
              secondary: voter.username ? `@${voter.username}` : undefined,
              value: voter.votesCount,
              valueLabel: 'votos',
              highlight: voter.votesCount >= 5,
            }))}
            emptyLabel="Nenhum voto hoje"
          />
          <MetricList
            title="Mais cancelamentos hoje"
            description="Votou e removeu (possível manipulação)"
            rows={report.topCancellersToday.map((voter) => ({
              key: voter.publicId || voter.username,
              primary: voter.name,
              secondary: voter.username ? `@${voter.username}` : undefined,
              value: voter.cancelledCount,
              valueLabel: 'cancel.',
              highlight: voter.cancelledCount >= 3,
            }))}
            emptyLabel="Nenhum cancelamento hoje"
          />
          <MetricList
            title="Mais votaram (histórico)"
            rows={report.heavyVotersAllTime.map((voter) => ({
              key: voter.publicId || voter.username,
              primary: voter.name,
              secondary: voter.username ? `@${voter.username}` : undefined,
              value: voter.votesCount,
              valueLabel: 'votos',
            }))}
            emptyLabel="Sem votos"
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <MetricList
            title="Logins suspeitos"
            description="Contas com tentativas de login acumuladas"
            rows={report.suspiciousLogins.map((account) => ({
              key: account.publicId || account.username,
              primary: account.name,
              secondary: `@${account.username} · último acesso ${formatDateTime(account.lastLogin)}`,
              value: account.loginAttempts,
              valueLabel: 'tentativas',
              highlight: account.loginAttempts >= 3,
            }))}
            emptyLabel="Nenhuma conta suspeita"
          />
        </Panel>
        <Panel>
          <MetricList
            title="Locais mais reportados"
            rows={report.reportedPlaces.map((place) => ({
              key: place.publicId || place.name,
              primary: place.name,
              secondary: place.city ?? undefined,
              value: place.openReports,
              valueLabel: 'reports',
              highlight: place.openReports >= 3,
            }))}
            emptyLabel="Nenhum local reportado"
          />
        </Panel>
      </div>

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Reports recentes</h2>
        {report.recentReports.length === 0 ? (
          <p className="text-sm text-muted">Nenhum report registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="px-3">Motivo</th>
                  <th className="px-3">Local</th>
                  <th className="px-3">Reportado por</th>
                  <th className="px-3">Status</th>
                  <th className="px-3">Quando</th>
                </tr>
              </thead>
              <tbody>
                {report.recentReports.map((item) => (
                  <tr key={item.publicId} className="bg-surface-muted">
                    <td className="rounded-l-lg px-3 py-2 font-medium">{item.reason}</td>
                    <td className="px-3 py-2">{item.placeName ?? '—'}</td>
                    <td className="px-3 py-2">{item.reporterName}</td>
                    <td className="px-3 py-2 font-semibold text-teal">{item.status}</td>
                    <td className="rounded-r-lg px-3 py-2 text-muted">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
