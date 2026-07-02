import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MapPin, Navigation, TrendingUp, UserPlus, Vote, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { resolveApiUrl } from '../../api/api'
import {
  cancelVoteForPlace,
  createPlace,
  getTodayMap,
  listMyVotes,
  listPublicGroups,
  requestFriendship,
  type MapFilters,
  voteForPlace,
} from '../../api/ondeHoje'
import type { MapPlace } from '../../@types/OndeHoje'
import { GooglePlacesMap, type GooglePlaceDraft } from '../../components/GooglePlacesMap'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { useUserStore } from '../../stores/userStore'

const today = formatLocalDate(new Date())
const maxVoteDay = formatLocalDate(addMonths(new Date(), 1))

export default function Home() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)
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
  const myVotesQuery = useQuery({
    enabled: Boolean(accessToken),
    queryKey: ['my-votes'],
    queryFn: listMyVotes,
  })

  const places = useMemo(() => mapQuery.data ?? [], [mapQuery.data])
  const selectedPlaceForDay = selectedPlace
    ? (places.find((place) => place.id === selectedPlace.id) ?? {
        ...selectedPlace,
        voteCount: 0,
        voters: [],
      })
    : undefined

  const voteMutation = useMutation({
    mutationFn: async (input: {
      day: string
      placeId: string
      note?: string
      groupPublicId?: string
    }) => {
      await voteForPlace(input.placeId, {
        day: input.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
      })
    },
    onSuccess: async (_data, input) => {
      setFilters((currentFilters) => ({ ...currentFilters, day: input.day }))
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
      day: string
      draft: GooglePlaceDraft
      note?: string
      groupPublicId?: string
    }) => {
      const place = await createPlace(input.draft)
      await voteForPlace(place.id, {
        day: input.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
      })
    },
    onSuccess: async (_data, input) => {
      setFilters((currentFilters) => ({ ...currentFilters, day: input.day }))
      setDraftPlace(undefined)
      setSelectedPlace(undefined)
      toast.success('Lugar salvo e voto registrado.')
      await refreshVotingData()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const cancelVoteMutation = useMutation({
    mutationFn: async (input: { day: string; placeId: string; groupPublicId?: string }) => {
      await cancelVoteForPlace(input.placeId, {
        day: input.day,
        groupPublicId: input.groupPublicId,
      })
    },
    onSuccess: async (_data, input) => {
      setFilters((currentFilters) => ({ ...currentFilters, day: input.day }))
      setSelectedPlace(undefined)
      toast.success('Voto removido.')
      await refreshVotingData()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const requestFriendshipMutation = useMutation({
    mutationFn: requestFriendship,
    onSuccess: async () => {
      toast.success('Pedido de amizade enviado.')
      await queryClient.invalidateQueries({ queryKey: ['friends'] })
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

  function voteDayFrom(form: FormData) {
    const day = String(form.get('day') || '')

    if (!day) {
      toast.error('Escolha o dia do voto.')
      return null
    }

    if (!isAllowedVoteDay(day)) {
      toast.error('Escolha uma data entre hoje e ate 1 mes no futuro.')
      return null
    }

    return day
  }

  function voteExisting(form: FormData) {
    if (!selectedPlaceForDay || !requireAuth()) {
      return
    }

    const day = voteDayFrom(form)

    if (!day) {
      return
    }

    voteMutation.mutate({
      day,
      placeId: selectedPlaceForDay.id,
      groupPublicId: String(form.get('groupPublicId') || '') || undefined,
      note: String(form.get('note') || '') || undefined,
    })
  }

  function voteDraft(form: FormData) {
    if (!draftPlace || !requireAuth()) {
      return
    }

    const day = voteDayFrom(form)

    if (!day) {
      return
    }

    createAndVoteMutation.mutate({
      day,
      draft: draftPlace,
      groupPublicId: String(form.get('groupPublicId') || '') || undefined,
      note: String(form.get('note') || '') || undefined,
    })
  }

  function cancelExistingVote(form: FormData, groupPublicId?: string) {
    if (!selectedPlaceForDay || !requireAuth()) {
      return
    }

    const day = voteDayFrom(form)

    if (!day) {
      return
    }

    cancelVoteMutation.mutate({
      day,
      placeId: selectedPlaceForDay.id,
      groupPublicId: groupPublicId ?? (String(form.get('groupPublicId') || '') || undefined),
    })
  }

  function changeMapDay(day: string) {
    if (!day) {
      return
    }

    if (!isAllowedVoteDay(day)) {
      toast.error('Escolha uma data entre hoje e ate 1 mes no futuro.')
      return
    }

    setFilters((currentFilters) => ({ ...currentFilters, day }))
  }

  const selectedPlaceUserVote = myVotesQuery.data?.find(
    (vote) => dateOnly(vote.day) === filters.day && vote.place.id === selectedPlaceForDay?.id
  )
  const selectedPlaceHasUserVote = Boolean(
    selectedPlaceUserVote ??
    selectedPlaceForDay?.voters.some((voter) => voter.publicId === user?.id)
  )
  const userVotesForSelectedDay =
    myVotesQuery.data?.filter((vote) => dateOnly(vote.day) === filters.day).length ?? 0

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
                    {draftPlace?.name ?? selectedPlaceForDay?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {draftPlace?.formattedAddress ?? selectedPlaceForDay?.formattedAddress}
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

              {selectedPlaceForDay && (
                <VotersList
                  currentUserPublicId={user?.id}
                  isPending={requestFriendshipMutation.isPending}
                  voters={selectedPlaceForDay.voters}
                  onAddFriend={(username) => {
                    if (!requireAuth()) {
                      return
                    }

                    requestFriendshipMutation.mutate(username)
                  }}
                />
              )}

              <VotePanel
                groups={groupsQuery.data ?? []}
                isNewPlace={Boolean(draftPlace)}
                placeName={draftPlace?.name ?? selectedPlaceForDay?.name}
                subtitle={draftPlace?.formattedAddress ?? selectedPlaceForDay?.formattedAddress}
                voteCount={selectedPlaceForDay?.voteCount}
                hasUserVote={selectedPlaceHasUserVote}
                isPending={
                  voteMutation.isPending ||
                  createAndVoteMutation.isPending ||
                  cancelVoteMutation.isPending
                }
                selectedDay={filters.day}
                maxDay={maxVoteDay}
                minDay={today}
                onDayChange={changeMapDay}
                onCancelVote={(form) => cancelExistingVote(form, selectedPlaceUserVote?.group?.id)}
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
            maxMapDay={maxVoteDay}
            mapDay={filters.day}
            minMapDay={today}
            places={places}
            selectedPlaceId={selectedPlace?.id}
            onMapDayChange={changeMapDay}
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
              createAndVoteMutation.error?.message ??
              cancelVoteMutation.error?.message ??
              requestFriendshipMutation.error?.message
            }
            loading={
              mapQuery.isLoading ||
              groupsQuery.isLoading ||
              myVotesQuery.isLoading ||
              voteMutation.isPending ||
              createAndVoteMutation.isPending ||
              cancelVoteMutation.isPending ||
              requestFriendshipMutation.isPending
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
              <Metric icon={Vote} label="meus votos" value={userVotesForSelectedDay} />
              <Metric icon={MapPin} label="lugares" value={places.length} />
              <Metric icon={CalendarDays} label="limite" value={3} />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-4 text-ink shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-lg font-black">
                <TrendingUp size={19} />
                Mais votados
              </h2>
              <span className="text-sm font-bold text-muted">{filters.day}</span>
            </div>
            <div className="grid gap-2">
              {places.slice(0, 3).map((place, index) => (
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
                  <em className="text-sm font-black not-italic text-teal">{place.voteCount}</em>
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
  hasUserVote,
  isNewPlace,
  isPending,
  maxDay,
  minDay,
  onDayChange,
  onCancelVote,
  onSubmit,
  placeName,
  selectedDay,
  subtitle,
  voteCount,
}: {
  groups: Array<{ id: string; name: string }>
  hasUserVote?: boolean
  isNewPlace?: boolean
  isPending?: boolean
  maxDay: string
  minDay: string
  onDayChange: (day: string) => void
  onCancelVote: (form: FormData) => void
  onSubmit: (form: FormData) => void
  placeName?: string
  selectedDay: string
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
          {voteCount} votos em {formatDateLabel(selectedDay)}
        </span>
      )}
      <form
        className="mt-4 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(new FormData(event.currentTarget))
        }}
      >
        <Input
          label="Dia"
          max={maxDay}
          min={minDay}
          name="day"
          required
          type="date"
          value={selectedDay}
          onChange={(event) => onDayChange(event.currentTarget.value)}
        />
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
        {hasUserVote && !isNewPlace ? (
          <Button
            disabled={!placeName || isPending}
            type="button"
            variant="danger"
            onClick={(event) => onCancelVote(new FormData(event.currentTarget.form!))}
          >
            Tirar meu voto
          </Button>
        ) : (
          <Button disabled={!placeName || isPending} type="submit">
            {isNewPlace ? 'Salvar e votar' : 'Votar aqui'}
          </Button>
        )}
      </form>
    </section>
  )
}

function VotersList({
  currentUserPublicId,
  isPending,
  onAddFriend,
  voters,
}: {
  currentUserPublicId?: string
  isPending?: boolean
  onAddFriend: (username: string) => void
  voters: MapPlace['voters']
}) {
  if (voters.length === 0) {
    return null
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase text-teal">Quem votou aqui</h3>
        <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-black text-teal">
          {voters.length}
        </span>
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
        {voters.map((voter) => (
          <div
            key={voter.publicId}
            className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-line bg-surface-muted p-3"
          >
            <Avatar name={voter.name} src={voter.avatarUrl} />
            <div className="min-w-0">
              <strong className="block truncate text-sm">{voter.name}</strong>
              {voter.username && (
                <span className="mt-0.5 block truncate text-xs font-bold text-teal">@{voter.username}</span>
              )}
              {voter.note && <p className="mt-1 text-sm text-muted">{voter.note}</p>}
            </div>
            {voter.username && voter.publicId !== currentUserPublicId && (
              <Button
                aria-label={`Adicionar @${voter.username}`}
                className="size-12 p-0"
                disabled={isPending}
                title={`Adicionar @${voter.username}`}
                type="button"
                variant="secondary"
                onClick={() => onAddFriend(voter.username!)}
              >
                <UserPlus size={22} strokeWidth={2.6} />
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function formatDateLabel(day: string) {
  const [year, month, date] = day.split('-').map(Number)

  if (!year || !month || !date) {
    return day
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(year, month - 1, date))
}

function dateOnly(value: string) {
  return value.slice(0, 10)
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

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const avatarSrc = resolveApiUrl(src)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (avatarSrc) {
    return (
      <img
        alt=""
        className="size-11 rounded-2xl border border-line object-cover"
        referrerPolicy="no-referrer"
        src={avatarSrc}
      />
    )
  }

  return (
    <span className="grid size-11 place-items-center rounded-2xl bg-teal text-xs font-black text-white">
      {initials || 'U'}
    </span>
  )
}

function formatLocalDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date)
  nextDate.setMonth(nextDate.getMonth() + months)
  return nextDate
}

function isAllowedVoteDay(day: string) {
  return day >= today && day <= maxVoteDay
}
