import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/store'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout'
import Login from './pages/Login'
import ManagerDashboard from './pages/ManagerDashboard'
import PeoplePage from './pages/PeoplePage'
import AttendancePage from './pages/AttendancePage'
import ManagerQRPage from './pages/ManagerQRPage'
import SalaryPage from './pages/SalaryPage'
import EmployeeLayout from './components/EmployeeLayout';
import EmployeeScanner from './pages/EmployeeScanner';
import EmployeeCalendar from './pages/EmployeeCalendar';
import EmployeeSalary from './pages/EmployeeSalary';
import InvitePage from './pages/InvitePage'
import Home from './pages/Home'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute requiredRole="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <EmployeeScanner /> },
          { path: "calendar", element: <EmployeeCalendar /> },
          { path: "salary", element: <EmployeeSalary /> }
        ]
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/invite/:token",
        element: <InvitePage />
      },
      {
        path: "/home",
        element: <Home />
      },
      {
        path: "/privacyPolicy",
        element: <PrivacyPolicy />
      },
      {
        path: "/termsAndConditions",
        element: <TermsAndConditions />
      },
      // Manager-only routes
      {
        path: "/manager",
        element: (
          <ProtectedRoute requiredRole="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "/manager/people",
        element: (
          <ProtectedRoute requiredRole="manager">
            <PeoplePage />
          </ProtectedRoute>
        )
      },
      {
        path: "/manager/attendance",
        element: (
          <ProtectedRoute requiredRole="manager">
            <AttendancePage />
          </ProtectedRoute>
        )
      },
      {
        path: "/manager/salary",
        element: (
          <ProtectedRoute requiredRole="manager">
            <SalaryPage />
          </ProtectedRoute>
        )
      },
      {
        path: "/manager/qr",
        element: (
          <ProtectedRoute requiredRole="manager">
            <ManagerQRPage />
          </ProtectedRoute>
        )
      },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </PersistGate>
    </Provider>
  </GoogleOAuthProvider>
)
