'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Target, Stage, STAGE_LABELS } from '@/types/database.types'
import { STAGE_ORDER } from '@/utils/constants'
import { formatKRW, formatPercent, formatDateShort, formatSavingRate, formatSavingAmount } from '@/utils/format'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TargetDetailModal from './TargetDetailModal'
import StageChangeModal from './StageChangeModal'
import SupplierInfoModal from './SupplierInfoModal'

interface TargetCardProps {
  target: Target
  stage: Stage
}

export default function TargetCard({ target, stage }: TargetCardProps) {
  const router = useRouter()
  const [isChangingStage, setIsChangingStage] = useState(false)
  const [showStageMenu, setShowStageMenu] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [pendingStageChange, setPendingStageChange] = useState<Stage | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSupplierInfo, setShowSupplierInfo] = useState(false)
  const [commentCount, setCommentCount] = useState<number>(0)

  // SOURCING_COMPLETED 이후 단계인지 확인
  const stageIndex = STAGE_ORDER.indexOf(target.current_stage as Stage)
  const sourcingCompletedIndex = STAGE_ORDER.indexOf(Stage.SOURCING_COMPLETED)
  const showSupplierButton = stageIndex >= sourcingCompletedIndex && stageIndex < STAGE_ORDER.indexOf(Stage.WON)

  // Load comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const response = await fetch(`/api/comments?target_id=${target.id}`)
        if (response.ok) {
          const data = await response.json()
          setCommentCount(data.comments?.length || 0)
        }
      } catch (error) {
        console.error('Error loading comment count:', error)
      }
    }
    loadCommentCount()
  }, [target.id])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: target.id,
    data: {
      type: 'target',
      target,
      stage,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleStageChange = (newStage: Stage) => {
    if (newStage === target.current_stage) {
      setShowStageMenu(false)
      return
    }

    setShowStageMenu(false)
    setPendingStageChange(newStage)
  }

  const handleStageChangeConfirm = async (comment: string, actorName: string) => {
    if (!pendingStageChange) return

    setIsChangingStage(true)
    setPendingStageChange(null)

    try {
      const response = await fetch(`/api/update-stage/${target.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: pendingStageChange,
          comment: comment || null,
          actor_name: actorName
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // v2.5: 제조원 정보 필수 에러 처리
        if (errorData.error === 'SUPPLIER_REQUIRED') {
          throw new Error(errorData.message || '제조원 정보를 먼저 등록해주세요.')
        }

        throw new Error(errorData.message || 'Failed to update stage')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating stage:', error)

      // 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '단계 변경에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setIsChangingStage(false)
    }
  }

  const handleStageChangeCancel = () => {
    setPendingStageChange(null)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    setShowStageMenu(false)

    try {
      const response = await fetch(`/api/targets/${target.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete target')
      }

      // 성공 시 페이지 새로고침
      router.refresh()
    } catch (error) {
      console.error('Error deleting target:', error)
      alert('품목 삭제에 실패했습니다.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
      >
        {/* Card Header with Stage Dropdown */}
        <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-gray-100">
          <div
            className="flex-1 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => {
              // Only open modal if not dragging
              if (!isDragging) {
                setShowDetailModal(true)
              }
            }}
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 text-sm">{target.account_name}</h4>
              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {commentCount}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{target.product_name}</p>
          </div>

        {/* Stage Change Dropdown Button */}
        <div className="relative ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowStageMenu(!showStageMenu)
            }}
            disabled={isChangingStage}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="단계 변경"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showStageMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStageMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto">
                {STAGE_ORDER.map((stageOption) => (
                  <button
                    key={stageOption}
                    onClick={() => handleStageChange(stageOption)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      stageOption === target.current_stage
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {STAGE_LABELS[stageOption]}
                  </button>
                ))}

                {/* Divider */}
                <div className="border-t border-gray-200 my-1" />

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStageMenu(false)
                    setShowDeleteConfirm(true)
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>

        {/* Card Body */}
        <div
          className="p-4 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            setShowDetailModal(true)
          }}
        >
          {/* Saving Rate Badge */}
          <div className="mb-3">
            {(() => {
              const hasCurrentPrice = !!(target.curr_unit_price_krw && target.curr_unit_price_krw > 0)
              const savingRateText = formatSavingRate(target.saving_rate, hasCurrentPrice)

              // 배지 색상 결정
              let badgeClass = 'bg-gray-100 text-gray-600' // 정보 없음

              if (hasCurrentPrice) {
                if (target.saving_rate === null || target.saving_rate === undefined) {
                  badgeClass = 'bg-gray-100 text-gray-600'
                } else if (target.saving_rate < 0) {
                  badgeClass = 'bg-red-100 text-red-800' // 역마진
                } else if (target.saving_rate > 0.1) {
                  badgeClass = 'bg-green-100 text-green-800'
                } else if (target.saving_rate > 0.05) {
                  badgeClass = 'bg-blue-100 text-blue-800'
                } else if (target.saving_rate > 0) {
                  badgeClass = 'bg-yellow-100 text-yellow-800'
                } else {
                  badgeClass = 'bg-gray-100 text-gray-600'
                }
              }

              return (
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${badgeClass}`}>
                  {savingRateText}
                </span>
              )
            })()}
          </div>

          {/* Supplier Info Button */}
          {showSupplierButton && (
            <div className="mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSupplierInfo(true)
                }}
                className="w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                제조원 정보 확인
              </button>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>담당자</span>
              <span className="font-medium text-gray-900">{target.owner_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>절감액</span>
              <span className={`font-medium ${
                target.total_saving_krw !== null && target.total_saving_krw < 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}>
                {formatSavingAmount(
                  target.total_saving_krw,
                  !!(target.curr_unit_price_krw && target.curr_unit_price_krw > 0)
                )}
              </span>
            </div>
            {target.stage_updated_at && (
              <div className="flex items-center justify-between">
                <span>업데이트</span>
                <span className="text-gray-500">{formatDateShort(target.stage_updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <TargetDetailModal target={target} onClose={() => setShowDetailModal(false)} />
      )}

      {/* Stage Change Modal */}
      {pendingStageChange && (
        <StageChangeModal
          target={target}
          newStage={pendingStageChange}
          onConfirm={handleStageChangeConfirm}
          onCancel={handleStageChangeCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">품목 삭제</h3>
                <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>{target.account_name}</strong>의 <strong>{target.product_name}</strong>을(를) 삭제하시겠습니까?
              </p>
              <p className="text-xs text-red-600">
                ⚠️ 단계 이력 및 제조원 정보도 함께 삭제됩니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Info Modal */}
      {showSupplierInfo && (
        <SupplierInfoModal target={target} onClose={() => setShowSupplierInfo(false)} />
      )}
    </>
  )
}
