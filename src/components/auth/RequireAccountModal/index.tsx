import { Link } from 'react-router-dom'
import { Modal } from '../../ui/Modal'

interface RequireAccountModalProps {
  onClose: () => void
  registerPath?: string
  loginPath?: string
}

export function RequireAccountModal({
  onClose,
  registerPath = '/register',
  loginPath = '/login',
}: RequireAccountModalProps) {
  return (
    <Modal title="Crie uma conta para votar" onClose={onClose}>
      <p className="text-sm leading-6 text-muted">
        Para poder votar você precisa estar logado no sistema.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex flex-1 min-h-11 items-center justify-center rounded-md bg-teal px-4 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
          to={registerPath}
          onClick={onClose}
        >
          Criar conta
        </Link>
        <Link
          className="inline-flex flex-1 min-h-11 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-teal-soft"
          to={loginPath}
          onClick={onClose}
        >
          Já tenho conta
        </Link>
      </div>
    </Modal>
  )
}
