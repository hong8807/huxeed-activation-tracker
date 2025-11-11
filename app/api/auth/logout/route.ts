import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
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

    // If shared account with accessor name, update access log
    if (session.role === 'shared' && session.accessorName) {
      const supabase = await createClient()

      // Find the most recent access log for this session
      const { data: logs } = await supabase
        .from('access_logs')
        .select('*')
        .eq('user_email', session.email)
        .eq('accessor_name', session.accessorName)
        .order('login_time', { ascending: false })
        .limit(1)

      if (logs && logs.length > 0) {
        const log = logs[0]
        const loginTime = new Date(log.login_time)
        const logoutTime = new Date()
        const sessionDurationSeconds = Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000)

        // Update access log with logout time and session duration
        await supabase
          .from('access_logs')
          .update({
            logout_time: logoutTime.toISOString(),
            session_duration_seconds: sessionDurationSeconds,
          })
          .eq('id', log.id)
      }
    }

    // Clear session cookie
    cookieStore.delete('session')

    return NextResponse.json({
      success: true,
      message: '로그아웃되었습니다',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
