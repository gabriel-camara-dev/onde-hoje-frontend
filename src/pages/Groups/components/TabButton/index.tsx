export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      className={`min-h-10 rounded-md px-3 text-sm font-semibold transition ${
        active ? 'bg-surface text-teal shadow-sm' : 'text-muted hover:bg-surface'
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
