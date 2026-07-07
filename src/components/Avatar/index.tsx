import { resolveApiUrl } from '../../api/api'

type AvatarProps = {
  name: string
  src?: string | null
  className?: string
}

export function Avatar({ name, src, className = 'size-10 rounded-full' }: AvatarProps) {
  const avatarSrc = resolveApiUrl(src)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  if (avatarSrc) {
    return (
      <img
        alt=""
        className={`${className} shrink-0 border border-line object-cover`}
        referrerPolicy="no-referrer"
        src={avatarSrc}
      />
    )
  }

  return (
    <span
      className={`${className} grid shrink-0 place-items-center bg-teal text-xs font-semibold text-on-teal`}
    >
      {initials || 'U'}
    </span>
  )
}
