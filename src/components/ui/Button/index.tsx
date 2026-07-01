import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-teal text-white shadow-[0_14px_30px_rgba(124,58,237,.26)] hover:bg-teal-dark',
  secondary:
    'border border-line bg-surface text-ink hover:bg-teal-soft',
  ghost:
    'bg-transparent text-muted hover:bg-teal-soft hover:text-ink',
  danger: 'bg-red-700 text-white hover:bg-red-800',
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
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
