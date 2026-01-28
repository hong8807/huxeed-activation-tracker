import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

interface MenuPermissions {
  dashboard: boolean;
  pipeline: boolean;
  sourcing: boolean;
  report: boolean;
  meetings: boolean;
  admin: boolean;
}

interface Session {
  email: string;
  role: 'admin' | 'shared';
  accessorName?: string;
  permissions?: MenuPermissions;
}

// 경로와 필요한 권한을 매핑
const PATH_PERMISSIONS: Record<string, keyof MenuPermissions | null> = {
  '/dashboard': 'dashboard',
  '/pipeline': 'pipeline',
  '/pipeline/sourcing': 'sourcing',
  '/pipeline/add': 'pipeline',
  '/pipeline/upload': 'pipeline',
  '/pipeline/documents': 'pipeline',
  '/report': 'report',
  '/meetings': 'meetings',
  '/admin': 'admin',
  '/admin/settings': 'admin',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지와 API 경로는 권한 체크 제외
  if (
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/set-accessor' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // 세션 쿠키 확인
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    // 세션이 없으면 로그인 페이지로 리디렉트
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session: Session = JSON.parse(sessionCookie.value);

    // Admin은 모든 페이지 접근 가능
    if (session.role === 'admin') {
      return NextResponse.next();
    }

    // 공용 계정인데 이름을 입력하지 않았으면 set-accessor로 리디렉트
    if (session.role === 'shared' && !session.accessorName) {
      if (pathname !== '/set-accessor') {
        return NextResponse.redirect(new URL('/set-accessor', request.url));
      }
      return NextResponse.next();
    }

    // 해당 경로에 필요한 권한 확인 (더 구체적인 경로부터 매칭)
    const sortedPaths = Object.keys(PATH_PERMISSIONS).sort(
      (a, b) => b.length - a.length
    );
    const requiredPermission = sortedPaths.find((path) =>
      pathname.startsWith(path)
    );

    if (requiredPermission) {
      const permissionKey = PATH_PERMISSIONS[requiredPermission];

      // 권한이 필요한 경로인 경우
      if (permissionKey) {
        // DB에서 최신 권한 조회
        const response = NextResponse.next();
        const supabase = createMiddlewareClient(request, response);

        const { data: subscriber, error } = await supabase
          .from('email_subscribers')
          .select('permissions, is_active')
          .eq('name', session.accessorName)
          .single();

        // DB 조회 실패 시 세션의 권한으로 폴백
        if (error || !subscriber) {
          console.log('Middleware: Failed to fetch permissions from DB, using session permissions');

          if (!session.permissions) {
            return NextResponse.next();
          }

          if (!session.permissions[permissionKey]) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          return NextResponse.next();
        }

        // 사용자가 비활성화된 경우 로그인 페이지로 리디렉트
        if (!subscriber.is_active) {
          console.log('Middleware: User is inactive, redirecting to login');
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('error', 'inactive');
          response.cookies.delete('session');
          return NextResponse.redirect(loginUrl);
        }

        const dbPermissions = subscriber.permissions as MenuPermissions | null;

        // 권한 체크
        if (!dbPermissions) {
          // 권한 정보가 없으면 기본 허용 (이전 버전 호환성)
          return response;
        }

        if (!dbPermissions[permissionKey]) {
          // 권한이 없으면 Dashboard로 리디렉트
          console.log(`Middleware: Permission denied for ${permissionKey}, redirecting to dashboard`);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // 세션의 권한과 DB의 권한이 다르면 세션 업데이트
        const sessionPermissionsStr = JSON.stringify(session.permissions);
        const dbPermissionsStr = JSON.stringify(dbPermissions);

        if (sessionPermissionsStr !== dbPermissionsStr) {
          console.log('Middleware: Permissions changed, updating session cookie');
          const updatedSession = {
            ...session,
            permissions: dbPermissions,
          };
          response.cookies.set('session', JSON.stringify(updatedSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          });
        }

        return response;
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // 세션 파싱 오류 시 로그인 페이지로 리디렉트
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
