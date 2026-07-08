import { CalendarDays, Navigation, TrendingUp, Vote } from 'lucide-react'
import type { Group, MapPlace } from '../../../../@types/OndeHoje'
import type { MapFilters } from '../../../../api/ondeHoje'
import Select from '../../../../components/ui/Select'
import { StatusBanner } from '../../../../components/ui/StatusBanner'
import { formatDisplayDate } from '../../../../lib/date'
import { Metric } from '../Metric'

type HomeSidebarProps = {
  errors?: Array<string | undefined>
  filters: MapFilters
  isLoading?: boolean
  isWeekView?: boolean
  groups: Group[]
  topPlaces: MapPlace[]
  userVotesThisWeek: number
  onGroupChange: (groupPublicId?: string) => void
  onSelectPlace: (place: MapPlace) => void
  onWeekViewChange: (week: boolean) => void
}

const WEEKLY_VOTE_LIMIT = 6

export function HomeSidebar({
  errors = [],
  filters,
  isLoading,
  isWeekView,
  groups,
  topPlaces,
  userVotesThisWeek,
  onGroupChange,
  onSelectPlace,
  onWeekViewChange,
}: HomeSidebarProps) {
  return (
    <aside className="grid content-start gap-3 p-3 md:pointer-events-none md:absolute md:right-4 md:top-4 md:z-20 md:w-[332px] md:p-0">
      <StatusBanner error={errors.find(Boolean)} loading={isLoading} />

      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-3 text-ink shadow-panel backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
          <Navigation size={14} />
          mapa principal
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight">Veja onde a galera vai hoje.</h1>
        <p className="mt-2 text-sm text-muted">
          Busque um lugar no Google Maps, salve na base e vote. Lugares com votos aparecem como
          marcadores reais no mapa.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-muted p-1">
          <button
            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition ${
              isWeekView ? 'bg-teal text-on-teal' : 'text-muted hover:text-ink'
            }`}
            type="button"
            onClick={() => onWeekViewChange(true)}
          >
            <CalendarDays size={15} />
            Proximos 7 dias
          </button>
          <button
            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition ${
              isWeekView ? 'text-muted hover:text-ink' : 'bg-teal text-on-teal'
            }`}
            type="button"
            onClick={() => onWeekViewChange(false)}
          >
            {formatDisplayDate(filters.day)}
          </button>
        </div>

        <div className="mt-4">
          <Select
            label="Filtrar por grupo"
            options={[
              { label: 'Todos os meus grupos', value: '' },
              ...groups.map((group) => ({ label: group.name, value: group.id })),
            ]}
            value={filters.groupPublicId ?? ''}
            onChange={(nextValue) => onGroupChange(nextValue || undefined)}
          />
          {groups.length === 0 && (
            <span className="mt-1.5 block text-xs text-muted">
              Entre em um grupo para filtrar o mapa por ele.
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric icon={Vote} label="votos na semana" value={userVotesThisWeek} />
          <Metric icon={CalendarDays} label="limite semanal" value={WEEKLY_VOTE_LIMIT} />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-muted">
          Voce pode votar em ate {WEEKLY_VOTE_LIMIT} lugares por semana ({userVotesThisWeek}/
          {WEEKLY_VOTE_LIMIT} usados).
        </p>
      </section>

      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-2.5 text-ink shadow-panel backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="inline-flex min-w-0 items-center gap-2 text-base font-semibold">
            <TrendingUp size={18} />
            Mais votados
          </h2>
          <span className="shrink-0 text-xs font-medium text-muted">
            {isWeekView ? 'Proximos 7 dias' : formatDisplayDate(filters.day)}
          </span>
        </div>
        <div className="grid gap-2">
          {topPlaces.map((place, index) => (
            <button
              key={place.id}
              className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-line p-2 text-left transition hover:bg-teal-soft"
              type="button"
              onClick={() => onSelectPlace(place)}
            >
              <b className="grid size-6 place-items-center rounded-lg bg-amber text-sm text-ink">
                {index + 1}
              </b>
              <span className="min-w-0">
                <strong className="block truncate text-sm">{place.name}</strong>
                {place.city && <small className="block truncate text-muted">{place.city}</small>}
              </span>
              <em className="text-sm font-semibold not-italic text-teal">{place.voteCount}</em>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
