/**
 * Server-side Data Fetching with React.cache
 * v2.14 - Performance Optimization
 *
 * React.cache를 사용하여 동일한 요청 수명주기 내에서
 * 중복 데이터베이스 쿼리를 방지합니다.
 *
 * 장점:
 * - 동일 렌더 트리 내 중복 요청 자동 제거
 * - 서버 컴포넌트 간 데이터 공유
 * - 메모리 효율적 (요청 완료 후 자동 정리)
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Target, Supplier, Stage } from '@/types/database.types'

// ===== Targets =====

/**
 * 모든 targets 조회 (캐싱)
 * Dashboard, Pipeline 등에서 사용
 */
export const getTargets = cache(async (): Promise<Target[]> => {
  console.log('📊 [React.cache] getTargets called')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('our_est_revenue_krw', { ascending: false })

  if (error) {
    console.error('❌ getTargets error:', error)
    throw new Error(`Failed to fetch targets: ${error.message}`)
  }

  return data || []
})

/**
 * 특정 단계의 targets 조회 (캐싱)
 */
export const getTargetsByStage = cache(async (stage: Stage): Promise<Target[]> => {
  console.log(`📊 [React.cache] getTargetsByStage called: ${stage}`)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .eq('current_stage', stage)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('❌ getTargetsByStage error:', error)
    throw new Error(`Failed to fetch targets by stage: ${error.message}`)
  }

  return data || []
})

/**
 * 단일 target 조회 (캐싱)
 */
export const getTargetById = cache(async (id: string): Promise<Target | null> => {
  console.log(`📊 [React.cache] getTargetById called: ${id}`)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('❌ getTargetById error:', error)
    throw new Error(`Failed to fetch target: ${error.message}`)
  }

  return data
})

// ===== Suppliers =====

/**
 * 품목명으로 제조원 조회 (캐싱)
 */
export const getSuppliersByProductName = cache(async (productName: string): Promise<Supplier[]> => {
  console.log(`📊 [React.cache] getSuppliersByProductName called: ${productName}`)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .ilike('product_name', productName)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ getSuppliersByProductName error:', error)
    throw new Error(`Failed to fetch suppliers: ${error.message}`)
  }

  return data || []
})

/**
 * 여러 품목의 제조원을 한 번에 조회 (배치 최적화)
 */
export const getSuppliersByProductNames = cache(async (productNames: string[]): Promise<Map<string, Supplier[]>> => {
  console.log(`📊 [React.cache] getSuppliersByProductNames called: ${productNames.length} products`)
  const supabase = await createClient()

  if (productNames.length === 0) {
    return new Map()
  }

  // 모든 제조원을 한 번의 쿼리로 조회
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .in('product_name', productNames)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ getSuppliersByProductNames error:', error)
    throw new Error(`Failed to fetch suppliers: ${error.message}`)
  }

  // 품목명별로 그룹화
  const supplierMap = new Map<string, Supplier[]>()
  for (const supplier of data || []) {
    const key = supplier.product_name.toLowerCase()
    if (!supplierMap.has(key)) {
      supplierMap.set(key, [])
    }
    supplierMap.get(key)!.push(supplier)
  }

  return supplierMap
})

/**
 * 모든 제조원 조회 (캐싱)
 */
export const getAllSuppliers = cache(async (): Promise<Supplier[]> => {
  console.log('📊 [React.cache] getAllSuppliers called')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('product_name', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ getAllSuppliers error:', error)
    throw new Error(`Failed to fetch suppliers: ${error.message}`)
  }

  return data || []
})

// ===== Dashboard KPIs =====

/**
 * Dashboard KPI 계산 (캐싱)
 * 중복 계산 방지를 위해 캐싱
 */
export const getDashboardKPIs = cache(async () => {
  console.log('📊 [React.cache] getDashboardKPIs called')
  const targets = await getTargets()

  const totalTargets = targets.length
  const completedTargets = targets.filter(t => t.current_stage === 'WON').length
  const avgProgress = targets.reduce((sum, t) => sum + (t.stage_progress_rate || 0), 0) / (totalTargets || 1) / 100

  const targetRevenue = targets.reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0)
  const achievedRevenue = targets
    .filter(t => t.current_stage === 'WON')
    .reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0)
  const achievementRate = targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0

  return {
    totalTargets,
    completedTargets,
    avgProgress,
    targetRevenue,
    achievedRevenue,
    achievementRate,
  }
})

