import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { NewProjectPage } from './pages/NewProjectPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SetPasswordPage } from './pages/SetPasswordPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/set-password',
    element: <SetPasswordPage />,
  },
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/new', element: <NewProjectPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
])
