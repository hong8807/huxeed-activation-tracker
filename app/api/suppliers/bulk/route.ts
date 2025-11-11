import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeProductName } from '@/utils/format'

/**
 * POST /api/suppliers/bulk
 * 제조원 정보 여러 개를 한 번에 등록 (품목명 기준)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { product_name, suppliers } = body

    // 필수 필드 검증
    if (!product_name || !suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 각 제조원 정보 검증
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i]
      if (!supplier.supplier_name || !supplier.created_by_name || !supplier.currency || !supplier.unit_price_foreign || !supplier.fx_rate) {
        return NextResponse.json(
          { error: `제조원 ${i + 1}: 필수 필드(제조원명, 입력자명, 통화, 단가, 환율)가 누락되었습니다.` },
          { status: 400 }
        )
      }
    }

    console.log(`📦 품목명: ${product_name}, 제조원 개수: ${suppliers.length}`)

    // 품목명 정규화
    const normalizedProductName = normalizeProductName(product_name)
    console.log(`📝 정규화된 품목명: ${normalizedProductName}`)

    // 해당 품목을 가진 모든 targets 조회 (모든 단계 허용)
    // 시장조사(MARKET_RESEARCH)와 소싱요청(SOURCING_REQUEST) 단계 모두 포함
    // 정규화된 품목명으로 비교
    const { data: allTargets, error: allTargetsError } = await supabase
      .from('targets')
      .select('*')

    if (allTargetsError) {
      console.error('Error fetching targets:', allTargetsError)
      return NextResponse.json(
        { error: 'Failed to fetch targets' },
        { status: 500 }
      )
    }

    // 정규화된 품목명으로 필터링
    const targets = allTargets?.filter(
      target => normalizeProductName(target.product_name) === normalizedProductName
    ) || []

    if (!targets || targets.length === 0) {
      return NextResponse.json(
        { error: '해당 품목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log(`📦 ${product_name} 품목에 대해 ${targets.length}개의 카드 발견`)
    targets.forEach(t => {
      console.log(`   - ${t.account_name} - ${t.product_name}`)
    })

    // 각 target에 대해 모든 제조원 정보 삽입
    const allSupplierInserts = targets.flatMap(target =>
      suppliers.map(supplier => ({
        target_id: target.id,
        product_name: target.product_name, // ✨ product_name 추가
        supplier_name: supplier.supplier_name.trim(),
        created_by_name: supplier.created_by_name.trim(), // v2.5: 입력자명
        currency: supplier.currency,
        unit_price_foreign: supplier.unit_price_foreign,
        fx_rate: supplier.fx_rate,
        tariff_rate: supplier.tariff_rate || 0, // v2.5: 관세율
        additional_cost_rate: supplier.additional_cost_rate || 0, // v2.5: 부대비용율
        unit_price_krw: supplier.unit_price_krw,
        dmf_registered: supplier.dmf_registered || false,
        linkage_status: supplier.linkage_status || 'PREPARING',
        note: supplier.note?.trim() || null,
      }))
    )

    console.log(`💾 총 ${allSupplierInserts.length}개의 제조원 정보 삽입 예정`)

    const { data: insertedSuppliers, error: insertError } = await supabase
      .from('suppliers')
      .insert(allSupplierInserts)
      .select()

    if (insertError) {
      console.error('Error inserting suppliers:', insertError)
      return NextResponse.json(
        { error: 'Failed to create suppliers' },
        { status: 500 }
      )
    }

    console.log(`✅ ${insertedSuppliers.length}개 제조원 정보 등록 완료`)

    // MARKET_RESEARCH 또는 SOURCING_REQUEST 단계인 targets를 SOURCING_COMPLETED로 변경
    const needsUpdateTargets = targets.filter(t =>
      t.current_stage === 'MARKET_RESEARCH' || t.current_stage === 'SOURCING_REQUEST'
    )

    if (needsUpdateTargets.length > 0) {
      const targetIds = needsUpdateTargets.map(t => t.id)

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
      const historyInserts = needsUpdateTargets.map(target => ({
        target_id: target.id,
        stage: 'SOURCING_COMPLETED',
        changed_at: new Date().toISOString(),
        actor_name: 'System',
        comment: `제조원 정보 ${suppliers.length}개 등록됨 (${target.current_stage} → SOURCING_COMPLETED)`,
      }))

      await supabase
        .from('stage_history')
        .insert(historyInserts)

      console.log(`✅ ${needsUpdateTargets.length}개 카드 SOURCING_COMPLETED로 전환 완료`)
      needsUpdateTargets.forEach(t => {
        console.log(`   - ${t.account_name} - ${t.product_name} (${t.current_stage} → SOURCING_COMPLETED)`)
      })
    } else {
      console.log(`ℹ️ 모든 카드가 이미 SOURCING_COMPLETED 이상 단계입니다. 단계 전환 생략.`)
    }

    // 삽입된 제조원 ID 배열 생성 (파일 업로드를 위해)
    const insertedIds = insertedSuppliers
      .filter(s => s.target_id === targets[0]?.id) // 첫 번째 target의 제조원만 (순서 보장)
      .map(s => s.id)

    return NextResponse.json({
      message: 'Success',
      affected_targets: targets.length,
      suppliers_created: insertedSuppliers.length,
      suppliers_per_target: suppliers.length,
      inserted_ids: insertedIds, // 파일 업로드를 위한 ID 배열
      all_inserted_suppliers: insertedSuppliers // 전체 삽입된 제조원 정보
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/suppliers/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
