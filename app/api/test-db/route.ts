import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test query
    const { data, error, count } = await supabase
      .from('targets')
      .select('*', { count: 'exact' })

    return NextResponse.json({
      success: !error,
      error: error || null,
      count: count,
      dataLength: data?.length || 0,
      sampleData: data?.[0] || null,
      allData: data || [],
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : null,
    })
  }
}
