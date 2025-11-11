import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/suppliers
 * 제조원 정보 등록 (품목명 기준)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      product_name,
      supplier_name,
      currency,
      unit_price_foreign,
      fx_rate,
      dmf_registered,
      linkage_status,
      note,
    } = body

    // 필수 필드 검증
    if (!product_name || !supplier_name || !currency || !unit_price_foreign || !fx_rate) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // KRW 환산 원가 계산
    const unit_price_krw = unit_price_foreign * fx_rate

    // 해당 품목을 가진 모든 targets 조회 (SOURCING_REQUEST 단계만)
    const { data: targets, error: targetsError } = await supabase
      .from('targets')
      .select('*')
      .eq('product_name', product_name)
      .eq('current_stage', 'SOURCING_REQUEST')

    if (targetsError) {
      console.error('Error fetching targets:', targetsError)
      return NextResponse.json(
        { error: 'Failed to fetch targets' },
        { status: 500 }
      )
    }

    if (!targets || targets.length === 0) {
      return NextResponse.json(
        { error: '해당 품목의 소싱요청 단계 카드를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log(`📦 ${product_name} 품목에 대해 ${targets.length}개의 카드 발견`)

    // 각 target에 대해 제조원 정보 삽입
    const supplierInserts = targets.map(target => ({
      target_id: target.id,
      product_name: target.product_name, // ✨ product_name 추가
      supplier_name,
      currency,
      unit_price_foreign,
      fx_rate,
      unit_price_krw,
      dmf_registered: dmf_registered || false,
      linkage_status: linkage_status || 'PREPARING',
      note: note || null,
    }))

    const { data: insertedSuppliers, error: insertError } = await supabase
      .from('suppliers')
      .insert(supplierInserts)
      .select()

    if (insertError) {
      console.error('Error inserting suppliers:', insertError)
      return NextResponse.json(
        { error: 'Failed to create suppliers' },
        { status: 500 }
      )
    }

    console.log(`✅ ${insertedSuppliers.length}개 제조원 정보 등록 완료`)

    // 모든 targets를 SOURCING_COMPLETED로 변경
    const targetIds = targets.map(t => t.id)

    const { error: updateError } = await supabase
      .from('targets')
      .update({
        current_stage: 'SOURCING_COMPLETED',
        stage_progress_rate: 10, // 소싱완료 단계는 10%
        stage_updated_at: new Date().toISOString(),
      })
      .in('id', targetIds)

    if (updateError) {
      console.error('Error updating stages:', updateError)
      return NextResponse.json(
        { error: 'Failed to update stages' },
        { status: 500 }
      )
    }

    // stage_history에 기록
    const historyInserts = targets.map(target => ({
      target_id: target.id,
      stage: 'SOURCING_COMPLETED',
      changed_at: new Date().toISOString(),
      actor_name: 'System',
      comment: `제조원 정보 등록됨 (${supplier_name})`,
    }))

    await supabase
      .from('stage_history')
      .insert(historyInserts)

    console.log(`✅ ${targets.length}개 카드 SOURCING_COMPLETED로 전환 완료`)
    targets.forEach(t => {
      console.log(`   - ${t.account_name} - ${t.product_name}`)
    })

    return NextResponse.json({
      message: 'Success',
      affected_targets: targets.length,
      suppliers_created: insertedSuppliers.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/suppliers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suppliers?targetId=xxx
 * 특정 품목의 제조원 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')

    if (!targetId) {
      return NextResponse.json(
        { error: 'targetId parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching suppliers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/suppliers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
