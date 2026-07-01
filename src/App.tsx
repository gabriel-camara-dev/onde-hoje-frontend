import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './router/router'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}

export default App
