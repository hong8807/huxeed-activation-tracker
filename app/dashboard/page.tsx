import { formatPercent } from '@/utils/format'
import StrategyCard from '@/components/dashboard/StrategyCard'
import KPICard from '@/components/dashboard/KPICard'
import Link from 'next/link'
import { getTargets, getDashboardKPIs, getStrategyData } from '@/lib/server-data'

// 페이지 캐싱 설정 (30초마다 재검증)
export const revalidate = 30

export default async function DashboardPage() {
  // React.cache를 사용한 데이터 조회 (중복 요청 자동 제거)
  const [targets, kpis, strategyData] = await Promise.all([
    getTargets(),
    getDashboardKPIs(),
    getStrategyData(),
  ])

  // Debug logging
  console.log('🔍 Dashboard Debug (React.cache):')
  console.log('  Data count:', targets?.length || 0)

  const {
    totalTargets,
    completedTargets,
    avgProgress,
    targetRevenue,
    achievedRevenue,
    achievementRate,
  } = kpis

  // 백만원 단위 포맷 함수
  const formatMillionKRW = (value: number) => {
    const millions = value / 1_000_000
    return `${millions.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}백만원`
  }

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

      {/* v2.14: React.cache로 에러 처리 - throw on error */}
    </div>
  )
}
