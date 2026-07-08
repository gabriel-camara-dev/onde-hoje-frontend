import { API_BASE_URL } from '../../../../api/api'

export function GoogleSignInButton({ onBeforeRedirect }: { onBeforeRedirect?: () => void }) {
  return (
    <a
      className="mb-3 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-teal-soft"
      href={API_BASE_URL + '/sessions/google'}
      onClick={onBeforeRedirect}
    >
      <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-semibold text-[#4285f4]">
        G
      </span>
      Entrar com Google
    </a>
  )
}
