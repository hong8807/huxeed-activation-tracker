import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeProductName } from '@/utils/format'

/**
 * PUT /api/suppliers/[id]
 * 제조원 정보 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and non-Promise params
    const params = await Promise.resolve(context.params)
    const { id } = params

    const supabase = await createClient()
    const body = await request.json()

    const {
      supplier_name,
      created_by_name, // v2.5: 입력자명
      currency,
      unit_price_foreign,
      fx_rate,
      tariff_rate, // v2.5: 관세율
      additional_cost_rate, // v2.5: 부대비용율
      dmf_registered,
      linkage_status,
      note,
      unit_price_krw, // 클라이언트에서 계산된 값 사용
    } = body

    // 제조원 정보 업데이트
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        supplier_name,
        created_by_name, // v2.5: 입력자명
        currency,
        unit_price_foreign,
        fx_rate,
        tariff_rate: tariff_rate || 0, // v2.5: 관세율
        additional_cost_rate: additional_cost_rate || 0, // v2.5: 부대비용율
        unit_price_krw, // 클라이언트에서 계산한 최종 KRW
        dmf_registered,
        linkage_status,
        note,
        updated_at: new Date().toISOString(), // 수정 시간 업데이트
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating supplier:', error)
      return NextResponse.json(
        { error: 'Failed to update supplier' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/suppliers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suppliers/[id]
 * 제조원 정보 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and non-Promise params
    const params = await Promise.resolve(context.params)
    const { id } = params

    const supabase = await createClient()

    // 삭제 전에 해당 제조원의 품목명을 가져옴
    const { data: supplierToDelete, error: fetchError } = await supabase
      .from('suppliers')
      .select('product_name')
      .eq('id', id)
      .single()

    if (fetchError || !supplierToDelete) {
      console.error('Error fetching supplier:', fetchError)
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    const productName = supplierToDelete.product_name
    console.log(`🗑️  제조원 삭제: 품목명="${productName}"`)

    // 제조원 삭제
    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting supplier:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete supplier' },
        { status: 500 }
      )
    }

    console.log(`✅ 제조원 정보 삭제 완료`)

    // 삭제 후 남은 제조원 개수 확인 (정규화된 품목명 기준)
    const normalizedProductName = normalizeProductName(productName)
    const { data: allSuppliers, error: remainingError } = await supabase
      .from('suppliers')
      .select('*')

    if (remainingError) {
      console.error('Error checking remaining suppliers:', remainingError)
    }

    const remainingSuppliers = allSuppliers?.filter(
      s => normalizeProductName(s.product_name) === normalizedProductName
    ) || []

    const remainingCount = remainingSuppliers.length
    console.log(`📊 남은 제조원 개수: ${remainingCount}개`)

    // 제조원이 0개가 되면 해당 품목의 모든 카드를 SOURCING_REQUEST로 되돌림
    if (remainingCount === 0) {
      console.log(`⚠️  제조원이 모두 삭제되었습니다. 관련 카드를 SOURCING_REQUEST로 되돌립니다.`)

      // 해당 품목의 모든 targets 조회 (정규화된 품목명 기준)
      const { data: allTargets, error: targetsError } = await supabase
        .from('targets')
        .select('*')

      if (targetsError) {
        console.error('Error fetching targets:', targetsError)
      } else {
        const targets = allTargets?.filter(
          target => normalizeProductName(target.product_name) === normalizedProductName
        ) || []

        // SOURCING_COMPLETED 이후 단계에 있는 카드들만 SOURCING_REQUEST로 되돌림
        const targetsToRollback = targets.filter(t => {
          const currentStageIndex = [
            'MARKET_RESEARCH',
            'SOURCING_REQUEST',
            'SOURCING_COMPLETED',
            'QUOTE_SENT',
            'SAMPLE_SHIPPED',
            'QUALIFICATION',
            'DMF_RA_REVIEW',
            'PRICE_AGREED',
            'TRIAL_PO',
            'REGISTRATION',
            'COMMERCIAL_PO',
            'WON'
          ].indexOf(t.current_stage)

          const sourcingCompletedIndex = 2 // SOURCING_COMPLETED의 인덱스

          return currentStageIndex >= sourcingCompletedIndex
        })

        if (targetsToRollback.length > 0) {
          console.log(`🔄 ${targetsToRollback.length}개 카드를 SOURCING_REQUEST로 되돌립니다.`)

          const targetIds = targetsToRollback.map(t => t.id)

          // 단계 되돌리기
          const { error: rollbackError } = await supabase
            .from('targets')
            .update({
              current_stage: 'SOURCING_REQUEST',
              stage_progress_rate: 5, // 소싱요청 단계는 5%
              stage_updated_at: new Date().toISOString(),
            })
            .in('id', targetIds)

          if (rollbackError) {
            console.error('Error rolling back stages:', rollbackError)
          } else {
            // stage_history에 기록
            const historyInserts = targetsToRollback.map(target => ({
              target_id: target.id,
              stage: 'SOURCING_REQUEST',
              changed_at: new Date().toISOString(),
              actor_name: 'System',
              comment: `제조원 정보 모두 삭제됨 (${target.current_stage} → SOURCING_REQUEST)`,
            }))

            await supabase
              .from('stage_history')
              .insert(historyInserts)

            console.log(`✅ 단계 되돌리기 완료`)
            targetsToRollback.forEach(t => {
              console.log(`   - ${t.account_name} - ${t.product_name} (${t.current_stage} → SOURCING_REQUEST)`)
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      remaining_suppliers: remainingCount,
      rolled_back: remainingCount === 0
    })
  } catch (error) {
    console.error('Error in DELETE /api/suppliers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
