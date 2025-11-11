import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and non-Promise params
    const params = await Promise.resolve(context.params)
    const { id } = params

    console.log('📜 Fetching stage history for target:', id)

    if (!id) {
      console.error('❌ Missing target ID')
      return NextResponse.json({ error: 'Missing target ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch stage history ordered by changed_at descending (newest first)
    const { data: history, error } = await supabase
      .from('stage_history')
      .select('*')
      .eq('target_id', id)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching stage history:', error)
      return NextResponse.json({ error: 'Failed to fetch stage history', details: error }, { status: 500 })
    }

    console.log(`✅ Found ${history?.length || 0} history entries`)

    return NextResponse.json({ history: history || [] })
  } catch (error) {
    console.error('💥 Error in stage-history API:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
