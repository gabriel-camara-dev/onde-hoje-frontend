import { MessageCircle } from 'lucide-react'
import { Logo } from '../Logo'

const WHATSAPP_NUMBER = '5521996905176'

export function Footer() {
  return (
    <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface/95 px-3 py-2 text-ink shadow-panel backdrop-blur">
      <p className="flex items-center gap-2 text-xs text-muted">
        <Logo className="text-base" />
        <span>
          &copy; {new Date().getFullYear()} &middot; Dúvidas ou sugestões? Fale no WhatsApp.
        </span>
      </p>
      <a
        className="inline-flex items-center gap-1.5 rounded-md bg-teal px-2.5 py-1 text-xs font-semibold text-on-teal transition hover:bg-teal-dark"
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
