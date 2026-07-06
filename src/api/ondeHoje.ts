import type {
  AdminDashboard,
  FriendListItem,
  Group,
  MyGroup,
  ListUsersResponse,
  MapHistoryDay,
  MapPlace,
  VoteType,
  Place,
  VoteHistoryItem,
} from '../@types/OndeHoje'
import type { User } from '../@types/User'
import { axiosPrivate, axiosPublic } from './api'

export type MapFilters = {
  city: string
  day: string
  q: string
  state?: string
  groupPublicId?: string
}

export type GlobalRankingFilters = {
  city: string
  state: string
}

export type GroupMemberSummary = {
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED'
  role: 'OWNER' | 'MODERATOR' | 'MEMBER'
  user: {
    publicId: string
    name: string
    username: string
    avatarUrl?: string | null
  }
}

export type PublicGroupDetails = Group & {
  members: GroupMemberSummary[]
}

export type GroupMembership = {
  groupPublicId: string
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED'
}

export type AuthResponse = {
  token: string
  user: User
}

const compactParams = (params: Record<string, string | number | undefined>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  )

export async function getTodayMap(filters: MapFilters) {
  const response = await axiosPublic.get<MapPlace[]>('/map/today', {
    params: compactParams(filters),
  })

  return response.data
}

export async function getTopPlaces(filters: MapFilters & { limit?: number }) {
  const response = await axiosPublic.get<MapPlace[]>('/map/top-places', {
    params: compactParams({ limit: 10, ...filters }),
  })

  return response.data
}

export async function getGlobalRanking(filters: GlobalRankingFilters) {
  const response = await axiosPublic.get<MapPlace[]>('/map/global-ranking', {
    params: compactParams({ ...filters, limit: 50 }),
  })

  return response.data
}

export async function getMapHistory(filters: MapFilters & { from?: string; to?: string }) {
  const response = await axiosPublic.get<MapHistoryDay[]>('/map/history', {
    params: compactParams({
      city: filters.city,
      groupPublicId: filters.groupPublicId,
      from: filters.from,
      to: filters.to,
    }),
  })

  return response.data
}

export async function listPlaces(filters: MapFilters) {
  const response = await axiosPublic.get<Place[]>('/places', {
    params: compactParams({ city: filters.city, q: filters.q }),
  })

  return response.data
}

export async function listPublicGroups(city: string) {
  const response = await axiosPublic.get<Group[]>('/groups/public', {
    params: compactParams({ city }),
  })

  return response.data
}

export async function getPublicGroup(groupPublicId: string) {
  const response = await axiosPrivate.get<PublicGroupDetails>(`/groups/${groupPublicId}`)

  return response.data
}

export async function authenticate(body: { login: string; password: string }) {
  const response = await axiosPublic.post<AuthResponse>('/sessions', body)

  return response.data
}

export async function registerUser(body: {
  name: string
  username: string
  email: string
  password: string
}) {
  const response = await axiosPublic.post<User>('/users', body)

  return response.data
}

export async function voteForPlace(
  placePublicId: string,
  body: { day?: string; groupPublicId?: string; note?: string; voteType?: VoteType }
) {
  const response = await axiosPrivate.post(`/places/${placePublicId}/votes`, body)

  return response.data
}

export async function cancelVoteForPlace(
  placePublicId: string,
  body: { day?: string; groupPublicId?: string }
) {
  const response = await axiosPrivate.delete(`/places/${placePublicId}/votes`, { data: body })

  return response.data
}

export async function estimateAttendance(
  placePublicId: string,
  params: { scheduledAt: string; radiusKm: number; groupPublicId?: string }
) {
  const response = await axiosPublic.get<{
    attendeeCount: number
    nearbyPlacesCount: number
  }>(`/places/${placePublicId}/attendance/estimate`, {
    params: compactParams(params),
  })

  return response.data
}

export async function createPlace(body: Partial<Place>) {
  const response = await axiosPrivate.post<Place>('/places', body)

  return response.data
}

export async function createGroup(body: {
  name: string
  description?: string
  privacy: 'PUBLIC' | 'PRIVATE'
  password?: string
}) {
  const response = await axiosPrivate.post<Group>('/groups', body)

  return response.data
}

export async function joinGroup(body: {
  name?: string
  password?: string
  groupPublicId?: string
}) {
  const response = body.groupPublicId
    ? await axiosPrivate.post<GroupMembership>(`/groups/${body.groupPublicId}/join`, {
        password: body.password,
      })
    : await axiosPrivate.post<GroupMembership>('/groups/join', {
        name: body.name,
        password: body.password,
      })

  return response.data
}

export async function listMyGroups() {
  const response = await axiosPrivate.get<MyGroup[]>('/groups/my')

  return response.data
}

export async function acceptGroupMember(groupPublicId: string, username: string) {
  const response = await axiosPrivate.post(`/groups/${groupPublicId}/members/${username}/accept`)

  return response.data
}

export async function inviteGroupMember(groupPublicId: string, username: string) {
  const response = await axiosPrivate.post(`/groups/${groupPublicId}/members/${username}/invite`)

  return response.data
}

export async function removeGroupMember(groupPublicId: string, username: string) {
  await axiosPrivate.delete(`/groups/${groupPublicId}/members/${username}`)
}

export async function leaveGroup(groupPublicId: string) {
  await axiosPrivate.delete(`/groups/${groupPublicId}/members/me`)
}

export async function listMyVotes() {
  const response = await axiosPrivate.get<VoteHistoryItem[]>('/me/votes', {
    params: { limit: 30 },
  })

  return response.data
}

export async function listFriends() {
  const response = await axiosPrivate.get<FriendListItem[]>('/friends')

  return response.data
}

export async function requestFriendship(username: string) {
  const response = await axiosPrivate.post<{ status: FriendListItem['status'] }>(
    `/friends/${username}/request`
  )

  return response.data
}

export async function acceptFriendship(username: string) {
  const response = await axiosPrivate.post<{ status: FriendListItem['status'] }>(
    `/friends/${username}/accept`
  )

  return response.data
}

export async function rejectFriendship(username: string) {
  await axiosPrivate.post(`/friends/${username}/reject`)
}

export async function listUsers(params: { page?: number; name?: string; email?: string }) {
  const response = await axiosPrivate.get<ListUsersResponse>('/users', {
    params: compactParams({
      page: params.page ?? 1,
      name: params.name,
      email: params.email,
    }),
  })

  return response.data
}

export async function updateUser(
  publicId: string,
  body: Partial<{
    name: string
    username: string
  }>
) {
  const response = await axiosPrivate.patch<User>(`/users/${publicId}`, body)

  return response.data
}

export async function resendEmailConfirmation(email: string) {
  await axiosPublic.post('/users/email/confirmation', { email })
}

export async function deleteUser(publicId: string) {
  await axiosPrivate.delete(`/users/${publicId}`)
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.set('file', file)

  const response = await axiosPrivate.patch('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}

export async function getAdminDashboard() {
  const response = await axiosPrivate.get<AdminDashboard>('/admin/onde-hoje/dashboard')

  return response.data
}
