import { Check, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { FriendListItem } from '../../../../@types/OndeHoje'
import { Avatar } from '../../../../components/Avatar'
import Button from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Modal } from '../../../../components/ui/Modal'

type RemoveKind = 'friend' | 'sent'

type FriendColumnProps = {
  acceptAction?: (username: string) => void
  rejectAction?: (username: string) => void
  removeAction?: (username: string) => void
  removeKind?: RemoveKind
  items: FriendListItem[]
  title: string
}

const iconButtonBase =
  'grid size-9 shrink-0 cursor-pointer place-items-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-60'

export function FriendColumn({
  acceptAction,
  items,
  rejectAction,
  removeAction,
  removeKind = 'friend',
  title,
}: FriendColumnProps) {
  const [confirmRemove, setConfirmRemove] = useState<{ username: string; name: string } | null>(null)

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-muted">{title}</h2>
      <div className="grid gap-1.5">
        {items.length === 0 ? (
          <EmptyState title="Nada aqui" description="Quando houver movimento, aparece nesta coluna." />
        ) : (
          items.map((item) => (
            <article
              key={item.friend.publicId}
              className="flex items-center gap-2.5 rounded-lg border border-line p-2"
            >
              <Avatar name={item.friend.name} src={item.friend.avatarUrl} className="size-9 rounded-md" />
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{item.friend.name}</strong>
                {item.friend.username && (
                  <span className="block truncate text-xs font-medium text-teal">
                    @{item.friend.username}
                  </span>
                )}
              </div>

              {acceptAction && rejectAction && item.friend.username && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    aria-label="Aceitar"
                    className={`${iconButtonBase} border border-line bg-surface text-ink hover:border-teal/45 hover:bg-teal-soft`}
                    type="button"
                    onClick={() => acceptAction(item.friend.username!)}
                  >
                    <Check size={18} />
                  </button>
                  <button
                    aria-label="Recusar"
                    className={`${iconButtonBase} bg-red-700 text-white hover:bg-red-800`}
                    type="button"
                    onClick={() => rejectAction(item.friend.username!)}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {removeAction && item.friend.username && (
                <button
                  aria-label={removeKind === 'sent' ? 'Cancelar solicitacao' : 'Excluir amigo'}
                  className={`${iconButtonBase} bg-red-700 text-white hover:bg-red-800`}
                  title={removeKind === 'sent' ? 'Cancelar solicitacao' : 'Excluir amigo'}
                  type="button"
                  onClick={() =>
                    setConfirmRemove({ username: item.friend.username!, name: item.friend.name })
                  }
                >
                  <X size={18} />
                </button>
              )}
            </article>
          ))
        )}
      </div>

      {confirmRemove && (
        <Modal
          title={removeKind === 'sent' ? 'Cancelar solicitacao' : 'Excluir amigo'}
          onClose={() => setConfirmRemove(null)}
        >
          <p className="text-sm text-muted">
            {removeKind === 'sent' ? (
              <>
                Cancelar a solicitacao de amizade enviada para{' '}
                <strong className="text-ink">{confirmRemove.name}</strong>?
              </>
            ) : (
              <>
                Tem certeza que deseja excluir{' '}
                <strong className="text-ink">{confirmRemove.name}</strong> da sua lista de amigos? Voces
                deixarao de ser amigos.
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmRemove(null)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                removeAction?.(confirmRemove.username)
                setConfirmRemove(null)
              }}
            >
              <Trash2 size={16} />
              {removeKind === 'sent' ? 'Cancelar solicitacao' : 'Excluir'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
