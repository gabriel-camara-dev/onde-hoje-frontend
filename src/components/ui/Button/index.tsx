import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-teal text-white shadow-[0_8px_18px_rgba(15,118,110,.18)] hover:bg-teal-dark',
  secondary:
    'border border-line bg-surface text-ink hover:border-teal/45 hover:bg-teal-soft',
  ghost:
    'border border-transparent bg-transparent text-muted hover:bg-surface-muted hover:text-ink',
  danger: 'border border-transparent bg-red-700 text-white hover:bg-red-800',
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

