import {
  BarChart3,
  Clock3,
  LogIn,
  LogOut,
  MapPinned,
  Search,
  Shield,
  UserRound,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { User } from '../../@types/User'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

type AppMenuProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

const links = [
  { href: '/', label: 'Mapa', icon: MapPinned },
  { href: '/places', label: 'Lugares', icon: Search },
  { href: '/ranking', label: 'Ranking', icon: BarChart3 },
  { href: '/history', label: 'Historico', icon: Clock3 },
  { href: '/groups', label: 'Grupos', icon: Users },
  { href: '/friends', label: 'Amigos', icon: UsersRound },
  { href: '/profile', label: 'Perfil', icon: UserRound },
  { href: '/admin', label: 'Admin', icon: Shield },
]

export function AppMenu({ isOpen, onClose, user }: AppMenuProps) {
  const { logout } = useAuth()

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="menu-overlay-enter fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="menu-panel-enter ml-auto grid h-full w-full max-w-sm content-start gap-4 border-l border-line bg-surface p-5 text-ink shadow-[0_30px_90px_rgba(0,0,0,.28)]"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-teal">Onde Hoje</p>
            <h2 className="text-2xl font-black">Menu</h2>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="rounded-2xl border border-line bg-teal-soft p-4">
          <strong className="block">{user?.name ?? 'Visitante'}</strong>
          <span className="text-sm text-muted">
            {user ? 'Conta conectada' : 'Entre para votar e criar grupos'}
          </span>
        </div>

        <nav className="grid gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-black text-ink transition hover:bg-teal-soft hover:text-teal"
              to={link.href}
              onClick={onClose}
            >
              <link.icon size={19} />
              {link.label}
            </Link>
          ))}
        </nav>

        {user ? (
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
        ) : (
          <Link
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal px-4 text-sm font-black text-white"
            to="/login"
            onClick={onClose}
          >
            <LogIn size={18} />
            Entrar
          </Link>
        )}
      </aside>
    </div>
  )
}
