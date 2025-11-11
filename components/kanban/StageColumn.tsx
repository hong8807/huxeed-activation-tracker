'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Stage, STAGE_LABELS, Target } from '@/types/database.types'
import TargetCard from './TargetCard'

interface StageColumnProps {
  stage: Stage
  targets: Target[]
}

export default function StageColumn({ stage, targets }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      type: 'column',
      stage,
    },
  })

  return (
    <div className="flex-shrink-0 w-80 min-w-80 bg-gray-100 rounded-lg">
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{STAGE_LABELS[stage]}</h3>
          <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
            {targets.length}
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`p-3 space-y-3 min-h-[200px] transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext
          items={targets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {targets.map((target) => (
            <TargetCard key={target.id} target={target} stage={stage} />
          ))}
        </SortableContext>

        {/* Empty State */}
        {targets.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">품목 없음</div>
        )}
      </div>
    </div>
  )
}
