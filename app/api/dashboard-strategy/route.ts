import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 전략 정의
const STRATEGIES = {
  whiteSpace: ['cefaclor', 'clarithromycin'],
  erdosteine: ['erdosteine']
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // WON 상태인 타겟만 조회
    const { data: wonTargets, error } = await supabase
      .from('targets')
      .select('*')
      .eq('current_stage', 'WON')

    if (error) {
      console.error('Error fetching WON targets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 전략별 분류 및 집계
    const result = {
      whiteSpace: {
        revenue: 0,
        count: 0,
        targets: [] as any[]
      },
      erdosteine: {
        revenue: 0,
        count: 0,
        targets: [] as any[]
      },
      segmentSP: {
        revenue: 0,
        count: 0,
        targets: [] as any[]
      }
    }

    // 각 타겟 분류 (우선순위: White Space > Erdosteine > S/P 세그먼트)
    wonTargets?.forEach(target => {
      const productName = (target.product_name || '').toLowerCase()
      const segment = target.segment || ''
      const revenue = target.our_est_revenue_krw || 0

      // 1. White Space 체크 (최우선)
      if (STRATEGIES.whiteSpace.includes(productName)) {
        result.whiteSpace.revenue += revenue
        result.whiteSpace.count += 1
        result.whiteSpace.targets.push({
          account_name: target.account_name,
          product_name: target.product_name,
          revenue: revenue
        })
      }
      // 2. Erdosteine 체크 (2순위)
      else if (STRATEGIES.erdosteine.includes(productName)) {
        result.erdosteine.revenue += revenue
        result.erdosteine.count += 1
        result.erdosteine.targets.push({
          account_name: target.account_name,
          product_name: target.product_name,
          revenue: revenue
        })
      }
      // 3. S/P 세그먼트 체크 (3순위) - segment 컬럼 사용
      else if (segment === 'S' || segment === 'P') {
        result.segmentSP.revenue += revenue
        result.segmentSP.count += 1
        result.segmentSP.targets.push({
          account_name: target.account_name,
          product_name: target.product_name,
          revenue: revenue,
          segment: segment
        })
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
