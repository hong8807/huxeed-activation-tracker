import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 Login attempt for email:', email)

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = createAuthClient()

    // 사용자 조회
    console.log('📊 Querying users table...')
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('✅ User found:', user.email, 'Role:', user.role)

    // 비밀번호 확인
    console.log('🔒 Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    console.log('✅ Password valid')

    // 마지막 로그인 시간 업데이트
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('email', email)

    // 세션 쿠키 설정 (7일 유효)
    const cookieStore = await cookies()
    const sessionData = {
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString(),
    }

    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('✅ Login successful for:', user.email)

    return NextResponse.json({
      success: true,
      role: user.role,
      email: user.email,
    })
  } catch (error) {
    console.error('💥 Login error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
