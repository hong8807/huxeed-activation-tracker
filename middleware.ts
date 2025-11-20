import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
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

    // 해당 경로에 필요한 권한 확인
    const requiredPermission = Object.keys(PATH_PERMISSIONS).find((path) =>
      pathname.startsWith(path)
    );

    if (requiredPermission) {
      const permissionKey = PATH_PERMISSIONS[requiredPermission];

      // 권한이 필요한 경로인 경우
      if (permissionKey) {
        // 권한 정보가 없으면 기본 허용 (이전 버전 호환성)
        if (!session.permissions) {
          return NextResponse.next();
        }

        // 권한이 없으면 Dashboard로 리디렉트
        if (!session.permissions[permissionKey]) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
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
