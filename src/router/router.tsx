import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import { DefaultLayout } from '../layouts/defaultLayout'
import { Login } from '../pages/Login'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '',
        element: <Home />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
])
