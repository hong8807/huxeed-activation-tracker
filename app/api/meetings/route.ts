import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// v2.14: 페이지네이션 지원 추가
// - page: 페이지 번호 (1부터 시작, 기본값 1)
// - limit: 페이지당 항목 수 (기본값 50, 최대 100)
// - 전체 개수(total)와 페이지 정보 함께 반환

// GET: 회의 실행 항목 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const meetingType = searchParams.get('meeting_type');
    const isDone = searchParams.get('is_done');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // v2.14: 페이지네이션 파라미터
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // 최대 limit을 1000으로 설정 (클라이언트에서 전체 데이터 필요시 대응)
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    // 기본 필터 조건 구성
    let countQuery = supabase
      .from('meeting_items')
      .select('*', { count: 'exact', head: true });

    let dataQuery = supabase
      .from('meeting_items')
      .select('*')
      .order('meeting_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 필터 적용 (두 쿼리 모두에)
    if (meetingType) {
      countQuery = countQuery.eq('meeting_type', meetingType);
      dataQuery = dataQuery.eq('meeting_type', meetingType);
    }

    if (isDone !== null && isDone !== undefined) {
      const isDoneValue = isDone === 'true';
      countQuery = countQuery.eq('is_done', isDoneValue);
      dataQuery = dataQuery.eq('is_done', isDoneValue);
    }

    if (startDate) {
      countQuery = countQuery.gte('meeting_date', startDate);
      dataQuery = dataQuery.gte('meeting_date', startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte('meeting_date', endDate);
      dataQuery = dataQuery.lte('meeting_date', endDate);
    }

    // 병렬로 전체 개수와 데이터 조회
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    if (countResult.error) {
      console.error('Count Query Error:', countResult.error);
      return NextResponse.json(
        { error: '데이터 개수 조회 중 오류 발생', details: countResult.error.message },
        { status: 500 }
      );
    }

    if (dataResult.error) {
      console.error('Data Query Error:', dataResult.error);
      return NextResponse.json(
        { error: '데이터 조회 중 오류 발생', details: dataResult.error.message },
        { status: 500 }
      );
    }

    const total = countResult.count || 0;
    const totalPages = Math.ceil(total / limit);

    // v2.14: 페이지네이션 정보 포함 응답
    return NextResponse.json({
      data: dataResult.data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: '서버 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
