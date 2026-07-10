import type { ComponentType } from 'react'
import type { MapPlace } from '../../../../@types/OndeHoje'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Panel } from '../../../../components/ui/Panel'
import { Metric } from '../Metric'

// Medal colours: 1st gold, 2nd silver, 3rd bronze, the rest neutral.
function medalClass(index: number) {
  if (index === 0) return 'bg-[#f5c518] text-[#3a2d00] shadow-[0_2px_8px_rgba(245,197,24,.4)]'
  if (index === 1) return 'bg-[#c8ccd4] text-[#2b2f36] shadow-[0_2px_8px_rgba(200,204,212,.35)]'
  if (index === 2) return 'bg-[#cd7f32] text-white shadow-[0_2px_8px_rgba(205,127,50,.35)]'
  return 'bg-surface-muted text-muted border border-line'
}

type RankingPanelProps = {
  countLabel: string
  icon: ComponentType<{ className?: string; size?: number }>
  places: MapPlace[]
  title: string
  totalVotes: number
}

export function RankingPanel({
  countLabel,
  icon: Icon,
  places,
  title,
  totalVotes,
}: RankingPanelProps) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold">
          <Icon className="text-amber" size={25} />
          {title}
        </h1>
        <span className="rounded-full bg-amber px-3 py-1 text-sm font-semibold">
          {places.length}
        </span>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Metric label={countLabel} value={totalVotes} />
        <Metric label="lugares ranqueados" value={places.length} />
      </div>
      <div className="grid max-h-[24rem] gap-2 overflow-y-auto pr-1">
        {places.length === 0 ? (
          <EmptyState
            title="Ranking vazio"
            description="Ainda não ha votos ativos para os filtros escolhidos."
          />
        ) : (
          places.map((place, index) => (
            <article
              key={place.id}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-lg border border-line p-3"
            >
              <b className={`grid size-9 place-items-center rounded-xl text-sm font-bold ${medalClass(index)}`}>
                {index + 1}
              </b>
              <span className="grid min-w-0">
                <strong className="truncate">{place.name}</strong>
                <small className="truncate text-muted">{place.formattedAddress}</small>
              </span>
              <em className="shrink-0 text-sm font-semibold not-italic text-teal">
                {place.voteCount} votos
              </em>
            </article>
          ))
        )}
      </div>
    </Panel>
  )
}
