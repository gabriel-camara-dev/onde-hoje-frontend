import { create } from 'zustand'

const SEEN_KEY = 'onde-hoje:tutorial-seen'

export function hasSeenTutorial() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

type TutorialState = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // ignore storage errors (private mode etc.)
    }
    set({ isOpen: false })
  },
}))
