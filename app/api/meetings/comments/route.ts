import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingItemId = searchParams.get('meeting_item_id');

    if (!meetingItemId) {
      return NextResponse.json(
        { error: 'meeting_item_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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
    const { meeting_item_id, user_name, comment_text } = body;

    if (!meeting_item_id || !user_name || !comment_text) {
      return NextResponse.json(
        { error: 'meeting_item_id, user_name, and comment_text are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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
      console.error('Failed to create comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/meetings/comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
