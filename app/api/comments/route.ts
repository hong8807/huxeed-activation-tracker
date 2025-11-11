import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/comments?target_id=xxx - 특정 타겟의 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const targetId = searchParams.get('target_id')

    if (!targetId) {
      return NextResponse.json(
        { error: 'target_id가 필요합니다' },
        { status: 400 }
      )
    }

    // 댓글 목록 조회 (최신순)
    const { data: comments, error } = await supabase
      .from('target_comments')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('댓글 조회 실패:', error)
      return NextResponse.json(
        { error: '댓글 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comments: comments || []
    })

  } catch (error) {
    console.error('댓글 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/comments - 새 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const { target_id, user_name, comment } = body

    // 필수 필드 검증
    if (!target_id || !user_name || !comment) {
      return NextResponse.json(
        { error: 'target_id, user_name, comment가 모두 필요합니다' },
        { status: 400 }
      )
    }

    // 댓글이 비어있는지 확인
    if (comment.trim().length === 0) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // 댓글 작성
    const { data: newComment, error } = await supabase
      .from('target_comments')
      .insert({
        target_id,
        user_name,
        comment: comment.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('댓글 작성 실패:', error)
      return NextResponse.json(
        { error: '댓글 작성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment: newComment
    })

  } catch (error) {
    console.error('댓글 작성 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
