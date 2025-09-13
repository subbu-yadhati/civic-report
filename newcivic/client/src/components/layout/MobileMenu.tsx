import React from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { NavLink } from './NavLink'
import { 
  Home, 
  PlusCircle, 
  FileText, 
  Bell, 
  User, 
  BarChart3,
  Users,
  Shield
} from 'lucide-react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  const citizenNavItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Report Issue', href: '/report', icon: PlusCircle },
    { name: 'My Reports', href: '/my-reports', icon: FileText },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Issues', href: '/admin/issues', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const highAdminNavItems = [
    ...adminNavItems,
    { name: 'Users', href: '/admin/users', icon: Users },
  ]

  const getNavItems = () => {
    if (user?.role === 'high_admin') return highAdminNavItems
    if (user?.role === 'low_admin') return adminNavItems
    return citizenNavItems
  }

  const navItems = getNavItems()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Civic Report
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              href={item.href}
              icon={item.icon}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
