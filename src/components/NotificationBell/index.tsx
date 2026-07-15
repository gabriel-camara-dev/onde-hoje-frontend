import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { AppNotification } from '../../@types/OndeHoje'
import { respondGroupInvite } from '../../api/ondeHoje'
import { useNotifications } from '../../hooks/useNotifications'
import { Avatar } from '../Avatar'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`

  const days = Math.floor(hours / 24)
  return `${days} d`
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notifications, unreadCount, hasMore, isLoadingMore, loadMore, markRead, markAllRead } =
    useNotifications()

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget
    if (hasMore && !isLoadingMore && el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
      loadMore()
    }
  }

  const respondMutation = useMutation({
    mutationFn: ({ groupPublicId, action }: { groupPublicId: string; action: 'accept' | 'decline' }) =>
      respondGroupInvite(groupPublicId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(variables.action === 'accept' ? 'Convite aceito.' : 'Convite recusado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function openNotification(notification: AppNotification) {
    if (!notification.read) {
      markRead(notification.id)
    }

    // Vote notifications expand inline to reveal who voted (Twitter-likes style).
    if (notification.type === 'PLACE_VOTE') {
      setExpandedId((current) => (current === notification.id ? null : notification.id))
      return
    }

    setIsOpen(false)

    if (notification.type === 'FRIEND_REQUEST' || notification.type === 'FRIEND_ACCEPTED') {
      navigate('/friends')
      return
    }

    const groupPublicId = notification.data?.groupPublicId
    navigate(groupPublicId ? `/groups/${groupPublicId}` : '/groups')
  }

  function respondInvite(notification: AppNotification, action: 'accept' | 'decline') {
    const groupPublicId = notification.data?.groupPublicId

    if (!groupPublicId) {
      return
    }

    markRead(notification.id)
    respondMutation.mutate({ groupPublicId, action })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Notificações"
        className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-md border border-line bg-surface text-ink transition hover:border-teal/45 hover:bg-teal-soft"
        title="Notificações"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-1/2 top-[68px] z-[80] flex max-h-[75vh] w-[94vw] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-panel sm:left-auto sm:right-3 sm:w-[24rem] sm:translate-x-0 lg:right-5">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <span className="truncate text-sm font-semibold text-ink">Notificações</span>
            {unreadCount > 0 && (
              <button
                className="shrink-0 cursor-pointer whitespace-nowrap text-xs font-semibold text-teal hover:underline"
                type="button"
                onClick={() => markAllRead()}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto" onScroll={handleScroll}>
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Nenhuma notificação ainda.</p>
            ) : (
              notifications.map((notification) => {
                const isInvite = notification.type === 'GROUP_INVITE' && Boolean(notification.data?.groupPublicId)

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-3 border-b border-line px-4 py-3 last:border-b-0 ${
                      notification.read ? 'bg-surface' : 'bg-teal-soft/40'
                    }`}
                  >
                    <Avatar
                      name={notification.actor?.name ?? '?'}
                      src={notification.actor?.avatarUrl ?? undefined}
                      className="size-9 shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <button
                        className="block w-full cursor-pointer text-left"
                        type="button"
                        onClick={() => openNotification(notification)}
                      >
                        <p className="truncate text-sm font-semibold text-ink">{notification.title}</p>
                        {notification.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{notification.body}</p>
                        )}
                        <span className="mt-1 block text-[11px] font-medium text-muted">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </button>

                      {isInvite && (
                        <div className="mt-2 flex gap-2">
                          <button
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-teal px-2.5 py-1 text-xs font-semibold text-on-contrast transition hover:opacity-90 disabled:opacity-50"
                            disabled={respondMutation.isPending}
                            type="button"
                            onClick={() => respondInvite(notification, 'accept')}
                          >
                            <Check size={14} />
                            Aceitar
                          </button>
                          <button
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink transition hover:bg-surface-muted disabled:opacity-50"
                            disabled={respondMutation.isPending}
                            type="button"
                            onClick={() => respondInvite(notification, 'decline')}
                          >
                            <X size={14} />
                            Recusar
                          </button>
                        </div>
                      )}

                      {notification.type === 'PLACE_VOTE' &&
                        expandedId === notification.id &&
                        (notification.data?.voters?.length ?? 0) > 0 && (
                          <div className="mt-2 grid max-h-[7.5rem] gap-1.5 overflow-y-auto rounded-md border border-line bg-surface p-2">
                            {notification.data?.voters?.map((voter) => (
                              <div key={voter.publicId} className="flex items-center gap-2">
                                <Avatar
                                  name={voter.name}
                                  src={voter.avatarUrl ?? undefined}
                                  className="size-7 shrink-0 rounded-md"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-ink">{voter.name}</p>
                                  {voter.username && (
                                    <p className="truncate text-[11px] text-teal">@{voter.username}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    {!notification.read && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-teal" aria-hidden />
                    )}
                  </div>
                )
              })
            )}

            {hasMore && (
              <button
                className="w-full cursor-pointer border-t border-line px-4 py-3 text-center text-xs font-semibold text-teal transition hover:bg-teal-soft disabled:opacity-60"
                disabled={isLoadingMore}
                type="button"
                onClick={() => loadMore()}
              >
                {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
