import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  MapPin, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Camera
} from 'lucide-react'
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
    coordinates: [number, number]
  }
  images: Array<{
    url: string
    caption?: string
  }>
  videos: Array<{
    url: string
    caption?: string
  }>
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
  statusHistory: Array<{
    status: string
    changedAt: string
    changedBy: {
      name: string
    }
    reason?: string
  }>
  comments: Array<{
    text: string
    author: {
      name: string
      role: string
    }
    createdAt: string
    isInternal: boolean
  }>
  workProof: Array<{
    url: string
    description: string
    uploadedBy: {
      name: string
    }
    uploadedAt: string
  }>
}

export const IssueDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: issue, isLoading, error } = useQuery<Issue>(
    ['issue', id],
    async () => {
      const response = await api.get(`/issues/${id}`)
      return response.data.issue
    },
    { enabled: !!id }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Issue not found</h3>
        <p className="text-gray-500">The issue you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">
              {getCategoryIcon(issue.category)}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {issue.title}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge(issue.status)}
            {getPriorityBadge(issue.priority)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
            </CardContent>
          </Card>

          {/* Images */}
          {issue.images && issue.images.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Photos
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {issue.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={`Issue photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {image.caption && (
                        <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Proof */}
          {issue.workProof && issue.workProof.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Work Proof</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issue.workProof.map((proof, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <img
                        src={proof.url}
                        alt={`Work proof ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                      <p className="text-sm text-gray-600">{proof.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded by {proof.uploadedBy.name} on {format(new Date(proof.uploadedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Comments
              </h2>
            </CardHeader>
            <CardContent>
              {issue.comments && issue.comments.length > 0 ? (
                <div className="space-y-4">
                  {issue.comments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        <Badge variant="gray" className="text-xs">
                          {comment.author.role.replace('_', ' ')}
                        </Badge>
                        {comment.isInternal && (
                          <Badge variant="warning" className="text-xs">
                            Internal
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No comments yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Issue Info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Issue Information</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{issue.location.address}</p>
                  <p className="text-sm text-gray-500">{issue.location.zone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reported by</p>
                  <p className="text-sm text-gray-600">{issue.reportedBy.name}</p>
                </div>
              </div>

              {issue.assignedTo && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned to</p>
                    <p className="text-sm text-gray-600">{issue.assignedTo.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reported on</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(issue.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last updated</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(issue.updatedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Status History</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {issue.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {history.status === 'verified_solved' ? (
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      ) : history.status === 'escalated' ? (
                        <AlertTriangle className="h-4 w-4 text-danger-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-warning-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(history.status)}
                        <span className="text-sm text-gray-500">
                          by {history.changedBy.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                      {history.reason && (
                        <p className="text-sm text-gray-500 mt-1">{history.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
