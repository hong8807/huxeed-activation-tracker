'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { Stage, STAGE_LABELS, Target } from '@/types/database.types'
import { STAGE_ORDER } from '@/utils/constants'
import { formatKRW, formatPercent } from '@/utils/format'
import StageColumn from './StageColumn'
import StageChangeModal from './StageChangeModal'
import { useRouter } from 'next/navigation'

interface KanbanBoardProps {
  initialTargets: Target[]
  owners: string[]
}

export default function KanbanBoard({ initialTargets, owners }: KanbanBoardProps) {
  const router = useRouter()
  const [targets, setTargets] = useState<Target[]>(initialTargets)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<string>('전체')
  const [pendingStageChange, setPendingStageChange] = useState<{
    target: Target
    newStage: Stage
  } | null>(null)

  // Refs for scroll synchronization
  const topScrollRef = useRef<HTMLDivElement>(null)
  const boardScrollRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch by only rendering DnD on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update targets when initialTargets changes (e.g., after router.refresh())
  useEffect(() => {
    setTargets(initialTargets)
  }, [initialTargets])

  // Sync scroll between top scrollbar and board
  const handleTopScroll = () => {
    if (topScrollRef.current && boardScrollRef.current) {
      boardScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }

  const handleBoardScroll = () => {
    if (topScrollRef.current && boardScrollRef.current) {
      topScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Filter targets by selected owner
  const filteredTargets = useMemo(() => {
    if (selectedOwner === '전체') {
      return targets
    }
    return targets?.filter((t) => t.owner_name === selectedOwner) || []
  }, [targets, selectedOwner])

  // Group targets by stage
  const targetsByStage = useMemo(() => {
    return STAGE_ORDER.reduce((acc, stage) => {
      acc[stage] = filteredTargets?.filter((t) => t.current_stage === stage) || []
      return acc
    }, {} as Record<Stage, Target[]>)
  }, [filteredTargets])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const targetId = active.id as string

    // Determine the new stage from either column or card data
    let newStage: Stage | undefined

    if (over.data?.current?.type === 'column') {
      // Dropped on column area
      newStage = over.id as Stage
    } else if (over.data?.current?.stage) {
      // Dropped on another card - use that card's stage
      newStage = over.data.current.stage as Stage
    }

    if (!newStage) {
      console.warn('⚠️ Could not determine target stage:', { over })
      return
    }

    const target = targets.find((t) => t.id === targetId)
    if (!target) {
      console.warn('⚠️ Target not found:', targetId)
      return
    }

    if (target.current_stage === newStage) {
      console.log('✅ Already in this stage, no update needed')
      return
    }

    console.log('🎯 Drag & Drop:', {
      targetId,
      targetName: `${target.account_name} - ${target.product_name}`,
      from: target.current_stage,
      to: newStage,
      dropType: over.data?.current?.type
    })

    // Show modal for comment input
    setPendingStageChange({ target, newStage })
  }

  const handleStageChangeConfirm = async (comment: string, actorName: string) => {
    if (!pendingStageChange) return

    const { target, newStage } = pendingStageChange
    const originalTargets = [...targets]

    // Optimistic update
    const updatedTargets = targets.map((t) =>
      t.id === target.id
        ? { ...t, current_stage: newStage, stage_updated_at: new Date().toISOString() }
        : t
    )
    setTargets(updatedTargets)
    setPendingStageChange(null)

    try {
      // Call API to update stage with comment and actor
      const response = await fetch(`/api/update-stage/${target.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
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

      console.log('✅ Stage updated successfully')

      // Refresh data from server
      router.refresh()
    } catch (error) {
      console.error('❌ Error updating stage:', error)
      // Revert to original state on error
      setTargets(originalTargets)

      // 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '단계 변경에 실패했습니다.'
      alert(errorMessage)
    }
  }

  const handleStageChangeCancel = () => {
    setPendingStageChange(null)
  }

  const activeTarget = activeId ? targets.find((t) => t.id === activeId) : null

  // Show loading skeleton before client hydration
  if (!isMounted) {
    return (
      <div>
        {/* Top Scrollbar */}
        <div className="mb-4 overflow-x-auto" style={{ height: '20px' }}>
          <div style={{ width: `${STAGE_ORDER.length * 336}px`, height: '1px' }}></div>
        </div>

        {/* Board */}
        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-80 min-w-80 bg-gray-100 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{STAGE_LABELS[stage]}</h3>
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
                    {targetsByStage[stage]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {targetsByStage[stage]?.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-400">품목 없음</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">담당자 필터:</span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedOwner('전체')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedOwner === '전체'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체 ({targets.length})
          </button>
          {owners.map((owner) => {
            const count = targets.filter((t) => t.owner_name === owner).length
            return (
              <button
                key={owner}
                onClick={() => setSelectedOwner(owner)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedOwner === owner
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {owner} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Top Scrollbar */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="mb-4 overflow-x-auto border border-gray-300 rounded-lg bg-gray-50"
        style={{ height: '20px' }}
      >
        <div style={{ width: `${STAGE_ORDER.length * 336}px`, height: '1px' }}></div>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={boardScrollRef}
          onScroll={handleBoardScroll}
          className="overflow-x-auto pb-4"
        >
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {STAGE_ORDER.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                targets={targetsByStage[stage] || []}
              />
            ))}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTarget ? (
            <div className="bg-white rounded-lg border-2 border-blue-500 p-4 shadow-lg opacity-90 w-80">
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900 text-sm">{activeTarget.account_name}</h4>
                <p className="text-sm text-gray-600 mt-1">{activeTarget.product_name}</p>
              </div>
              <div className="mb-3">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    (activeTarget.saving_rate || 0) > 0.1
                      ? 'bg-green-100 text-green-800'
                      : (activeTarget.saving_rate || 0) > 0.05
                      ? 'bg-blue-100 text-blue-800'
                      : (activeTarget.saving_rate || 0) > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {formatPercent(activeTarget.saving_rate)}
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>담당자</span>
                  <span className="font-medium text-gray-900">{activeTarget.owner_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>절감액</span>
                  <span className="font-medium text-gray-900">
                    {formatKRW(activeTarget.total_saving_krw)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Stage Change Modal */}
      {pendingStageChange && (
        <StageChangeModal
          target={pendingStageChange.target}
          newStage={pendingStageChange.newStage}
          onConfirm={handleStageChangeConfirm}
          onCancel={handleStageChangeCancel}
        />
      )}
    </div>
  )
}
