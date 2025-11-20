import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '성함을 입력해주세요' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: '성함은 최소 2자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // Get current session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '로그인 세션이 없습니다' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)

    // Only shared accounts need accessor name
    if (session.role !== 'shared') {
      return NextResponse.json(
        { error: '공용 계정만 접속자 이름을 설정할 수 있습니다' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // 이름으로 email_subscribers 조회하여 권한 확인
    const { data: subscriber, error: subscriberError } = await supabase
      .from('email_subscribers')
      .select('id, email, name, is_active, permissions')
      .eq('name', name.trim())
      .single()

    if (subscriberError || !subscriber) {
      return NextResponse.json(
        { error: '등록되지 않은 사용자입니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    if (!subscriber.is_active) {
      return NextResponse.json(
        { error: '비활성화된 사용자입니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 기본 권한 (권한 정보가 없는 경우)
    const defaultPermissions = {
      dashboard: true,
      pipeline: true,
      sourcing: true,
      report: true,
      meetings: true,
      admin: false,
      can_download_meetings: false,
    }

    const permissions = subscriber.permissions || defaultPermissions

    console.log('👤 Accessor login:', name.trim())
    console.log('📊 Subscriber permissions:', subscriber.permissions)
    console.log('✅ Final permissions:', permissions)
    console.log('📥 Can download meetings:', permissions.can_download_meetings)

    // Create access log entry
    const { error: logError } = await supabase
      .from('access_logs')
      .insert({
        user_email: session.email,
        accessor_name: name.trim(),
        login_time: session.loginTime,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })

    if (logError) {
      console.error('Access log creation error:', logError)
      return NextResponse.json(
        { error: '접속 로그 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    // Update session cookie with accessor name and permissions
    const updatedSession = {
      ...session,
      accessorName: name.trim(),
      permissions,
    }

    cookieStore.set('session', JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      accessorName: name.trim(),
    })
  } catch (error) {
    console.error('Set accessor error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
