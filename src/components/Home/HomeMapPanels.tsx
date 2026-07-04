import {
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
  TrendingUp,
  UserCheck,
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
  return (
    <div className="fixed inset-0 z-50 bg-black/55 px-4 py-6 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center md:items-center">
        <section
          aria-modal="true"
          className="grid max-h-[calc(100vh-3rem)] w-full max-w-2xl gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-4 text-ink shadow-[0_24px_70px_rgba(0,0,0,.24)] md:p-6"
          role="dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-teal">
                {draftPlace ? 'Novo ponto do mapa' : 'Lugar existente'}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{draftPlace?.name ?? place?.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {draftPlace?.formattedAddress ?? place?.formattedAddress}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="rounded-lg border border-line bg-teal-soft p-3 text-sm text-ink/80">
            {draftPlace
              ? 'Clique em outro ponto do mapa para trocar a localizacao. Se o Google nao identificar o endereco, o ponto continua selecionado do mesmo jeito.'
              : 'Esse lugar ja existe no mapa. Voce pode votar nele agora ou abrir outro marcador para trocar de selecao.'}
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
  currentAddress: string
  errors?: Array<string | undefined>
  filters: MapFilters
  isLoading?: boolean
  groups: Group[]
  placesCount: number
  topPlaces: MapPlace[]
  userVotesForSelectedDay: number
  onGroupChange: (groupPublicId?: string) => void
  onSelectPlace: (place: MapPlace) => void
}

export function HomeSidebar({
  currentAddress,
  errors = [],
  filters,
  isLoading,
  groups,
  placesCount,
  topPlaces,
  userVotesForSelectedDay,
  onGroupChange,
  onSelectPlace,
}: HomeSidebarProps) {
  return (
    <aside className="grid content-start gap-4 p-3 md:pointer-events-none md:absolute md:right-4 md:top-4 md:z-20 md:w-[420px] md:p-0">
      <StatusBanner error={errors.find(Boolean)} loading={isLoading} />

      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-5 text-ink shadow-panel backdrop-blur">
        <p className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
          <Navigation size={14} />
          mapa principal
        </p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight">Veja onde a galera vai hoje.</h1>
        <p className="mt-3 text-sm text-muted">
          Busque um lugar no Google Maps, salve na base e vote. Lugares com votos aparecem como
          marcadores reais no mapa.
        </p>
        {currentAddress && (
          <div className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
            <span className="block text-xs font-semibold uppercase text-muted">
              Localizacao atual do mapa
            </span>
            <strong className="mt-1 block text-sm">{currentAddress}</strong>
          </div>
        )}
        <label className="mt-4 grid gap-1.5 text-xs font-medium text-muted">
          Filtrar por grupo
          <select
            className="min-h-10 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            value={filters.groupPublicId ?? ''}
            onChange={(event) => onGroupChange(event.currentTarget.value || undefined)}
          >
            <option value="">Todos os meus grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {groups.length === 0 && (
            <span className="text-xs text-muted">
              Entre em um grupo para filtrar o mapa por ele.
            </span>
          )}
        </label>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric icon={Vote} label="meus votos" value={userVotesForSelectedDay} />
          <Metric icon={MapPin} label="lugares" value={placesCount} />
          <Metric icon={CalendarDays} label="limite" value={3} />
        </div>
      </section>

      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-4 text-ink shadow-panel backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <TrendingUp size={19} />
            Mais votados
          </h2>
          <span className="text-sm font-medium text-muted">{formatDisplayDate(filters.day)}</span>
        </div>
        <div className="grid gap-2">
          {topPlaces.map((place, index) => (
            <button
              key={place.id}
              className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-line p-3 text-left transition hover:bg-teal-soft"
              type="button"
              onClick={() => onSelectPlace(place)}
            >
              <b className="grid size-8 place-items-center rounded-xl bg-amber text-ink">
                {index + 1}
              </b>
              <span>
                <strong className="block text-sm">{place.name}</strong>
                <small className="text-muted">{place.city ?? 'Sem cidade'}</small>
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
      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-4 text-ink shadow-panel backdrop-blur">
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
    <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-4 text-ink shadow-panel backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase text-teal">
        {isNewPlace ? 'Novo lugar do Google Maps' : 'Lugar selecionado'}
      </p>
      <h2 className="text-2xl font-semibold">{placeName ?? 'Selecione um marcador'}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      {voteCount !== undefined && (
        <span className="mt-3 inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
          {voteCount} votos em {formatDisplayDate(selectedDay)}
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
        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Grupo
          <select
            className="min-h-10 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            name="groupPublicId"
            defaultValue={selectedGroupPublicId ?? ''}
          >
            <option value="">Publico</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        {canChooseVoteType && (
          <fieldset className="grid gap-2">
            <legend className="text-xs font-medium text-muted">Tipo do voto</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {voteTypeOptions.map(({ icon: Icon, label, optionClassName, value }) => (
                <label
                  key={value}
                  className={`grid min-h-16 cursor-pointer place-items-center gap-1 rounded-lg border border-line bg-surface-muted px-2 py-2 text-xs font-semibold text-muted transition ${optionClassName}`}
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
          Nota
          <textarea
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            maxLength={240}
            name="note"
            rows={3}
          />
        </label>
        <Button disabled={!placeName || isPending} type="submit">
          {isNewPlace ? 'Salvar e votar' : 'Votar aqui'}
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase text-teal">Quem votou aqui</h3>
        <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
          {voters.length}
        </span>
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
        {voters.map((voter) => (
          <div
            key={voter.publicId}
            className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-line bg-surface-muted p-3"
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
  if (friendship) {
    const isAccepted = friendship.status === 'ACCEPTED'
    const isSent = friendship.status === 'PENDING' && friendship.direction === 'sent'
    const label = isAccepted ? 'Amigos' : isSent ? 'Enviado' : 'Pendente'
    const Icon = isAccepted ? UserCheck : Clock3

    return (
      <Button
        aria-label={`${label} @${username}`}
        className={`h-11 min-w-11 px-3 ${
          isAccepted
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200'
            : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200'
        }`}
        disabled
        title={`${label} @${username}`}
        type="button"
        variant="secondary"
      >
        <Icon size={19} strokeWidth={2.5} />
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
    <div className="rounded-lg border border-line bg-surface-muted p-3">
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
        className="size-11 rounded-lg border border-line object-cover"
        referrerPolicy="no-referrer"
        src={avatarSrc}
      />
    )
  }

  return (
    <span className="grid size-11 place-items-center rounded-lg bg-teal text-xs font-semibold text-white">
      {initials || 'U'}
    </span>
  )
}
