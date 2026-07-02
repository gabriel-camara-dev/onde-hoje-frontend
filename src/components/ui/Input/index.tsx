import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export default function Input({ className = '', error, label, ...props }: InputProps) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-muted">
      {label && (
        <span>
          {label}
          {props.required && <span className="text-teal"> *</span>}
        </span>
      )}
      <input
        {...props}
        className={`min-h-10 rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-teal transition placeholder:text-muted/60 ${error ? 'border-red-500' : 'border-line'} ${className}`}
      />
      {error && <span className="text-xs text-red-700">{error}</span>}
    </label>
  )
}
