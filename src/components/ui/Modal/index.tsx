import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Button from '../Button'

interface ModalProps {
  children: ReactNode
  onClose: () => void
  title: string
}

export function Modal({ children, onClose, title }: ModalProps) {
  // Rendered through a portal so page transitions (which apply a transform and
  // create a containing block) can't break the fixed full-screen overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-lg gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-5 text-ink shadow-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button className="size-12 p-0" type="button" variant="ghost" onClick={onClose}>
            <X size={26} strokeWidth={2.6} />
          </Button>
        </div>
        {children}
      </section>
    </div>,
    document.body
  )
}
