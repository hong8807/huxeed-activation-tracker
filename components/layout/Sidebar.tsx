'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  permissionKey?: keyof MenuPermissions; // 권한 체크용 키
}

interface MenuPermissions {
  dashboard: boolean;
  pipeline: boolean;
  sourcing: boolean;
  report: boolean;
  meetings: boolean;
  admin: boolean;
}

interface UserInfo {
  name: string;
  email: string;
  role: 'admin' | 'shared';
  permissions?: MenuPermissions;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', permissionKey: 'dashboard' },
  { name: 'Pipeline', href: '/pipeline', icon: 'view_kanban', permissionKey: 'pipeline' },
  { name: 'Sourcing', href: '/pipeline/sourcing', icon: 'inventory_2', permissionKey: 'sourcing' },
  { name: 'Reports', href: '/report', icon: 'assessment', permissionKey: 'report' },
  { name: 'Meetings', href: '/meetings', icon: 'event_note', permissionKey: 'meetings' },
  { name: 'Documents', href: '/pipeline/documents', icon: 'folder_open', permissionKey: 'pipeline' }, // Pipeline 권한 사용
  { name: 'New Registration', href: '/pipeline/add', icon: 'add_circle', permissionKey: 'pipeline' }, // Pipeline 권한 사용
  { name: 'Excel Upload', href: '/pipeline/upload', icon: 'upload_file', permissionKey: 'pipeline' }, // Pipeline 권한 사용
];

const adminNavItems: NavItem[] = [
  { name: 'Admin Settings', href: '/admin/settings', icon: 'settings', permissionKey: 'admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 세션 정보 가져오기
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();

          // 사용자 정보 설정
          setUser({
            name: data.accessorName || data.email.split('@')[0],
            email: data.email,
            role: data.role,
            permissions: data.permissions, // 권한 정보 추가
          });
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };

    fetchSession();
  }, []);

  // 권한 확인 함수
  const hasPermission = (permissionKey?: keyof MenuPermissions): boolean => {
    // Admin은 모든 권한 가짐
    if (user?.role === 'admin') {
      return true;
    }

    // permissionKey가 없으면 접근 허용 (권한 체크 불필요한 메뉴)
    if (!permissionKey) {
      return true;
    }

    // 권한 정보가 없으면 기본 허용 (이전 버전 호환성)
    if (!user?.permissions) {
      return true;
    }

    // 권한 체크
    return user.permissions[permissionKey] === true;
  };

  // 권한에 따라 필터링된 메뉴 아이템
  const filteredNavItems = navItems.filter((item) => hasPermission(item.permissionKey));
  const filteredAdminItems = adminNavItems.filter((item) => hasPermission(item.permissionKey));

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-[#1f2316] border-r border-card-border dark:border-card-border-dark flex flex-col">
      {/* Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-card-border dark:border-card-border-dark">
        <Image
          src="/logo.png"
          alt="HUXEED Logo"
          width={120}
          height={32}
          className="h-6 w-auto"
          priority
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="flex flex-col gap-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold">{item.name}</span>
                </Link>
              </li>
            );
          })}

          {/* Admin/Permission-based Menu */}
          {filteredAdminItems.length > 0 && (
            <>
              <li className="my-2">
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
              </li>
              {filteredAdminItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                        ${isActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {item.icon}
                      </span>
                      <span className="text-sm font-semibold">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-card-border dark:border-card-border-dark">
        <div className="p-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {user.role === 'shared' && (
                  <p className="text-xs text-primary dark:text-primary/80 mt-0.5">
                    공용 계정
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="
              w-full flex items-center justify-center gap-2
              px-3 py-1.5 rounded-md
              text-xs text-gray-600 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-900 dark:hover:text-white
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <span className="material-symbols-outlined text-sm">
              logout
            </span>
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
