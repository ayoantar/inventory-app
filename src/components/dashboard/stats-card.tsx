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
    iconBg: 'bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10',
    text: 'text-white/60 hover:text-white/80 transition-colors'
  },
  success: {
    iconBg: 'bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10',
    text: 'text-emerald-400 hover:text-emerald-300 transition-colors'
  },
  warning: {
    iconBg: 'bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10',
    text: 'text-amber-400 hover:text-amber-300 transition-colors'
  },
  danger: {
    iconBg: 'bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10',
    text: 'text-red-400 hover:text-red-300 transition-colors'
  }
}

export default function StatsCard({ title, value, change, icon, variant = 'default', onClick, href }: StatsCardProps) {
  const colors = variantClasses[variant]
  
  const content = (
    <div className="flex items-center">
      <div className={`${colors.iconBg} ${colors.text} p-3 rounded-lg transition-colors`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-brand-secondary-text">{title}</p>
        <p className="text-2xl font-bold text-brand-primary-text">{value}</p>
        {change && (
          <p className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text mt-1">{change}</p>
        )}
      </div>
    </div>
  )

  const baseClasses = "bg-gray-900/5 border border-gray-700 rounded-lg p-6 shadow-sm transition-all duration-200"
  const interactiveClasses = onClick || href ? "hover:shadow-md hover:border-gray-400:border-gray-600 cursor-pointer transform hover:scale-[1.02]" : "hover:shadow-md"

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