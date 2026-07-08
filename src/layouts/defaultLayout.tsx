import { Outlet } from 'react-router-dom'
import { Footer } from '../components/Footer'
import Header from '../components/Header'
import { PageTransition } from '../components/PageTransition'

export function DefaultLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper p-3 lg:p-5">
      <Header />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}

