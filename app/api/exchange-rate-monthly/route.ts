import { NextResponse } from 'next/server'

const KOREAEXIM_API_KEY = 'FDPciB9QH0H0CalugXZFZ4lRjO13P8H4'
const KOREAEXIM_API_URL = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'

interface ExchangeRateData {
  result: number
  cur_unit: string
  cur_nm: string
  deal_bas_r: string  // 매매기준율
  ttb: string         // 전신환(송금) 받으실때
  tts: string         // 전신환(송금) 보내실때
}

interface MonthlyRate {
  date: string
  rate: number
}

/**
 * GET /api/exchange-rate-monthly?currency=USD&rateType=deal_bas_r
 * 최근 1개월(30영업일)의 특정 통화 환율 조회 (주말 제외)
 * @param currency - USD, EUR, CNY, JPY
 * @param rateType - deal_bas_r(매매기준율), ttb(받으실때), tts(보내실때)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const currency = searchParams.get('currency')
  const rateType = searchParams.get('rateType') || 'deal_bas_r'

  if (!currency) {
    return NextResponse.json(
      { error: 'Currency parameter is required' },
      { status: 400 }
    )
  }

  try {
    const monthlyRates: MonthlyRate[] = []

    // 최근 30영업일 (주말 제외)
    let daysCollected = 0
    let daysBack = 0
    const maxAttempts = 50 // 최대 50일 이전까지만 조회

    while (daysCollected < 30 && daysBack < maxAttempts) {
      const date = new Date()
      date.setDate(date.getDate() - daysBack)

      // 주말 체크 (0=일요일, 6=토요일)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        daysBack++
        continue
      }

      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD 형식
      const displayDate = date.toISOString().split('T')[0] // YYYY-MM-DD 형식

      // 해당 날짜의 환율 조회
      const rate = await fetchRateForDate(dateStr, currency, rateType as 'deal_bas_r' | 'ttb' | 'tts')

      if (rate !== null) {
        monthlyRates.push({
          date: displayDate,
          rate
        })
        daysCollected++
      }

      daysBack++
    }

    // 날짜 오름차순 정렬 (오래된 날짜부터)
    monthlyRates.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      currency,
      rateType,
      rates: monthlyRates,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching monthly exchange rates:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch monthly exchange rates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 특정 날짜의 특정 통화 환율 조회
 */
async function fetchRateForDate(
  dateStr: string,
  currency: string,
  rateType: 'deal_bas_r' | 'ttb' | 'tts'
): Promise<number | null> {
  try {
    const apiUrl = `${KOREAEXIM_API_URL}?authkey=${KOREAEXIM_API_KEY}&searchdate=${dateStr}&data=AP01`

    const response = await fetch(apiUrl, {
      cache: 'no-store'
    })

    if (!response.ok) {
      console.warn(`API request failed for date ${dateStr}: ${response.status}`)
      return null
    }

    const data: ExchangeRateData[] = await response.json()

    // 통화 코드 매핑
    const currencyMap: Record<string, string> = {
      'CNY': 'CNH',
      'JPY': 'JPY(100)'
    }

    const apiCurrency = currencyMap[currency] || currency
    const currencyData = data.find(item => item.cur_unit === apiCurrency)

    if (!currencyData) {
      return null
    }

    const rateStr = currencyData[rateType]
    if (!rateStr) {
      return null
    }

    let rate = parseFloat(rateStr.replace(/,/g, ''))

    // JPY는 100엔 기준이므로 100으로 나눔
    if (currency === 'JPY') {
      rate = rate / 100
    }

    return rate

  } catch (error) {
    console.error(`Error fetching rate for date ${dateStr}:`, error)
    return null
  }
}
