'use client'

import { useState, useEffect } from 'react'
import { Stage, STAGE_LABELS, Target } from '@/types/database.types'

interface StageChangeModalProps {
  target: Target
  newStage: Stage
  onConfirm: (comment: string, actorName: string) => void
  onCancel: () => void
}

export default function StageChangeModal({ target, newStage, onConfirm, onCancel }: StageChangeModalProps) {
  const [comment, setComment] = useState('')
  const [actorName, setActorName] = useState(target.owner_name || 'System')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleConfirm = () => {
    onConfirm(comment.trim(), actorName.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  if (!mounted) return null

  const currentStageLabel = target.current_stage ? STAGE_LABELS[target.current_stage as keyof typeof STAGE_LABELS] : 'N/A'
  const newStageLabel = STAGE_LABELS[newStage]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">단계 변경</h2>
          <p className="text-sm text-blue-100 mt-1">
            {target.account_name} - {target.product_name}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Stage Transition */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 text-right">
                <div className="text-xs text-gray-500 mb-1">현재 단계</div>
                <div className="text-sm font-semibold text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
                  {currentStageLabel}
                </div>
              </div>
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs text-gray-500 mb-1">새 단계</div>
                <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                  {newStageLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Actor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              담당자명
            </label>
            <input
              type="text"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="담당자명을 입력하세요"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              코멘트 <span className="text-gray-400 font-normal">(선택사항)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="단계 변경 사유나 특이사항을 입력하세요"
              rows={3}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="mt-1 text-xs text-gray-500">
              Ctrl/Cmd + Enter로 확인
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!actorName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
