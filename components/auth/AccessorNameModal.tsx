'use client'

import { useState } from 'react'

interface AccessorNameModalProps {
  isOpen: boolean
  onSubmit: (name: string) => void
  onClose: () => void
}

export default function AccessorNameModal({
  isOpen,
  onSubmit,
  onClose,
}: AccessorNameModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('성함을 입력해주세요')
      return
    }

    if (name.trim().length < 2) {
      setError('성함은 최소 2자 이상이어야 합니다')
      return
    }

    onSubmit(name.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-background-dark rounded-2xl border border-card-border dark:border-card-border-dark shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            접속자 정보
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            공용 계정 사용을 위해 성함을 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 입력 */}
          <div>
            <label
              htmlFor="accessor-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              성함 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accessor-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="홍길동"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              입력하신 성함은 활동 로그에 기록되며, 시스템 사용 현황 집계에 활용됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
