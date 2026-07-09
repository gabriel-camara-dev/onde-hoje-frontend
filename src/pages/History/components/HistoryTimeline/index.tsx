import { MapPin } from 'lucide-react'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Panel } from '../../../../components/ui/Panel'
import { formatDisplayDate } from '../../../../lib/date'
import type { HistoryDay } from '../../helpers'

type HistoryTimelineProps = {
  isLoggedIn: boolean
  history: HistoryDay[]
}

export function HistoryTimeline({ isLoggedIn, history }: HistoryTimelineProps) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Linha do tempo</h2>
        <strong className="text-muted">{history.length} dias</strong>
      </div>
      {!isLoggedIn ? (
        <EmptyState
          title="Entre para ver seu histórico"
          description="Seu histórico individual aparece aqui depois que você estiver logado."
        />
      ) : history.length === 0 ? (
        <EmptyState
          title="Sem votos neste periodo"
          description="Quando você votar em algum lugar, ele aparece nesta linha do tempo."
        />
      ) : (
        <div className="grid gap-4">
          {history.map((day) => (
            <article key={day.day} className="rounded-lg border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <strong>{formatDisplayDate(day.day)}</strong>
                <span className="text-sm font-medium text-teal">
                  {day.votes.length} {day.votes.length === 1 ? 'voto' : 'votos'}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {day.votes.map((vote) => (
                  <div key={vote.id} className="rounded-lg bg-teal-soft p-3">
                    <strong className="block">{vote.place.name}</strong>
                    <span className="mt-1 block text-sm text-muted">
                      {vote.place.formattedAddress}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal">
                      <MapPin size={15} />
                      {vote.group?.name ?? 'Público'}
                    </span>
                    {vote.note && <p className="mt-2 text-sm text-muted">{vote.note}</p>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}
