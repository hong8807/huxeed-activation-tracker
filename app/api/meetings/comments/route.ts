import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 댓글 목록 조회 또는 댓글 개수 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingItemId = searchParams.get('meeting_item_id');
    const countOnly = searchParams.get('count_only') === 'true';

    if (!meetingItemId) {
      return NextResponse.json(
        { error: 'meeting_item_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 개수만 조회
    if (countOnly) {
      const { count, error } = await supabase
        .from('meeting_comments')
        .select('*', { count: 'exact', head: true })
        .eq('meeting_item_id', meetingItemId);

      if (error) {
        console.error('Failed to fetch comment count:', error);
        return NextResponse.json(
          { error: 'Failed to fetch comment count', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ count: count || 0 }, { status: 200 });
    }

    // 전체 댓글 목록 조회
    const { data, error } = await supabase
      .from('meeting_comments')
      .select('*')
      .eq('meeting_item_id', meetingItemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('GET /api/meetings/comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// 댓글 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Comment creation request:', body);

    const { meeting_item_id, user_name, comment_text } = body;

    if (!meeting_item_id || !user_name || !comment_text) {
      console.error('❌ Missing required fields:', { meeting_item_id, user_name, comment_text });
      return NextResponse.json(
        { error: 'meeting_item_id, user_name, and comment_text are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    console.log('🔄 Attempting to insert comment...');
    const { data, error } = await supabase
      .from('meeting_comments')
      .insert({
        meeting_item_id,
        user_name,
        comment_text,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      return NextResponse.json(
        {
          error: 'Failed to create comment',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    console.log('✅ Comment created successfully:', data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/meetings/comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
