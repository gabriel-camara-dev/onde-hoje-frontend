import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MapPin, Navigation, TrendingUp, Vote, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  createPlace,
  getTodayMap,
  listPublicGroups,
  type MapFilters,
  voteForPlace,
} from '../../api/ondeHoje'
import type { MapPlace } from '../../@types/OndeHoje'
import { GooglePlacesMap, type GooglePlaceDraft } from '../../components/GooglePlacesMap'
import Button from '../../components/ui/Button'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useUserStore } from '../../stores/userStore'

const today = new Date().toISOString().slice(0, 10)

export default function Home() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accessToken = useUserStore((state) => state.accessToken)
  const [filters, setFilters] = useState<MapFilters>({ city: '', day: today, q: '' })
  const [selectedPlace, setSelectedPlace] = useState<MapPlace>()
  const [draftPlace, setDraftPlace] = useState<GooglePlaceDraft>()
  const [currentAddress, setCurrentAddress] = useState('')

  const mapQuery = useQuery({
    queryKey: ['today-map', filters],
    queryFn: () => getTodayMap(filters),
  })
  const groupsQuery = useQuery({
    queryKey: ['public-groups', filters.city],
    queryFn: () => listPublicGroups(filters.city),
  })

  const places = useMemo(() => mapQuery.data ?? [], [mapQuery.data])
  const activePlace = selectedPlace ?? places[0]

  const voteMutation = useMutation({
    mutationFn: async (input: { placeId: string; note?: string; groupPublicId?: string }) => {
      await voteForPlace(input.placeId, {
        day: filters.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
      })
    },
    onSuccess: async () => {
      setDraftPlace(undefined)
      setSelectedPlace(undefined)
      toast.success('Voto registrado no mapa.')
      await refreshVotingData()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const createAndVoteMutation = useMutation({
    mutationFn: async (input: {
      draft: GooglePlaceDraft
      note?: string
      groupPublicId?: string
    }) => {
      const place = await createPlace(input.draft)
      await voteForPlace(place.id, {
        day: filters.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
      })
    },
    onSuccess: async () => {
      setDraftPlace(undefined)
      setSelectedPlace(undefined)
      toast.success('Lugar salvo e voto registrado.')
      await refreshVotingData()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  async function refreshVotingData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['today-map'] }),
      queryClient.invalidateQueries({ queryKey: ['top-places'] }),
      queryClient.invalidateQueries({ queryKey: ['map-history'] }),
      queryClient.invalidateQueries({ queryKey: ['my-votes'] }),
      queryClient.invalidateQueries({ queryKey: ['places'] }),
    ])
  }

  function requireAuth() {
    if (!accessToken) {
      navigate('/login?reason=vote')
      return false
    }

    return true
  }

  function voteExisting(form: FormData) {
    if (!activePlace || !requireAuth()) {
      return
    }

    voteMutation.mutate({
      placeId: activePlace.id,
      groupPublicId: String(form.get('groupPublicId') || '') || undefined,
      note: String(form.get('note') || '') || undefined,
    })
  }

  function voteDraft(form: FormData) {
    if (!draftPlace || !requireAuth()) {
      return
    }

    createAndVoteMutation.mutate({
      draft: draftPlace,
      groupPublicId: String(form.get('groupPublicId') || '') || undefined,
      note: String(form.get('note') || '') || undefined,
    })
  }

  return (
    <>
      {(draftPlace || selectedPlace) && (
        <div className="fixed inset-0 z-50 bg-black/55 px-4 py-6 backdrop-blur-sm">
          <div className="flex min-h-full items-end justify-center md:items-center">
            <section
              aria-modal="true"
              className="grid w-full max-w-2xl gap-4 rounded-[28px] border border-line bg-surface p-4 text-ink shadow-[0_30px_90px_rgba(0,0,0,.35)] md:p-6"
              role="dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-teal">
                    {draftPlace ? 'Novo ponto do mapa' : 'Lugar existente'}
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {draftPlace?.name ?? selectedPlace?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {draftPlace?.formattedAddress ?? selectedPlace?.formattedAddress}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraftPlace(undefined)
                    setSelectedPlace(undefined)
                  }}
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="rounded-2xl border border-line bg-teal-soft p-3 text-sm text-ink/80">
                {draftPlace
                  ? 'Clique em outro ponto do mapa para trocar a localização. Se o Google não identificar o endereço, o ponto continua selecionado do mesmo jeito.'
                  : 'Esse lugar já existe no mapa. Você pode votar nele agora ou abrir outro marcador para trocar de seleção.'}
              </div>

              <VotePanel
                groups={groupsQuery.data ?? []}
                isNewPlace={Boolean(draftPlace)}
                placeName={draftPlace?.name ?? selectedPlace?.name}
                subtitle={draftPlace?.formattedAddress ?? selectedPlace?.formattedAddress}
                voteCount={selectedPlace?.voteCount}
                onSubmit={draftPlace ? voteDraft : voteExisting}
              />
            </section>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4">
          <GooglePlacesMap
            city={filters.city}
            places={places}
            selectedPlaceId={selectedPlace?.id}
            onLocationResolved={(location) => {
              setCurrentAddress(location.address)

              if (location.city && !filters.city) {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  city: location.city ?? currentFilters.city,
                }))
              }
            }}
            onDraftSelected={(place) => {
              setDraftPlace(place)
              setSelectedPlace(undefined)
            }}
            onPlaceSelected={(place) => {
              setDraftPlace(undefined)
              setSelectedPlace(place)
            }}
          />
        </div>

        <aside className="grid content-start gap-4">
          <StatusBanner
            error={
              mapQuery.error?.message ??
              voteMutation.error?.message ??
              createAndVoteMutation.error?.message
            }
            loading={
              mapQuery.isLoading ||
              groupsQuery.isLoading ||
              voteMutation.isPending ||
              createAndVoteMutation.isPending
            }
          />

          <section className="rounded-3xl border border-line bg-surface p-5 text-ink shadow-panel">
            <p className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-black text-teal">
              <Navigation size={14} />
              mapa principal
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight">Veja onde a galera vai hoje.</h1>
            <p className="mt-3 text-sm text-muted">
              Busque um lugar no Google Maps, salve na base e vote. Lugares com votos aparecem como
              marcadores reais no mapa.
            </p>
            {currentAddress && (
              <div className="mt-4 rounded-2xl border border-line bg-surface-muted p-3">
                <span className="block text-xs font-black uppercase text-muted">
                  Localizacao atual do mapa
                </span>
                <strong className="mt-1 block text-sm">{currentAddress}</strong>
              </div>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Metric
                icon={Vote}
                label="votos"
                value={places.reduce((sum, place) => sum + place.voteCount, 0)}
              />
              <Metric icon={MapPin} label="lugares" value={places.length} />
              <Metric icon={CalendarDays} label="limite" value={3} />
            </div>
          </section>

          {!draftPlace && (
            <VotePanel
              groups={groupsQuery.data ?? []}
              placeName={activePlace?.name}
              subtitle={activePlace?.formattedAddress}
              voteCount={activePlace?.voteCount}
              onSubmit={voteExisting}
            />
          )}

          <section className="rounded-3xl border border-line bg-surface p-4 text-ink shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-lg font-black">
                <TrendingUp size={19} />
                Mais votados
              </h2>
              <span className="text-sm font-bold text-muted">{filters.day}</span>
            </div>
            <div className="grid gap-2">
              {places.slice(0, 8).map((place, index) => (
                <button
                  key={place.id}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:bg-teal-soft"
                  type="button"
                  onClick={() => {
                    setDraftPlace(undefined)
                    setSelectedPlace(place)
                  }}
                >
                  <b className="grid size-8 place-items-center rounded-xl bg-amber text-ink">
                    {index + 1}
                  </b>
                  <span>
                    <strong className="block text-sm">{place.name}</strong>
                    <small className="text-muted">{place.city ?? 'Sem cidade'}</small>
                  </span>
                  <em className="text-sm font-black not-italic text-teal">
                    {place.voteCount}
                  </em>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

function VotePanel({
  groups,
  isNewPlace,
  onSubmit,
  placeName,
  subtitle,
  voteCount,
}: {
  groups: Array<{ id: string; name: string }>
  isNewPlace?: boolean
  onSubmit: (form: FormData) => void
  placeName?: string
  subtitle?: string
  voteCount?: number
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-4 text-ink shadow-panel">
      <p className="mb-2 text-xs font-black uppercase text-teal">
        {isNewPlace ? 'Novo lugar do Google Maps' : 'Lugar selecionado'}
      </p>
      <h2 className="text-2xl font-black">{placeName ?? 'Selecione um marcador'}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      {voteCount !== undefined && (
        <span className="mt-3 inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-black text-teal">
          {voteCount} votos hoje
        </span>
      )}
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(new FormData(event.currentTarget))
        }}
      >
        <label className="grid gap-1.5 text-xs font-bold text-muted">
          Grupo
          <select
            className="min-h-10 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-teal"
            name="groupPublicId"
          >
            <option value="">Publico</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-muted">
          Nota
          <textarea
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-teal"
            maxLength={240}
            name="note"
            rows={3}
          />
        </label>
        <Button disabled={!placeName} type="submit">
          {isNewPlace ? 'Salvar e votar' : 'Votar aqui'}
        </Button>
      </form>
    </section>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Vote; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-muted p-3">
      <Icon className="mb-2 text-teal" size={17} />
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}
