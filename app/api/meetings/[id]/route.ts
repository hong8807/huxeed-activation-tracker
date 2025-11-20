import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH: 회의 실행 항목 수정
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    const { meeting_type, meeting_date, account_name, content, assignee_name, reply_text, is_done } = body;

    const updateData: Record<string, any> = {};

    // 회의록 작성 내용 수정
    if (meeting_type !== undefined) {
      updateData.meeting_type = meeting_type;
    }

    if (meeting_date !== undefined) {
      updateData.meeting_date = meeting_date;
    }

    if (account_name !== undefined) {
      updateData.account_name = account_name || null;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    // 담당자 답변 수정
    if (assignee_name !== undefined) {
      updateData.assignee_name = assignee_name;
    }

    if (reply_text !== undefined) {
      updateData.reply_text = reply_text;
    }

    if (is_done !== undefined) {
      updateData.is_done = is_done;
    }

    const { data, error } = await supabase
      .from('meeting_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update Error:', error);
      return NextResponse.json(
        { error: '데이터 수정 중 오류 발생', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json(
      { error: '서버 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: 회의 실행 항목 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('meeting_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete Error:', error);
      return NextResponse.json(
        { error: '데이터 삭제 중 오류 발생', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: '서버 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
