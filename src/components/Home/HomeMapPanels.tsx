import {
  CalendarDays,
  Clock3,
  Navigation,
  TrendingUp,
  UserPlus,
  Vote,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { resolveApiUrl } from '../../api/api'
import type { MapFilters } from '../../api/ondeHoje'
import type { Group, MapPlace, VoteType } from '../../@types/OndeHoje'
import type { GooglePlaceDraft } from '../GooglePlacesMap'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { StatusBanner } from '../ui/StatusBanner'
import { formatDisplayDate } from '../../lib/date'
import { voteTypeOptions } from './homeVoteTypeOptions'

type PlaceVoteDialogProps = {
  cancelVotePending?: boolean
  currentUserPublicId?: string
  draftPlace?: GooglePlaceDraft
  groups: Group[]
  hasUserVote?: boolean
  isPending?: boolean
  maxDay: string
  minDay: string
  onAddFriend: (username: string) => void
  onCancelVote: (form: FormData) => void
  onClose: () => void
  onDayChange: (day: string) => void
  onSubmit: (form: FormData) => void
  place?: MapPlace
  requestedFriendUsernames: Set<string>
  requestFriendPending?: boolean
  selectedDay: string
  selectedGroupPublicId?: string
}

export function PlaceVoteDialog({
  currentUserPublicId,
  draftPlace,
  groups,
  hasUserVote,
  isPending,
  maxDay,
  minDay,
  onAddFriend,
  onCancelVote,
  onClose,
  onDayChange,
  onSubmit,
  place,
  requestedFriendUsernames,
  requestFriendPending,
  selectedDay,
  selectedGroupPublicId,
}: PlaceVoteDialogProps) {
  const isFreeMapPoint = draftPlace?.googlePlaceId.startsWith('map-click:') ?? false
  const dialogTitle = draftPlace ? (isFreeMapPoint ? 'Votar no lugar' : 'Votar no lugar') : 'Votar no lugar'
  const placeTitle = draftPlace?.name ?? place?.name ?? 'Lugar selecionado'
  const placeAddress = draftPlace?.formattedAddress ?? place?.formattedAddress

  return (
    <div className="fixed inset-0 z-50 bg-black/55 px-3 py-4 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center md:items-center">
        <section
          aria-modal="true"
          className="grid max-h-[calc(100vh-2rem)] w-full max-w-xl gap-3 overflow-y-auto rounded-lg border border-line bg-surface p-4 text-ink shadow-[0_24px_70px_rgba(0,0,0,.24)]"
          role="dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-teal">{dialogTitle}</p>
              <h2 className="mt-1 truncate text-xl font-semibold">{placeTitle}</h2>
              {placeAddress && <p className="mt-1 line-clamp-2 text-sm text-muted">{placeAddress}</p>}
            </div>
            <button
              aria-label="Fechar modal"
              className="grid size-12 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              type="button"
              onClick={onClose}
            >
              <X size={34} strokeWidth={2.8} />
            </button>
          </div>

          {place && (
            <VotersList
              currentUserPublicId={currentUserPublicId}
              isPending={requestFriendPending}
              requestedUsernames={requestedFriendUsernames}
              voters={place.voters}
              onAddFriend={onAddFriend}
            />
          )}

          <VotePanel
            groups={groups}
            hasUserVote={hasUserVote}
            isFreeMapPoint={isFreeMapPoint}
            isNewPlace={Boolean(draftPlace)}
            isPending={isPending}
            maxDay={maxDay}
            minDay={minDay}
            placeName={draftPlace?.name ?? place?.name}
            selectedDay={selectedDay}
            subtitle={draftPlace?.formattedAddress ?? place?.formattedAddress}
            voteCount={place?.voteCount}
            selectedGroupPublicId={selectedGroupPublicId}
            onCancelVote={onCancelVote}
            onDayChange={onDayChange}
            onSubmit={onSubmit}
          />
        </section>
      </div>
    </div>
  )
}

type HomeSidebarProps = {
  errors?: Array<string | undefined>
  filters: MapFilters
  isLoading?: boolean
  groups: Group[]
  topPlaces: MapPlace[]
  userVotesForSelectedDay: number
  onGroupChange: (groupPublicId?: string) => void
  onSelectPlace: (place: MapPlace) => void
}

export function HomeSidebar({
  errors = [],
  filters,
  isLoading,
  groups,
  topPlaces,
  userVotesForSelectedDay,
  onGroupChange,
  onSelectPlace,
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
          <Metric icon={Vote} label="meus votos" value={userVotesForSelectedDay} />
          <Metric icon={CalendarDays} label="limite" value={3} />
        </div>
      </section>

      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-2.5 text-ink shadow-panel backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="inline-flex min-w-0 items-center gap-2 text-base font-semibold">
            <TrendingUp size={18} />
            Mais votados
          </h2>
          <span className="shrink-0 text-xs font-medium text-muted">{formatDisplayDate(filters.day)}</span>
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

function VotePanel({
  canChooseVoteType = true,
  groups,
  hasUserVote,
  isFreeMapPoint,
  isNewPlace,
  isPending,
  maxDay,
  minDay,
  onDayChange,
  onCancelVote,
  onSubmit,
  placeName,
  selectedDay,
  selectedGroupPublicId,
  subtitle,
  voteCount,
}: {
  canChooseVoteType?: boolean
  groups: Array<{ id: string; name: string }>
  hasUserVote?: boolean
  isFreeMapPoint?: boolean
  isNewPlace?: boolean
  isPending?: boolean
  maxDay: string
  minDay: string
  onDayChange: (day: string) => void
  onCancelVote: (form: FormData) => void
  onSubmit: (form: FormData) => void
  placeName?: string
  selectedDay: string
  selectedGroupPublicId?: string
  subtitle?: string
  voteCount?: number
}) {
  if (hasUserVote && !isNewPlace) {
    return (
      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-3 text-ink shadow-panel backdrop-blur">
        <p className="mb-2 text-xs font-semibold uppercase text-teal">Seu voto</p>
        <h2 className="text-2xl font-semibold">{placeName ?? 'Lugar selecionado'}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        {voteCount !== undefined && (
          <span className="mt-3 inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
            {voteCount} votos em {formatDisplayDate(selectedDay)}
          </span>
        )}
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault()
            onCancelVote(new FormData(event.currentTarget))
          }}
        >
          <input name="day" type="hidden" value={selectedDay} />
          <Button disabled={!placeName || isPending} type="submit" variant="danger">
            Tirar meu voto
          </Button>
        </form>
      </section>
    )
  }

  return (
    <section className="pointer-events-auto text-ink">
      {voteCount !== undefined && (
        <span className="inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
          {voteCount} votos em {formatDisplayDate(selectedDay)}
        </span>
      )}
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(new FormData(event.currentTarget))
        }}
      >
        {isFreeMapPoint && (
          <Input
            autoFocus
            defaultValue=""
            label="Nome do lugar"
            maxLength={80}
            minLength={2}
            name="placeName"
            placeholder="Ex: Quadra da praia, Escadaria, Mirante..."
            required
          />
        )}
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
        <Select
          defaultValue={selectedGroupPublicId ?? ''}
          label="Grupo"
          name="groupPublicId"
          options={[
            { label: 'Publico', value: '' },
            ...groups.map((group) => ({ label: group.name, value: group.id })),
          ]}
        />
        {canChooseVoteType && (
          <fieldset>
            <legend className="mb-3 block text-xs font-medium text-muted">Tipo do voto</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {voteTypeOptions.map(({ icon: Icon, label, optionClassName, value }) => (
                <label
                  key={value}
                  className={`grid min-h-14 cursor-pointer place-items-center gap-1 rounded-md border border-line bg-surface-muted px-2 py-2 text-xs font-semibold text-muted transition ${optionClassName}`}
                >
                  <input
                    className="sr-only"
                    defaultChecked={value === 'GENERAL'}
                    name="voteType"
                    type="radio"
                    value={value}
                  />
                  <Icon size={18} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Nota opcional
          <textarea
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            maxLength={240}
            name="note"
            rows={2}
          />
        </label>
        <Button disabled={!placeName || isPending} type="submit">
          {isFreeMapPoint ? 'Salvar ponto e votar' : isNewPlace ? 'Salvar e votar' : 'Votar aqui'}
        </Button>
      </form>
    </section>
  )
}

function VotersList({
  currentUserPublicId,
  isPending,
  onAddFriend,
  requestedUsernames,
  voters,
}: {
  currentUserPublicId?: string
  isPending?: boolean
  onAddFriend: (username: string) => void
  requestedUsernames: Set<string>
  voters: MapPlace['voters']
}) {
  if (voters.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-panel">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase text-teal">Quem votou aqui</h3>
        <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
          {voters.length}
        </span>
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
        {voters.map((voter) => (
          <div
            key={voter.publicId}
            className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-line bg-surface-muted p-2.5"
          >
            <Avatar name={voter.name} src={voter.avatarUrl} />
            <div className="min-w-0">
              <strong className="block truncate text-sm">{voter.name}</strong>
              {voter.username && (
                <span className="mt-0.5 block truncate text-xs font-medium text-teal">
                  @{voter.username}
                </span>
              )}
              <VoteTypeBadge voteType={voter.voteType} />
              {voter.note && <p className="mt-1 text-sm text-muted">{voter.note}</p>}
            </div>
            {voter.username && voter.publicId !== currentUserPublicId && (
              <FriendshipButton
                friendship={
                  requestedUsernames.has(voter.username)
                    ? { status: 'PENDING', direction: 'sent' }
                    : voter.friendship
                }
                isPending={isPending}
                username={voter.username}
                onAddFriend={onAddFriend}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function FriendshipButton({
  friendship,
  isPending,
  onAddFriend,
  username,
}: {
  friendship?: NonNullable<MapPlace['voters'][number]['friendship']>
  isPending?: boolean
  onAddFriend: (username: string) => void
  username: string
}) {
  if (friendship?.status === 'ACCEPTED') {
    return null
  }

  if (friendship) {
    const isSent = friendship.status === 'PENDING' && friendship.direction === 'sent'
    const label = isSent ? 'Enviado' : 'Pendente'

    return (
      <Button
        aria-label={`${label} @${username}`}
        className="h-11 min-w-11 border-amber-200 bg-amber-50 px-3 text-amber-800 hover:bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200"
        disabled
        title={`${label} @${username}`}
        type="button"
        variant="secondary"
      >
        <Clock3 size={19} strokeWidth={2.5} />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    )
  }

  return (
    <Button
      aria-label={`Adicionar @${username}`}
      className="size-12 p-0"
      disabled={isPending}
      title={`Adicionar @${username}`}
      type="button"
      variant="secondary"
      onClick={() => onAddFriend(username)}
    >
      <UserPlus size={22} strokeWidth={2.6} />
    </Button>
  )
}

function VoteTypeBadge({ voteType }: { voteType: VoteType }) {
  const option = voteTypeOptions.find((item) => item.value === voteType) ?? voteTypeOptions[0]
  const Icon = option.icon

  return (
    <span
      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${option.badgeClassName}`}
    >
      <Icon size={13} />
      {option.label}
    </span>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; size?: number }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-muted p-2.5">
      <Icon className="mb-2 text-teal" size={17} />
      <strong className="block text-xl">{value}</strong>
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
        className="size-11 rounded-lg border border-line object-cover"
        referrerPolicy="no-referrer"
        src={avatarSrc}
      />
    )
  }

  return (
    <span className="grid size-11 place-items-center rounded-lg bg-teal text-xs font-semibold text-on-teal">
      {initials || 'U'}
    </span>
  )
}


