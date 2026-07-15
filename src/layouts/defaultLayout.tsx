import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '../components/Footer'
import Header from '../components/Header'
import { PageTransition } from '../components/PageTransition'
import { TutorialModal } from '../components/TutorialModal'
import { hasSeenTutorial, useTutorialStore } from '../stores/tutorialStore'

export function DefaultLayout() {
  const isTutorialOpen = useTutorialStore((state) => state.isOpen)
  const openTutorial = useTutorialStore((state) => state.open)
  const closeTutorial = useTutorialStore((state) => state.close)

  useEffect(() => {
    if (!hasSeenTutorial()) {
      openTutorial()
    }
  }, [openTutorial])

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper p-3 lg:p-5">
      <Header />
      <main className="min-w-0 flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      {isTutorialOpen && <TutorialModal onClose={closeTutorial} />}
    </div>
  )
}

