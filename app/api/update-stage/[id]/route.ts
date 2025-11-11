import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Stage, STAGE_PROGRESS } from '@/types/database.types'
import { STAGE_ORDER } from '@/utils/constants'
import { normalizeProductName } from '@/utils/format'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and non-Promise params
    const params = await Promise.resolve(context.params)
    const { id } = params
    const { stage, comment, actor_name } = await request.json()

    console.log('📝 Update stage API called:', { id, stage, comment, actor_name })

    if (!id || !stage) {
      console.error('❌ Missing required fields:', { id, stage })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // 현재 target의 product_name 조회 (제조원 확인용)
    const { data: target, error: targetError } = await supabase
      .from('targets')
      .select('product_name')
      .eq('id', id)
      .single()

    if (targetError || !target) {
      console.error('❌ Error fetching target:', targetError)
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // 제조원 정보 조회 (정규화된 품목명으로 비교)
    const normalizedProductName = normalizeProductName(target.product_name)
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('product_name')

    if (supplierError) {
      console.error('❌ Error fetching suppliers:', supplierError)
      return NextResponse.json({ error: 'Failed to check supplier count' }, { status: 500 })
    }

    // 정규화된 품목명으로 필터링
    const matchingSuppliers = (suppliers || []).filter(s =>
      normalizeProductName(s.product_name) === normalizedProductName
    )

    const supplierCount = matchingSuppliers.length
    console.log(`📦 제조원 정보: ${supplierCount}개 (품목: ${target.product_name}, 정규화: ${normalizedProductName})`)

    // v2.5: 단계 이동 제한 검증 및 자동 전환
    let finalStage = stage as Stage
    const newStageIndex = STAGE_ORDER.indexOf(stage as Stage)
    const sourcingRequestIndex = STAGE_ORDER.indexOf(Stage.SOURCING_REQUEST)
    const sourcingCompletedIndex = STAGE_ORDER.indexOf(Stage.SOURCING_COMPLETED)

    // 케이스 1: SOURCING_REQUEST로 이동하려는 경우
    if (newStageIndex === sourcingRequestIndex) {
      if (supplierCount > 0) {
        // 제조원이 있으면 자동으로 SOURCING_COMPLETED로 변경
        finalStage = Stage.SOURCING_COMPLETED
        console.log(`✨ 자동 전환: SOURCING_REQUEST → SOURCING_COMPLETED (제조원 ${supplierCount}개 존재)`)
      } else {
        console.log(`📌 SOURCING_REQUEST 단계 유지 (제조원 없음)`)
      }
    }
    // 케이스 2: SOURCING_REQUEST 이후 단계로 이동하려는 경우
    else if (newStageIndex > sourcingRequestIndex) {
      // 제조원 정보가 없으면 단계 이동 불가
      if (supplierCount === 0) {
        console.warn(`⚠️ 제조원 정보 없음: ${target.product_name} (정규화: ${normalizedProductName})`)
        return NextResponse.json({
          error: 'SUPPLIER_REQUIRED',
          message: '제조원 정보를 먼저 등록해주세요.\n\n제조원 관리 페이지에서 제조원 정보를 등록한 후 다시 시도해주세요.'
        }, { status: 400 })
      }

      console.log(`✅ 제조원 정보 확인 완료: ${supplierCount}개 (품목: ${target.product_name})`)
    }

    // Calculate progress rate based on final stage (10, 20, 30... format)
    const progressRate = STAGE_PROGRESS[finalStage] || 0

    // Update target stage (with final stage after auto-conversion)
    const { error: updateError } = await supabase
      .from('targets')
      .update({
        current_stage: finalStage,
        stage_updated_at: new Date().toISOString(),
        stage_progress_rate: progressRate, // Store as 10, 20, 30... (not 0.1, 0.2, 0.3)
      })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error updating target:', updateError)
      return NextResponse.json({ error: 'Failed to update target', details: updateError }, { status: 500 })
    }

    console.log(`✅ Target updated successfully to ${finalStage}`)

    // Insert stage history with comment and actor (with final stage)
    let finalComment = comment || null
    if (finalStage === Stage.SOURCING_COMPLETED && stage === Stage.SOURCING_REQUEST) {
      // 자동 전환된 경우 코멘트 추가
      finalComment = `[자동 전환] 제조원 ${supplierCount}개 등록됨으로 소싱완료로 자동 이동${comment ? '. ' + comment : ''}`
    }

    const { error: historyError } = await supabase.from('stage_history').insert({
      target_id: id,
      stage: finalStage,
      changed_at: new Date().toISOString(),
      actor_name: actor_name || 'System',
      comment: finalComment,
    })

    if (historyError) {
      console.error('⚠️ Error inserting stage history:', historyError)
      // Don't fail the request if history insertion fails
    } else {
      console.log('✅ Stage history inserted')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 Error in update-stage API:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
