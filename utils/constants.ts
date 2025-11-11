import { Stage } from '@/types/database.types'

/**
 * 담당자 목록
 */
export const OWNERS = ['박경민', '여철구', '한정수', '홍성재'] as const

/**
 * 통화 목록
 */
export const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'] as const

/**
 * 연도 목록
 */
export const YEARS = [2024, 2025, 2026] as const

/**
 * 활성화 단계 순서 (12단계)
 */
export const STAGE_ORDER: Stage[] = [
  Stage.MARKET_RESEARCH,
  Stage.SOURCING_REQUEST,
  Stage.SOURCING_COMPLETED,
  Stage.QUOTE_SENT,
  Stage.SAMPLE_SHIPPED,
  Stage.QUALIFICATION,
  Stage.DMF_RA_REVIEW,
  Stage.PRICE_AGREED,
  Stage.TRIAL_PO,
  Stage.REGISTRATION,
  Stage.COMMERCIAL_PO,
  Stage.WON,
  Stage.LOST,
  Stage.ON_HOLD,
]

/**
 * 단계별 색상 (Tailwind CSS) - 12단계
 */
export const STAGE_COLORS: Record<Stage, string> = {
  [Stage.MARKET_RESEARCH]: 'bg-slate-100 text-slate-700',
  [Stage.SOURCING_REQUEST]: 'bg-gray-100 text-gray-700',
  [Stage.SOURCING_COMPLETED]: 'bg-cyan-100 text-cyan-700',
  [Stage.QUOTE_SENT]: 'bg-blue-100 text-blue-700',
  [Stage.SAMPLE_SHIPPED]: 'bg-indigo-100 text-indigo-700',
  [Stage.QUALIFICATION]: 'bg-purple-100 text-purple-700',
  [Stage.DMF_RA_REVIEW]: 'bg-pink-100 text-pink-700',
  [Stage.PRICE_AGREED]: 'bg-yellow-100 text-yellow-700',
  [Stage.TRIAL_PO]: 'bg-orange-100 text-orange-700',
  [Stage.REGISTRATION]: 'bg-amber-100 text-amber-700',
  [Stage.COMMERCIAL_PO]: 'bg-lime-100 text-lime-700',
  [Stage.WON]: 'bg-green-100 text-green-700',
  [Stage.LOST]: 'bg-red-100 text-red-700',
  [Stage.ON_HOLD]: 'bg-zinc-100 text-zinc-700',
}

/**
 * Badge 색상 (절감률)
 */
export const getBadgeColor = (savingRate: number | null): string => {
  if (!savingRate) return 'bg-gray-100 text-gray-700'
  if (savingRate > 10) return 'bg-green-100 text-green-700'
  if (savingRate > 5) return 'bg-blue-100 text-blue-700'
  if (savingRate > 0) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}
