import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/autocomplete/suppliers
 * 제조원명 자동완성 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('suppliers')
      .select('supplier_name')
      .order('supplier_name', { ascending: true })

    if (error) {
      console.error('Error fetching supplier names:', error)
      return NextResponse.json(
        { error: 'Failed to fetch supplier names' },
        { status: 500 }
      )
    }

    // 중복 제거 및 null/empty 제거
    const uniqueSuppliers = Array.from(
      new Set(
        data
          .map((item) => item.supplier_name)
          .filter((name) => name && name.trim() !== '')
      )
    ).sort()

    return NextResponse.json(uniqueSuppliers)
  } catch (error) {
    console.error('Error in GET /api/autocomplete/suppliers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
