import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SourcingRequestList from '@/components/sourcing/SourcingRequestList'
import ExchangeRateTable from '@/components/sourcing/ExchangeRateTable'

export default async function SourcingRequestPage() {
  const supabase = await createClient()

  // 소싱 관리 페이지: MARKET_RESEARCH 제외한 모든 품목 조회 (제조원 개수 표시용)
  // WON, LOST, ON_HOLD 포함 모든 단계에서 제조원 관리 가능
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .neq('current_stage', 'MARKET_RESEARCH')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching targets:', error)
  }

  // 품목별 제조원 개수 조회 (supplier_name + created_by_name으로 조회)
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('product_name, supplier_name, created_by_name')

  if (suppliersError) {
    console.error('Error fetching suppliers:', suppliersError)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">제조원 관리</h1>
            <p className="text-gray-600 mt-2">품목별 제조원 정보를 조회하고 관리하세요</p>
          </div>
          <Link
            href="/pipeline"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            파이프라인으로
          </Link>
        </div>

        {/* Exchange Rate Table */}
        <ExchangeRateTable />

        {/* Sourcing Request List */}
        <div className="bg-white rounded-lg shadow">
          <SourcingRequestList
            initialTargets={targets || []}
            initialSuppliers={suppliers || []}
          />
        </div>
      </div>
    </div>
  )
}
