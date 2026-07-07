import { Check, X } from 'lucide-react'
import type { FriendListItem } from '../../../../@types/OndeHoje'
import { Avatar } from '../../../../components/Avatar'
import Button from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'

type FriendColumnProps = {
  acceptAction?: (username: string) => void
  rejectAction?: (username: string) => void
  items: FriendListItem[]
  title: string
}

export function FriendColumn({ acceptAction, items, rejectAction, title }: FriendColumnProps) {
  return (
    <div>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="grid gap-2">
        {items.length === 0 ? (
          <EmptyState title="Nada aqui" description="Quando houver movimento, aparece nesta coluna." />
        ) : (
          items.map((item) => (
            <article key={item.friend.publicId} className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar name={item.friend.name} src={item.friend.avatarUrl} />
                <div className="min-w-0">
                  <strong className="block truncate">{item.friend.name}</strong>
                  {item.friend.username && (
                    <span className="block truncate text-sm font-medium text-teal">
                      @{item.friend.username}
                    </span>
                  )}
                </div>
              </div>
              {acceptAction && rejectAction && item.friend.username && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => acceptAction(item.friend.username!)}
                  >
                    <Check size={16} />
                    Aceitar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => rejectAction(item.friend.username!)}
                  >
                    <X size={16} />
                    Recusar
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
