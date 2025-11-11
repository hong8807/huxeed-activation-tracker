import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeProductName } from '@/utils/format'

/**
 * GET /api/suppliers/by-product?productName=xxx
 * 품목명으로 제조원 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')

    if (!productName) {
      return NextResponse.json(
        { error: 'productName parameter is required' },
        { status: 400 }
      )
    }

    // 정규화된 품목명으로 조회
    const normalizedName = normalizeProductName(productName)

    // 모든 제조원 조회 후 정규화된 이름으로 필터링
    const { data: allSuppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching suppliers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }

    // 클라이언트 측에서 정규화된 품목명으로 필터링
    const filteredSuppliers = allSuppliers?.filter(
      supplier => normalizeProductName(supplier.product_name) === normalizedName
    ) || []

    return NextResponse.json(filteredSuppliers)
  } catch (error) {
    console.error('Error in GET /api/suppliers/by-product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
