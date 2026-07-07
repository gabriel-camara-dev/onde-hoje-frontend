import { MapPin } from 'lucide-react'
import type { VoteType } from '../../../../@types/OndeHoje'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Modal } from '../../../../components/ui/Modal'
import { formatDisplayDate } from '../../../../lib/date'
import { useUserHistory } from './hooks/useUserHistory'

const voteTypeLabels: Record<VoteType, string> = {
  GENERAL: 'Geral',
  MUSIC: 'Música',
  FOOD: 'Comida',
  DRINK: 'Bebida',
  SPORTS: 'Esporte',
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'nunca'
  }

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type UserHistoryModalProps = {
  publicId: string
  fallbackName: string
  onClose: () => void
}

export function UserHistoryModal({ publicId, fallbackName, onClose }: UserHistoryModalProps) {
  const { data, isLoading, error } = useUserHistory(publicId)
  const user = data?.user
  const votes = data?.votes ?? []

  return (
    <Modal title={`Histórico de ${user?.name ?? fallbackName}`} onClose={onClose}>
      <div className="grid gap-4">
        {user && (
          <section className="grid gap-2 rounded-lg border border-line bg-surface-muted p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{user.name}</strong>
              {user.username && <span className="text-teal">@{user.username}</span>}
              <span className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-semibold text-teal">
                {user.role}
              </span>
              {!user.emailVerified && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  e-mail não verificado
                </span>
              )}
            </div>
            <p className="text-muted">{user.email}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              <span>Cadastro: {formatDateTime(user.createdAt)}</span>
              <span>Último acesso: {formatDateTime(user.lastLogin)}</span>
              <span>{votes.length} votos no histórico</span>
            </div>
          </section>
        )}

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>
        ) : isLoading ? (
          <div className="rounded-lg border border-line bg-surface-muted p-4 text-sm font-semibold text-muted">
            Carregando histórico...
          </div>
        ) : votes.length === 0 ? (
          <EmptyState
            title="Sem votos"
            description="Este usuário ainda não votou em nenhum lugar."
          />
        ) : (
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1">
            {votes.map((vote) => (
              <article key={vote.id} className="rounded-lg border border-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate">{vote.place.name}</strong>
                    <span className="block truncate text-sm text-muted">
                      {vote.place.formattedAddress}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {formatDisplayDate(vote.day)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-teal">
                    <MapPin size={13} />
                    {vote.group?.name ?? 'Público'}
                  </span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold text-muted">
                    {voteTypeLabels[vote.voteType] ?? vote.voteType}
                  </span>
                </div>
                {vote.note && <p className="mt-2 text-sm text-muted">{vote.note}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
