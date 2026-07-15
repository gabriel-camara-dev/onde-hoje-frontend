import { LogIn, Menu, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deviceHasAccount } from '../../lib/deviceAccount'
import { useUserStore } from '../../stores/userStore'
import { AppMenu } from '../AppMenu'
import { Avatar } from '../Avatar'
import { Logo } from '../Logo'
import { NotificationBell } from '../NotificationBell'
import { ThemeToggle } from '../ThemeToggle'

export default function Header() {
  const user = useUserStore((state) => state.user)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Returning devices (already had an account here) see "Entrar"; new ones "Registrar".
  const returningDevice = deviceHasAccount()

  return (
    <>
      <header className="sticky top-0 z-40 mb-4 flex items-center justify-between rounded-lg border border-line bg-surface/95 p-2 text-ink shadow-panel backdrop-blur">
        <Link aria-label="Onde Hoje — início" className="inline-flex items-center" to="/">
          <Logo className="text-[26px] sm:text-[30px]" />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}
          {!user && (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-teal px-3 py-1 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
              to={returningDevice ? '/login' : '/register'}
            >
              {returningDevice ? <LogIn size={18} /> : <UserPlus size={18} />}
              {returningDevice ? 'Entrar' : 'Registrar'}
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

