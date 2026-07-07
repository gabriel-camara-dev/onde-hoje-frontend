import { Camera, Plus } from 'lucide-react'
import { resolveApiUrl } from '../../../../api/api'
import { useAvatarUpload } from './hooks/useAvatarUpload'

type ProfileAvatarProps = {
  name: string
  avatarUrl?: string | null
}

export function ProfileAvatar({ name, avatarUrl }: ProfileAvatarProps) {
  const { fileInputRef, openFilePicker, handleAvatarChange } = useAvatarUpload()
  const avatarSrc = resolveApiUrl(avatarUrl)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        className="group relative grid h-32 w-32 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-surface bg-contrast text-4xl font-semibold text-on-contrast shadow-[var(--shadow-panel)] outline-none ring-2 ring-line transition hover:scale-[1.02] hover:ring-teal focus-visible:ring-4 focus-visible:ring-teal"
        aria-label="Alterar foto de perfil"
        onClick={openFilePicker}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt={`Foto de ${name}`} className="h-full w-full object-cover" />
        ) : (
          <span>{initials || <Camera size={36} />}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-teal text-on-teal shadow-lg">
            <Plus size={30} strokeWidth={3} />
          </span>
        </span>
      </button>
      <input
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/webp"
        name="file"
        type="file"
        onChange={handleAvatarChange}
      />
    </div>
  )
}
