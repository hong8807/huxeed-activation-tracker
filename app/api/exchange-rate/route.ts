import { NextResponse } from 'next/server'

const KOREAEXIM_API_KEY = 'FDPciB9QH0H0CalugXZFZ4lRjO13P8H4'
const KOREAEXIM_API_URL = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'

interface ExchangeRateData {
  result: number
  cur_unit: string
  cur_nm: string
  ttb: string
  tts: string
  deal_bas_r: string  // 매매기준율
  bkpr: string
  yy_efee_r: string
  ten_dd_efee_r: string
  kftc_deal_bas_r: string
  kftc_bkpr: string
}

/**
 * GET /api/exchange-rate?currency=USD
 * 한국수출입은행 환율 API를 통해 실시간 환율 조회
 * 매매기준율(deal_bas_r) 반환
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency')

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency parameter is required' },
        { status: 400 }
      )
    }

    // KRW는 환율 조회 불필요
    if (currency === 'KRW') {
      return NextResponse.json({
        currency: 'KRW',
        rate: 1,
        source: 'fixed'
      })
    }

    // 통화 코드 매핑 (API에서 다르게 표시되는 경우)
    const currencyMap: Record<string, string> = {
      'CNY': 'CNH',  // 위안화는 CNH로 표시됨
      'JPY': 'JPY(100)'  // 엔화는 100엔 기준
    }

    const apiCurrency = currencyMap[currency] || currency

    // 한국수출입은행 API 호출
    const apiUrl = `${KOREAEXIM_API_URL}?authkey=${KOREAEXIM_API_KEY}&data=AP01`

    const response = await fetch(apiUrl, {
      cache: 'no-store',  // 실시간 환율이므로 캐시 사용 안 함
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: ExchangeRateData[] = await response.json()

    // 요청한 통화의 환율 찾기
    const exchangeRate = data.find((item) => item.cur_unit === apiCurrency)

    if (!exchangeRate) {
      return NextResponse.json(
        { error: `Exchange rate not found for currency: ${currency}` },
        { status: 404 }
      )
    }

    // result 체크 (1: 성공, 2: DATA코드 오류, 3: 인증코드 오류, 4: 일일제한횟수 마감)
    if (exchangeRate.result !== 1) {
      const errorMessages: Record<number, string> = {
        2: 'DATA code error',
        3: 'Authentication key error',
        4: 'Daily request limit exceeded'
      }

      return NextResponse.json(
        {
          error: errorMessages[exchangeRate.result] || 'Unknown error',
          result: exchangeRate.result
        },
        { status: 500 }
      )
    }

    // 매매기준율 추출 및 쉼표 제거
    let rate = parseFloat(exchangeRate.deal_bas_r.replace(/,/g, ''))

    // JPY는 100엔 기준이므로 100으로 나눔
    if (currency === 'JPY') {
      rate = rate / 100
    }

    return NextResponse.json({
      currency,
      rate,
      currencyName: exchangeRate.cur_nm,
      source: 'koreaexim',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch exchange rate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
