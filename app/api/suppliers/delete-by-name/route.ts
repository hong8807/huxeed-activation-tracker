import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeProductName } from '@/utils/format'

/**
 * DELETE /api/suppliers/delete-by-name
 * 품목명과 제조원명으로 모든 관련 제조원 정보 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')
    const supplierName = searchParams.get('supplierName')

    if (!productName || !supplierName) {
      return NextResponse.json(
        { error: 'productName and supplierName parameters are required' },
        { status: 400 }
      )
    }

    console.log(`🗑️  삭제 요청: 품목명="${productName}", 제조원명="${supplierName}"`)

    // 정규화된 품목명으로 모든 제조원 조회
    const normalizedProductName = normalizeProductName(productName)

    const { data: allSuppliers, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')

    if (fetchError) {
      console.error('Error fetching suppliers:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }

    // 정규화된 품목명 + 제조원명으로 필터링
    const suppliersToDelete = allSuppliers?.filter(
      supplier =>
        normalizeProductName(supplier.product_name) === normalizedProductName &&
        supplier.supplier_name === supplierName
    ) || []

    if (suppliersToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No matching suppliers found' },
        { status: 404 }
      )
    }

    console.log(`📦 삭제 대상: ${suppliersToDelete.length}개 레코드`)

    // 모든 해당 제조원 정보 삭제
    const idsToDelete = suppliersToDelete.map(s => s.id)

    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      console.error('Error deleting suppliers:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete suppliers' },
        { status: 500 }
      )
    }

    console.log(`✅ ${suppliersToDelete.length}개 제조원 정보 삭제 완료`)

    // 삭제 후 남은 제조원 개수 확인
    const { data: remainingSuppliers, error: remainingError } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('product_name', productName)

    if (remainingError) {
      console.error('Error checking remaining suppliers:', remainingError)
    }

    const remainingCount = remainingSuppliers?.length || 0
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
      deleted_count: suppliersToDelete.length,
      remaining_suppliers: remainingCount,
      rolled_back: remainingCount === 0
    })
  } catch (error) {
    console.error('Error in DELETE /api/suppliers/delete-by-name:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
