import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // 2. 요청 body 파싱
    const { passwordHash, changedBy } = await request.json();

    if (!passwordHash || !changedBy) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 비밀번호 변경 이력 기록
    const { error } = await supabase.from('password_history').insert({
      user_email: 'huxeed@huxeed.com',
      password_hash: passwordHash,
      changed_by: changedBy,
      is_notified: false, // 메일 발송 전이므로 false
      changed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Password history insert error:', error);
      return NextResponse.json(
        { error: '이력 기록 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호 변경 이력이 기록되었습니다',
    });
  } catch (error) {
    console.error('Password history error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
