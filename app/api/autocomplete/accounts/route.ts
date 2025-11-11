import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/autocomplete/accounts
 * 거래처명 자동완성 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('targets')
      .select('account_name')
      .order('account_name', { ascending: true })

    if (error) {
      console.error('Error fetching account names:', error)
      return NextResponse.json(
        { error: 'Failed to fetch account names' },
        { status: 500 }
      )
    }

    // 중복 제거 및 null/empty 제거
    const uniqueAccounts = Array.from(
      new Set(
        data
          .map((item) => item.account_name)
          .filter((name) => name && name.trim() !== '')
      )
    ).sort()

    return NextResponse.json(uniqueAccounts)
  } catch (error) {
    console.error('Error in GET /api/autocomplete/accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
