import { createBrowserRouter } from 'react-router-dom'
import { DefaultLayout } from '../layouts/defaultLayout'
import { ProtectedRoute } from './ProtectedRoute'
import Admin from '../pages/Admin'
import Friends from '../pages/Friends'
import Groups from '../pages/Groups'
import History from '../pages/History'
import Home from '../pages/Home'
import { Login } from '../pages/Login'
import { OAuthCallback } from '../pages/OAuthCallback'
import Profile from '../pages/Profile'
import Ranking from '../pages/Ranking'
import { Register } from '../pages/Register'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      { path: '', element: <Home /> },
      { path: 'ranking', element: <Ranking /> },
      { path: 'history', element: <History /> },
      { path: 'groups', element: <Groups /> },
      { path: 'groups/:groupPublicId', element: <Groups /> },
      {
        path: 'friends',
        element: (
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/auth/google/callback',
    element: <OAuthCallback />,
  },
])
