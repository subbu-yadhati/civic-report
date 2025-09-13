import React from 'react'
import { 
  Home, 
  PlusCircle, 
  FileText, 
  Bell, 
  User, 
  Settings,
  BarChart3,
  Users,
  Shield
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { NavLink } from './NavLink'

export const Sidebar: React.FC = () => {
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

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Civic Report
            </span>
          </div>
        </div>
        
        <nav className="mt-8 flex-1 px-2 space-y-1">
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
