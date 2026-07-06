import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button'

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  function toggleDarkMode() {
    const nextDarkMode = !isDarkMode

    document.documentElement.classList.toggle('dark', nextDarkMode)
    localStorage.setItem('onde-hoje-theme', nextDarkMode ? 'dark' : 'light')
    setIsDarkMode(nextDarkMode)
  }

  return (
    <Button
      aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="size-10 p-0!"
      title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
      type="button"
      variant="secondary"
      onClick={toggleDarkMode}
    >
      {isDarkMode ? (
        <Sun className="shrink-0" size={20} strokeWidth={2.4} />
      ) : (
        <Moon className="shrink-0" size={20} strokeWidth={2.4} />
      )}
    </Button>
  )
}

