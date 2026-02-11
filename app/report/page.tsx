import { Metadata } from 'next'
import { Suspense } from 'react'
import VisualizationReport from '@/components/report/VisualizationReport'
import ReportDownloadButton from '@/components/report/ReportDownloadButton'

// v2.14: 리포트 컴포넌트 로딩 스피너
function ReportLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-600">리포트 로딩 중...</p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: '전략 품목 진행 현황 리포트',
  description: 'HUXEED 신규품목 활성화 진행 현황 시각화 리포트',
}

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">전략 품목 진행 현황 리포트</h1>
          <p className="text-sm text-gray-500 mt-0.5">HUXEED 신규품목 활성화 진행 현황</p>
        </div>
        <ReportDownloadButton />
      </div>
      <Suspense fallback={<ReportLoadingSpinner />}>
        <VisualizationReport />
      </Suspense>
    </div>
  )
}
