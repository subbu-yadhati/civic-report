import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Input } from '../components/ui/Input'
import { 
  FileText, 
  Search, 
  Filter,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle
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
  updatedAt: string
  assignedTo?: {
    name: string
    email: string
  }
}

export const MyReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data: issues, isLoading, refetch } = useQuery<Issue[]>(
    ['my-reports', searchTerm, statusFilter, categoryFilter],
    async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      
      const response = await api.get(`/issues?${params.toString()}`)
      return response.data.issues
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified_solved':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-danger-600" />
      default:
        return <Clock className="h-4 w-4 text-warning-600" />
    }
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
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of your reported issues.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setCategoryFilter('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {issues && issues.length > 0 ? (
          issues.map((issue) => (
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
                        <MapPin className="h-4 w-4" />
                        <span>{issue.location.zone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Reported {format(new Date(issue.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {issue.assignedTo && (
                        <div className="text-sm text-gray-500">
                          Assigned to: {issue.assignedTo.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(issue.status)}
                      {getStatusBadge(issue.status)}
                    </div>
                    {getPriorityBadge(issue.priority)}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/issue/${issue._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || categoryFilter
                  ? 'No issues match your current filters.'
                  : "You haven't reported any issues yet."}
              </p>
              <Button asChild>
                <Link to="/report">
                  Report Your First Issue
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