// ===== Strategy Data =====

const STRATEGIES = {
  whiteSpace: ['cefaclor', 'rebamipide', 'clarithromycin'],
  erdosteine: ['erdosteine']
}

/**
 * 전략별 데이터 계산 (캐싱)
 */
export const getStrategyData = cache(async () => {
  console.log('📊 [React.cache] getStrategyData called')
  const targets = await getTargets()

  const strategyData = {
    whiteSpace: { targetRevenue: 0, achievedRevenue: 0, count: 0, wonCount: 0 },
    erdosteine: { targetRevenue: 0, achievedRevenue: 0, count: 0, wonCount: 0 },
    segmentSP: { targetRevenue: 0, achievedRevenue: 0, count: 0, wonCount: 0 }
  }

  targets.forEach(target => {
    const productName = (target.product_name || '').toLowerCase()
    const segment = target.segment || ''
    const revenue = target.our_est_revenue_krw || 0
    const isWon = target.current_stage === 'WON'

    if (STRATEGIES.whiteSpace.includes(productName)) {
      strategyData.whiteSpace.targetRevenue += revenue
      strategyData.whiteSpace.count += 1
      if (isWon) {
        strategyData.whiteSpace.achievedRevenue += revenue
        strategyData.whiteSpace.wonCount += 1
      }
    } else if (STRATEGIES.erdosteine.includes(productName)) {
      strategyData.erdosteine.targetRevenue += revenue
      strategyData.erdosteine.count += 1
      if (isWon) {
        strategyData.erdosteine.achievedRevenue += revenue
        strategyData.erdosteine.wonCount += 1
      }
    } else if (segment === 'S' || segment === 'P') {
      strategyData.segmentSP.targetRevenue += revenue
      strategyData.segmentSP.count += 1
      if (isWon) {
        strategyData.segmentSP.achievedRevenue += revenue
        strategyData.segmentSP.wonCount += 1
      }
    }
  })

  return strategyData
})

// ===== Stage History =====

export interface StageHistory {
  id: string
  target_id: string
  stage: string
  changed_at: string
  actor_name: string | null
  comment: string | null
}

/**
 * 단계 이력 조회 (캐싱)
 */
export const getStageHistory = cache(async (targetId: string): Promise<StageHistory[]> => {
  console.log(`📊 [React.cache] getStageHistory called: ${targetId}`)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stage_history')
    .select('*')
    .eq('target_id', targetId)
    .order('changed_at', { ascending: false })

  if (error) {
    console.error('❌ getStageHistory error:', error)
    throw new Error(`Failed to fetch stage history: ${error.message}`)
  }

  return data || []
})

// ===== Meetings (for Phase 1-3) =====

export interface MeetingItem {
  id: string
  meeting_type: string
  meeting_date: string
  account_name: string | null
  action_content: string
  assignee_name: string | null
  is_done: boolean
  created_at: string
  updated_at: string
}

/**
 * 회의록 목록 조회 (캐싱)
 */
export const getMeetings = cache(async (): Promise<MeetingItem[]> => {
  console.log('📊 [React.cache] getMeetings called')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meeting_items')
    .select('*')
    .order('meeting_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ getMeetings error:', error)
    throw new Error(`Failed to fetch meetings: ${error.message}`)
  }

  return data || []
})

/**
 * 여러 회의록 항목의 댓글 개수를 한 번에 조회 (배치 최적화)
 */
export const getCommentCountsBatch = cache(async (meetingItemIds: string[]): Promise<Map<string, number>> => {
  console.log(`📊 [React.cache] getCommentCountsBatch called: ${meetingItemIds.length} items`)
  const supabase = await createClient()

  if (meetingItemIds.length === 0) {
    return new Map()
  }

  // 모든 댓글을 한 번의 쿼리로 조회하고 그룹별 카운트
  const { data, error } = await supabase
    .from('meeting_comments')
    .select('meeting_item_id')
    .in('meeting_item_id', meetingItemIds)

  if (error) {
    console.error('❌ getCommentCountsBatch error:', error)
    throw new Error(`Failed to fetch comment counts: ${error.message}`)
  }

  // meeting_item_id별로 카운트
  const countMap = new Map<string, number>()
  for (const comment of data || []) {
    const id = comment.meeting_item_id
    countMap.set(id, (countMap.get(id) || 0) + 1)
  }

  return countMap
})
