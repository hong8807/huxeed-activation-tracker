import { createClient } from '@/lib/supabase/server'
import { formatKRW, formatPercent } from '@/utils/format'
import StrategyCard from '@/components/dashboard/StrategyCard'
import KPICard from '@/components/dashboard/KPICard'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all targets (sorted by TARGET 매출액 descending)
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .order('our_est_revenue_krw', { ascending: false, nullsLast: true })

  // Debug logging
  console.log('🔍 Dashboard Debug:')
  console.log('  Error:', error)
  console.log('  Data count:', targets?.length || 0)
  console.log('  First item:', targets?.[0])

  if (error) {
    console.error('❌ Error fetching targets:', error)
  }

  // Calculate KPIs
  const totalTargets = targets?.length || 0
  const completedTargets = targets?.filter(t => t.current_stage === 'WON').length || 0
  // stage_progress_rate는 10, 20... 형태로 저장되므로 100으로 나누어서 0-1 범위로 변환
  const avgProgress = (targets?.reduce((sum, t) => sum + (t.stage_progress_rate || 0), 0) / (totalTargets || 1) || 0) / 100

  // Target매출액 (모든 품목의 예상매출액 합)
  const targetRevenue = targets?.reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0) || 0

  // 예상 신규 매출액 (WON 단계 품목의 예상매출액 합)
  const achievedRevenue = targets?.filter(t => t.current_stage === 'WON')
    .reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0) || 0

  // 전략달성율 (%)
  const achievementRate = targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0

  // 백만원 단위 포맷 함수
  const formatMillionKRW = (value: number) => {
    const millions = value / 1_000_000
    return `${millions.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}백만원`
  }

  // Calculate strategy data directly (instead of API call)
  const STRATEGIES = {
    whiteSpace: ['cefaclor', 'rebamipide', 'clarithromycin'],
    erdosteine: ['erdosteine']
  }

  const wonTargets = targets?.filter(t => t.current_stage === 'WON') || []
  const allTargets = targets || []

  const strategyData = {
    whiteSpace: { targetRevenue: 0, achievedRevenue: 0, count: 0, wonCount: 0 },
    erdosteine: { targetRevenue: 0, achievedRevenue: 0, count: 0, wonCount: 0 },
    segmentSP: { targetRevenue: 0, achievedRevenue: 0, count: 0, wonCount: 0 }
  }

  // Calculate Target revenue (all targets) and Achieved revenue (WON only)
  allTargets.forEach(target => {
    const productName = (target.product_name || '').toLowerCase()
    const segment = target.segment || ''
    const revenue = target.our_est_revenue_krw || 0
    const isWon = target.current_stage === 'WON'

    // 1. White Space check (highest priority)
    if (STRATEGIES.whiteSpace.includes(productName)) {
      strategyData.whiteSpace.targetRevenue += revenue
      strategyData.whiteSpace.count += 1
      if (isWon) {
        strategyData.whiteSpace.achievedRevenue += revenue
        strategyData.whiteSpace.wonCount += 1
      }
    }
    // 2. Erdosteine check (second priority)
    else if (STRATEGIES.erdosteine.includes(productName)) {
      strategyData.erdosteine.targetRevenue += revenue
      strategyData.erdosteine.count += 1
      if (isWon) {
        strategyData.erdosteine.achievedRevenue += revenue
        strategyData.erdosteine.wonCount += 1
      }
    }
    // 3. S/P Segment check (third priority) - excluding strategy products
    else if (segment === 'S' || segment === 'P') {
      strategyData.segmentSP.targetRevenue += revenue
      strategyData.segmentSP.count += 1
      if (isWon) {
        strategyData.segmentSP.achievedRevenue += revenue
        strategyData.segmentSP.wonCount += 1
      }
    }
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">거래처별 신규 품목 활성화 현황</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="평균 진척률"
          value={avgProgress * 100}
          unit="%"
          icon="progress"
          color="primary"
        />
        <KPICard
          label="완료 건수"
          value={completedTargets}
          unit="건"
          icon="completed"
          color="success"
        />
        <KPICard
          label="매출목표"
          value={targetRevenue / 100000000}
          unit="억원"
          icon="revenue"
          color="secondary"
        />
        <KPICard
          label="전략 달성율"
          value={achievementRate}
          unit="%"
          icon="achievement"
          color="accent"
        />
      </div>

      {/* 3대 전략 대시보드 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3대 성장 전략</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StrategyCard
            title="White Space"
            subtitle="미개척 품목 진출"
            color="blue"
            targetRevenue={strategyData.whiteSpace.targetRevenue}
            achievedRevenue={strategyData.whiteSpace.achievedRevenue}
            count={strategyData.whiteSpace.count}
            wonCount={strategyData.whiteSpace.wonCount}
            products={['Cefaclor', 'Rebamipide', 'Clarithromycin']}
          />
          <StrategyCard
            title="Erdosteine"
            subtitle="기존 품목 확장"
            color="green"
            targetRevenue={strategyData.erdosteine.targetRevenue}
            achievedRevenue={strategyData.erdosteine.achievedRevenue}
            count={strategyData.erdosteine.count}
            wonCount={strategyData.erdosteine.wonCount}
            products={['Erdosteine']}
          />
          <StrategyCard
            title="S/P Segment"
            subtitle="프리미엄 거래처"
            color="purple"
            targetRevenue={strategyData.segmentSP.targetRevenue}
            achievedRevenue={strategyData.segmentSP.achievedRevenue}
            count={strategyData.segmentSP.count}
            wonCount={strategyData.segmentSP.wonCount}
          />
        </div>
      </div>

      {/* Targets Table */}
      <div className="bg-white dark:bg-background-dark rounded-xl border border-card-border dark:border-card-border-dark shadow-sm">
        <div className="px-6 py-4 border-b border-card-border dark:border-card-border-dark">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">거래처별 품목 현황</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              총 {targets?.length || 0}개 품목
            </span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/50 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  거래처
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  품목명
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  TARGET 매출
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  절감율
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  현재 단계
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border dark:divide-card-border-dark">
              {targets && targets.length > 0 ? (
                targets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {target.account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {target.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {target.owner_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary">
                      {formatMillionKRW(target.our_est_revenue_krw || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (target.saving_rate || 0) > 0.1
                          ? 'bg-primary-pale text-primary-dark'
                          : (target.saving_rate || 0) > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {formatPercent(target.saving_rate || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-accent/10 text-accent">
                        {target.current_stage || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    데이터가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug Info */}
      {error && (
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">⚠️ 데이터베이스 에러</h3>
          <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
