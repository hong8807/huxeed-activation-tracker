import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// GET: 메일 수신자 목록 조회
export async function GET(request: NextRequest) {
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

    // 2. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 3. 메일 수신자 목록 조회
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch subscribers error:', error);
      return NextResponse.json(
        { error: '수신자 목록 조회 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscribers: data || [],
    });
  } catch (error) {
    console.error('Get email subscribers error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 메일 수신자 추가
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
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '이메일은 필수입니다' },
        { status: 400 }
      );
    }

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();

    // 4. 메일 수신자 추가
    const { error } = await supabase.from('email_subscribers').insert({
      email,
      name: name || null,
      is_active: true,
      subscribed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Insert subscriber error:', error);

      // 중복 이메일 체크
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: '수신자 추가 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '메일 수신자가 추가되었습니다',
    });
  } catch (error) {
    console.error('Add email subscriber error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
