import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../../stores/userStore'
import { AppMenu } from '../AppMenu'
import { Avatar } from '../Avatar'
import { NotificationBell } from '../NotificationBell'
import { ThemeToggle } from '../ThemeToggle'
import Button from '../ui/Button'

export default function Header() {
  const user = useUserStore((state) => state.user)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="mb-4 flex items-center justify-between rounded-lg border border-line bg-surface/95 p-2 text-ink shadow-panel backdrop-blur">
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
          {user && <NotificationBell />}
          <ThemeToggle />
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
            <Button type="button" variant="secondary" onClick={() => setIsMenuOpen(true)}>
              <Menu size={18} />
              Menu
            </Button>
          )}
        </div>
      </header>

      <AppMenu isOpen={isMenuOpen} user={user} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

