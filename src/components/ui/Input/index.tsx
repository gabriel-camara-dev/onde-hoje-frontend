import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export default function Input({ className = '', error, label, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword && showPassword ? 'text' : type

  return (
    <label className="grid gap-1.5 text-xs font-semibold text-muted">
      {label && (
        <span>
          {label}
          {props.required && <span className="text-teal"> *</span>}
        </span>
      )}
      <div className="relative">
        <input
          {...props}
          type={effectiveType}
          className={`min-h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/55 focus:border-teal focus:ring-2 focus:ring-teal/20 ${isPassword ? 'pr-11' : ''} ${error ? 'border-red-500' : 'border-line'} ${className}`}
        />
        {isPassword && (
          <button
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center text-muted transition hover:text-ink"
            tabIndex={-1}
            type="button"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs font-semibold text-red-700">{error}</span>}
    </label>
  )
}
