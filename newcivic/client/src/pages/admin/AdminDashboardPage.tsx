import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  BarChart3
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { format } from 'date-fns'

interface DashboardData {
  overview: {
    totalIssues: number
    pendingIssues: number
    resolvedIssues: number
    escalatedIssues: number
    resolutionRate: number
  }
  issuesByCategory: Array<{
    _id: string
    count: number
  }>
  issuesByPriority: Array<{
    _id: string
    count: number
  }>
  issuesByZone: Array<{
    _id: string
    count: number
  }>
  recentIssues: Array<{
    _id: string
    title: string
    category: string
    status: string
    priority: string
    location: {
      zone: string
    }
    createdAt: string
    reportedBy: {
      name: string
    }
    assignedTo?: {
      name: string
    }
  }>
  adminPerformance: Array<{
    name: string
    email: string
    totalAssigned: number
    totalResolved: number
    resolutionRate: number
  }>
  issuesRequiringAttention: Array<{
    _id: string
    title: string
    status: string
    priority: string
    createdAt: string
    reportedBy: {
      name: string
    }
    assignedTo?: {
      name: string
    }
  }>
}

export const AdminDashboardPage: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard')
      return response.data
    }
  })

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of civic issues and system performance.
        </p>
      </div>

      {/* Overview Stats */}
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
                    Total Issues
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData?.overview.totalIssues || 0}
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
                    Pending Issues
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData?.overview.pendingIssues || 0}
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
                    Resolved Issues
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData?.overview.resolvedIssues || 0}
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
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolution Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData?.overview.resolutionRate || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Issues by Category</h3>
          </CardHeader>
          <CardContent>
            {dashboardData?.issuesByCategory && dashboardData.issuesByCategory.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.issuesByCategory.map((category) => (
                  <div key={category._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCategoryIcon(category._id)}</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category._id.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Issues by Priority */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Issues by Priority</h3>
          </CardHeader>
          <CardContent>
            {dashboardData?.issuesByPriority && dashboardData.issuesByPriority.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.issuesByPriority.map((priority) => (
                  <div key={priority._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(priority._id)}
                    </div>
                    <span className="text-sm text-gray-500">{priority.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues and Admin Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Issues</h3>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/issues">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentIssues && dashboardData.recentIssues.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentIssues.map((issue) => (
                  <div key={issue._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {issue.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500">
                          Reported by {issue.reportedBy.name} • {issue.location.zone}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-4">
                        {getStatusBadge(issue.status)}
                        {getPriorityBadge(issue.priority)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent issues</p>
            )}
          </CardContent>
        </Card>

        {/* Admin Performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Admin Performance</h3>
          </CardHeader>
          <CardContent>
            {dashboardData?.adminPerformance && dashboardData.adminPerformance.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.adminPerformance.map((admin, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {admin.resolutionRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Resolution Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{admin.totalAssigned} assigned</span>
                      <span>{admin.totalResolved} resolved</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No performance data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues Requiring Attention */}
      {dashboardData?.issuesRequiringAttention && dashboardData.issuesRequiringAttention.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <h3 className="text-lg font-medium text-gray-900">Issues Requiring Attention</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.issuesRequiringAttention.map((issue) => (
                <div key={issue._id} className="border border-warning-200 rounded-lg p-4 bg-warning-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Reported by {issue.reportedBy.name} • {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                      </p>
                      {issue.assignedTo && (
                        <p className="text-xs text-gray-500">
                          Assigned to: {issue.assignedTo.name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-4">
                      {getStatusBadge(issue.status)}
                      {getPriorityBadge(issue.priority)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild>
              <Link to="/admin/issues">
                <FileText className="h-4 w-4 mr-2" />
                Manage Issues
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/admin/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/notifications">
                <Clock className="h-4 w-4 mr-2" />
                Notifications
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
