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
  User, 
  Mail, 
  Phone, 
  Shield,
  MapPin,
  Building,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react'
import { api } from '../../services/api'
import { format } from 'date-fns'

interface User {
  _id: string
  name: string
  email: string
  phone: string
  role: string
  assignedZones?: string[]
  department?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('isActive', statusFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      
      const response = await api.get(`/users?${params.toString()}`)
      return response.data
    }
  })

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      citizen: { variant: 'gray' as const, label: 'Citizen' },
      low_admin: { variant: 'primary' as const, label: 'Low Admin' },
      high_admin: { variant: 'danger' as const, label: 'High Admin' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || { variant: 'gray' as const, label: role }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="danger">Inactive</Badge>
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setStatusFilter('')
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all users in the system.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="low_admin">Low Admin</option>
              <option value="high_admin">High Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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

      {/* Users List */}
      <div className="space-y-4">
        {usersData?.users && usersData.users.length > 0 ? (
          usersData.users.map((user) => (
            <Card key={user._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4" />
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                      {user.department && (
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>{user.department}</span>
                        </div>
                      )}
                    </div>

                    {user.assignedZones && user.assignedZones.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {user.assignedZones.map((zone, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </span>
                      {user.lastLogin && (
                        <span>
                          Last login {format(new Date(user.lastLogin), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.isActive)}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
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
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter || statusFilter
                  ? 'No users match your current filters.'
                  : 'No users have been registered yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {usersData?.pagination && usersData.pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((usersData.pagination.currentPage - 1) * usersData.pagination.itemsPerPage) + 1} to{' '}
                {Math.min(usersData.pagination.currentPage * usersData.pagination.itemsPerPage, usersData.pagination.totalItems)} of{' '}
                {usersData.pagination.totalItems} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersData.pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersData.pagination.currentPage === usersData.pagination.totalPages}
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
