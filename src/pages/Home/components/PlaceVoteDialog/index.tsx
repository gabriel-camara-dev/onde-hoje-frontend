import { X } from 'lucide-react'
import type { Group, MapPlace } from '../../../../@types/OndeHoje'
import type { GooglePlaceDraft } from '../../../../components/GooglePlacesMap'
import { VotePanel } from '../VotePanel'
import { VotersList } from '../VotersList'

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
  const dialogTitle = 'Votar no lugar'
  const googlePlaceName = draftPlace?.googlePlaceName ?? place?.googlePlaceName
  const nickname = draftPlace?.nickname ?? place?.nickname
  const placeTitle =
    nickname ?? googlePlaceName ?? draftPlace?.name ?? place?.name ?? 'Lugar selecionado'
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
              {googlePlaceName && googlePlaceName !== placeTitle && (
                <p className="mt-1 truncate text-sm font-semibold text-ink">{googlePlaceName}</p>
              )}
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
            googlePlaceName={googlePlaceName}
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
