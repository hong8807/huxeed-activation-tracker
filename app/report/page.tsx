import { Metadata } from 'next'
import VisualizationReport from '@/components/report/VisualizationReport'

export const metadata: Metadata = {
  title: '전략 품목 진행 현황 리포트',
  description: 'HUXEED 신규품목 활성화 진행 현황 시각화 리포트',
}

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <VisualizationReport />
    </div>
  )
}
