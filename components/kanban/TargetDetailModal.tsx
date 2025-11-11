'use client'

import { Target, STAGE_LABELS } from '@/types/database.types'
import { formatKRW, formatPercent, formatNumber, formatDateFull } from '@/utils/format'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TargetDetailModalProps {
  target: Target
  onClose: () => void
}

interface StageHistory {
  id: string
  stage: string
  changed_at: string
  actor_name: string | null
  comment: string | null
}

interface Comment {
  id: string
  target_id: string
  user_name: string
  comment: string
  created_at: string
  updated_at: string
}

export default function TargetDetailModal({ target, onClose }: TargetDetailModalProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Target>>(target)
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    // Load stage history
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/stage-history/${target.id}`)
        if (response.ok) {
          const data = await response.json()
          setStageHistory(data.history || [])
        }
      } catch (error) {
        console.error('Error loading stage history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()

    // Load comments
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/comments?target_id=${target.id}`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setLoadingComments(false)
      }
    }
    loadComments()

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [target.id])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/update-target/${target.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update target')
      }

      alert('수정이 완료되었습니다.')
      setIsEditing(false)
      router.refresh()
      onClose()
    } catch (error) {
      console.error('Error updating target:', error)
      alert('수정에 실패했습니다: ' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(target)
    setIsEditing(false)
  }

  // Handle comment submission
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    // Get user name from localStorage (set during login)
    const userName = localStorage.getItem('userName')
    if (!userName) {
      alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
      return
    }

    setIsPostingComment(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: target.id,
          user_name: userName,
          comment: newComment.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '댓글 작성에 실패했습니다')
      }

      const data = await response.json()

      // Add new comment to the list (prepend to show newest first)
      setComments([data.comment, ...comments])
      setNewComment('')

    } catch (error) {
      console.error('Error posting comment:', error)
      alert('댓글 작성에 실패했습니다: ' + (error as Error).message)
    } finally {
      setIsPostingComment(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{target.account_name}</h2>
            <p className="text-sm text-gray-600 mt-1">{target.product_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <section className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <EditField label="연도" value={formData.year || ''} onChange={(v) => setFormData({...formData, year: Number(v)})} type="number" />
                  <EditField label="담당자" value={formData.owner_name || ''} onChange={(v) => setFormData({...formData, owner_name: v})} />
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">세그먼트</label>
                    <select
                      value={formData.segment || '일반'}
                      onChange={(e) => setFormData({...formData, segment: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="S">S (전략 거래처)</option>
                      <option value="P">P (우선순위 거래처)</option>
                      <option value="일반">일반</option>
                    </select>
                  </div>
                  <EditField label="예상 수량 (kg)" value={formData.est_qty_kg || ''} onChange={(v) => setFormData({...formData, est_qty_kg: Number(v)})} type="number" />
                  <EditField label="2025년 매출 (KRW)" value={formData.sales_2025_krw || ''} onChange={(v) => setFormData({...formData, sales_2025_krw: Number(v)})} type="number" />
                </>
              ) : (
                <>
                  <InfoRow label="연도" value={target.year || 'N/A'} />
                  <InfoRow label="담당자" value={target.owner_name || 'N/A'} />
                  <InfoRow
                    label="세그먼트"
                    value={
                      target.segment === 'S' ? 'S (전략 거래처)' :
                      target.segment === 'P' ? 'P (우선순위 거래처)' :
                      '일반'
                    }
                  />
                  <InfoRow label="예상 수량" value={target.est_qty_kg ? `${formatNumber(target.est_qty_kg)} kg` : 'N/A'} />
                  <InfoRow label="2025년 매출" value={target.sales_2025_krw ? formatKRW(target.sales_2025_krw) : 'N/A'} />
                </>
              )}
            </div>
          </section>

          {/* Stage Info */}
          <section className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              진행 상태
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="현재 단계"
                value={target.current_stage ? STAGE_LABELS[target.current_stage as keyof typeof STAGE_LABELS] : 'N/A'}
              />
              <InfoRow
                label="진척률"
                value={target.stage_progress_rate ? `${target.stage_progress_rate}%` : 'N/A'}
              />
              <InfoRow
                label="단계 변경일"
                value={target.stage_updated_at ? formatDateFull(target.stage_updated_at) : 'N/A'}
                colSpan={2}
              />
            </div>
          </section>

          {/* Stage History Timeline */}
          <section className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              단계 변경 이력
            </h3>

            {loadingHistory ? (
              <div className="text-center py-8 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2">이력 로딩 중...</p>
              </div>
            ) : stageHistory.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                단계 변경 이력이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {stageHistory.map((history, index) => (
                  <div key={history.id} className="relative pl-8 pb-4 last:pb-0">
                    {/* Timeline Line */}
                    {index < stageHistory.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-indigo-200"></div>
                    )}

                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow"></div>

                    {/* Content */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded">
                            {STAGE_LABELS[history.stage as keyof typeof STAGE_LABELS] || history.stage}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateFull(history.changed_at)}
                        </div>
                      </div>

                      {history.actor_name && (
                        <div className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">담당자:</span> {history.actor_name}
                        </div>
                      )}

                      {history.comment && (
                        <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded mt-2">
                          {history.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Comments Section */}
          <section className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              댓글 ({comments.length})
            </h3>

            {/* Comment Input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isPostingComment) {
                      handlePostComment()
                    }
                  }}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  disabled={isPostingComment}
                />
                <button
                  onClick={handlePostComment}
                  disabled={isPostingComment || !newComment.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPostingComment ? '작성 중...' : '작성'}
                </button>
              </div>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center py-8 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2">댓글 로딩 중...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                          {comment.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{comment.user_name}</div>
                          <div className="text-xs text-gray-500">{formatDateFull(comment.created_at)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap pl-10">
                      {comment.comment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Price Info - Current */}
          <section className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              거래처 현재 매입가
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <EditField label="통화" value={formData.curr_currency || ''} onChange={(v) => setFormData({...formData, curr_currency: v})} />
                  <EditField label="단가 (외화)" value={formData.curr_unit_price_foreign || ''} onChange={(v) => setFormData({...formData, curr_unit_price_foreign: Number(v)})} type="number" step="0.01" />
                  <EditField label="환율" value={formData.curr_fx_rate_input || ''} onChange={(v) => setFormData({...formData, curr_fx_rate_input: Number(v)})} type="number" step="0.01" />
                </>
              ) : (
                <>
                  <InfoRow label="통화" value={target.curr_currency || 'N/A'} />
                  <InfoRow label="단가 (외화)" value={target.curr_unit_price_foreign ? formatNumber(target.curr_unit_price_foreign) : 'N/A'} />
                  <InfoRow label="환율" value={target.curr_fx_rate_input ? formatNumber(target.curr_fx_rate_input) : 'N/A'} />
                </>
              )}
              <InfoRow label="단가 (KRW)" value={target.curr_unit_price_krw ? formatKRW(target.curr_unit_price_krw) : 'N/A'} />
              <InfoRow label="총액 (KRW)" value={target.curr_total_krw ? formatKRW(target.curr_total_krw) : 'N/A'} colSpan={2} highlight />
            </div>
          </section>

          {/* Price Info - Our Estimate */}
          <section className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-teal-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              우리 예상 판매가
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <EditField label="통화" value={formData.our_currency || ''} onChange={(v) => setFormData({...formData, our_currency: v})} />
                  <EditField label="단가 (외화)" value={formData.our_unit_price_foreign || ''} onChange={(v) => setFormData({...formData, our_unit_price_foreign: Number(v)})} type="number" step="0.01" />
                  <EditField label="환율" value={formData.our_fx_rate_input || ''} onChange={(v) => setFormData({...formData, our_fx_rate_input: Number(v)})} type="number" step="0.01" />
                </>
              ) : (
                <>
                  <InfoRow label="통화" value={target.our_currency || 'N/A'} />
                  <InfoRow label="단가 (외화)" value={target.our_unit_price_foreign ? formatNumber(target.our_unit_price_foreign) : 'N/A'} />
                  <InfoRow label="환율" value={target.our_fx_rate_input ? formatNumber(target.our_fx_rate_input) : 'N/A'} />
                </>
              )}
              <InfoRow label="단가 (KRW)" value={target.our_unit_price_krw ? formatKRW(target.our_unit_price_krw) : 'N/A'} />
              <InfoRow label="예상 매출 (KRW)" value={target.our_est_revenue_krw ? formatKRW(target.our_est_revenue_krw) : 'N/A'} colSpan={2} highlight />
            </div>
          </section>

          {/* Savings */}
          <section className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              절감 분석
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                label="kg당 절감액"
                value={target.saving_per_kg ? formatKRW(target.saving_per_kg) : 'N/A'}
              />
              <InfoRow
                label="절감률"
                value={target.saving_rate ? formatPercent(target.saving_rate) : 'N/A'}
                className={(target.saving_rate || 0) < 0 ? 'text-red-600' : 'text-green-600'}
              />
              <InfoRow
                label="총 절감액"
                value={target.total_saving_krw ? formatKRW(target.total_saving_krw) : 'N/A'}
                colSpan={2}
                highlight
                className={(target.total_saving_krw || 0) < 0 ? 'text-red-600' : 'text-green-600'}
              />
            </div>
          </section>

          {/* Note */}
          <section className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              비고
            </h3>
            {isEditing ? (
              <textarea
                value={formData.note || ''}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                className="w-full text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                placeholder="비고를 입력하세요"
              />
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{target.note || '없음'}</p>
            )}
          </section>

          {/* Metadata */}
          <section className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>생성일: {target.created_at ? formatDateFull(target.created_at) : 'N/A'}</div>
              <div>수정일: {target.updated_at ? formatDateFull(target.updated_at) : 'N/A'}</div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                수정하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper Components
interface InfoRowProps {
  label: string
  value: string | number
  colSpan?: 1 | 2
  highlight?: boolean
  className?: string
}

function InfoRow({ label, value, colSpan = 1, highlight, className }: InfoRowProps) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-lg' : ''} ${className || 'text-gray-900'}`}>
        {value}
      </dd>
    </div>
  )
}

interface EditFieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  step?: string
}

function EditField({ label, value, onChange, type = 'text', step }: EditFieldProps) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
