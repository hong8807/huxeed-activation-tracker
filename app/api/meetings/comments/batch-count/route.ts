/**
 * Batch Comment Count API
 * v2.14 - Performance Optimization
 *
 * 여러 회의록 항목의 댓글 개수를 한 번의 요청으로 조회
 * 기존: N개 항목 = N개 API 호출 (100개 항목 = 100 요청 = ~10초)
 * 개선: N개 항목 = 1개 API 호출 (100개 항목 = 1 요청 = ~100ms)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CommentCountResult {
  [meetingItemId: string]: number
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body = await request.json()
    const { meeting_item_ids } = body

    if (!meeting_item_ids || !Array.isArray(meeting_item_ids)) {
      return NextResponse.json(
        { error: 'meeting_item_ids array is required' },
        { status: 400 }
      )
    }

    if (meeting_item_ids.length === 0) {
      return NextResponse.json({ counts: {} }, { status: 200 })
    }

    console.log(`📊 [배치 댓글 개수] ${meeting_item_ids.length}개 항목 조회 시작...`)

    const supabase = await createClient()

    // 단일 쿼리로 모든 댓글을 조회
    const { data, error } = await supabase
      .from('meeting_comments')
      .select('meeting_item_id')
      .in('meeting_item_id', meeting_item_ids)

    if (error) {
      console.error('❌ 배치 댓글 조회 실패:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comment counts', details: error.message },
        { status: 500 }
      )
    }

    // meeting_item_id별 카운트 계산
    const counts: CommentCountResult = {}

    // 초기화 (모든 ID에 대해 0으로 시작)
    for (const id of meeting_item_ids) {
      counts[id] = 0
    }

    // 실제 댓글 개수 계산
    for (const comment of data || []) {
      const id = comment.meeting_item_id
      if (counts[id] !== undefined) {
        counts[id]++
      }
    }

    const elapsed = Date.now() - startTime
    console.log(`📊 [배치 댓글 개수 완료] ${meeting_item_ids.length}개 항목, ${data?.length || 0}개 댓글, ${elapsed}ms`)

    return NextResponse.json({
      counts,
      meta: {
        requestedCount: meeting_item_ids.length,
        totalComments: data?.length || 0,
        elapsed: `${elapsed}ms`
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ POST /api/meetings/comments/batch-count error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
