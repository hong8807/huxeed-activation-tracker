'use client';

import { useState, useEffect } from 'react';
import bcryptjs from 'bcryptjs';

interface MenuPermissions {
  dashboard: boolean;
  pipeline: boolean;
  sourcing: boolean;
  report: boolean;
  meetings: boolean;
  admin: boolean;
  can_download_meetings: boolean;
}

interface EmailSubscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  subscribed_at: string;
  permissions: MenuPermissions;
}

const DEFAULT_PERMISSIONS: MenuPermissions = {
  dashboard: true,
  pipeline: true,
  sourcing: true,
  report: true,
  meetings: true,
  admin: false,
  can_download_meetings: false,
};

const MENU_LABELS = {
  dashboard: 'Dashboard',
  pipeline: 'Pipeline',
  sourcing: 'Sourcing',
  report: 'Report',
  meetings: 'Meetings',
  admin: 'Admin Settings',
  can_download_meetings: 'Meetings 다운로드',
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'subscribers'>('password');

  // 비밀번호 변경 상태
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  // 메일 수신자 상태
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [newSubscriberName, setNewSubscriberName] = useState('');
  const [isAddingSubscriber, setIsAddingSubscriber] = useState(false);

  // 메일 수신자 목록 불러오기
  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers();
    }
  }, [activeTab]);

  const fetchSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const response = await fetch('/api/admin/email-subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  // 공용 비밀번호 변경
  const handlePasswordUpdate = async () => {
    setUpdateError('');
    setUpdateMessage('');

    // 유효성 검증
    if (!newPassword) {
      setUpdateError('새 비밀번호를 입력해주세요');
      return;
    }

    if (newPassword.length < 8) {
      setUpdateError('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsUpdating(true);

    try {
      // 1. bcrypt 해시 생성
      const hash = await bcryptjs.hash(newPassword, 10);

      // 2. 비밀번호 업데이트 (이력 기록 & 메일 발송 포함)
      const updateResponse = await fetch('/api/admin/update-shared-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordHash: hash,
          plainPassword: newPassword, // 메일 발송용 평문 비밀번호
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || '비밀번호 업데이트 실패');
      }

      const result = await updateResponse.json();

      // 3. 성공 메시지 표시
      setUpdateMessage(result.message || '✅ 공용 계정 비밀번호가 성공적으로 변경되었습니다');
      setNewPassword('');
      setConfirmPassword('');

      // 4. 메일 발송 결과 로그
      if (result.emailSent && result.emailResults) {
        console.log('📧 메일 발송 결과:', result.emailResults);
      }
    } catch (error) {
      console.error('Password update error:', error);
      setUpdateError(
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // 메일 수신자 추가
  const handleAddSubscriber = async () => {
    if (!newSubscriberEmail) {
      alert('이메일을 입력해주세요');
      return;
    }

    setIsAddingSubscriber(true);

    try {
      const response = await fetch('/api/admin/email-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSubscriberEmail,
          name: newSubscriberName || null,
        }),
      });

      if (response.ok) {
        setNewSubscriberEmail('');
        setNewSubscriberName('');
        fetchSubscribers();
      } else {
        const data = await response.json();
        alert(data.error || '추가 실패');
      }
    } catch (error) {
      console.error('Add subscriber error:', error);
      alert('메일 수신자 추가에 실패했습니다');
    } finally {
      setIsAddingSubscriber(false);
    }
  };

  // 메일 수신자 삭제
  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/email-subscribers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSubscribers();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('Delete subscriber error:', error);
      alert('메일 수신자 삭제에 실패했습니다');
    }
  };

  // 권한 업데이트
  const handlePermissionChange = async (
    subscriberId: string,
    menu: keyof MenuPermissions,
    value: boolean
  ) => {
    try {
      const subscriber = subscribers.find((s) => s.id === subscriberId);
      if (!subscriber) return;

      const updatedPermissions = {
        ...subscriber.permissions,
        [menu]: value,
      };

      const response = await fetch(`/api/admin/email-subscribers/${subscriberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: updatedPermissions,
        }),
      });

      if (response.ok) {
        // UI 즉시 업데이트
        setSubscribers((prev) =>
          prev.map((s) =>
            s.id === subscriberId ? { ...s, permissions: updatedPermissions } : s
          )
        );
      } else {
        alert('권한 업데이트 실패');
      }
    } catch (error) {
      console.error('Update permission error:', error);
      alert('권한 업데이트에 실패했습니다');
    }
  };

  // 활성화/비활성화 토글
  const handleToggleActive = async (subscriberId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/email-subscribers/${subscriberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchSubscribers();
      } else {
        alert('상태 변경 실패');
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      alert('상태 변경에 실패했습니다');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        관리자 설정
      </h1>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'password'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            공용 계정 비밀번호
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subscribers'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            메일 수신자 및 권한 관리
          </button>
        </nav>
      </div>

      {/* 비밀번호 변경 탭 */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            공용 계정 비밀번호 변경
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            huxeed@huxeed.com 계정의 비밀번호를 변경합니다
          </p>

          <div className="space-y-4">
            {/* 새 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 비밀번호
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="최소 8자 이상"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비밀번호 확인
              </label>
              <input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* 에러 메시지 */}
            {updateError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{updateError}</p>
              </div>
            )}

            {/* 성공 메시지 */}
            {updateMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{updateMessage}</p>
              </div>
            )}

            {/* 변경 버튼 */}
            <button
              onClick={handlePasswordUpdate}
              disabled={isUpdating}
              className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? '변경 중...' : '비밀번호 변경'}
            </button>

            {/* 안내 문구 */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 비밀번호 변경 시 모든 메일 수신자에게 자동으로 알림이 발송됩니다
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 메일 수신자 및 권한 관리 탭 */}
      {activeTab === 'subscribers' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            메일 수신자 및 메뉴 접근 권한 관리
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            비밀번호 변경 알림을 받을 사용자와 각 사용자의 메뉴 접근 권한을 관리합니다
          </p>

          {/* 수신자 추가 폼 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              새 사용자 추가
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={newSubscriberEmail}
                onChange={(e) => setNewSubscriberEmail(e.target.value)}
                placeholder="이메일 주소"
                className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={newSubscriberName}
                onChange={(e) => setNewSubscriberName(e.target.value)}
                placeholder="이름 (로그인 시 입력할 이름)"
                className="w-48 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={handleAddSubscriber}
                disabled={isAddingSubscriber}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded hover:bg-primary-dark disabled:opacity-50"
              >
                {isAddingSubscriber ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>

          {/* 수신자 목록 */}
          {isLoadingSubscribers ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">로딩 중...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                등록된 사용자가 없습니다
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                      이메일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                      이름
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                      상태
                    </th>
                    {Object.entries(MENU_LABELS).map(([key, label]) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subscribers.map((subscriber) => {
                    const permissions = subscriber.permissions || DEFAULT_PERMISSIONS;
                    return (
                      <tr
                        key={subscriber.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {subscriber.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {subscriber.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              handleToggleActive(subscriber.id, subscriber.is_active)
                            }
                            className={`text-xs px-2 py-1 rounded ${
                              subscriber.is_active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300'
                            }`}
                          >
                            {subscriber.is_active ? '활성' : '비활성'}
                          </button>
                        </td>
                        {Object.keys(MENU_LABELS).map((menu) => (
                          <td key={menu} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[menu as keyof MenuPermissions]}
                              onChange={(e) =>
                                handlePermissionChange(
                                  subscriber.id,
                                  menu as keyof MenuPermissions,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 안내 문구 */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 <strong>이름</strong>: 로그인 후 입력할 이름입니다. 이 이름으로 로그인하면 체크된 메뉴만 접근 가능합니다.<br/>
              💡 <strong>상태</strong>: 비활성화하면 메일을 받지 않으며 로그인도 불가능합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
