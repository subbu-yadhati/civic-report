import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  User
} from 'lucide-react'
import { api } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedIssue?: {
    _id: string
    title: string
    category: string
  }
  priority: string
}

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery<Notification[]>(
    ['notifications', filter],
    async () => {
      const params = new URLSearchParams()
      if (filter === 'unread') params.append('unreadOnly', 'true')
      
      const response = await api.get(`/notifications?${params.toString()}`)
      return response.data.notifications
    }
  )

  const { data: stats } = useQuery(
    'notification-stats',
    async () => {
      const response = await api.get('/notifications')
      return {
        total: response.data.pagination.totalItems,
        unread: response.data.unreadCount
      }
    }
  )

  const markAsReadMutation = useMutation(
    async (notificationId: string) => {
      await api.put(`/notifications/${notificationId}/read`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('notification-stats')
      }
    }
  )

  const markAllAsReadMutation = useMutation(
    async () => {
      await api.put('/notifications/read-all')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('notification-stats')
        toast.success('All notifications marked as read')
      }
    }
  )

  const deleteNotificationMutation = useMutation(
    async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('notification-stats')
        toast.success('Notification deleted')
      }
    }
  )

  const deleteAllNotificationsMutation = useMutation(
    async () => {
      await api.delete('/notifications')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        queryClient.invalidateQueries('notification-stats')
        toast.success('All notifications deleted')
      }
    }
  )

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'issue_created':
        return <FileText className="h-5 w-5 text-primary-600" />
      case 'issue_assigned':
        return <User className="h-5 w-5 text-warning-600" />
      case 'issue_updated':
        return <Clock className="h-5 w-5 text-primary-600" />
      case 'issue_resolved':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'issue_escalated':
        return <AlertCircle className="h-5 w-5 text-danger-600" />
      case 'verification_required':
        return <Check className="h-5 w-5 text-warning-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'gray' as const, label: 'Low' },
      medium: { variant: 'primary' as const, label: 'Medium' },
      high: { variant: 'danger' as const, label: 'High' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { variant: 'gray' as const, label: priority }
    return <Badge variant={config.variant}>{config.label}</Badge>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with the latest activity on your issues.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isLoading}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            onClick={() => deleteAllNotificationsMutation.mutate()}
            disabled={deleteAllNotificationsMutation.isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-warning-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Notifications
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Unread Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card key={notification._id} className={notification.isRead ? 'opacity-75' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium ${notification.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(notification.priority)}
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm ${notification.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    
                    {notification.relatedIssue && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-900">
                          Related Issue: {notification.relatedIssue.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Category: {notification.relatedIssue.category}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsReadMutation.mutate(notification._id)}
                        disabled={markAsReadMutation.isLoading}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNotificationMutation.mutate(notification._id)}
                      disabled={deleteNotificationMutation.isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? "You don't have any unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
