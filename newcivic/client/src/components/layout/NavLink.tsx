import React from 'react'
import { NavLink as RouterNavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface NavLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

export const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, children }) => {
  return (
    <RouterNavLink
      to={href}
      className={({ isActive }) =>
        clsx(
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
          isActive
            ? 'bg-primary-100 text-primary-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )
      }
    >
      <Icon
        className={({ isActive }) =>
          clsx(
            'mr-3 h-5 w-5 flex-shrink-0',
            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
          )
        }
      />
      {children}
    </RouterNavLink>
  )
}
