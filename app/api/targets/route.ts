import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/targets
 * 시스템 내 신규 품목 등록
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      year,
      account_name,
      product_name,
      est_qty_kg,
      owner_name,
      sales_2025_krw,
      curr_currency,
      curr_unit_price_foreign,
      curr_fx_rate_input,
      our_currency,
      our_unit_price_foreign,
      our_fx_rate_input,
      note,
    } = body

    // 필수 필드 검증
    if (!account_name || !product_name) {
      return NextResponse.json(
        { error: '거래처명과 품목명은 필수입니다.' },
        { status: 400 }
      )
    }

    // v2.11: 현재 매입가 정보 유무 확인
    const hasCurrentPrice = !!(curr_currency && curr_unit_price_foreign && curr_fx_rate_input)

    // 자동 계산 필드
    let curr_unit_price_krw = null
    let curr_total_krw = null
    let saving_per_kg = null
    let total_saving_krw = null
    let saving_rate = null

    if (hasCurrentPrice) {
      // 현재 매입가 정보 있을 때만 계산
      curr_unit_price_krw = curr_unit_price_foreign * curr_fx_rate_input
      curr_total_krw = curr_unit_price_krw * est_qty_kg
    }

    // 우리예상 판매가는 항상 계산
    const our_unit_price_krw = our_unit_price_foreign * our_fx_rate_input
    const our_est_revenue_krw = our_unit_price_krw * est_qty_kg

    if (hasCurrentPrice && curr_unit_price_krw !== null) {
      // 절감 계산 (현재 매입가 정보 있을 때만)
      saving_per_kg = curr_unit_price_krw - our_unit_price_krw
      total_saving_krw = saving_per_kg * est_qty_kg
      saving_rate = curr_unit_price_krw > 0 ? (saving_per_kg / curr_unit_price_krw) : 0
    }

    // targets 테이블에 insert
    const { data, error } = await supabase
      .from('targets')
      .insert({
        year: year || 2025,
        account_name,
        product_name,
        est_qty_kg: est_qty_kg || 0,
        owner_name: owner_name || null,
        sales_2025_krw: sales_2025_krw || 0,
        // v2.11: 현재 매입가 정보 (선택 입력)
        curr_currency: hasCurrentPrice ? curr_currency : null,
        curr_unit_price_foreign: hasCurrentPrice ? curr_unit_price_foreign : null,
        curr_fx_rate_input: hasCurrentPrice ? curr_fx_rate_input : null,
        curr_unit_price_krw,
        curr_total_krw,
        // 우리예상 판매가 (필수)
        our_currency: our_currency || 'USD',
        our_unit_price_foreign: our_unit_price_foreign || 0,
        our_fx_rate_input: our_fx_rate_input || 0,
        our_unit_price_krw,
        our_est_revenue_krw,
        // 절감 지표 (현재 매입가 있을 때만 계산됨)
        saving_per_kg,
        total_saving_krw,
        saving_rate,
        current_stage: 'MARKET_RESEARCH',  // 초기 단계
        stage_progress_rate: 0,
        stage_updated_at: new Date().toISOString(),
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting target:', error)
      return NextResponse.json(
        { error: 'Failed to create target' },
        { status: 500 }
      )
    }

    // 단계 이력 기록
    await supabase
      .from('stage_history')
      .insert({
        target_id: data.id,
        stage: 'MARKET_RESEARCH',
        changed_at: new Date().toISOString(),
        actor_name: owner_name || 'System',
        comment: '신규 품목 등록',
      })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/targets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
