import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Input } from '../../components/ui/Input'
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
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
  updatedAt: string
  reportedBy: {
    name: string
    email: string
  }
  assignedTo?: {
    name: string
    email: string
  }
}

export const AdminIssuesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const { data: issuesData, isLoading } = useQuery({
    queryKey: ['admin-issues', searchTerm, statusFilter, categoryFilter, priorityFilter, zoneFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (zoneFilter) params.append('zone', zoneFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      
      const response = await api.get(`/issues?${params.toString()}`)
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

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setCategoryFilter('')
    setPriorityFilter('')
    setZoneFilter('')
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Issues</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all civic issues in the system.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="verified_solved">Solved</option>
              <option value="escalated">Escalated</option>
              <option value="reopened">Reopened</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="streetlight">Street Light</option>
              <option value="garbage">Garbage</option>
              <option value="water_leak">Water Leak</option>
              <option value="traffic_signal">Traffic Signal</option>
              <option value="road_damage">Road Damage</option>
              <option value="sewage">Sewage</option>
              <option value="parks">Parks</option>
              <option value="other">Other</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
              <option value="priority">Sort by Priority</option>
            </select>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {issuesData?.issues && issuesData.issues.length > 0 ? (
          issuesData.issues.map((issue) => (
            <Card key={issue._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">
                        {getCategoryIcon(issue.category)}
                      </span>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {issue.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {issue.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{issue.reportedBy.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{issue.location.zone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(issue.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {issue.assignedTo && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Assigned to: {issue.assignedTo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(issue.status)}
                      {getPriorityBadge(issue.priority)}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/issue/${issue._id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter || categoryFilter || priorityFilter || zoneFilter
                  ? 'No issues match your current filters.'
                  : 'No issues have been reported yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {issuesData?.pagination && issuesData.pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((issuesData.pagination.currentPage - 1) * issuesData.pagination.itemsPerPage) + 1} to{' '}
                {Math.min(issuesData.pagination.currentPage * issuesData.pagination.itemsPerPage, issuesData.pagination.totalItems)} of{' '}
                {issuesData.pagination.totalItems} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={issuesData.pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={issuesData.pagination.currentPage === issuesData.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
