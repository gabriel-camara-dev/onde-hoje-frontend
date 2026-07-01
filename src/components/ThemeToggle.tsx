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
      className="size-12 rounded-2xl px-0"
      title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
      type="button"
      variant="secondary"
      onClick={toggleDarkMode}
    >
      {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
    </Button>
  )
}
