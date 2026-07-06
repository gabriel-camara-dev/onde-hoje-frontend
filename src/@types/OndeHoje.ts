export type VoteType = 'GENERAL' | 'MUSIC' | 'FOOD' | 'DRINK' | 'SPORTS'

export type Place = {
  id: string
  googlePlaceId: string
  name: string
  formattedAddress: string
  latitude: number
  longitude: number
  city?: string | null
  state?: string | null
  country?: string | null
  photoUrl?: string | null
  websiteUrl?: string | null
  mapsUrl?: string | null
  distanceKm?: number
}

export type MapPlace = Place & {
  voteCount: number
  dominantVoteType: VoteType
  voters: Array<{
    publicId: string
    name: string
    username?: string | null
    avatarUrl?: string | null
    note?: string | null
    voteType: VoteType
    friendship?: {
      status: FriendListItem['status']
      direction: FriendListItem['direction']
    }
  }>
}

export type MapHistoryDay = {
  day: string
  places: MapPlace[]
}

export type Group = {
  id: string
  name: string
  slug: string
  description?: string | null
  privacy: 'PUBLIC' | 'PRIVATE'
  city?: string | null
  state?: string | null
  membersCount: number
  todayVotesCount: number
}

export type MyGroup = Group & {
  myRole: 'OWNER' | 'MODERATOR' | 'MEMBER'
  myStatus: 'ACTIVE' | 'PENDING' | 'BLOCKED'
  members: Array<{
    status: 'ACTIVE' | 'PENDING' | 'BLOCKED'
    role: 'OWNER' | 'MODERATOR' | 'MEMBER'
    user: {
      publicId: string
      name: string
      username: string
      avatarUrl?: string | null
    }
  }>
}

export type VoteHistoryItem = {
  id: string
  day: string
  note?: string | null
  voteType: VoteType
  scopeKey: string
  group?: Pick<Group, 'id' | 'name'> | null
  place: Place
}

export type FriendListItem = {
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  direction: 'sent' | 'received'
  friend: {
    publicId: string
    name: string
    username?: string | null
    avatarUrl?: string | null
  }
}

export type ListUsersResponse = {
  data: Array<{
    id: string
    name: string
    username?: string | null
    email: string
    role: 'DEFAULT' | 'ADMIN'
    avatarUrl?: string | null
    createdAt: string
    updatedAt: string
  }>
  currentPage: number
  totalCount: number
  totalPages: number
}

export type AdminDashboard = {
  usersCount: number
  placesCount: number
  groupsCount: number
  todayVotesCount: number
  openReportsCount: number
  topPlaces: Array<{
    publicId: string
    name: string
    city: string | null
    votesCount: number
  }>
}
