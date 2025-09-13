import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  PlusCircle, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { format } from 'date-fns'

interface Issue {
  _id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  location: {
    address: string
    zone: string
  }
  createdAt: string
  reportedBy: {
    name: string
    email: string
  }
}

interface DashboardStats {
  totalReports: number
  resolvedReports: number
  pendingReports: number
  resolutionRate: number
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>(
    'dashboard-stats',
    async () => {
      const response = await api.get(`/users/${user?.id}/stats`)
      return response.data.stats
    },
    { enabled: !!user }
  )

  const { data: recentIssues, isLoading: issuesLoading } = useQuery<Issue[]>(
    'recent-issues',
    async () => {
      const response = await api.get('/issues?limit=5&sortBy=createdAt&sortOrder=desc')
      return response.data.issues
    },
    { enabled: !!user }
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      in_progress: { variant: 'primary' as const, label: 'In Progress' },
      pending_verification: { variant: 'warning' as const, label: 'Pending Verification' },
      verified_solved: { variant: 'success' as const, label: 'Solved' },
      escalated: { variant: 'danger' as const, label: 'Escalated' },
      reopened: { variant: 'warning' as const, label: 'Reopened' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'gray' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'gray' as const, label: 'Low' },
      medium: { variant: 'primary' as const, label: 'Medium' },
      high: { variant: 'warning' as const, label: 'High' },
      urgent: { variant: 'danger' as const, label: 'Urgent' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { variant: 'gray' as const, label: priority }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      pothole: '🕳️',
      streetlight: '💡',
      garbage: '🗑️',
      water_leak: '💧',
      traffic_signal: '🚦',
      road_damage: '🛣️',
      sewage: '🚽',
      parks: '🌳',
      other: '📋'
    }
    return icons[category as keyof typeof icons] || '📋'
  }

  if (statsLoading || issuesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with civic issues in your area.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <Link to="/report">
              <PlusCircle className="h-4 w-4 mr-2" />
              Report New Issue
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reports
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalReports || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.resolvedReports || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.pendingReports || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolution Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.resolutionRate || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Recent Issues</h3>
          </CardHeader>
          <CardContent>
            {recentIssues && recentIssues.length > 0 ? (
              <div className="space-y-4">
                {recentIssues.map((issue) => (
                  <div key={issue._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">
                            {getCategoryIcon(issue.category)}
                          </span>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {issue.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {issue.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{issue.location.zone}</span>
                          <Calendar className="h-3 w-3 ml-2" />
                          <span>{format(new Date(issue.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-4">
                        {getStatusBadge(issue.status)}
                        {getPriorityBadge(issue.priority)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/issue/${issue._id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent issues found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link to="/report">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Report New Issue
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/my-reports">
                  <FileText className="h-4 w-4 mr-2" />
                  View My Reports
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/notifications">
                  <Clock className="h-4 w-4 mr-2" />
                  Check Notifications
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
