import { Menu, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../../stores/userStore'
import { AppMenu } from '../AppMenu'
import { Avatar } from '../Avatar'
import { NotificationBell } from '../NotificationBell'
import { ThemeToggle } from '../ThemeToggle'

export default function Header() {
  const user = useUserStore((state) => state.user)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="relative z-40 mb-4 flex items-center justify-between rounded-lg border border-line bg-surface/95 p-2 text-ink shadow-panel backdrop-blur">
        <Link className="inline-flex items-center gap-3 font-semibold" to="/">
          <span className="grid size-9 place-items-center rounded-md bg-contrast text-xs font-medium text-on-contrast">
            OH
          </span>
          <span className="grid leading-tight">
            Onde Hoje
            <small className="text-xs font-medium text-muted">Mapa social</small>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}
          {!user && (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-teal px-3 py-1 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
              to="/register"
            >
              <UserPlus size={18} />
              Registrar
            </Link>
          )}
          {user ? (
            <button
              aria-label="Abrir menu da conta"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-surface px-2 py-1 text-sm font-semibold text-ink transition hover:border-teal/45 hover:bg-teal-soft"
              title="Abrir menu"
              type="button"
              onClick={() => setIsMenuOpen(true)}
            >
              <Avatar name={user.name} src={user.avatarUrl} className="size-8 rounded-md" />
              <span className="hidden max-w-36 truncate pr-1 md:inline">{user.name}</span>
            </button>
          ) : (
            <button
              aria-label="Abrir menu"
              className="inline-flex size-10 items-center justify-center rounded-md border border-line bg-surface text-ink transition hover:border-teal/45 hover:bg-teal-soft"
              title="Abrir menu"
              type="button"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </header>

      <AppMenu isOpen={isMenuOpen} user={user} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

