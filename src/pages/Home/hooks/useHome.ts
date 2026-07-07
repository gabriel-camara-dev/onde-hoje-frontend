import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  cancelVoteForPlace,
  createPlace,
  getTodayMap,
  getTopPlaces,
  listMyGroups,
  listMyVotes,
  requestFriendship,
  voteForPlace,
  type MapFilters,
} from '../../../api/ondeHoje'
import type { MapPlace, VoteType } from '../../../@types/OndeHoje'
import type { GooglePlaceDraft } from '../../../components/GooglePlacesMap'
import { formatInputDate } from '../../../lib/date'
import { useUserStore } from '../../../stores/userStore'
import { loadHomeMapFilters, saveHomeMapFilters } from '../homeMapFiltersStorage'
import { voteTypeOptions } from '../homeVoteTypeOptions'
import { addMonths, countUserActiveVotesForDay, dateOnly, isAllowedVoteDay } from '../homeVotingUtils'

const today = formatInputDate(new Date())
const maxVoteDay = formatInputDate(addMonths(new Date(), 1))
const defaultMapFilters: MapFilters = { city: '', day: today, q: '' }

export function useHome() {
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

    if (!isAllowedVoteDay(day, today, maxVoteDay)) {
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

    if (!isAllowedVoteDay(day, today, maxVoteDay)) {
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

  function addFriend(username: string) {
    if (!requireAuth()) {
      return
    }

    requestFriendshipMutation.mutate(username)
  }

  function changeCity(city?: string) {
    if (city && city !== filters.city) {
      setFilters((currentFilters) => ({ ...currentFilters, city }))
    }
  }

  function changeGroup(groupPublicId?: string) {
    setFilters((currentFilters) => ({ ...currentFilters, groupPublicId }))
  }

  return {
    // state
    filters,
    minDay: today,
    maxDay: maxVoteDay,
    places,
    topPlaces,
    activeGroups,
    currentUserPublicId: user?.id,
    draftPlace,
    selectedPlace,
    selectedPlaceForDay,
    isDialogOpen: Boolean(draftPlace || selectedPlace),
    hasUserVote: selectedPlaceHasUserVote,
    isVotingPending,
    requestedFriendUsernames,
    requestFriendPending: requestFriendshipMutation.isPending,
    userVotesForSelectedDay,
    showRequireAccountModal,
    isSidebarLoading:
      mapQuery.isLoading ||
      myGroupsQuery.isLoading ||
      myVotesQuery.isLoading ||
      topPlacesQuery.isLoading ||
      isVotingPending ||
      requestFriendshipMutation.isPending,
    // handlers
    closeRequireAccountModal: () => setShowRequireAccountModal(false),
    closeSelectedPlace,
    changeMapDay,
    changeCity,
    changeGroup,
    selectPlace,
    selectDraft,
    addFriend,
    submitVote: (form: FormData) => (draftPlace ? voteDraft(form) : voteExisting(form)),
    cancelSelectedVote: (form: FormData) =>
      cancelExistingVote(form, selectedPlaceUserVote?.group?.id),
  }
}
