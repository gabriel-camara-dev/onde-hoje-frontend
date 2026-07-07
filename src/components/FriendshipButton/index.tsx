import { Clock3, UserPlus } from 'lucide-react'
import Button from '../ui/Button'

type FriendshipInfo = {
  status?: string
  direction?: 'sent' | 'received'
}

type FriendshipButtonProps = {
  friendship?: FriendshipInfo | null
  isPending?: boolean
  onAddFriend: (username: string) => void
  requested?: boolean
  username: string
}

export function FriendshipButton({
  friendship,
  isPending,
  onAddFriend,
  requested,
  username,
}: FriendshipButtonProps) {
  if (friendship?.status === 'ACCEPTED') {
    return null
  }

  if (requested || friendship) {
    const isReceived = friendship?.status === 'PENDING' && friendship.direction === 'received'
    const label = isReceived ? 'Pendente' : 'Enviado'

    return (
      <Button
        aria-label={`${label} @${username}`}
        className="size-12 border-amber-200 bg-amber-50 p-0 text-amber-800 hover:bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200"
        disabled
        title={`${label} @${username}`}
        type="button"
        variant="secondary"
      >
        <Clock3 size={26} strokeWidth={2.7} />
      </Button>
    )
  }

  return (
    <Button
      aria-label={`Adicionar @${username}`}
      className="size-12 p-0"
      disabled={isPending}
      title={`Adicionar @${username}`}
      type="button"
      variant="secondary"
      onClick={() => onAddFriend(username)}
    >
      <UserPlus size={27} strokeWidth={2.7} />
    </Button>
  )
}
