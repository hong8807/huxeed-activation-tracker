interface StrategyCardProps {
  title: string
  subtitle: string
  color: 'blue' | 'green' | 'purple'
  targetRevenue: number      // Target 매출액 (전체)
  achievedRevenue: number    // 예상 매출액 (WON 단계)
  count: number              // 전체 품목 수
  wonCount: number           // WON 단계 품목 수
  products?: string[]
}

const colorClasses = {
  blue: {
    accentColor: 'border-l-[#95c11f]',
  },
  green: {
    accentColor: 'border-l-blue-500',
  },
  purple: {
    accentColor: 'border-l-purple-500',
  }
}

export default function StrategyCard({
  title,
  subtitle,
  color,
  targetRevenue,
  achievedRevenue,
  count,
  wonCount,
  products
}: StrategyCardProps) {
  const colors = colorClasses[color]

  const formatKRW = (amount: number) => {
    if (amount >= 100000000) {
      const billions = (amount / 100000000).toFixed(1)
      return `${billions}억원`
    } else if (amount >= 10000000) {
      const millions = Math.round(amount / 10000000)
      return `${millions}천만원`
    } else if (amount >= 10000) {
      const tenThousands = Math.round(amount / 10000)
      return `${tenThousands}만원`
    } else {
      return `${amount.toLocaleString()}원`
    }
  }

  // 달성율 계산
  const achievementRate = targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0

  // 아이콘 SVG 선택
  const getIcon = () => {
    if (color === 'blue') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )
    } else if (color === 'green') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      )
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="12" x2="12" y2="22.08"></line>
        </svg>
      )
    }
  }

  return (
    <div className={`group relative flex flex-col gap-5 rounded-xl p-6 bg-white dark:bg-background-dark border border-card-border dark:border-card-border-dark border-l-4 ${colors.accentColor} shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* 헤더: 아이콘 + 제목 + 부제목 */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      {/* Target 매출액 */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">매출목표</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatKRW(targetRevenue)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{count}건</p>
        </div>
      </div>

      {/* 예상 매출액 (WON 단계가 있을 때만 표시) */}
      {wonCount > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">달성 현황</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {formatKRW(achievedRevenue)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{wonCount}건</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                달성률
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {achievementRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
