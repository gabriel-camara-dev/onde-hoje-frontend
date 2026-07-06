import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import { PageTransition } from '../components/PageTransition'

export function DefaultLayout() {
  return (
    <div className="min-h-screen bg-paper p-3 lg:p-5">
      <Header />
      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}

