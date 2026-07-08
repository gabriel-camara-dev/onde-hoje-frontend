import { RequireAccountModal } from '../../components/auth/RequireAccountModal'
import { GooglePlacesMap } from '../../components/GooglePlacesMap'
import { HomeSidebar, PlaceVoteDialog } from './components'
import { useHome } from './hooks/useHome'

export default function Home() {
  const home = useHome()

  return (
    <>
      {home.showRequireAccountModal && (
        <RequireAccountModal onClose={home.closeRequireAccountModal} />
      )}

      {home.isDialogOpen && (
        <PlaceVoteDialog
          currentUserPublicId={home.currentUserPublicId}
          draftPlace={home.draftPlace}
          groups={home.activeGroups}
          hasUserVote={home.hasUserVote}
          isPending={home.isVotingPending}
          maxDay={home.maxDay}
          minDay={home.minDay}
          place={home.selectedPlaceForDay}
          requestedFriendUsernames={home.requestedFriendUsernames}
          requestFriendPending={home.requestFriendPending}
          selectedDay={home.filters.day}
          selectedGroupPublicId={home.filters.groupPublicId}
          onAddFriend={home.addFriend}
          onCancelVote={home.cancelSelectedVote}
          onClose={home.closeSelectedPlace}
          onCopyVoteLink={home.copyVoteLink}
          onDayChange={home.changeMapDay}
          onSubmit={home.submitVote}
        />
      )}

      <div className="relative -mx-3 bg-paper md:h-[calc(100dvh-158px)] md:overflow-hidden md:bg-surface lg:-mx-5 lg:h-[calc(100dvh-178px)]">
        <GooglePlacesMap
          className="h-[58vh] min-h-[420px] rounded-none border-x-0 border-t-0 shadow-none md:h-full md:min-h-0 md:border-0"
          city={home.filters.city}
          maxMapDay={home.maxDay}
          mapDay={home.filters.day}
          minMapDay={home.minDay}
          places={home.places}
          selectedPlaceId={home.selectedPlace?.id}
          onDraftSelected={home.selectDraft}
          onLocationResolved={(location) => home.changeCity(location.city)}
          onMapDayChange={home.changeMapDay}
          onPlaceSelected={home.selectPlace}
        />

        <HomeSidebar
          filters={home.filters}
          isLoading={home.isSidebarLoading}
          isWeekView={home.isWeekView}
          groups={home.activeGroups}
          topPlaces={home.topPlaces}
          userVotesForSelectedDay={home.userVotesForSelectedDay}
          onGroupChange={home.changeGroup}
          onSelectPlace={home.selectPlace}
          onWeekViewChange={home.setWeekView}
        />
      </div>
    </>
  )
}
