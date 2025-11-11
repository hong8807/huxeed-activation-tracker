import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/autocomplete/products
 * 품목명 자동완성 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('targets')
      .select('product_name')
      .order('product_name', { ascending: true })

    if (error) {
      console.error('Error fetching product names:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product names' },
        { status: 500 }
      )
    }

    // 중복 제거 및 null/empty 제거
    const uniqueProducts = Array.from(
      new Set(
        data
          .map((item) => item.product_name)
          .filter((name) => name && name.trim() !== '')
      )
    ).sort()

    return NextResponse.json(uniqueProducts)
  } catch (error) {
    console.error('Error in GET /api/autocomplete/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
