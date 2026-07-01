import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../../stores/userStore'
import { AppMenu } from '../AppMenu'
import { ThemeToggle } from '../ThemeToggle'
import Button from '../ui/Button'

export default function Header() {
  const user = useUserStore((state) => state.user)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="mb-4 flex items-center justify-between rounded-3xl border border-line bg-surface/90 p-3 text-ink shadow-panel backdrop-blur">
        <Link className="inline-flex items-center gap-3 font-black" to="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-teal text-xs text-white shadow-[0_12px_28px_rgba(124,58,237,.35)]">
            OH
          </span>
          <span className="grid leading-none">
            Onde Hoje
            <small className="text-xs font-bold text-muted">Google Maps + votos</small>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <button
              aria-label="Abrir menu da conta"
              className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-2.5 py-1.5 text-sm font-bold text-ink transition hover:bg-teal-soft"
              title="Abrir menu"
              type="button"
              onClick={() => setIsMenuOpen(true)}
            >
              <Avatar name={user.name} src={user.avatarUrl} />
              <span className="hidden max-w-36 truncate pr-1 md:inline">{user.name}</span>
            </button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => setIsMenuOpen(true)}>
              <Menu size={19} />
              Menu
            </Button>
          )}
        </div>
      </header>

      <AppMenu isOpen={isMenuOpen} user={user} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (src) {
    return (
      <img
        alt=""
        className="size-9 rounded-xl border border-line object-cover"
        referrerPolicy="no-referrer"
        src={src}
      />
    )
  }

  return (
    <span className="grid size-9 place-items-center rounded-xl bg-teal text-xs font-black text-white">
      {initials || 'U'}
    </span>
  )
}
