import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증되지 않았습니다' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)

    // Get user's download permission from database
    const supabase = await createClient()
    const { data: user } = await supabase
      .from('users')
      .select('can_download_meetings')
      .eq('email', session.email)
      .single()

    return NextResponse.json({
      success: true,
      email: session.email,
      role: session.role,
      accessorName: session.accessorName || null,
      can_download_meetings: user?.can_download_meetings || false,    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: '세션 확인 실패' },
      { status: 401 }
    )
  }
}
