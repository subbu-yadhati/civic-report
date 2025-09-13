import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  MapPin,
  Users,
  Calendar
} from 'lucide-react'
import { api } from '../../services/api'
import { format } from 'date-fns'

interface AnalyticsData {
  issuesOverTime: Array<{
    _id: {
      year: number
      month: number
      day: number
    }
    count: number
  }>
  resolutionTimeAnalysis: {
    avgResolutionTime: number
    minResolutionTime: number
    maxResolutionTime: number
    medianResolutionTime: number
  }
  categoryPerformance: Array<{
    category: string
    total: number
    resolved: number
    resolutionRate: number
    avgResolutionTime: number
  }>
  zonePerformance: Array<{
    zone: string
    total: number
    resolved: number
    resolutionRate: number
    avgResolutionTime: number
  }>
  adminPerformanceDetails: Array<{
    name: string
    email: string
    totalAssigned: number
    totalResolved: number
    resolutionRate: number
    avgResolutionTime: number
  }>
}

export const AdminAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', dateRange, selectedZone, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      if (selectedZone) params.append('zone', selectedZone)
      if (selectedCategory) params.append('category', selectedCategory)
      
      const response = await api.get(`/admin/analytics?${params.toString()}`)
      return response.data
    }
  })

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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed insights into system performance and trends.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="input"
              >
                <option value="">All Zones</option>
                <option value="Zone A">Zone A</option>
                <option value="Zone B">Zone B</option>
                <option value="Zone C">Zone C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolution Time Analysis */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Resolution Time Analysis</h2>
        </CardHeader>
        <CardContent>
          {analyticsData?.resolutionTimeAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {analyticsData.resolutionTimeAnalysis.avgResolutionTime.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Average (days)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">
                  {analyticsData.resolutionTimeAnalysis.minResolutionTime.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Fastest (days)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">
                  {analyticsData.resolutionTimeAnalysis.maxResolutionTime.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Slowest (days)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {analyticsData.resolutionTimeAnalysis.medianResolutionTime.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Median (days)</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No resolution time data available</p>
          )}
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Category Performance</h2>
        </CardHeader>
        <CardContent>
          {analyticsData?.categoryPerformance && analyticsData.categoryPerformance.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.categoryPerformance.map((category) => (
                <div key={category.category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCategoryIcon(category.category)}</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {category.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {category.resolutionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Resolution Rate</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Issues</div>
                      <div className="font-medium">{category.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Resolved</div>
                      <div className="font-medium">{category.resolved}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg. Resolution Time</div>
                      <div className="font-medium">
                        {category.avgResolutionTime ? category.avgResolutionTime.toFixed(1) : 'N/A'} days
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No category performance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Zone Performance */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Zone Performance</h2>
        </CardHeader>
        <CardContent>
          {analyticsData?.zonePerformance && analyticsData.zonePerformance.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.zonePerformance.map((zone) => (
                <div key={zone.zone} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{zone.zone}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {zone.resolutionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Resolution Rate</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Issues</div>
                      <div className="font-medium">{zone.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Resolved</div>
                      <div className="font-medium">{zone.resolved}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg. Resolution Time</div>
                      <div className="font-medium">
                        {zone.avgResolutionTime ? zone.avgResolutionTime.toFixed(1) : 'N/A'} days
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No zone performance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Performance Details */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Admin Performance Details</h2>
        </CardHeader>
        <CardContent>
          {analyticsData?.adminPerformanceDetails && analyticsData.adminPerformanceDetails.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.adminPerformanceDetails.map((admin, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.resolutionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Resolution Rate</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Assigned</div>
                      <div className="font-medium">{admin.totalAssigned}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Resolved</div>
                      <div className="font-medium">{admin.totalResolved}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg. Resolution Time</div>
                      <div className="font-medium">
                        {admin.avgResolutionTime ? admin.avgResolutionTime.toFixed(1) : 'N/A'} days
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Performance</div>
                      <div className="font-medium">
                        {admin.resolutionRate >= 80 ? 'Excellent' : 
                         admin.resolutionRate >= 60 ? 'Good' : 
                         admin.resolutionRate >= 40 ? 'Fair' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No admin performance data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
