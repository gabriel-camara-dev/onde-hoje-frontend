import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  cancelVoteForPlace,
  createPlace,
  getTodayMap,
  getTopPlaces,
  listMyVotes,
  listMyGroups,
  requestFriendship,
  type MapFilters,
  voteForPlace,
} from '../../api/ondeHoje'
import type { MapPlace, VoteHistoryItem, VoteType } from '../../@types/OndeHoje'
import { RequireAccountModal } from '../../components/auth/RequireAccountModal'
import { GooglePlacesMap, type GooglePlaceDraft } from '../../components/GooglePlacesMap'
import { formatInputDate } from '../../lib/date'
import { useUserStore } from '../../stores/userStore'
import { HomeSidebar, PlaceVoteDialog } from '../../components/Home/HomeMapPanels'
import { loadHomeMapFilters, saveHomeMapFilters } from '../../components/Home/homeMapFiltersStorage'
import { voteTypeOptions } from '../../components/Home/homeVoteTypeOptions'

const today = formatInputDate(new Date())
const maxVoteDay = formatInputDate(addMonths(new Date(), 1))
const defaultMapFilters: MapFilters = { city: '', day: today, q: '' }

export default function Home() {
  const queryClient = useQueryClient()
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)
  const [filters, setFilters] = useState<MapFilters>(() => loadHomeMapFilters(defaultMapFilters))
  const [selectedPlace, setSelectedPlace] = useState<MapPlace>()
  const [draftPlace, setDraftPlace] = useState<GooglePlaceDraft>()
  const [requestedFriendUsernames, setRequestedFriendUsernames] = useState<Set<string>>(new Set())
  const [showRequireAccountModal, setShowRequireAccountModal] = useState(false)

  useEffect(() => {
    saveHomeMapFilters(filters)
  }, [filters])

  const mapQuery = useQuery({
    queryKey: ['today-map', filters],
    queryFn: () => getTodayMap(filters),
    refetchOnMount: 'always',
  })

  const myGroupsQuery = useQuery({
    enabled: Boolean(accessToken && user),
    queryKey: ['my-groups'],
    queryFn: listMyGroups,
  })

  const myVotesQuery = useQuery({
    enabled: Boolean(accessToken && user),
    queryKey: ['my-votes'],
    queryFn: listMyVotes,
  })

  const topPlacesQuery = useQuery({
    queryKey: ['top-places', filters],
    queryFn: () => getTopPlaces({ ...filters, limit: 3 }),
    refetchOnMount: 'always',
  })

  const places = useMemo(() => mapQuery.data ?? [], [mapQuery.data])
  const topPlaces = useMemo(() => topPlacesQuery.data ?? [], [topPlacesQuery.data])
  const activeGroups = useMemo(
    () => (myGroupsQuery.data ?? []).filter((group) => group.myStatus === 'ACTIVE'),
    [myGroupsQuery.data]
  )
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
      voteType?: VoteType
      groupPublicId?: string
    }) => {
      await voteForPlace(input.placeId, {
        day: input.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
        voteType: input.voteType,
      })
    },
    onSuccess: async (_data, input) => {
      setFilters((currentFilters) => ({ ...currentFilters, day: input.day }))
      closeSelectedPlace()
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
      voteType?: VoteType
      groupPublicId?: string
    }) => {
      const place = await createPlace(input.draft)
      await voteForPlace(place.id, {
        day: input.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
        voteType: input.voteType,
      })
    },
    onSuccess: async (_data, input) => {
      setFilters((currentFilters) => ({ ...currentFilters, day: input.day }))
      closeSelectedPlace()
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
    onSuccess: async (_data, username) => {
      setRequestedFriendUsernames((current) => new Set(current).add(username))
      toast.success('Pedido de amizade enviado.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['friends'] }),
        queryClient.invalidateQueries({ queryKey: ['today-map'] }),
      ])
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const selectedPlaceUserVote = myVotesQuery.data?.find(
    (vote) =>
      dateOnly(vote.day) === filters.day &&
      vote.place.id === selectedPlaceForDay?.id &&
      (!filters.groupPublicId || vote.group?.id === filters.groupPublicId)
  )
  const selectedPlaceHasUserVote = Boolean(
    selectedPlaceUserVote ??
    selectedPlaceForDay?.voters.some((voter) => voter.publicId === user?.id)
  )
  const userVotesForSelectedDay = countUserActiveVotesForDay(myVotesQuery.data, filters.day)
  const isVotingPending =
    voteMutation.isPending || createAndVoteMutation.isPending || cancelVoteMutation.isPending

  async function refreshVotingData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['map-history'] }),
      queryClient.invalidateQueries({ queryKey: ['my-votes'] }),
      queryClient.invalidateQueries({ queryKey: ['places'] }),
      queryClient.refetchQueries({ queryKey: ['today-map'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['top-places'], type: 'active' }),
    ])
  }

  function requireAuth() {
    if (!accessToken) {
      setShowRequireAccountModal(true)
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

  function voteTypeFrom(form: FormData): VoteType {
    const voteType = String(form.get('voteType') || 'GENERAL')

    return voteTypeOptions.some((option) => option.value === voteType)
      ? (voteType as VoteType)
      : 'GENERAL'
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
      voteType: voteTypeFrom(form),
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

    const nickname = String(form.get('placeNickname') || '').trim()

    createAndVoteMutation.mutate({
      day,
      draft: {
        ...draftPlace,
        name: nickname || draftPlace.googlePlaceName || draftPlace.name,
        googlePlaceName: draftPlace.googlePlaceName || draftPlace.name,
        nickname: nickname || undefined,
      },
      groupPublicId: String(form.get('groupPublicId') || '') || undefined,
      note: String(form.get('note') || '') || undefined,
      voteType: voteTypeFrom(form),
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

  function closeSelectedPlace() {
    setDraftPlace(undefined)
    setSelectedPlace(undefined)
  }

  function selectPlace(place: MapPlace) {
    if (!requireAuth()) {
      return
    }

    setDraftPlace(undefined)
    setSelectedPlace(place)
  }

  function selectDraft(place: GooglePlaceDraft) {
    if (!requireAuth()) {
      return
    }

    setSelectedPlace(undefined)
    setDraftPlace(place)
  }

  return (
    <>
      {showRequireAccountModal && (
        <RequireAccountModal onClose={() => setShowRequireAccountModal(false)} />
      )}

      {(draftPlace || selectedPlace) && (
        <PlaceVoteDialog
          currentUserPublicId={user?.id}
          draftPlace={draftPlace}
          groups={activeGroups}
          hasUserVote={selectedPlaceHasUserVote}
          isPending={isVotingPending}
          maxDay={maxVoteDay}
          minDay={today}
          place={selectedPlaceForDay}
          requestedFriendUsernames={requestedFriendUsernames}
          requestFriendPending={requestFriendshipMutation.isPending}
          selectedDay={filters.day}
          selectedGroupPublicId={filters.groupPublicId}
          onAddFriend={(username) => {
            if (!requireAuth()) {
              return
            }

            requestFriendshipMutation.mutate(username)
          }}
          onCancelVote={(form) => cancelExistingVote(form, selectedPlaceUserVote?.group?.id)}
          onClose={closeSelectedPlace}
          onDayChange={changeMapDay}
          onSubmit={draftPlace ? voteDraft : voteExisting}
        />
      )}

      <div className="relative -mx-3 -mb-3 bg-paper md:h-[calc(100vh-98px)] md:overflow-hidden md:bg-surface lg:-mx-5 lg:-mb-5 lg:h-[calc(100vh-114px)]">
        <GooglePlacesMap
          className="h-[58vh] min-h-[420px] rounded-none border-x-0 border-t-0 shadow-none md:h-full md:min-h-0 md:border-0"
          city={filters.city}
          maxMapDay={maxVoteDay}
          mapDay={filters.day}
          minMapDay={today}
          places={places}
          selectedPlaceId={selectedPlace?.id}
          onDraftSelected={selectDraft}
          onLocationResolved={(location) => {
            if (location.city && location.city !== filters.city) {
              setFilters((currentFilters) => ({
                ...currentFilters,
                city: location.city ?? currentFilters.city,
              }))
            }
          }}
          onMapDayChange={changeMapDay}
          onPlaceSelected={selectPlace}
        />

        <HomeSidebar
          filters={filters}
          isLoading={
            mapQuery.isLoading ||
            myGroupsQuery.isLoading ||
            myVotesQuery.isLoading ||
            topPlacesQuery.isLoading ||
            isVotingPending ||
            requestFriendshipMutation.isPending
          }
          groups={activeGroups}
          topPlaces={topPlaces}
          userVotesForSelectedDay={userVotesForSelectedDay}
          onGroupChange={(groupPublicId) => {
            setFilters((currentFilters) => ({
              ...currentFilters,
              groupPublicId,
            }))
          }}
          onSelectPlace={selectPlace}
        />
      </div>
    </>
  )
}

function countUserActiveVotesForDay(votes: VoteHistoryItem[] | undefined, day: string) {
  if (!votes) {
    return 0
  }

  return votes.filter((vote) => dateOnly(vote.day) === day).length
}

function dateOnly(value: string) {
  return value.slice(0, 10)
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date)
  nextDate.setMonth(nextDate.getMonth() + months)
  return nextDate
}

function isAllowedVoteDay(day: string) {
  return day >= today && day <= maxVoteDay
}
