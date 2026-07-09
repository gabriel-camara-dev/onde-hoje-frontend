import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  cancelVoteForPlace,
  createPlace,
  getMapPlace,
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
import { addMonths, countUserActiveVotesForWeek, dateOnly, isAllowedVoteDay } from '../homeVotingUtils'

const today = formatInputDate(new Date())
const weekTo = formatInputDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000))
const maxVoteDay = formatInputDate(addMonths(new Date(), 1))
const defaultMapFilters: MapFilters = { city: '', day: today, q: '', from: today, to: weekTo }

export function useHome() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const accessToken = useUserStore((state) => state.accessToken)
  const user = useUserStore((state) => state.user)
  const [filters, setFilters] = useState<MapFilters>(() => loadHomeMapFilters(defaultMapFilters))
  const handledVoteLinkRef = useRef(false)
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
  const voteLinkPlaceId = searchParams.get('vote')

  // Vote link (?vote=<placeId>&city=&day=): fetch the exact place directly so it
  // opens regardless of the current map view (city/day), then clean the URL.
  useEffect(() => {
    if (!voteLinkPlaceId || handledVoteLinkRef.current) {
      return
    }

    handledVoteLinkRef.current = true

    const linkCity = searchParams.get('city')
    const linkDay = searchParams.get('day')
    const day = linkDay && isAllowedVoteDay(linkDay, today, maxVoteDay) ? linkDay : filters.day

    setFilters((currentFilters) => ({
      ...currentFilters,
      ...(linkCity ? { city: linkCity } : {}),
      day,
      from: undefined,
      to: undefined,
    }))

    // Keep the ?vote= params in the URL while the dialog is open so that, if the
    // session is expired and voting 401s, the login redirect's returnTo still
    // carries the intent. They're cleared when the dialog closes.
    getMapPlace(voteLinkPlaceId, { day })
      .then((place) => {
        if (place) {
          setSelectedPlace(place)
        }
      })
      .catch(() => {
        toast.error('Não foi possível abrir esse lugar.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteLinkPlaceId])
  const topPlaces = useMemo(() => topPlacesQuery.data ?? [], [topPlacesQuery.data])
  const activeGroups = useMemo(
    () => (myGroupsQuery.data ?? []).filter((group) => group.myStatus === 'ACTIVE'),
    [myGroupsQuery.data]
  )
  // Per-day/scope fetch of the open place. Used ONLY to decide whether "não vou"
  // is allowed for the selected day (it needs a going vote on that exact day),
  // not for the displayed voter list.
  const selectedPlaceDetailQuery = useQuery({
    enabled: Boolean(selectedPlace && !draftPlace),
    queryKey: ['map-place', selectedPlace?.id, filters.day, filters.groupPublicId],
    queryFn: () => getMapPlace(selectedPlace!.id, { day: filters.day, groupPublicId: filters.groupPublicId }),
  })
  // Displayed card = the same aggregated data as the map marker (week + my groups),
  // so "Quem votou aqui" lists everyone the marker counts. Falls back to the
  // per-place fetch for places opened via a vote link (not on the current map).
  const selectedPlaceForDay = selectedPlace
    ? (places.find((place) => place.id === selectedPlace.id) ??
      selectedPlaceDetailQuery.data ?? {
        ...selectedPlace,
        voteCount: 0,
        voters: [],
      })
    : undefined
  const canDeclineSelectedPlace = (selectedPlaceDetailQuery.data?.voteCount ?? 0) > 0

  const voteMutation = useMutation({
    mutationFn: async (input: {
      day: string
      placeId: string
      note?: string
      voteType?: VoteType
      groupPublicId?: string
      showIdentity?: boolean
      going?: boolean
      voteTime?: string
    }) => {
      await voteForPlace(input.placeId, {
        day: input.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
        voteType: input.voteType,
        showIdentity: input.showIdentity,
        going: input.going,
        voteTime: input.voteTime,
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
      showIdentity?: boolean
      going?: boolean
      voteTime?: string
    }) => {
      const place = await createPlace(input.draft)
      await voteForPlace(place.id, {
        day: input.day,
        groupPublicId: input.groupPublicId,
        note: input.note,
        voteType: input.voteType,
        showIdentity: input.showIdentity,
        going: input.going,
        voteTime: input.voteTime,
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
  // Only rely on the user's vote for the *selected day* (from my-votes). The map
  // voters can span the whole week (range view), so checking that list would give
  // false positives and make "Tirar meu voto" target a day with no vote.
  const selectedPlaceHasUserVote = Boolean(selectedPlaceUserVote)
  const userVotesThisWeek = countUserActiveVotesForWeek(myVotesQuery.data, filters.day)
  const isVotingPending =
    voteMutation.isPending || createAndVoteMutation.isPending || cancelVoteMutation.isPending

  async function refreshVotingData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['map-history'] }),
      queryClient.invalidateQueries({ queryKey: ['my-votes'] }),
      queryClient.invalidateQueries({ queryKey: ['places'] }),
      queryClient.refetchQueries({ queryKey: ['today-map'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['top-places'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['map-place'], type: 'active' }),
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
      toast.error('Escolha uma data entre hoje e até 1 mes no futuro.')
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
    if (!selectedPlaceForDay) {
      return
    }

    // Close the place dialog so the "create account" modal isn't hidden behind it.
    if (!requireAuth()) {
      closeSelectedPlace()
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
      showIdentity: form.get('showIdentity') === 'on',
      going: form.get('going') !== 'false',
      voteTime: String(form.get('voteTime') || '') || undefined,
    })
  }

  function voteDraft(form: FormData) {
    if (!draftPlace) {
      return
    }

    if (!requireAuth()) {
      closeSelectedPlace()
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
      showIdentity: form.get('showIdentity') === 'on',
      going: form.get('going') !== 'false',
      voteTime: String(form.get('voteTime') || '') || undefined,
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
      toast.error('Escolha uma data entre hoje e até 1 mes no futuro.')
      return
    }

    // Picking a specific day leaves the 7-day week view.
    setFilters((currentFilters) => ({ ...currentFilters, day, from: undefined, to: undefined }))
  }

  function setWeekView(week: boolean) {
    setFilters((currentFilters) =>
      week
        ? { ...currentFilters, from: today, to: weekTo }
        : { ...currentFilters, from: undefined, to: undefined }
    )
  }

  async function copyVoteLink(placeId: string, city?: string | null) {
    const url = new URL(window.location.origin)
    url.searchParams.set('vote', placeId)

    if (city) {
      url.searchParams.set('city', city)
    }

    url.searchParams.set('day', filters.day)

    try {
      await navigator.clipboard.writeText(url.toString())
      toast.success('Link para votar copiado.')
    } catch {
      toast.error('Não foi possível copiar o link agora.')
    }
  }

  function closeSelectedPlace() {
    setDraftPlace(undefined)
    setSelectedPlace(undefined)

    // Drop any leftover vote-link params now that the dialog is closing.
    if (searchParams.has('vote') || searchParams.has('city') || searchParams.has('day')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('vote')
      nextParams.delete('city')
      nextParams.delete('day')
      setSearchParams(nextParams, { replace: true })
    }
  }

  // Anyone (even logged out) can open a place and see its votes; the account
  // modal only shows when they actually try to vote.
  function selectPlace(place: MapPlace) {
    setDraftPlace(undefined)
    setSelectedPlace(place)
  }

  function selectDraft(place: GooglePlaceDraft) {
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
    isWeekView: Boolean(filters.from && filters.to),
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
    canDecline: canDeclineSelectedPlace,
    isVotingPending,
    requestedFriendUsernames,
    requestFriendPending: requestFriendshipMutation.isPending,
    userVotesThisWeek,
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
    setWeekView,
    copyVoteLink,
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
