import {
  BarChart3,
  Clock3,
  LogOut,
  MapPinned,
  MessagesSquare,
  Shield,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { User, UserRole } from '../../@types/User'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

type AppMenuProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

type AppMenuLink = {
  href: string
  label: string
  icon: typeof MapPinned
  auth?: 'authenticated'
  role?: UserRole
}

const links: AppMenuLink[] = [
  { href: '/', label: 'Mapa', icon: MapPinned },
  { href: '/ranking', label: 'Ranking', icon: BarChart3 },
  { href: '/history', label: 'Historico', icon: Clock3 },
  { href: '/groups', label: 'Grupos', icon: MessagesSquare },
  { href: '/friends', label: 'Amigos', icon: UsersRound, auth: 'authenticated' },
  { href: '/profile', label: 'Perfil', icon: UserRound, auth: 'authenticated' },
  { href: '/admin', label: 'Admin', icon: Shield, role: 'ADMIN' },
]

export function AppMenu({ isOpen, onClose, user }: AppMenuProps) {
  const { logout } = useAuth()
  const visibleLinks = links.filter((link) => {
    if (link.role) {
      return user?.role === link.role
    }

    if (link.auth === 'authenticated') {
      return Boolean(user)
    }

    return true
  })

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="menu-overlay-enter fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="menu-panel-enter ml-auto grid h-full w-full max-w-sm content-start gap-4 border-l border-line bg-surface p-5 text-ink shadow-[0_24px_70px_rgba(0,0,0,.24)]"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">Onde Hoje</p>
            <h2 className="text-2xl font-semibold">Menu</h2>
          </div>
          <Button className="size-12 p-0" type="button" variant="ghost" onClick={onClose}>
            <X size={30} strokeWidth={2.6} />
          </Button>
        </div>

        <div className="rounded-lg border border-line bg-surface-muted p-4">
          <strong className="block font-semibold">{user?.name ?? 'Visitante'}</strong>
          <span className="text-sm text-muted">
            {user ? 'Conta conectada' : 'Entre para votar e criar grupos'}
          </span>
        </div>

        <nav className="grid gap-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              className="inline-flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-ink transition hover:bg-teal-soft hover:text-teal"
              to={link.href}
              onClick={onClose}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </nav>

        {user && (
          <Button
            className="mt-2"
            type="button"
            variant="secondary"
            onClick={() => {
              onClose()
              logout()
            }}
          >
            <LogOut size={18} />
            Sair da conta
          </Button>
        )}
      </aside>
    </div>
  )
}