import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { ReportIssuePage } from './pages/ReportIssuePage.tsx'
import { MyReportsPage } from './pages/MyReportsPage.tsx'
import { IssueDetailsPage } from './pages/IssueDetailsPage.tsx'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx'
import { AdminIssuesPage } from './pages/admin/AdminIssuesPage.tsx'
import { AdminUsersPage } from './pages/admin/AdminUsersPage.tsx'
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage.tsx'
import { NotificationsPage } from './pages/NotificationsPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // TypeScript now knows user is not null
  const userRole = user.role

  return (
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        
        {/* Citizen routes */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/report" element={<ReportIssuePage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/issue/:id" element={<IssueDetailsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Admin routes */}
        {(userRole === 'low_admin' || userRole === 'high_admin') && (
          <>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/issues" element={<AdminIssuesPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          </>
        )}
        
        {/* High admin only routes */}
        {userRole === 'high_admin' && (
          <Route path="/admin/users" element={<AdminUsersPage />} />
        )}
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App