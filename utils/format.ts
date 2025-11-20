/**
 * 숫자를 원화 형식으로 포맷팅
 * @param value - 숫자 값
 * @returns 포맷된 문자열 (예: ₩1,234,567)
 */
export function formatKRW(value: number | null | undefined): string {
  if (value === null || value === undefined) return '₩0'
  return `₩${value.toLocaleString('ko-KR')}`
}

/**
 * 숫자를 억 단위로 포맷팅
 * @param value - 숫자 값
 * @returns 포맷된 문자열 (예: ₩1.2B)
 */
export function formatKRWShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return '₩0'
  if (value >= 100000000) {
    return `₩${(value / 100000000).toFixed(1)}억`
  }
  if (value >= 10000) {
    return `₩${(value / 10000).toFixed(0)}만`
  }
  return formatKRW(value)
}

/**
 * 퍼센트 포맷팅
 * @param value - 숫자 값 (0-1 범위, 예: 0.1 = 10%)
 * @param decimals - 소수점 자리수
 * @returns 포맷된 문자열 (예: 10.0%)
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '0%'
  // Excel의 백분율 서식처럼 0-1 범위를 0-100%로 변환
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 날짜를 한국어 형식으로 포맷팅 (한국 시간 기준)
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 포맷된 문자열 (예: 2025년 1월 4일)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 날짜를 짧은 형식으로 포맷팅 (한국 시간 기준)
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 포맷된 문자열 (예: 2025-01-04)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date

  // 한국 시간 기준으로 YYYY-MM-DD 형식 반환
  return d.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '')
}

/**
 * 날짜를 상세 형식으로 포맷팅 (시간 포함, 한국 시간 기준)
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 포맷된 문자열 (예: 2025-01-04 14:30)
 */
export function formatDateFull(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * 숫자를 천 단위 구분자로 포맷팅
 * @param value - 숫자 값
 * @returns 포맷된 문자열 (예: 1,234,567)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  return value.toLocaleString('ko-KR')
}

/**
 * 두 날짜 사이의 일수 계산
 * @param from - 시작 날짜
 * @param to - 종료 날짜 (기본값: 현재)
 * @returns 일수
 */
export function daysBetween(
  from: Date | string,
  to: Date | string = new Date()
): number {
  const fromDate = typeof from === 'string' ? new Date(from) : from
  const toDate = typeof to === 'string' ? new Date(to) : to
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 품목명을 정규화 (대소문자 무시, 공백 및 특수문자 정리)
 * @param productName - 품목명
 * @returns 정규화된 품목명
 * @example
 * normalizeProductName('Cefaclor') // 'cefaclor'
 * normalizeProductName(' CEFACLOR  ') // 'cefaclor'
 * normalizeProductName('Cefaclor-Monohydrate') // 'cefaclormonohydrate'
 */
export function normalizeProductName(productName: string | null | undefined): string {
  if (!productName) return ''

  return productName
    .toLowerCase() // 소문자 변환
    .trim() // 앞뒤 공백 제거
    .replace(/\s+/g, '') // 중간 공백 제거
    .replace(/[-_]/g, '') // 하이픈, 언더스코어 제거
}

/**
 * 절감액 포맷팅 (현재 매입가 정보 없으면 "정보 없음" 표시)
 * @param savingAmount - 절감액
 * @param hasCurrentPrice - 현재 매입가 정보 유무
 * @returns 포맷된 문자열
 */
export function formatSavingAmount(
  savingAmount: number | null | undefined,
  hasCurrentPrice: boolean
): string {
  if (!hasCurrentPrice) return '정보 없음'
  if (savingAmount === null || savingAmount === undefined) return '정보 없음'
  if (savingAmount < 0) return `역마진 (${formatKRW(Math.abs(savingAmount))})`
  return formatKRW(savingAmount)
}

/**
 * 절감률 포맷팅 (현재 매입가 정보 없으면 "정보 없음" 표시)
 * @param savingRate - 절감률 (0-1 범위)
 * @param hasCurrentPrice - 현재 매입가 정보 유무
 * @returns 포맷된 문자열
 */
export function formatSavingRate(
  savingRate: number | null | undefined,
  hasCurrentPrice: boolean
): string {
  if (!hasCurrentPrice) return '정보 없음'
  if (savingRate === null || savingRate === undefined) return '정보 없음'
  if (savingRate < 0) return `역마진 (${formatPercent(Math.abs(savingRate))})`
  return formatPercent(savingRate)
}
