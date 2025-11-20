import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 회의 실행 항목 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const meetingType = searchParams.get('meeting_type');
    const isDone = searchParams.get('is_done');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('meeting_items')
      .select('*')
      .order('meeting_date', { ascending: false })
      .order('created_at', { ascending: false });

    // 필터 적용
    if (meetingType) {
      query = query.eq('meeting_type', meetingType);
    }

    if (isDone !== null && isDone !== undefined) {
      query = query.eq('is_done', isDone === 'true');
    }

    if (startDate) {
      query = query.gte('meeting_date', startDate);
    }

    if (endDate) {
      query = query.lte('meeting_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Query Error:', error);
      return NextResponse.json(
        { error: '데이터 조회 중 오류 발생', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: '서버 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
