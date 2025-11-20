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

    console.log('📧 Session check for:', session.email)
    console.log('👤 Accessor name:', session.accessorName)
    console.log('🔐 Session permissions:', session.permissions)

    let canDownload = false

    // 1. 세션에 이미 권한 정보가 있는 경우 (이름으로 로그인한 경우)
    if (session.permissions?.can_download_meetings !== undefined) {
      canDownload = session.permissions.can_download_meetings === true
      console.log('✅ Using session permissions, can download:', canDownload)
    } else {
      // 2. 세션에 권한 정보가 없는 경우 (이메일로 직접 로그인한 경우)
      const supabase = await createClient()
      const { data: subscriber, error: subscriberError } = await supabase
        .from('email_subscribers')
        .select('permissions, is_active')
        .eq('email', session.email)
        .single()

      console.log('📊 Subscriber data:', subscriber)
      console.log('❌ Subscriber error:', subscriberError)

      // Check if user is active and has download permission
      canDownload = subscriber?.is_active && subscriber?.permissions?.can_download_meetings === true
      console.log('✅ Using database permissions, can download:', canDownload)
    }

    return NextResponse.json({
      success: true,
      email: session.email,
      role: session.role,
      accessorName: session.accessorName || null,
      can_download_meetings: canDownload,
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: '세션 확인 실패' },
      { status: 401 }
    )
  }
}
