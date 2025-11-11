'use client'

import { useState, useEffect } from 'react'

interface DailyRate {
  date: string
  USD: number | null
  EUR: number | null
  CNY: number | null
  JPY: number | null
}

interface ExchangeRateHistoryResponse {
  rates: DailyRate[]
  timestamp: string
}

interface MonthlyRate {
  date: string
  rate: number
}

interface MonthlyRateResponse {
  currency: string
  rateType: string
  rates: MonthlyRate[]
  timestamp: string
}

type RateType = 'deal_bas_r' | 'ttb' | 'tts'

// 라인 차트 컴포넌트
function LineChart({ rates }: { rates: MonthlyRate[] }) {
  if (rates.length === 0) return null

  const width = 450
  const height = 180
  const padding = { top: 20, right: 15, bottom: 35, left: 15 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 최소/최대 환율 계산
  const rateValues = rates.map(r => r.rate)
  const minRate = Math.min(...rateValues)
  const maxRate = Math.max(...rateValues)
  const rateRange = maxRate - minRate
  const yPadding = rateRange * 0.1 // 10% 여유 공간

  // 좌표 변환 함수
  const getX = (index: number) => {
    return padding.left + (index / (rates.length - 1)) * chartWidth
  }

  const getY = (rate: number) => {
    const normalized = (rate - (minRate - yPadding)) / (rateRange + yPadding * 2)
    return padding.top + chartHeight - (normalized * chartHeight)
  }

  // 부드러운 곡선 경로 생성 (Cubic Bezier)
  const getSmoothPath = () => {
    if (rates.length === 0) return ''

    const points = rates.map((rate, i) => ({
      x: getX(i),
      y: getY(rate.rate)
    }))

    let path = `M ${points[0].x} ${points[0].y}`

    // Catmull-Rom to Bezier 변환
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(i + 2, points.length - 1)]

      // 제어점 계산 (tension = 0.5)
      const tension = 0.5
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    return path
  }

  const linePath = getSmoothPath()

  // 그라디언트 fill을 위한 영역 경로
  const areaPath = linePath +
    ` L ${getX(rates.length - 1)} ${height - padding.bottom}` +
    ` L ${getX(0)} ${height - padding.bottom} Z`

  // Y축 눈금 (5개)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = minRate - yPadding + ((rateRange + yPadding * 2) / 4) * i
    return {
      y: padding.top + chartHeight - ((i / 4) * chartHeight),
      label: `₩${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`
    }
  })

  // X축 눈금 (7개만 표시)
  const xTickInterval = Math.floor(rates.length / 6)
  const xTicks = rates
    .filter((_, i) => i % xTickInterval === 0 || i === rates.length - 1)
    .map((rate, i, arr) => {
      const originalIndex = rates.findIndex(r => r.date === rate.date)
      const dateObj = new Date(rate.date)
      const month = dateObj.getMonth() + 1
      const day = dateObj.getDate()
      return {
        x: getX(originalIndex),
        label: `${month}/${day}`
      }
    })

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-white">
      {/* 그라디언트 정의 */}
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4DA3FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 배경 그리드 (매우 은은하게) */}
      {yTicks.map((tick, i) => (
        i > 0 && i < yTicks.length - 1 && (
          <line
            key={i}
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
        )
      ))}

      {/* X축 레이블만 (하단) */}
      {xTicks.map((tick, i) => (
        <g key={i}>
          <text
            x={tick.x}
            y={height - 15}
            textAnchor="middle"
            fontSize="11"
            fill="rgba(255,255,255,0.5)"
            fontWeight="600"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* 그라디언트 fill 영역 */}
      <path
        d={areaPath}
        fill="url(#chartGradient)"
      />

      {/* 라인 */}
      <path
        d={linePath}
        fill="none"
        stroke="#4DA3FF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ExchangeRateTable() {
  const [rates, setRates] = useState<DailyRate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateType, setRateType] = useState<RateType>('deal_bas_r')
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [monthlyRates, setMonthlyRates] = useState<MonthlyRate[]>([])
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false)

  useEffect(() => {
    fetchExchangeRates()
  }, [rateType])

  useEffect(() => {
    if (selectedCurrency) {
      fetchMonthlyRates(selectedCurrency)
    }
  }, [selectedCurrency, rateType])

  const fetchExchangeRates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/exchange-rate-history?rateType=${rateType}`)

      if (!response.ok) {
        throw new Error('환율 정보를 가져올 수 없습니다.')
      }

      const data: ExchangeRateHistoryResponse = await response.json()
      setRates(data.rates)
    } catch (err) {
      console.error('Error fetching exchange rates:', err)
      setError(err instanceof Error ? err.message : '환율 정보를 가져올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMonthlyRates = async (currency: string) => {
    setIsLoadingMonthly(true)

    try {
      const response = await fetch(`/api/exchange-rate-monthly?currency=${currency}&rateType=${rateType}`)

      if (!response.ok) {
        throw new Error('월간 환율 정보를 가져올 수 없습니다.')
      }

      const data: MonthlyRateResponse = await response.json()
      setMonthlyRates(data.rates)
    } catch (err) {
      console.error('Error fetching monthly rates:', err)
      setMonthlyRates([])
    } finally {
      setIsLoadingMonthly(false)
    }
  }

  const formatRate = (rate: number | null): string => {
    if (rate === null) return '-'
    return rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${month}/${day}\n(${weekday})`
  }

  // 등락 표시 함수 (이전 날짜 대비) - 오른쪽 열과 비교
  const getRateChange = (current: number | null, next: number | null): string => {
    if (current === null || next === null) return ''
    const change = current - next
    if (Math.abs(change) < 0.01) return ''

    const percentage = ((change / next) * 100).toFixed(2)
    if (change > 0) {
      return `▲${change.toFixed(2)}`
    } else {
      return `▼${Math.abs(change).toFixed(2)}`
    }
  }

  const getChangeColor = (current: number | null, next: number | null): string => {
    if (current === null || next === null) return ''
    const change = current - next
    if (Math.abs(change) < 0.01) return 'text-gray-500'
    return change > 0 ? 'text-red-600' : 'text-blue-600'
  }

  // 통화 목록
  const currencies = [
    { key: 'USD', label: '미국 달러', symbol: '$' },
    { key: 'EUR', label: '유로', symbol: '€' },
    { key: 'CNY', label: '중국 위안', symbol: '¥' },
    { key: 'JPY', label: '일본 엔', symbol: '¥' }
  ] as const

  // 환율 유형 목록
  const rateTypes = [
    { value: 'deal_bas_r', label: '매매기준율' },
    { value: 'ttb', label: '전신환(송금) 받으실때' },
    { value: 'tts', label: '전신환(송금) 보내실때' }
  ] as const

  const getRateTypeLabel = () => {
    return rateTypes.find(rt => rt.value === rateType)?.label || '매매기준율'
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 text-amber-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">주요 통화 환율 추이 (최근 7영업일)</h2>
            <p className="text-sm text-gray-600 mt-1">
              한국수출입은행 {getRateTypeLabel()} | 영업일 11시 전후 업데이트 | 주말 제외
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 환율 유형 필터 */}
            <select
              value={rateType}
              onChange={(e) => setRateType(e.target.value as RateType)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rateTypes.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
            {/* 새로고침 버튼 */}
            <button
              onClick={fetchExchangeRates}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                '새로고침'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  통화
                </th>
                {rates.map((rate, index) => (
                  <th
                    key={rate.date}
                    className={`px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-pre-line ${
                      index === 0 ? 'bg-blue-100' : ''
                    }`}
                  >
                    {formatDate(rate.date)}
                    {index === 0 && (
                      <div className="text-xs font-semibold text-blue-800 mt-1">
                        최신
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currencies.map((currency) => (
                <tr key={currency.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky left-0 bg-white">
                    <button
                      onClick={() => setSelectedCurrency(currency.key)}
                      className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <span className="text-lg">{currency.symbol}</span>
                      <span className="underline decoration-dotted">{currency.label}</span>
                    </button>
                  </td>
                  {rates.map((rate, index) => {
                    const nextRate = rates[index + 1] // 오른쪽 열이 이전 날짜
                    const currentValue = rate[currency.key as keyof DailyRate] as number | null
                    const nextValue = nextRate ? (nextRate[currency.key as keyof DailyRate] as number | null) : null

                    return (
                      <td
                        key={rate.date}
                        className={`px-4 py-4 whitespace-nowrap text-center ${
                          index === 0 ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          ₩{formatRate(currentValue)}
                        </div>
                        {nextValue !== null && (
                          <div className={`text-xs ${getChangeColor(currentValue, nextValue)}`}>
                            {getRateChange(currentValue, nextValue)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ※ 최근 7영업일(주말 제외) 환율 추이입니다. | 영업시간 전(11시 이전)에는 이전 영업일의 환율이 표시됩니다. | 환율 상승 ▲ 빨간색, 하락 ▼ 파란색
        </p>
      </div>

      {/* 1개월 환율 차트 모달 */}
      {selectedCurrency && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedCurrency(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg shadow-2xl p-4 max-w-md w-full mx-4 border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {currencies.find(c => c.key === selectedCurrency)?.symbol}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {currencies.find(c => c.key === selectedCurrency)?.label}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {getRateTypeLabel()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCurrency(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 통계 정보 */}
            {!isLoadingMonthly && monthlyRates.length > 0 && (
              <div className="mb-3">
                <p className="text-xl font-bold text-white mb-1">
                  ₩{monthlyRates[monthlyRates.length - 1].rate.toLocaleString('ko-KR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">최근 30영업일</p>
                  {(() => {
                    const firstRate = monthlyRates[0].rate
                    const lastRate = monthlyRates[monthlyRates.length - 1].rate
                    const change = ((lastRate - firstRate) / firstRate) * 100
                    const isPositive = change > 0
                    return (
                      <p className={`text-xs font-semibold ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                      </p>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* 차트 영역 */}
            <div className="bg-black rounded-lg p-3 min-h-[200px] border border-gray-800">
              {isLoadingMonthly ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-center text-gray-400">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-xs">로딩 중...</p>
                  </div>
                </div>
              ) : monthlyRates.length === 0 ? (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-gray-500 text-xs">데이터를 불러올 수 없습니다.</p>
                </div>
              ) : (
                <LineChart rates={monthlyRates} />
              )}
            </div>

            {/* 메모지 스타일 하단 */}
            <div className="mt-2 text-[10px] text-gray-500 italic border-t border-gray-700 pt-2">
              <p>💡 한국수출입은행 API | 주말/공휴일 제외 | 11시 업데이트</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
