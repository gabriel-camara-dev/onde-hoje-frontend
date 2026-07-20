import { MessageCircle } from 'lucide-react'
import { Logo } from '../Logo'

const WHATSAPP_NUMBER = '5521996905176'

export function Footer() {
  // Stacks on phones: side by side, the long line pushes the link onto a row of
  // its own anyway, and justify-between then strands it against the left edge.
  // The link also gets min-h-10 there, so it's a reachable tap target.
  return (
    <footer className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-surface/95 px-3 py-2.5 text-ink shadow-panel backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-xs text-muted">
        <Logo className="text-base" />
        <span>
          &copy; {new Date().getFullYear()} &middot; Dúvidas ou sugestões? Fale no WhatsApp.
        </span>
      </p>
      <a
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-teal px-3 text-xs font-semibold text-on-teal transition hover:bg-teal-dark sm:min-h-0 sm:px-2.5 sm:py-1"
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        rel="noreferrer noopener"
        target="_blank"
      >
        <MessageCircle size={15} />
        (21) 99690-5176
      </a>
    </footer>
  )
}
