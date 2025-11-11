'use client'

import { useEffect, useState, useRef } from 'react'
import { formatKRW } from '@/utils/format'
import KPICard from '@/components/dashboard/KPICard'

interface KPIs {
  totalTargets: number
  avgProgress: number
  completedTargets: number
  targetRevenue: number
  achievedRevenue: number
  achievementRate: number
}

interface StageFunnelItem {
  stage: string
  label: string
  count: number
}

interface AccountProgressItem {
  account: string
  avgProgress: number
  count: number
}

interface TargetTimelineItem {
  id: string
  account: string
  product: string
  stage: string
  stageLabel: string
  progress: number
  savingRate: number
  totalSaving: number
  revenue: number
  owner: string
  updatedAt: string
}

interface OwnerDistribution {
  owner: string
  count: number
}

interface SourcingSupplierStatusItem {
  id: string
  productName: string
  supplierCount: number
  dmfStatus: string
  linkageStatus: string
}

interface VisualizationData {
  kpis: KPIs
  stageFunnel: StageFunnelItem[]
  accountProgress: AccountProgressItem[]
  targetTimeline: TargetTimelineItem[]
  ownerDistribution: OwnerDistribution[]
  sourcingSupplierStatus: SourcingSupplierStatusItem[]
  generatedAt: string
}

const STAGE_COLORS: Record<string, string> = {
  SOURCING_REQUEST: '#60a5fa',
  QUOTE_SENT: '#34d399',
  SAMPLE_SHIPPED: '#fbbf24',
  QUALIFICATION: '#a78bfa',
  DMF_RA_REVIEW: '#f87171',
  PRICE_AGREED: '#38bdf8',
  TRIAL_PO: '#fb923c',
  REGISTRATION: '#c084fc',
  COMMERCIAL_PO: '#4ade80',
  WON: '#22c55e',
  LOST: '#ef4444',
  ON_HOLD: '#94a3b8',
}

// Format revenue in millions with comma separator
function formatRevenueMillion(revenue: number): string {
  if (!revenue || revenue === 0) return ''
  const millions = revenue / 1000000
  // Always show without decimals
  return Math.round(millions).toLocaleString('ko-KR') + '백만원'
}

