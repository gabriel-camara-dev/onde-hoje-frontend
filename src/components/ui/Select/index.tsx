import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type SelectOption = {
  label: string
  value: string
}

type SelectProps = {
  className?: string
  disabled?: boolean
  label?: string
  name?: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
}

export default function Select({
  className = '',
  defaultValue = '',
  disabled,
  label,
  name,
  onChange,
  options,
  placeholder = 'Selecione',
  required,
  value,
}: SelectProps) {
  const id = useId()
  const wrapperRef = useRef<HTMLLabelElement>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const selectedValue = isControlled ? value : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue)

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function selectValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onChange?.(nextValue)
    setIsOpen(false)
  }

  return (
    <label ref={wrapperRef} className={`relative grid gap-1.5 text-xs font-semibold text-muted ${className}`}>
      {label && (
        <span>
          {label}
          {required && <span className="text-teal"> *</span>}
        </span>
      )}
      {name && <input name={name} type="hidden" value={selectedValue} />}
      <button
        aria-controls={`${id}-options`}
        aria-expanded={isOpen}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left text-sm font-semibold text-ink outline-none transition hover:border-teal/50 focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={disabled}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      >
        <span className={selectedOption ? 'truncate' : 'truncate text-muted'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`shrink-0 text-teal transition ${isOpen ? 'rotate-180' : ''}`}
          size={18}
          strokeWidth={2.4}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-line bg-surface py-1 text-sm text-ink shadow-[0_18px_45px_rgba(0,0,0,.16)] dark:shadow-[0_18px_45px_rgba(0,0,0,.38)]"
          id={`${id}-options`}
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === selectedValue

            return (
              <button
                key={option.value}
                className={`flex min-h-9 w-full items-center justify-between gap-3 px-3 py-2 text-left font-medium transition ${
                  active ? 'bg-teal-soft text-teal' : 'hover:bg-surface-muted'
                }`}
                role="option"
                type="button"
                aria-selected={active}
                onClick={() => selectValue(option.value)}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="shrink-0" size={16} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      )}
    </label>
  )
}
