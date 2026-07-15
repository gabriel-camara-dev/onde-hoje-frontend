// Remembers which group the user last voted with, so the vote dialog's group
// select defaults to it next time. Empty string means "Público"; null means the
// user hasn't voted yet (so we fall back to the current map filter).
const KEY = 'onde-hoje:last-vote-group'

export function getLastVoteGroup(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setLastVoteGroup(groupPublicId: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(KEY, groupPublicId)
  } catch {
    // Ignore storage failures (private mode / disabled storage).
  }
}