export default function VisualizationReport() {
  const [data, setData] = useState<VisualizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOwner, setSelectedOwner] = useState<string>('전체')
  const kpiRef = useRef<SVGSVGElement>(null)
  const funnelRef = useRef<SVGSVGElement>(null)
  const accountRef = useRef<SVGSVGElement>(null)
  const ganttRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visualization-data')
        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching visualization data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter data by selected owner
  const filteredData = data ? {
    ...data,
    targetTimeline: selectedOwner === '전체'
      ? data.targetTimeline
      : data.targetTimeline.filter(t => t.owner === selectedOwner),
  } : null

  // Recalculate KPIs based on filtered data
  const filteredKPIs = filteredData ? {
    totalTargets: filteredData.targetTimeline.length,
    avgProgress: filteredData.targetTimeline.length > 0
      ? filteredData.targetTimeline.reduce((sum, t) => sum + t.progress, 0) / filteredData.targetTimeline.length
      : 0,
    completedTargets: filteredData.targetTimeline.filter(t => t.stage === 'WON').length,
    targetRevenue: filteredData.targetTimeline.reduce((sum, t) => sum + t.revenue, 0),
    achievedRevenue: filteredData.targetTimeline.filter(t => t.stage === 'WON').reduce((sum, t) => sum + t.revenue, 0),
    achievementRate: filteredData.targetTimeline.reduce((sum, t) => sum + t.revenue, 0) > 0
      ? (filteredData.targetTimeline.filter(t => t.stage === 'WON').reduce((sum, t) => sum + t.revenue, 0) /
         filteredData.targetTimeline.reduce((sum, t) => sum + t.revenue, 0)) * 100
      : 0,
  } : data?.kpis || { totalTargets: 0, avgProgress: 0, completedTargets: 0, targetRevenue: 0, achievedRevenue: 0, achievementRate: 0 }

  // Recalculate stage funnel based on filtered data
  const filteredStageFunnel = filteredData && data ?
    data.stageFunnel.map(stage => ({
      ...stage,
      count: filteredData.targetTimeline.filter(t => t.stage === stage.stage).length,
    }))
    : data?.stageFunnel || []

  // Recalculate account progress based on filtered data
  const filteredAccountProgress = filteredData ? (() => {
    const accountMap = new Map<string, { count: number; totalProgress: number }>()
    filteredData.targetTimeline.forEach(t => {
      const account = t.account || 'Unknown'
      const existing = accountMap.get(account) || { count: 0, totalProgress: 0 }
      accountMap.set(account, {
        count: existing.count + 1,
        totalProgress: existing.totalProgress + t.progress,
      })
    })
    return Array.from(accountMap.entries())
      .map(([account, data]) => ({
        account,
        avgProgress: data.totalProgress / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.avgProgress - a.avgProgress)
      .slice(0, 10)
  })() : data?.accountProgress || []

  const downloadSVG = (svgElement: SVGSVGElement | null, filename: string) => {
    if (!svgElement) {
      console.error('SVG element is null')
      alert('SVG 요소를 찾을 수 없습니다.')
      return
    }

    const ownerSuffix = selectedOwner !== '전체' ? `-${selectedOwner}` : ''
    const date = new Date().toISOString().split('T')[0]

    // Get the width and height from the SVG element
    const width = svgElement.getAttribute('width') || '960'
    const height = svgElement.getAttribute('height') || '600'
    const viewBox = svgElement.getAttribute('viewBox') || `0 0 ${width} ${height}`

    // Extract inner content (same method as downloadFullReportSVG)
    const innerContent = svgElement.innerHTML

    // Create a clean SVG wrapper (no hidden styles)
    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif;">
${innerContent}
</svg>`

    console.log('SVG Data length:', svgString.length)
    console.log('SVG Data preview:', svgString.substring(0, 500))

    // Create blob
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    console.log('Blob size:', blob.size)

    // Download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}${ownerSuffix}-${date}.svg`
    link.click()
    URL.revokeObjectURL(url)

    console.log(`Downloaded: ${link.download}`)
  }

  const downloadFullReportSVG = () => {
    // Combine all chart SVGs into one large SVG matching the web layout exactly
    if (!kpiRef.current || !funnelRef.current || !accountRef.current || !ganttRef.current) {
      alert('차트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const ownerSuffix = selectedOwner !== '전체' ? `-${selectedOwner}` : ''
    const date = new Date().toISOString().split('T')[0]

    // A4 Landscape size: 297mm × 210mm at 96 DPI = 1123px × 794px
    const width = 1123
    const height = 794
    const padding = 30
    const titleHeight = 60
    const kpiHeight = 120
    const gridRowHeight = 280
    const ganttHeight = 260
    const spacing = 20

    const combinedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}px" height="${height}px" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif; background: #f9fafb;">

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#f9fafb"/>

  <!-- Header Section -->
  <text x="${width / 2}" y="30" font-size="20" font-weight="bold" text-anchor="middle" fill="#111827">
    전략 품목 진행 현황 리포트
  </text>
  <text x="${width / 2}" y="48" font-size="10" text-anchor="middle" fill="#6b7280">
    생성일시: ${new Date().toLocaleString('ko-KR')}${ownerSuffix !== '' ? ' | 담당자: ' + selectedOwner : ' | 전체 담당자'}
  </text>

  <!-- KPI Cards Section -->
  <g transform="translate(${padding}, ${titleHeight})">
    <rect width="${width - padding * 2}" height="${kpiHeight}" rx="4" fill="white" filter="url(#shadow)"/>
    <text x="10" y="18" font-size="12" font-weight="bold" fill="#111827">핵심 성과 지표 (KPI)</text>
    <g transform="scale(${(width - padding * 2) / 1920}, ${kpiHeight / 200}) translate(0, 0)">
      ${kpiRef.current.innerHTML}
    </g>
  </g>

  <!-- Grid Section: Funnel and Account Progress -->
  <g transform="translate(${padding}, ${titleHeight + kpiHeight + spacing})">
    <!-- Stage Funnel -->
    <rect width="${(width - padding * 2 - spacing) / 2}" height="${gridRowHeight}" rx="4" fill="white" filter="url(#shadow)"/>
    <text x="10" y="18" font-size="12" font-weight="bold" fill="#111827">단계별 전환율</text>
    <g transform="scale(${((width - padding * 2 - spacing) / 2) / 960}, ${gridRowHeight / 600}) translate(0, -10)">
      ${funnelRef.current.innerHTML}
    </g>

    <!-- Sourcing Supplier Status -->
    <g transform="translate(${(width - padding * 2 - spacing) / 2 + spacing}, 0)">
      <rect width="${(width - padding * 2 - spacing) / 2}" height="${gridRowHeight}" rx="4" fill="white" filter="url(#shadow)"/>
      <text x="10" y="18" font-size="12" font-weight="bold" fill="#111827">소싱요청 제조원 등록 현황</text>
      <g transform="scale(${((width - padding * 2 - spacing) / 2) / 960}, ${gridRowHeight / 600}) translate(0, -10)">
        ${accountRef.current.innerHTML}
      </g>
    </g>
  </g>

  <!-- Gantt Chart Section -->
  <g transform="translate(${padding}, ${titleHeight + kpiHeight + spacing + gridRowHeight + spacing})">
    <rect width="${width - padding * 2}" height="${ganttHeight}" rx="4" fill="white" filter="url(#shadow)"/>
    <text x="10" y="18" font-size="12" font-weight="bold" fill="#111827">전체 품목 타임라인</text>
    <g transform="scale(${(width - padding * 2) / 1920}, ${ganttHeight / 500}) translate(0, -10)">
      ${ganttRef.current.innerHTML}
    </g>
  </g>

  <!-- Shadow Filter -->
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="1" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.1"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>`

    const blob = new Blob([combinedSVG], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `전략품목-전체리포트-A4${ownerSuffix}-${date}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">리포트 생성 중...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-gray-900">전략 품목 진행 현황 리포트</h1>
            <p className="text-sm text-gray-500">
              생성일시: {new Date(data.generatedAt).toLocaleString('ko-KR')}
            </p>
          </div>

          {/* Filter and Download Button */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400 hidden sm:block">
              차트 우측 상단 버튼을 통해 SVG 다운로드가 가능합니다.
            </p>
            {/* Owner Filter */}
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="전체">전체 담당자</option>
              {data.ownerDistribution.map(({ owner }) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            {/* Full Report SVG Download Button */}
            <button
              onClick={downloadFullReportSVG}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              전체 리포트 다운로드
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">핵심 성과 지표 (KPI)</h2>
            <button
              onClick={() => downloadSVG(kpiRef.current, 'kpi-cards')}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              title="SVG 다운로드"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              label="평균 진척률"
              value={filteredKPIs.avgProgress}
              unit="%"
              icon="progress"
              color="primary"
            />
            <KPICard
              label="완료 건수"
              value={filteredKPIs.completedTargets}
              unit="건"
              icon="completed"
              color="success"
            />
            <KPICard
              label="전체 품목"
              value={filteredKPIs.totalTargets}
              unit="건"
              icon="total"
              color="neutral"
            />
            <KPICard
              label="매출목표"
              value={Math.round(filteredKPIs.targetRevenue / 100000000)}
              unit="억원"
              icon="revenue"
              color="secondary"
            />
            <KPICard
              label="전략 달성율"
              value={filteredKPIs.achievementRate}
              unit="%"
              icon="achievement"
              color="accent"
            />
          </div>
          {/* Hidden SVG for download */}
          <svg
            ref={kpiRef}
            width="1920"
            height="180"
            viewBox="0 0 1920 180"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none', fontFamily: 'Arial, sans-serif' }}
          >
            <rect width="1920" height="180" fill="#ffffff" />
            <KPICards data={filteredKPIs} />
          </svg>
        </div>

        {/* Stage Funnel and Account Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage Funnel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">단계별 전환율</h2>
              <button
                onClick={() => downloadSVG(funnelRef.current, 'stage-funnel')}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                title="SVG 다운로드"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="w-full max-w-full space-y-1.5">
                {filteredStageFunnel.map((item) => {
                  // Get stage color from STAGE_COLORS
                  const stageColor = STAGE_COLORS[item.stage] || '#6b7280'

                  // If count is 0, use light gray background
                  if (item.count === 0) {
                    return (
                      <div key={item.stage} className="flex items-center justify-between p-2.5 rounded-md bg-gray-200 text-gray-400">
                        <span className="font-medium text-sm truncate">{item.label}</span>
                        <span className="text-sm font-mono ml-2 flex-shrink-0">{item.count}개</span>
                      </div>
                    )
                  }

                  // If count > 0, use stage's unique color
                  return (
                    <div
                      key={item.stage}
                      className="flex items-center justify-between p-2.5 rounded-md text-white"
                      style={{ backgroundColor: stageColor }}
                    >
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      <span className="text-sm font-mono ml-2 flex-shrink-0">{item.count}개</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Hidden SVG for download */}
            <svg
              ref={funnelRef}
              width="960"
              height="850"
              viewBox="0 0 960 850"
              xmlns="http://www.w3.org/2000/svg"
              style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none', fontFamily: 'Arial, sans-serif' }}
            >
              <rect width="960" height="850" fill="#ffffff" />
              <StageFunnelSVG data={filteredStageFunnel} />
            </svg>
          </div>

          {/* Sourcing Supplier Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">소싱요청 제조원 등록 현황</h2>
              <button
                onClick={() => downloadSVG(accountRef.current, 'sourcing-supplier-status')}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                title="SVG 다운로드"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="w-full max-w-full space-y-2">
                {filteredData?.sourcingSupplierStatus && filteredData.sourcingSupplierStatus.length > 0 ? (
                  <>
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-200 text-xs text-gray-500 font-medium">
                      <div className="col-span-4">품목명</div>
                      <div className="col-span-3 text-center">제조원 등록</div>
                      <div className="col-span-3 text-center">DMF 등록현황</div>
                      <div className="col-span-2 text-center">연계심사 완료</div>
                    </div>

                    {/* Table Rows */}
                    {filteredData.sourcingSupplierStatus.slice(0, 8).map((item) => {
                      return (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-2 text-sm hover:bg-gray-50 rounded">
                          <div className="col-span-4 truncate font-medium text-gray-800" title={item.productName}>
                            {item.productName}
                          </div>
                          <div className="col-span-3 flex items-center justify-center gap-1">
                            {item.supplierCount === 0 ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                미등록
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(item.supplierCount, 5) }).map((_, i) => (
                                  <div key={i} className="w-2 h-2 rounded-full bg-green-500"></div>
                                ))}
                                <span className="ml-1 text-green-700 font-bold text-sm">
                                  {item.supplierCount}개
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="col-span-3 flex items-center justify-center">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {item.dmfStatus}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {item.linkageStatus}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    소싱 관련 품목이 없습니다
                  </div>
                )}
              </div>
            </div>
            {/* Hidden SVG for download */}
            <svg
              ref={accountRef}
              width="960"
              height="600"
              viewBox="0 0 960 600"
              xmlns="http://www.w3.org/2000/svg"
              style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none', fontFamily: 'Arial, sans-serif' }}
            >
              <rect width="960" height="600" fill="#ffffff" />
              <SourcingSupplierStatusSVG data={filteredData?.sourcingSupplierStatus || []} />
            </svg>
          </div>
        </div>

        {/* Gantt Chart Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">전체 품목 타임라인</h2>
            <button
              onClick={() => downloadSVG(ganttRef.current, 'gantt-chart')}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              title="SVG 다운로드"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4 overflow-x-auto">
            <div className="w-full min-w-[1000px]">
              {/* Gantt Chart Header - Fixed */}
              <div className="flex gap-2 items-center py-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                {/* Left Info Columns */}
                <div className="flex gap-2 text-xs text-gray-500 font-medium">
                  <div className="w-16 flex-shrink-0">담당자</div>
                  <div className="w-20 flex-shrink-0">거래처</div>
                  <div className="w-28 flex-shrink-0">품목</div>
                  <div className="w-20 flex-shrink-0 text-center">시작일</div>
                  <div className="w-20 flex-shrink-0 text-center">완료일</div>
                </div>

                {/* Right Stage Columns */}
                <div className="flex-1 grid grid-cols-9 gap-1 text-xs font-medium">
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#60a5fa' }}>소싱<br/>요청</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#34d399' }}>견적<br/>발송</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#fbbf24' }}>샘플<br/>배송</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#a78bfa' }}>품질<br/>테스트</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#38bdf8' }}>가격<br/>합의</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#fb923c' }}>시험<br/>PO</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#c084fc' }}>완제<br/>심사</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#4ade80' }}>상업<br/>PO</div>
                  <div className="text-center py-1 rounded text-white" style={{ backgroundColor: '#22c55e' }}>완료</div>
                </div>
              </div>

              {/* Gantt Chart Rows - Scrollable */}
              <div className="max-h-[600px] overflow-y-auto space-y-2 pt-2">
                {filteredData?.targetTimeline
                  .sort((a, b) => {
                    // WON 단계를 먼저 표시
                    if (a.stage === 'WON' && b.stage !== 'WON') return -1
                    if (a.stage !== 'WON' && b.stage === 'WON') return 1
                    // 그 다음 진행률 높은 순
                    return b.progress - a.progress
                  })
                  .map((item) => {
                const stageColor = STAGE_COLORS[item.stage] || '#6b7280'
                const completionDate = item.stage === 'WON' && item.updatedAt
                  ? new Date(item.updatedAt).toISOString().split('T')[0]
                  : '-'

                // Define stage order for gantt chart
                const ganttStages = [
                  'SOURCING_REQUEST',
                  'QUOTE_SENT',
                  'SAMPLE_SHIPPED',
                  'QUALIFICATION',
                  'PRICE_AGREED',
                  'TRIAL_PO',
                  'REGISTRATION',
                  'COMMERCIAL_PO',
                  'WON'
                ]

                return (
                  <div key={item.id} className="flex gap-2 items-center py-2 text-xs text-gray-800">
                    {/* Left Info Columns */}
                    <div className="flex gap-2">
                      <div className="w-16 flex-shrink-0 truncate" title={item.owner}>{item.owner}</div>
                      <div className="w-20 flex-shrink-0 truncate" title={item.account}>{item.account}</div>
                      <div className="w-28 flex-shrink-0 truncate font-medium" title={item.product}>{item.product}</div>
                      <div className="w-20 flex-shrink-0 text-center">
                        {item.updatedAt ? new Date(item.updatedAt).toISOString().split('T')[0].slice(5) : '-'}
                      </div>
                      <div className="w-20 flex-shrink-0 text-center font-medium">
                        {completionDate !== '-' ? completionDate.slice(5) : '-'}
                      </div>
                    </div>

                    {/* Right Stage Columns - Gantt Chart */}
                    <div className="flex-1 relative h-6 flex items-center">
                      {/* Background grid lines */}
                      <div className="absolute inset-0 grid grid-cols-9">
                        {ganttStages.map((stage) => (
                          <div key={stage} className="border-r border-gray-200 last:border-r-0"></div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="relative w-full h-4 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded flex items-center justify-end pr-2 transition-all duration-300"
                          style={{
                            width: `${((ganttStages.indexOf(item.stage) + 1) / ganttStages.length) * 100}%`,
                            background: `linear-gradient(90deg, ${stageColor}dd, ${stageColor})`
                          }}
                        >
                          <span className="text-white font-bold text-xs drop-shadow">{item.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </div>
          {/* Hidden SVG for download */}
          <svg
            ref={ganttRef}
            width="1920"
            height="500"
            viewBox="0 0 1920 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', pointerEvents: 'none', fontFamily: 'Arial, sans-serif' }}
          >
            <rect width="1920" height="500" fill="#ffffff" />
            <GanttChartSVG data={filteredData?.targetTimeline || []} />
          </svg>
        </div>
      </div>
    </div>
  )
}

// KPI Cards Component - Modern Design
function KPICards({ data }: { data: KPIs }) {
  // 백만원 단위 포맷 함수
  const formatMillionKRW = (value: number) => {
    const millions = value / 1_000_000
    return `${millions.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}백만원`
  }

  const cards = [
    { label: '평균 진척률', value: `${data.avgProgress.toFixed(1)}%`, color: '#95C11F' },
    { label: '완료(WON) 건수', value: `${data.completedTargets}건`, color: '#10b981' },
    { label: '전체 품목', value: `${data.totalTargets}건`, color: '#6B7280' },
    { label: 'Target매출액', value: formatMillionKRW(data.targetRevenue), color: '#7E3AF2' },
    { label: '전략달성율', value: `${data.achievementRate.toFixed(1)}%`, color: '#3B82F6' },
  ]

  const cardWidth = 320
  const cardSpacing = 30
  const totalWidth = cardWidth * 5 + cardSpacing * 4
  const offsetX = (1920 - totalWidth) / 2

  return (
    <g>
      <g transform="translate(0, 50)">
        {cards.map((card, index) => (
          <g key={index} transform={`translate(${offsetX + index * (cardWidth + cardSpacing)}, 0)`}>
            {/* Card background - gray */}
            <rect
              width={cardWidth}
              height="90"
              rx="8"
              fill="#F9FAFB"
              stroke="#E5E7EB"
              strokeWidth="1"
            />

            {/* Label */}
            <text
              x={cardWidth / 2}
              y="32"
              fontSize="14"
              fontWeight="600"
              textAnchor="middle"
              fill="#6b7280"
            >
              {card.label}
            </text>

            {/* Value */}
            <text
              x={cardWidth / 2}
              y="68"
              fontSize="28"
              fontWeight="bold"
              textAnchor="middle"
              fill={card.color}
            >
              {card.value}
            </text>
          </g>
        ))}
      </g>
    </g>
  )
}

// Stage Funnel Component
function StageFunnel({ data }: { data: StageFunnelItem[] }) {
  const maxCount = Math.max(...data.map(d => d.count))
  const startY = 220
  const startX = 80
  const funnelWidth = 700
  const barHeight = 32
  const barSpacing = 6

  return (
    <g transform={`translate(${startX}, 0)`}>
      <text x="0" y={startY} fontSize="22" fontWeight="bold" fill="#1f2937">
        단계별 진행 퍼널
      </text>

      {data.map((item, index) => {
        const barY = startY + 40 + index * (barHeight + barSpacing)
        const barWidth = maxCount > 0 ? (item.count / maxCount) * funnelWidth : 0
        const color = STAGE_COLORS[item.stage] || '#6b7280'

        return (
          <g key={item.stage}>
            {/* Bar */}
            <rect x="0" y={barY} width={barWidth} height={barHeight} fill={color} fillOpacity="0.8" rx="4" />

            {/* Label */}
            <text x="10" y={barY + 21} fontSize="13" fontWeight="600" fill="#ffffff">
              {item.label}
            </text>

            {/* Count */}
            <text x={barWidth + 10} y={barY + 21} fontSize="15" fontWeight="bold" fill={color}>
              {item.count}개
            </text>
          </g>
        )
      })}
    </g>
  )
}

// Account Progress Component
function AccountProgress({ data }: { data: AccountProgressItem[] }) {
  const startY = 220
  const startX = 1000
  const maxWidth = 820
  const barHeight = 32
  const barSpacing = 6

  return (
    <g transform={`translate(${startX}, 0)`}>
      <text x="0" y={startY} fontSize="22" fontWeight="bold" fill="#1f2937">
        거래처별 진행률 Top 10
      </text>

      {data.slice(0, 10).map((item, index) => {
        const barY = startY + 40 + index * (barHeight + barSpacing)
        const barWidth = (item.avgProgress / 100) * maxWidth
        const color = item.avgProgress > 70 ? '#10b981' : item.avgProgress > 40 ? '#3b82f6' : '#f59e0b'

        return (
          <g key={item.account}>
            {/* Background */}
            <rect x="0" y={barY} width={maxWidth} height={barHeight} fill="#f3f4f6" rx="4" />

            {/* Progress Bar */}
            <rect x="0" y={barY} width={barWidth} height={barHeight} fill={color} fillOpacity="0.8" rx="4" />

            {/* Account Name */}
            <text x="10" y={barY + 21} fontSize="13" fontWeight="600" fill="#1f2937">
              {item.account.length > 25 ? item.account.substring(0, 25) + '...' : item.account}
            </text>

            {/* Progress Value */}
            <text x={maxWidth - 10} y={barY + 21} fontSize="13" fontWeight="bold" fill={color} textAnchor="end">
              {item.avgProgress.toFixed(1)}%
            </text>
          </g>
        )
      })}
    </g>
  )
}

// Separate SVG Components for Individual Downloads

// Stage Funnel SVG (960x600) - Updated to match HTML/CSS UI with conditional colors
function StageFunnelSVG({ data }: { data: StageFunnelItem[] }) {
  const width = 960
  const height = 600
  const startY = 90
  const startX = 60
  const barWidth = 800
  const barHeight = 42
  const barSpacing = 8

  return (
    <g>
      <text x={width / 2} y="40" fontSize="24" fontWeight="bold" fill="#1f2937" textAnchor="middle">
        단계별 전환율
      </text>

      <g transform={`translate(${startX}, ${startY})`}>
        {data.map((item, index) => {
          const barY = index * (barHeight + barSpacing)
          const stageColor = STAGE_COLORS[item.stage] || '#6b7280'

          // If count is 0, use gray background; otherwise use stage color
          const bgColor = item.count === 0 ? '#E5E7EB' : stageColor
          const textColor = item.count === 0 ? '#9CA3AF' : '#ffffff'

          return (
            <g key={item.stage}>
              {/* Bar */}
              <rect x="0" y={barY} width={barWidth} height={barHeight} fill={bgColor} fillOpacity="0.9" rx="6" />

              {/* Label */}
              <text x="15" y={barY + 27} fontSize="15" fontWeight="600" fill={textColor}>
                {item.label}
              </text>

              {/* Count */}
              <text x={barWidth - 15} y={barY + 27} fontSize="16" fontWeight="bold" fill={textColor} textAnchor="end">
                {item.count}개
              </text>
            </g>
          )
        })}
      </g>
    </g>
  )
}

// Sourcing Supplier Status SVG (960x600) - Updated to match HTML/CSS UI
function SourcingSupplierStatusSVG({ data }: { data: SourcingSupplierStatusItem[] }) {
  const width = 960
  const height = 600
  const startY = 90
  const startX = 60
  const rowHeight = 48
  const colWidths = [280, 200, 200, 140] // 품목명, 제조원등록, DMF등록현황, 연계심사완료

  return (
    <g>
      <text x={width / 2} y="40" fontSize="24" fontWeight="bold" fill="#1f2937" textAnchor="middle">
        소싱요청 제조원 등록 현황
      </text>

      <g transform={`translate(${startX}, ${startY})`}>
        {/* Table Header */}
        <g>
          <rect x="0" y="0" width={colWidths[0]} height="36" fill="#f9fafb" />
          <rect x={colWidths[0]} y="0" width={colWidths[1]} height="36" fill="#f9fafb" />
          <rect x={colWidths[0] + colWidths[1]} y="0" width={colWidths[2]} height="36" fill="#f9fafb" />
          <rect x={colWidths[0] + colWidths[1] + colWidths[2]} y="0" width={colWidths[3]} height="36" fill="#f9fafb" />

          <text x="15" y="22" fontSize="13" fontWeight="600" fill="#6b7280">품목명</text>
          <text x={colWidths[0] + colWidths[1] / 2} y="22" fontSize="13" fontWeight="600" fill="#6b7280" textAnchor="middle">제조원 등록</text>
          <text x={colWidths[0] + colWidths[1] + colWidths[2] / 2} y="22" fontSize="13" fontWeight="600" fill="#6b7280" textAnchor="middle">DMF 등록현황</text>
          <text x={colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2} y="22" fontSize="13" fontWeight="600" fill="#6b7280" textAnchor="middle">연계심사 완료</text>

          <line x1="0" y1="36" x2={colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]} y2="36" stroke="#e5e7eb" strokeWidth="1" />
        </g>

        {/* Table Rows */}
        {data.slice(0, 8).map((item, index) => {
          const rowY = 40 + index * rowHeight

          return (
            <g key={item.id}>
              {/* Alternating row background */}
              {index % 2 === 0 && (
                <rect x="0" y={rowY} width={colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]} height={rowHeight} fill="#fafafa" />
              )}

              {/* Product Name */}
              <text x="15" y={rowY + 28} fontSize="14" fontWeight="600" fill="#1f2937">
                {item.productName.length > 22 ? item.productName.substring(0, 22) + '...' : item.productName}
              </text>

              {/* Supplier Count */}
              {item.supplierCount === 0 ? (
                <g transform={`translate(${colWidths[0] + colWidths[1] / 2 - 40}, ${rowY + 10})`}>
                  <rect x="0" y="0" width="80" height="28" rx="14" fill="#fef2f2" />
                  <circle cx="15" cy="14" r="6" fill="#ef4444" />
                  <line x1="12" y1="11" x2="18" y2="17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18" y1="11" x2="12" y2="17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <text x="25" y="18" fontSize="11" fontWeight="600" fill="#991b1b">미등록</text>
                </g>
              ) : (
                <g transform={`translate(${colWidths[0] + colWidths[1] / 2 - 40}, ${rowY + 18})`}>
                  {Array.from({ length: Math.min(item.supplierCount, 5) }).map((_, i) => (
                    <circle key={i} cx={i * 16} cy="6" r="4" fill="#10b981" />
                  ))}
                  <text x={Math.min(item.supplierCount, 5) * 16 + 8} y="10" fontSize="13" fontWeight="700" fill="#059669">
                    {item.supplierCount}개
                  </text>
                </g>
              )}

              {/* DMF Status */}
              <rect
                x={colWidths[0] + colWidths[1] + (colWidths[2] - 80) / 2}
                y={rowY + 10}
                width="80"
                height="28"
                rx="14"
                fill="#dbeafe"
              />
              <text
                x={colWidths[0] + colWidths[1] + colWidths[2] / 2}
                y={rowY + 28}
                fontSize="12"
                fontWeight="600"
                fill="#1e40af"
                textAnchor="middle"
              >
                {item.dmfStatus}
              </text>

              {/* Linkage Status */}
              <rect
                x={colWidths[0] + colWidths[1] + colWidths[2] + (colWidths[3] - 80) / 2}
                y={rowY + 10}
                width="80"
                height="28"
                rx="14"
                fill="#e9d5ff"
              />
              <text
                x={colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2}
                y={rowY + 28}
                fontSize="12"
                fontWeight="600"
                fill="#6b21a8"
                textAnchor="middle"
              >
                {item.linkageStatus}
              </text>
            </g>
          )
        })}
      </g>
    </g>
  )
}

// Gantt Chart SVG (1920x500) - Updated to match HTML/CSS UI with continuous gradient bars
function GanttChartSVG({ data }: { data: TargetTimelineItem[] }) {
  const width = 1920
  const height = 500
  const startY = 60
  const startX = 40
  const rowHeight = 38
  const maxRows = 8

  // Column widths for left info section
  const ownerWidth = 100
  const accountWidth = 120
  const productWidth = 180
  const startDateWidth = 80
  const endDateWidth = 80
  const infoWidth = ownerWidth + accountWidth + productWidth + startDateWidth + endDateWidth + 40

  const chartWidth = width - startX - infoWidth - 40

  // Define stages for gantt chart
  const ganttStages = [
    'SOURCING_REQUEST',
    'QUOTE_SENT',
    'SAMPLE_SHIPPED',
    'QUALIFICATION',
    'PRICE_AGREED',
    'TRIAL_PO',
    'REGISTRATION',
    'COMMERCIAL_PO',
    'WON'
  ]

  const stageLabels: Record<string, string> = {
    'SOURCING_REQUEST': '소싱\n요청',
    'QUOTE_SENT': '견적\n발송',
    'SAMPLE_SHIPPED': '샘플\n배송',
    'QUALIFICATION': '품질\n테스트',
    'PRICE_AGREED': '가격\n합의',
    'TRIAL_PO': '시험\nPO',
    'REGISTRATION': '완제\n심사',
    'COMMERCIAL_PO': '상업\nPO',
    'WON': '완료'
  }

  const stageWidth = chartWidth / ganttStages.length

  return (
    <g>
      {/* Title */}
      <text x={width / 2} y="40" fontSize="24" fontWeight="bold" fill="#1f2937" textAnchor="middle">
        전체 품목 타임라인
      </text>

      <g transform={`translate(${startX}, ${startY})`}>
        {/* Header Row */}
        <g>
          {/* Left Info Column Headers */}
          <rect x="0" y="0" width={infoWidth} height="40" fill="#f9fafb" />
          <text x="10" y="25" fontSize="12" fontWeight="600" fill="#6b7280">담당자</text>
          <text x={ownerWidth + 10} y="25" fontSize="12" fontWeight="600" fill="#6b7280">거래처</text>
          <text x={ownerWidth + accountWidth + 10} y="25" fontSize="12" fontWeight="600" fill="#6b7280">품목</text>
          <text x={ownerWidth + accountWidth + productWidth + startDateWidth / 2} y="25" fontSize="12" fontWeight="600" fill="#6b7280" textAnchor="middle">시작일</text>
          <text x={ownerWidth + accountWidth + productWidth + startDateWidth + endDateWidth / 2} y="25" fontSize="12" fontWeight="600" fill="#6b7280" textAnchor="middle">완료일</text>

          {/* Right Stage Column Headers */}
          {ganttStages.map((stage, index) => {
            const x = infoWidth + index * stageWidth
            const color = STAGE_COLORS[stage] || '#6b7280'
            const [line1, line2] = stageLabels[stage].split('\n')

            return (
              <g key={stage}>
                <rect x={x} y="0" width={stageWidth} height="40" fill={color} />
                <text x={x + stageWidth / 2} y="18" fontSize="11" fontWeight="600" fill="#ffffff" textAnchor="middle">
                  {line1}
                </text>
                <text x={x + stageWidth / 2} y="32" fontSize="11" fontWeight="600" fill="#ffffff" textAnchor="middle">
                  {line2}
                </text>
              </g>
            )
          })}

          <line x1="0" y1="40" x2={infoWidth + chartWidth} y2="40" stroke="#e5e7eb" strokeWidth="2" />
        </g>

        {/* Data Rows */}
        {data.slice(0, maxRows).map((item, index) => {
          const rowY = 44 + index * rowHeight
          const stageColor = STAGE_COLORS[item.stage] || '#6b7280'
          const completionDate = item.stage === 'WON' && item.updatedAt
            ? new Date(item.updatedAt).toISOString().split('T')[0].slice(5)
            : '-'
          const startDate = item.updatedAt
            ? new Date(item.updatedAt).toISOString().split('T')[0].slice(5)
            : '-'

          const progressWidth = ((ganttStages.indexOf(item.stage) + 1) / ganttStages.length) * chartWidth

          return (
            <g key={item.id}>
              {/* Alternating row background */}
              {index % 2 === 1 && (
                <rect x="0" y={rowY} width={infoWidth + chartWidth} height={rowHeight} fill="#fafafa" />
              )}

              {/* Left Info Columns */}
              <text x="10" y={rowY + 22} fontSize="11" fill="#1f2937">
                {item.owner.length > 8 ? item.owner.substring(0, 8) + '...' : item.owner}
              </text>
              <text x={ownerWidth + 10} y={rowY + 22} fontSize="11" fill="#1f2937">
                {item.account.length > 10 ? item.account.substring(0, 10) + '...' : item.account}
              </text>
              <text x={ownerWidth + accountWidth + 10} y={rowY + 22} fontSize="11" fontWeight="600" fill="#1f2937">
                {item.product.length > 16 ? item.product.substring(0, 16) + '...' : item.product}
              </text>
              <text x={ownerWidth + accountWidth + productWidth + startDateWidth / 2} y={rowY + 22} fontSize="11" fill="#1f2937" textAnchor="middle">
                {startDate}
              </text>
              <text x={ownerWidth + accountWidth + productWidth + startDateWidth + endDateWidth / 2} y={rowY + 22} fontSize="11" fontWeight="600" fill="#1f2937" textAnchor="middle">
                {completionDate}
              </text>

              {/* Right Gantt Chart Section */}
              <g transform={`translate(${infoWidth}, 0)`}>
                {/* Background grid lines */}
                {ganttStages.map((stage, i) => (
                  <line
                    key={stage}
                    x1={i * stageWidth}
                    y1={rowY}
                    x2={i * stageWidth}
                    y2={rowY + rowHeight}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}

                {/* Progress bar with continuous gradient */}
                <rect x="0" y={rowY + 8} width={chartWidth} height="20" rx="4" fill="#f3f4f6" />

                {/* Continuous gradient progress bar */}
                <defs>
                  <linearGradient id={`gradient-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={stageColor} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={stageColor} stopOpacity="1" />
                  </linearGradient>
                </defs>
                <rect
                  x="0"
                  y={rowY + 8}
                  width={progressWidth}
                  height="20"
                  rx="4"
                  fill={`url(#gradient-${item.id})`}
                />

                {/* Progress percentage text */}
                <text
                  x={progressWidth - 8}
                  y={rowY + 22}
                  fontSize="11"
                  fontWeight="700"
                  fill="#ffffff"
                  textAnchor="end"
                >
                  {item.progress}%
                </text>
              </g>
            </g>
          )
        })}

        {/* Footer note if more items exist */}
        {data.length > maxRows && (
          <text
            x={(infoWidth + chartWidth) / 2}
            y={44 + maxRows * rowHeight + 20}
            fontSize="13"
            fill="#6b7280"
            textAnchor="middle"
          >
            ... 외 {data.length - maxRows}개 품목
          </text>
        )}
      </g>
    </g>
  )
}
