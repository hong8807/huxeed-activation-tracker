import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// DELETE: 메일 수신자 삭제
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 세션 확인 (관리자만 접근 가능)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증되지 않았습니다' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근 가능합니다' },
        { status: 403 }
      );
    }

    // 2. ID 파싱
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 메일 수신자 삭제
    const { error } = await supabase
      .from('email_subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete subscriber error:', error);
      return NextResponse.json(
        { error: '수신자 삭제 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '메일 수신자가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Delete email subscriber error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
