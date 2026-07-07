export type VoteType = 'GENERAL' | 'MUSIC' | 'FOOD' | 'DRINK' | 'SPORTS'

export type Place = {
  id: string
  googlePlaceId: string
  name: string
  googlePlaceName?: string | null
  nickname?: string | null
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

export type AdminDailyPoint = {
  day: string
  count: number
}

export type AdminOverview = {
  users: {
    total: number
    newToday: number
    newLast7Days: number
    activeToday: number
    activeLast7Days: number
    verified: number
    withGoogle: number
    admins: number
  }
  votes: {
    activeTotal: number
    today: number
    cancelledTotal: number
    last7Days: number
  }
  places: {
    activeTotal: number
    newToday: number
  }
  groups: {
    total: number
    newToday: number
  }
  friendships: {
    accepted: number
    pending: number
  }
  reports: {
    open: number
    total: number
  }
  voteTypesToday: Array<{ voteType: VoteType; count: number }>
  votesPerDay: AdminDailyPoint[]
  signupsPerDay: AdminDailyPoint[]
  topCitiesToday: Array<{ city: string; votes: number }>
}

export type AdminVoterStat = {
  publicId: string
  name: string
  username: string
  votesCount: number
}

export type AdminAbuseReport = {
  topVotersToday: AdminVoterStat[]
  topCancellersToday: Array<{
    publicId: string
    name: string
    username: string
    cancelledCount: number
  }>
  heavyVotersAllTime: AdminVoterStat[]
  suspiciousLogins: Array<{
    publicId: string
    name: string
    username: string
    loginAttempts: number
    lastLogin: string | null
  }>
  reportedPlaces: Array<{
    publicId: string
    name: string
    city: string | null
    openReports: number
  }>
  recentReports: Array<{
    publicId: string
    reason: string
    status: string
    placeName: string | null
    reporterName: string
    createdAt: string
  }>
}

export type AdminUserSummary = {
  publicId: string
  name: string
  username: string
  email: string
  role: string
  lastLogin: string | null
  createdAt: string
  emailVerified: boolean
}

export type AdminUserHistory = {
  user: AdminUserSummary
  votes: VoteHistoryItem[]
}

export type AdminAuthActivity = {
  loginsToday: number
  failedToday: number
  unknownUserToday: number
  blockedToday: number
  uniqueUsersToday: number
  loginsPerDay: AdminDailyPoint[]
  statusBreakdown: Array<{ status: string; count: number }>
  topFailedIps: Array<{ ipAddress: string; attempts: number }>
  recentAttempts: Array<{
    status: string
    ipAddress: string | null
    userAgent: string | null
    userName: string | null
    createdAt: string
  }>
}
