import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { AppNotification } from '../@types/OndeHoje'
import { API_BASE_URL } from '../api/api'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/ondeHoje'
import { useUserStore } from '../stores/userStore'

const NOTIFICATIONS_KEY = ['notifications'] as const
const PAGE_SIZE = 5

// Queries that should refresh when a realtime notification lands, so the rest
// of the UI (friends list, my groups, pending requests) stays in sync.
const RELATED_KEYS = [['friends'], ['my-groups'], ['groups'], ['public-group']]

export function useNotifications() {
  const queryClient = useQueryClient()
  const user = useUserStore((state) => state.user)
  const accessToken = useUserStore((state) => state.accessToken)
  // The event bus re-emits each event once from Redis, so we drop duplicates by id.
  const seenEventIds = useRef<Set<string>>(new Set())

  const notificationsQuery = useInfiniteQuery({
    enabled: Boolean(user),
    queryKey: NOTIFICATIONS_KEY,
    queryFn: ({ pageParam }) => listNotifications({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 10_000,
    // Fallback polling in case the SSE stream drops without notice.
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })

  useEffect(() => {
    if (!user || !accessToken) {
      return
    }

    const url = `${API_BASE_URL}/events?access_token=${encodeURIComponent(accessToken)}`
    const source = new EventSource(url)

    const handleNotification = (event: MessageEvent<string>) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })

      for (const key of RELATED_KEYS) {
        queryClient.invalidateQueries({ queryKey: key })
      }

      try {
        const parsed = JSON.parse(event.data) as { eventId?: string; payload?: AppNotification }
        const eventId = parsed.eventId

        if (eventId) {
          if (seenEventIds.current.has(eventId)) {
            return
          }

          seenEventIds.current.add(eventId)

          if (seenEventIds.current.size > 200) {
            seenEventIds.current = new Set([...seenEventIds.current].slice(-100))
          }
        }

        if (parsed.payload?.title) {
          toast(parsed.payload.title, { description: parsed.payload.body ?? undefined })
        }
      } catch {
        // Ignore malformed events; the query invalidation already refreshed state.
      }
    }

    // The backend tags each SSE message with its domain event name.
    source.addEventListener('notification.created', handleNotification as EventListener)

    return () => {
      source.removeEventListener('notification.created', handleNotification as EventListener)
      source.close()
    }
  }, [accessToken, queryClient, user])

  const pages = notificationsQuery.data?.pages ?? []
  const unreadCount = pages[0]?.unreadCount ?? 0

  // Offset pagination can overlap when new items arrive, so dedupe by id.
  const seenIds = new Set<string>()
  const notifications = pages
    .flatMap((page) => page.notifications)
    .filter((notification) => {
      if (seenIds.has(notification.id)) {
        return false
      }

      seenIds.add(notification.id)
      return true
    })

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    hasMore: Boolean(notificationsQuery.hasNextPage),
    isLoadingMore: notificationsQuery.isFetchingNextPage,
    loadMore: () => notificationsQuery.fetchNextPage(),
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  }
}
