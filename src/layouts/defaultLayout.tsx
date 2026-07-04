import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

export function DefaultLayout() {
  return (
    <div className="min-h-screen bg-paper p-3 lg:p-5">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

