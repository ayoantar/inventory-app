'use client'

import { ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  count?: number
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline' | 'cards'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Tabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  variant = 'default',
  size = 'md',
  className = '' 
}: TabsProps) {
  const baseClasses = "flex transition-all duration-200 overflow-x-auto"
  
  const variantClasses = {
    default: "border-b border-gray-700",
    pills: "bg-gray-900/5 p-1 rounded-xl",
    underline: "space-x-1",
    cards: "bg-gray-900/5 border border-gray-700 rounded-lg p-1"
  }

  const sizeClasses = {
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base"
  }

  const getTabClasses = (tab: Tab, isActive: boolean) => {
    const disabled = tab.disabled

    if (variant === 'pills') {
      return `
        flex items-center px-4 py-2.5 font-medium rounded-lg transition-all duration-200 
        ${isActive 
          ? 'bg-gray-900 text-brand-primary-text shadow-sm' 
          : 'text-brand-primary-text hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${size === 'sm' ? 'px-3 py-2 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : ''}
      `.trim()
    }

    if (variant === 'cards') {
      return `
        flex items-center px-4 py-2.5 font-medium rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'text-brand-primary-text hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${size === 'sm' ? 'px-3 py-2 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : ''}
      `.trim()
    }

    if (variant === 'underline') {
      return `
        flex items-center px-1 py-3 font-medium border-b-2 transition-all duration-200
        ${isActive 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-600 dark:text-brand-secondary-text hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800:border-gray-600:border-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${size === 'sm' ? 'py-2 text-xs' : size === 'lg' ? 'py-4 text-base' : ''}
      `.trim()
    }

    // Default variant
    return `
      flex items-center px-6 py-3 font-semibold border-b-3 transition-all duration-200 relative
      ${isActive 
        ? 'border-blue-500 text-blue-600 bg-blue-50/50' 
        : 'border-transparent text-brand-primary-text hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800:border-gray-600:border-gray-600 hover'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${size === 'sm' ? 'px-4 py-2 text-xs' : size === 'lg' ? 'px-8 py-4 text-base' : ''}
    `.trim()
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={getTabClasses(tab, isActive)}
            disabled={tab.disabled}
            type="button"
          >
            {tab.icon && (
              <span className="mr-2 flex-shrink-0">
                {tab.icon}
              </span>
            )}
            
            <span className="whitespace-nowrap">
              {tab.label}
            </span>
            
            {tab.count !== undefined && (
              <span className={`
                ml-2 px-2 py-0.5 text-xs font-medium rounded-full
                ${isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-200 text-brand-primary-text'
                }
              `}>
                {tab.count}
              </span>
            )}
            
            {/* Active indicator for default variant */}
            {variant === 'default' && isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Tab Content Container Component
interface TabContentProps {
  children: ReactNode
  className?: string
}

export function TabContent({ children, className = '' }: TabContentProps) {
  return (
    <div className={`mt-6 ${className}`}>
      {children}
    </div>
  )
}

// Tab Panel Component
interface TabPanelProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'card'
}

export function TabPanel({ children, className = '', variant = 'card' }: TabPanelProps) {
  const variantClasses = {
    default: '',
    card: 'bg-gray-900/5 rounded-xl border border-gray-700 p-6 shadow-sm'
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}