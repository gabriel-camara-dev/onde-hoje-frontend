import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Trophy } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { MapPlace } from '../../@types/OndeHoje'
import {
  getGlobalRanking,
  getTopPlaces,
  type GlobalRankingFilters,
  type MapFilters,
} from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { formatInputDate } from '../../lib/date'
import { loadGoogleMaps } from '../../lib/googleMaps'

type RankingFilters = {
  city: string
  state: string
  day: string
}

const today = formatInputDate(new Date())

export default function Ranking() {
  const [filters, setFilters] = useState<RankingFilters>({ city: '', state: '', day: today })
  const [draftFilters, setDraftFilters] = useState<RankingFilters>(filters)

  useEffect(() => {
    resolveCurrentCity()
      .then((location) => {
        if (!location?.city) {
          return
        }

        const city = location.city

        setFilters((current) => ({
          ...current,
          city,
          state: location.state ?? current.state,
        }))
        setDraftFilters((current) => ({
          ...current,
          city,
          state: location.state ?? current.state,
        }))
      })
      .catch(() => {})
  }, [])

  const globalFilters: GlobalRankingFilters = {
    city: filters.city,
    state: filters.state,
  }
  const dayFilters: MapFilters = {
    city: filters.city,
    state: filters.state,
    day: filters.day,
    q: '',
  }

  const globalRankingQuery = useQuery({
    queryKey: ['global-ranking', globalFilters],
    queryFn: () => getGlobalRanking(globalFilters),
  })
  const dayRankingQuery = useQuery({
    queryKey: ['top-places', dayFilters],
    queryFn: () => getTopPlaces(dayFilters),
  })

  const globalPlaces = globalRankingQuery.data ?? []
  const dayPlaces = dayRankingQuery.data ?? []
  const totalGlobalVotes = totalVotes(globalPlaces)
  const totalDayVotes = totalVotes(dayPlaces)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({
      city: draftFilters.city.trim(),
      state: draftFilters.state.trim().toUpperCase(),
      day: draftFilters.day || today,
    })
  }

  return (
    <>
      <StatusBanner
        error={globalRankingQuery.error?.message ?? dayRankingQuery.error?.message}
        loading={globalRankingQuery.isLoading || dayRankingQuery.isLoading}
      />
      <section className="grid gap-4">
        <Panel>
          <form className="grid gap-2 md:grid-cols-[1fr_120px_170px_auto]" onSubmit={submit}>
            <Input
              label="Cidade"
              name="city"
              value={draftFilters.city}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, city: event.currentTarget.value }))
              }
            />
            <Input
              label="Estado"
              maxLength={2}
              name="state"
              placeholder="SP"
              value={draftFilters.state}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, state: event.currentTarget.value }))
              }
            />
            <Input
              label="Dia"
              name="day"
              type="date"
              value={draftFilters.day}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, day: event.currentTarget.value }))
              }
            />
            <Button className="self-end" type="submit">
              Buscar
            </Button>
          </form>
        </Panel>

        <section className="grid gap-4 xl:grid-cols-2">
          <RankingPanel
            countLabel="votos globais"
            icon={Trophy}
            places={globalPlaces}
            title="Ranking global"
            totalVotes={totalGlobalVotes}
          />
          <RankingPanel
            countLabel="votos no dia"
            icon={CalendarDays}
            places={dayPlaces}
            title="Ranking do dia"
            totalVotes={totalDayVotes}
          />
        </section>
      </section>
    </>
  )
}

function RankingPanel({
  countLabel,
  icon: Icon,
  places,
  title,
  totalVotes,
}: {
  countLabel: string
  icon: typeof Trophy
  places: MapPlace[]
  title: string
  totalVotes: number
}) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold">
          <Icon className="text-amber" size={25} />
          {title}
        </h1>
        <span className="rounded-full bg-amber px-3 py-1 text-sm font-semibold">{places.length}</span>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Metric label={countLabel} value={totalVotes} />
        <Metric label="lugares ranqueados" value={places.length} />
      </div>
      <div className="grid gap-2">
        {places.length === 0 ? (
          <EmptyState
            title="Ranking vazio"
            description="Ainda nao ha votos ativos para os filtros escolhidos."
          />
        ) : (
          places.map((place, index) => (
            <article
              key={place.id}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-lg border border-line p-3"
            >
              <b className="grid size-9 place-items-center rounded-xl bg-amber">{index + 1}</b>
              <span className="grid min-w-0">
                <strong className="truncate">{place.name}</strong>
                <small className="truncate text-muted">{place.formattedAddress}</small>
              </span>
              <em className="text-sm font-semibold not-italic text-teal">{place.voteCount} votos</em>
            </article>
          ))
        )}
      </div>
    </Panel>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-muted p-3">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}

function totalVotes(places: MapPlace[]) {
  return places.reduce((sum, place) => sum + place.voteCount, 0)
}


function resolveCurrentCity() {
  return new Promise<{ city?: string; state?: string } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const googleApi = await loadGoogleMaps()
          const geocoder = new googleApi.maps.Geocoder()

          geocoder.geocode(
            {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            },
            (results, status) => {
              if (status !== googleApi.maps.GeocoderStatus.OK || !results?.[0]) {
                resolve(null)
                return
              }

              const result = results[0]

              resolve({
                city:
                  geocodeComponent(result, 'administrative_area_level_2', 'long_name') ??
                  geocodeComponent(result, 'locality', 'long_name'),
                state: geocodeComponent(result, 'administrative_area_level_1', 'short_name'),
              })
            }
          )
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 6000,
      }
    )
  })
}

function geocodeComponent(
  result: google.maps.GeocoderResult,
  type: string,
  nameKind: 'long_name' | 'short_name'
) {
  return result.address_components.find((item) => item.types.includes(type))?.[nameKind]
}

