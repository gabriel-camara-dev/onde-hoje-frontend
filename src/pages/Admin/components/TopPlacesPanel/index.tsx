import type { AdminDashboard } from '../../../../@types/OndeHoje'
import { Panel } from '../../../../components/ui/Panel'

export function TopPlacesPanel({ places }: { places: AdminDashboard['topPlaces'] }) {
  return (
    <Panel>
      <h2 className="mb-4 text-lg font-semibold">Top lugares hoje</h2>
      <div className="grid gap-2">
        {places.map((place, index) => (
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
  )
}
