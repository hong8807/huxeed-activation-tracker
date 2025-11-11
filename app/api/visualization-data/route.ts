import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Target, Stage, STAGE_LABELS } from '@/types/database.types'
import { STAGE_ORDER } from '@/utils/constants'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all targets
    const { data: targets, error } = await supabase
      .from('targets')
      .select('*')
      .order('account_name', { ascending: true })

    if (error) {
      console.error('Error fetching targets:', error)
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 })
    }

    // Calculate KPIs
    const totalTargets = targets?.length || 0
    const avgProgress = targets?.reduce((sum, t) => sum + (t.stage_progress_rate || 0), 0) / totalTargets || 0
    const completedTargets = targets?.filter(t => t.current_stage === 'WON').length || 0

    // Target매출액 (모든 품목의 예상매출액 합)
    const targetRevenue = targets?.reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0) || 0

    // 예상 신규 매출액 (WON 단계 품목의 예상매출액 합)
    const achievedRevenue = targets?.filter(t => t.current_stage === 'WON')
      .reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0) || 0

    // 전략달성율 (%)
    const achievementRate = targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0

    // Stage funnel data
    const stageFunnel = STAGE_ORDER.map(stage => ({
      stage,
      label: STAGE_LABELS[stage],
      count: targets?.filter(t => t.current_stage === stage).length || 0,
    }))

    // Account progress data
    const accountMap = new Map<string, { count: number; totalProgress: number }>()
    targets?.forEach(t => {
      const account = t.account_name || 'Unknown'
      const existing = accountMap.get(account) || { count: 0, totalProgress: 0 }
      accountMap.set(account, {
        count: existing.count + 1,
        totalProgress: existing.totalProgress + (t.stage_progress_rate || 0),
      })
    })

    const accountProgress = Array.from(accountMap.entries())
      .map(([account, data]) => ({
        account,
        avgProgress: data.totalProgress / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.avgProgress - a.avgProgress)
      .slice(0, 10) // Top 10 accounts

    // Target timeline data (all targets with their current stage)
    const targetTimeline = targets?.map(t => ({
      id: t.id,
      account: t.account_name || 'Unknown',
      product: t.product_name || 'Unknown',
      stage: t.current_stage,
      stageLabel: t.current_stage ? STAGE_LABELS[t.current_stage as keyof typeof STAGE_LABELS] : 'N/A',
      progress: t.stage_progress_rate || 0,
      savingRate: t.saving_rate || 0,
      totalSaving: t.total_saving_krw || 0,
      revenue: t.our_est_revenue_krw || 0,
      owner: t.owner_name || 'N/A',
      updatedAt: t.stage_updated_at,
    })) || []

    // Owner distribution
    const ownerMap = new Map<string, number>()
    targets?.forEach(t => {
      const owner = t.owner_name || 'Unknown'
      ownerMap.set(owner, (ownerMap.get(owner) || 0) + 1)
    })

    const ownerDistribution = Array.from(ownerMap.entries())
      .map(([owner, count]) => ({ owner, count }))
      .sort((a, b) => b.count - a.count)

    // Sourcing supplier status - from SOURCING_COMPLETED to WON (not SOURCING_REQUEST/LOST/ON_HOLD)
    // Note: SOURCING_REQUEST is excluded because products with suppliers automatically move to SOURCING_COMPLETED
    const sourcingRelatedStages = [
      'SOURCING_COMPLETED',
      'QUOTE_SENT',
      'SAMPLE_SHIPPED',
      'QUALIFICATION',
      'DMF_RA_REVIEW',
      'PRICE_AGREED',
      'TRIAL_PO',
      'REGISTRATION',
      'COMMERCIAL_PO',
      'WON'
    ]

    const sourcingTargets = targets?.filter(t =>
      sourcingRelatedStages.includes(t.current_stage || '')
    ) || []

    // Group by product_name to avoid duplicates
    const productMap = new Map<string, Target>()
    sourcingTargets.forEach(target => {
      const productName = target.product_name || 'Unknown'
      if (!productMap.has(productName)) {
        productMap.set(productName, target)
      }
    })

    // Get unique supplier counts for each unique product with DMF and linkage status
    const sourcingSupplierStatus = await Promise.all(
      Array.from(productMap.values()).map(async (target) => {
        // Get suppliers with full information
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('supplier_name, dmf_registered, linkage_status')
          .eq('product_name', target.product_name)

        // Deduplicate by supplier_name (keep first occurrence)
        const supplierMap = new Map<string, { dmf_registered: boolean; linkage_status: string }>()
        suppliers?.forEach(s => {
          if (!supplierMap.has(s.supplier_name)) {
            supplierMap.set(s.supplier_name, {
              dmf_registered: s.dmf_registered || false,
              linkage_status: s.linkage_status || 'PREPARING',
            })
          }
        })

        // Calculate DMF and linkage status
        const totalSuppliers = supplierMap.size
        const dmfRegisteredCount = Array.from(supplierMap.values()).filter(s => s.dmf_registered).length
        const linkageCompletedCount = Array.from(supplierMap.values()).filter(s => s.linkage_status === 'COMPLETED').length

        return {
          id: target.id,
          productName: target.product_name || 'Unknown',
          supplierCount: totalSuppliers,
          dmfStatus: totalSuppliers > 0 ? `${dmfRegisteredCount}/${totalSuppliers}` : '-',
          linkageStatus: totalSuppliers > 0 ? `${linkageCompletedCount}/${totalSuppliers}` : '-',
        }
      })
    )

    // Sort by supplier count (ascending - show items with 0 suppliers first)
    const sortedSourcingStatus = sourcingSupplierStatus.sort((a, b) => a.supplierCount - b.supplierCount)

    return NextResponse.json({
      kpis: {
        totalTargets,
        avgProgress: Math.round(avgProgress * 10) / 10,
        completedTargets,
        targetRevenue,
        achievedRevenue,
        achievementRate: Math.round(achievementRate * 10) / 10,
      },
      stageFunnel,
      accountProgress,
      targetTimeline,
      ownerDistribution,
      sourcingSupplierStatus: sortedSourcingStatus,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in visualization-data API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
