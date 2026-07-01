import type { HTMLAttributes, ReactNode } from 'react'

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

export function Panel({ children, className = '', ...props }: PanelProps) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface p-4 text-ink shadow-panel ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}
