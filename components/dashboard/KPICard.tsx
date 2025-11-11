'use client'

interface KPICardProps {
  label: string
  value: number
  unit: string
  icon: 'progress' | 'completed' | 'revenue' | 'achievement' | 'total'
  color: 'primary' | 'success' | 'secondary' | 'accent' | 'neutral'
}

const colorClasses = {
  primary: {
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
  },
  success: {
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
  },
  secondary: {
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
  },
  accent: {
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
  },
  neutral: {
    icon: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
  },
}

const IconComponent = ({ type, className }: { type: string; className: string }) => {
  switch (type) {
    case 'progress':
      // Line chart icon
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      )
    case 'completed':
      // Checkmark circle icon
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'revenue':
      // Currency icon
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'achievement':
      // Target icon
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0a9 9 0 100-18 9 9 0 000 18zm0-9a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      )
    case 'total':
      // Document list icon
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      )
    default:
      return null
  }
}

export default function KPICard({ label, value, unit, icon, color }: KPICardProps) {
  const colors = colorClasses[color]

  // Determine decimal places based on unit
  const decimalPlaces = unit === '%' ? 1 : 0

  return (
    <div className="group relative rounded-xl p-6 bg-white dark:bg-background-dark border border-card-border dark:border-card-border-dark shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-col items-center justify-center text-center gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
          <IconComponent type={icon} className={`w-6 h-6 ${colors.icon}`} />
        </div>

        {/* Content */}
        <div className="w-full">
          {/* Label */}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide whitespace-nowrap">
            {label}
          </p>

          {/* Value */}
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-2xl font-bold ${colors.value} tracking-tight`}>
              {value.toLocaleString('ko-KR', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
              })}
            </span>
            <span className={`text-lg font-semibold ${colors.value}`}>
              {unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
