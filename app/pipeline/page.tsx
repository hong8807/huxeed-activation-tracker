import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/kanban/KanbanBoard'

export default async function PipelinePage() {
  const supabase = await createClient()

  // Fetch all targets
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .order('stage_updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching targets:', error)
  }

  // Extract unique owners for filter
  const owners = Array.from(new Set(targets?.map(t => t.owner_name).filter(Boolean))) as string[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-900">활성화 파이프라인</h1>
          <p className="text-sm text-gray-600 mt-1">드래그하여 단계를 이동하세요</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="px-8 py-4">
        <KanbanBoard initialTargets={targets || []} owners={owners} />
      </div>

      {/* Stats Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3">
        <div className="w-full">
          <div className="flex gap-6 text-sm">
            <span className="text-gray-600">
              전체 품목: <strong className="text-gray-900">{targets?.length || 0}</strong>
            </span>
            <span className="text-gray-600">
              진행 중: <strong className="text-blue-600">
                {targets?.filter(t => !['WON', 'LOST', 'ON_HOLD'].includes(t.current_stage || '')).length || 0}
              </strong>
            </span>
            <span className="text-gray-600">
              완료: <strong className="text-green-600">
                {targets?.filter(t => t.current_stage === 'WON').length || 0}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
