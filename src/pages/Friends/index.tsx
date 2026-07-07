import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { FriendColumns, FriendLinkModal, FriendRequestPanel } from './components'
import { useFriends } from './hooks/useFriends'

export default function FriendsPage() {
  const {
    user,
    isLinkModalOpen,
    setIsLinkModalOpen,
    friendshipLink,
    copyFriendshipLink,
    requestFriend,
    accept,
    reject,
    received,
    accepted,
    sent,
    error,
    isLoading,
    message,
  } = useFriends()

  if (!user) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Amizades</h1>
        <p className="mt-2 text-sm text-muted">Entre para listar, solicitar e aceitar amizades.</p>
      </Panel>
    )
  }

  return (
    <>
      <StatusBanner error={error} loading={isLoading} message={message} />
      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <FriendRequestPanel
          canLink={Boolean(user.username)}
          onSubmit={requestFriend}
          onOpenLink={() => setIsLinkModalOpen(true)}
        />
        <FriendColumns
          received={received}
          accepted={accepted}
          sent={sent}
          onAccept={accept}
          onReject={reject}
        />
      </section>

      {isLinkModalOpen && (
        <FriendLinkModal
          username={user.username}
          link={friendshipLink}
          onClose={() => setIsLinkModalOpen(false)}
          onCopy={copyFriendshipLink}
        />
      )}
    </>
  )
}
