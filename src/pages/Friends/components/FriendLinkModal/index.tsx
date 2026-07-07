import { Copy } from 'lucide-react'
import Button from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'

type FriendLinkModalProps = {
  username?: string | null
  link: string
  onClose: () => void
  onCopy: () => void
}

export function FriendLinkModal({ username, link, onClose, onCopy }: FriendLinkModalProps) {
  return (
    <Modal title="Meu link de amizade" onClose={onClose}>
      <div className="grid gap-3">
        <p className="text-sm text-muted">
          Envie este link para alguem abrir seu perfil de amizade e mandar um pedido para voce.
        </p>
        <div className="grid gap-2 rounded-lg border border-line bg-surface-muted p-3">
          <span className="text-xs font-semibold uppercase text-muted">Seu username</span>
          <code className="truncate rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink">
            @{username ?? 'sem-username'}
          </code>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <code className="truncate rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
            {link}
          </code>
          <Button type="button" variant="secondary" onClick={onCopy}>
            <Copy size={16} />
            Copiar link
          </Button>
        </div>
      </div>
    </Modal>
  )
}
