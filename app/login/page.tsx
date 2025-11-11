'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import AccessorNameModal from '@/components/auth/AccessorNameModal'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAccessorModal, setShowAccessorModal] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '로그인에 실패했습니다')
        setIsLoading(false)
        return
      }

      // 공용 계정인 경우 접속자 이름 입력 필요
      if (data.role === 'shared') {
        setIsLoading(false)
        setShowAccessorModal(true)
      } else {
        // 관리자는 바로 대시보드로
        router.push('/dashboard')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다')
      setIsLoading(false)
    }
  }

  const handleAccessorNameSubmit = async (name: string) => {
    try {
      const response = await fetch('/api/auth/set-accessor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '접속자 이름 설정에 실패했습니다')
        setShowAccessorModal(false)
        return
      }

      // 사용자 이름을 localStorage에 저장 (댓글 기능에서 사용)
      localStorage.setItem('userName', name)

      // 접속자 이름 설정 성공 시 대시보드로 이동
      router.push('/dashboard')
    } catch (err) {
      setError('서버 오류가 발생했습니다')
      setShowAccessorModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* 페이지 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] animate-dynamic-title animate-pulse-glow inline-block">
            Huxeed V-track
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
            Vision Tracking System
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="relative bg-white dark:bg-background-dark rounded-2xl border border-card-border dark:border-card-border-dark shadow-xl p-8">
          {/* Vision 문구 */}
          <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 via-transparent to-gray-50/50 dark:from-gray-800/50 dark:to-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-gray-400 dark:from-transparent dark:via-gray-600 dark:to-gray-500"></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">VISION</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-300 to-gray-400 dark:from-transparent dark:via-gray-600 dark:to-gray-500"></div>
            </div>
            <p className="text-sm text-center text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              <span className="text-[#8CC63F] font-bold text-base">2028년</span>까지{' '}
              <span className="text-[#7AB82E] font-bold text-base">750억 이상</span>{' '}
              지속성장 하는 기업으로
              <br />
              원료의약품 판매{' '}
              <span className="text-[#6BA626] font-bold text-base">TOP 5</span> 진입
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* 이메일 입력 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-gray-700 transition-all placeholder:text-gray-400"
                placeholder="huxeed@huxeed.com"
                required
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white dark:focus:bg-gray-700 transition-all placeholder:text-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-gradient-to-r from-[#8CC63F] to-[#7AB82E] hover:from-[#7AB82E] hover:to-[#6BA626] text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8CC63F]/30 hover:shadow-xl hover:shadow-[#8CC63F]/40 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 공용 계정 안내 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
              공용 계정으로 로그인 시 접속자 성함을 입력해주세요
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2025 HUXEED. All rights reserved.
          </p>
        </div>
      </div>

      {/* Accessor Name Modal */}
      <AccessorNameModal
        isOpen={showAccessorModal}
        onSubmit={handleAccessorNameSubmit}
        onClose={() => setShowAccessorModal(false)}
      />
    </div>
  )
}
