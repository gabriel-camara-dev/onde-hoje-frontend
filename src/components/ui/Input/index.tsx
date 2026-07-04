import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export default function Input({ className = '', error, label, ...props }: InputProps) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-muted">
      {label && (
        <span>
          {label}
          {props.required && <span className="text-teal"> *</span>}
        </span>
      )}
      <input
        {...props}
        className={`min-h-10 rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/55 focus:border-teal focus:ring-2 focus:ring-teal/20 ${error ? 'border-red-500' : 'border-line'} ${className}`}
      />
      {error && <span className="text-xs font-semibold text-red-700">{error}</span>}
    </label>
  )
}

