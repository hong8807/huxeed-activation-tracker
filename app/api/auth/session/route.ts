import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

interface MenuPermissions {
  dashboard: boolean;
  pipeline: boolean;
  sourcing: boolean;
  report: boolean;
  meetings: boolean;
  admin: boolean;
  can_download_meetings?: boolean;
}

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

    // Admin은 모든 권한 보유
    if (session.role === 'admin') {
      return NextResponse.json({
        success: true,
        email: session.email,
        role: session.role,
        accessorName: session.accessorName || null,
        permissions: {
          dashboard: true,
          pipeline: true,
          sourcing: true,
          report: true,
          meetings: true,
          admin: true,
          can_download_meetings: true,
        },
        can_download_meetings: true,
      })
    }

    // 공용 계정인 경우 DB에서 최신 권한 조회
    let permissions: MenuPermissions | null = null
    let canDownload = false

    if (session.accessorName) {
      // 이름으로 로그인한 경우 - DB에서 최신 권한 조회
      const supabase = await createClient()
      const { data: subscriber, error: subscriberError } = await supabase
        .from('email_subscribers')
        .select('permissions, is_active')
        .eq('name', session.accessorName)
        .single()

      console.log('📊 Subscriber data:', subscriber)
      console.log('❌ Subscriber error:', subscriberError)

      if (subscriber && subscriber.is_active) {
        permissions = subscriber.permissions || null
        canDownload = subscriber.permissions?.can_download_meetings === true

        // 권한이 변경되었는지 확인하고 세션 업데이트
        const currentPermissionsStr = JSON.stringify(session.permissions)
        const newPermissionsStr = JSON.stringify(permissions)

        if (currentPermissionsStr !== newPermissionsStr) {
          console.log('🔄 Permissions changed, updating session cookie')
          console.log('   Old:', session.permissions)
          console.log('   New:', permissions)

          const updatedSession = {
            ...session,
            permissions,
          }

          cookieStore.set('session', JSON.stringify(updatedSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          })
        }
      } else if (!subscriber) {
        // 사용자가 삭제된 경우
        console.log('⚠️ User not found in database')
      } else if (!subscriber.is_active) {
        // 사용자가 비활성화된 경우
        console.log('⚠️ User is inactive')
      }
    } else {
      // 이름을 입력하지 않은 경우 (세션의 권한 사용)
      permissions = session.permissions || null
      canDownload = session.permissions?.can_download_meetings === true
    }

    console.log('✅ Final permissions:', permissions)
    console.log('✅ Can download:', canDownload)

    return NextResponse.json({
      success: true,
      email: session.email,
      role: session.role,
      accessorName: session.accessorName || null,
      permissions: permissions,
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
