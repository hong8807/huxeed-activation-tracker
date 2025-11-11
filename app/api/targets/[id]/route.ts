import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/targets/[id]
 * 품목 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 먼저 해당 target이 존재하는지 확인
    const { data: existingTarget, error: fetchError } = await supabase
      .from('targets')
      .select('id, account_name, product_name')
      .eq('id', id)
      .single()

    if (fetchError || !existingTarget) {
      return NextResponse.json(
        { error: '품목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // targets 테이블에서 삭제 (cascade로 연관 데이터도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from('targets')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting target:', deleteError)
      return NextResponse.json(
        { error: '품목 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: '품목이 삭제되었습니다.',
        deleted: {
          id: existingTarget.id,
          account_name: existingTarget.account_name,
          product_name: existingTarget.product_name
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/targets/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
