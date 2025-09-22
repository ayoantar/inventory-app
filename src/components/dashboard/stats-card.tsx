import Link from 'next/link'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  onClick?: () => void
  href?: string
}

const variantClasses = {
  default: {
    iconBg: 'bg-gray-100 dark:bg-white/5',
    text: 'text-gray-700 dark:text-brand-secondary-text'
  },
  success: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400'
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400'
  },
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400'
  }
}

export default function StatsCard({ title, value, change, icon, variant = 'default', onClick, href }: StatsCardProps) {
  const colors = variantClasses[variant]
  
  const content = (
    <div className="flex items-center">
      <div className={`${colors.iconBg} ${colors.text} p-3 rounded-lg`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-brand-secondary-text">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-brand-primary-text">{value}</p>
        {change && (
          <p className="text-sm font-medium text-gray-800 dark:text-brand-secondary-text mt-1">{change}</p>
        )}
      </div>
    </div>
  )

  const baseClasses = "bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-gray-700 rounded-lg p-6 shadow-sm transition-all duration-200"
  const interactiveClasses = onClick || href ? "hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer transform hover:scale-[1.02]" : "hover:shadow-md"

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${interactiveClasses} block`}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} ${interactiveClasses} w-full text-left`}>
        {content}
      </button>
    )
  }

  return (
    <div className={`${baseClasses} ${interactiveClasses}`}>
      {content}
    </div>
  )
}