import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { 
  MapPin, 
  Camera, 
  Upload, 
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface ReportFormData {
  title: string
  description: string
  category: string
  priority: string
  location: {
    address: string
    zone: string
    coordinates: [number, number]
  }
  images: File[]
}

const categories = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'streetlight', label: 'Street Light', icon: '💡' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'water_leak', label: 'Water Leak', icon: '💧' },
  { value: 'traffic_signal', label: 'Traffic Signal', icon: '🚦' },
  { value: 'road_damage', label: 'Road Damage', icon: '🛣️' },
  { value: 'sewage', label: 'Sewage', icon: '🚽' },
  { value: 'parks', label: 'Parks & Recreation', icon: '🌳' },
  { value: 'other', label: 'Other', icon: '📋' }
]

const priorities = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'primary' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'danger' }
]

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ReportFormData>({
    defaultValues: {
      category: 'other',
      priority: 'medium',
      location: {
        address: '',
        zone: '',
        coordinates: [0, 0]
      }
    }
  })

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude]
        setCurrentLocation(coords)
        setValue('location.coordinates', coords)
        toast.success('Location captured successfully')
      },
      (error) => {
        toast.error('Unable to get your location')
        console.error('Geolocation error:', error)
      }
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`)
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
      }
      
      return isValidType && isValidSize
    })

    setSelectedImages(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const createIssueMutation = useMutation(
    async (data: ReportFormData) => {
      const formData = new FormData()
      
      // Add basic data
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('priority', data.priority)
      formData.append('location[address]', data.location.address)
      formData.append('location[zone]', data.location.zone)
      formData.append('location[coordinates][0]', data.location.coordinates[0].toString())
      formData.append('location[coordinates][1]', data.location.coordinates[1].toString())
      
      // Add images
      selectedImages.forEach((image, index) => {
        formData.append(`images[${index}]`, image)
      })

      const response = await api.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    {
      onSuccess: (data) => {
        toast.success('Issue reported successfully!')
        queryClient.invalidateQueries('recent-issues')
        queryClient.invalidateQueries('dashboard-stats')
        navigate(`/issue/${data.issue._id}`)
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to report issue'
        toast.error(message)
      }
    }
  )

  const onSubmit = (data: ReportFormData) => {
    if (!currentLocation) {
      toast.error('Please capture your location first')
      return
    }

    if (data.location.address.trim() === '') {
      toast.error('Please enter the address')
      return
    }

    if (data.location.zone.trim() === '') {
      toast.error('Please enter the zone')
      return
    }

    createIssueMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Help improve your community by reporting civic issues.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Issue Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <Input
              label="Issue Title"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
              placeholder="Brief description of the issue"
            />

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input resize-none"
                placeholder="Provide detailed information about the issue"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`relative flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      watch('category') === category.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={category.value}
                      {...register('category')}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">{category.icon}</span>
                    <span className="text-xs text-center">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <div className="flex space-x-2">
                {priorities.map((priority) => (
                  <label
                    key={priority.value}
                    className={`flex items-center space-x-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                      watch('priority') === priority.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={priority.value}
                      {...register('priority')}
                      className="sr-only"
                    />
                    <Badge variant={priority.color as any}>
                      {priority.label}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="flex-1"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {currentLocation ? 'Location Captured' : 'Capture Location'}
                </Button>
              </div>

              {currentLocation && (
                <div className="flex items-center space-x-2 text-sm text-success-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Location captured: {currentLocation[1].toFixed(4)}, {currentLocation[0].toFixed(4)}</span>
                </div>
              )}

              <Input
                label="Address"
                {...register('location.address', { required: 'Address is required' })}
                error={errors.location?.address?.message}
                placeholder="Enter the exact address"
              />

              <Input
                label="Zone/Area"
                {...register('location.zone', { required: 'Zone is required' })}
                error={errors.location?.zone?.message}
                placeholder="Enter the zone or area name"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Photos (Optional)
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload photos
                      </span>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB each (max 5 photos)
                    </p>
                  </div>
                </div>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createIssueMutation.isLoading}
                disabled={createIssueMutation.isLoading || !currentLocation}
              >
                Report Issue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
