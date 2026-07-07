import { Panel } from '../../../../components/ui/Panel'
import { StatusBanner } from '../../../../components/ui/StatusBanner'
import { MetricList } from '../MetricList'
import { MiniBars } from '../MiniBars'
import { StatCard } from '../StatCard'
import { useAdminAuth } from './hooks/useAdminAuth'

const statusLabels: Record<string, string> = {
  SUCCESS: 'Sucesso',
  INCORRECT_PASSWORD: 'Senha incorreta',
  USER_NOT_EXISTS: 'Usuário inexistente',
  BLOCKED: 'Bloqueado',
  RECOVER_PASSWORD: 'Recuperar senha',
  INVALID_TOKEN: 'Token inválido',
}

function labelStatus(status: string) {
  return statusLabels[status] ?? status
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuthTab() {
  const { activity, isLoading, error } = useAdminAuth()

  if (!activity) {
    return <StatusBanner error={error} loading={isLoading} />
  }

  return (
    <div className="grid gap-4">
      <StatusBanner error={error} loading={isLoading} />

      <Panel>
        <h2 className="mb-1 text-lg font-semibold">Autenticação hoje</h2>
        <p className="mb-4 text-sm text-muted">
          Registro real de tentativas de login (sucesso, falhas e bloqueios).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Logins com sucesso" value={activity.loginsToday} accent />
          <StatCard label="Usuários distintos" value={activity.uniqueUsersToday} />
          <StatCard
            label="Senha incorreta"
            value={activity.failedToday}
            accent={activity.failedToday > 0}
          />
          <StatCard
            label="Usuário inexistente"
            value={activity.unknownUserToday}
            accent={activity.unknownUserToday > 0}
          />
          <StatCard
            label="Bloqueados"
            value={activity.blockedToday}
            accent={activity.blockedToday > 0}
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <MiniBars title="Logins por dia (14 dias)" data={activity.loginsPerDay} />
        </Panel>
        <Panel>
          <MetricList
            title="Status (7 dias)"
            rows={activity.statusBreakdown.map((item) => ({
              key: item.status,
              primary: labelStatus(item.status),
              value: item.count,
              highlight: item.status !== 'SUCCESS' && item.count > 0,
            }))}
            emptyLabel="Sem registros"
          />
        </Panel>
      </div>

      <Panel>
        <MetricList
          title="IPs com mais falhas (7 dias)"
          description="Muitas tentativas do mesmo IP podem indicar ataque de força bruta"
          rows={activity.topFailedIps.map((item) => ({
            key: item.ipAddress,
            primary: item.ipAddress,
            value: item.attempts,
            valueLabel: 'falhas',
            highlight: item.attempts >= 5,
          }))}
          emptyLabel="Nenhuma falha registrada"
        />
      </Panel>

      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Tentativas recentes</h2>
        {activity.recentAttempts.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma tentativa registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="px-3">Status</th>
                  <th className="px-3">Usuário</th>
                  <th className="px-3">IP</th>
                  <th className="px-3">Quando</th>
                  <th className="px-3">Dispositivo</th>
                </tr>
              </thead>
              <tbody>
                {activity.recentAttempts.map((attempt, index) => (
                  <tr key={`${attempt.createdAt}-${index}`} className="bg-surface-muted">
                    <td
                      className={`rounded-l-lg px-3 py-2 font-semibold ${
                        attempt.status === 'SUCCESS' ? 'text-teal' : 'text-red-700'
                      }`}
                    >
                      {labelStatus(attempt.status)}
                    </td>
                    <td className="px-3 py-2">{attempt.userName ?? '—'}</td>
                    <td className="px-3 py-2">{attempt.ipAddress ?? '—'}</td>
                    <td className="px-3 py-2 text-muted">{formatDateTime(attempt.createdAt)}</td>
                    <td className="max-w-[240px] truncate rounded-r-lg px-3 py-2 text-muted" title={attempt.userAgent ?? ''}>
                      {attempt.userAgent ?? '—'}
                    </td>
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
