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

interface DailyRate {
  date: string
  USD: number | null
  EUR: number | null
  CNY: number | null
  JPY: number | null
}

/**
 * GET /api/exchange-rate-history?rateType=deal_bas_r
 * 최근 7영업일간의 주요 통화 환율 추이 조회 (주말 제외)
 * @param rateType - deal_bas_r(매매기준율), ttb(받으실때), tts(보내실때)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rateType = searchParams.get('rateType') || 'deal_bas_r'
  try {
    const dailyRates: DailyRate[] = []

    // 최근 7영업일 (주말 제외)
    let daysCollected = 0
    let daysBack = 0

    while (daysCollected < 7) {
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
      const rates = await fetchRatesForDate(dateStr, rateType as 'deal_bas_r' | 'ttb' | 'tts')

      dailyRates.push({
        date: displayDate,
        USD: rates.USD,
        EUR: rates.EUR,
        CNY: rates.CNY,
        JPY: rates.JPY
      })

      daysCollected++
      daysBack++
    }

    return NextResponse.json({
      rates: dailyRates,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching exchange rate history:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch exchange rate history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 특정 날짜의 환율 조회
 */
async function fetchRatesForDate(
  dateStr: string,
  rateType: 'deal_bas_r' | 'ttb' | 'tts'
): Promise<{
  USD: number | null
  EUR: number | null
  CNY: number | null
  JPY: number | null
}> {
  try {
    const apiUrl = `${KOREAEXIM_API_URL}?authkey=${KOREAEXIM_API_KEY}&searchdate=${dateStr}&data=AP01`

    const response = await fetch(apiUrl, {
      cache: 'no-store'
    })

    if (!response.ok) {
      console.warn(`API request failed for date ${dateStr}: ${response.status}`)
      return { USD: null, EUR: null, CNY: null, JPY: null }
    }

    const data: ExchangeRateData[] = await response.json()

    // 각 통화 찾기
    const usd = data.find(item => item.cur_unit === 'USD')
    const eur = data.find(item => item.cur_unit === 'EUR')
    const cny = data.find(item => item.cur_unit === 'CNH') // CNY는 CNH로 표시됨
    const jpy = data.find(item => item.cur_unit === 'JPY(100)') // JPY는 100엔 기준

    // 선택된 환율 유형에 따라 값 추출
    const getRateValue = (item: ExchangeRateData | undefined) => {
      if (!item) return null
      const rateStr = item[rateType]
      return rateStr ? parseFloat(rateStr.replace(/,/g, '')) : null
    }

    return {
      USD: getRateValue(usd),
      EUR: getRateValue(eur),
      CNY: getRateValue(cny),
      JPY: jpy ? (getRateValue(jpy) || 0) / 100 : null // 100엔 기준이므로 100으로 나눔
    }

  } catch (error) {
    console.error(`Error fetching rates for date ${dateStr}:`, error)
    return { USD: null, EUR: null, CNY: null, JPY: null }
  }
}
