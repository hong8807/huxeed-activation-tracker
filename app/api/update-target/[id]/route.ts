import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const body = await request.json()
    const supabase = await createClient()

    // Validate required fields
    if (!body.account_name || !body.product_name) {
      return NextResponse.json(
        { error: '거래처명과 품목명은 필수입니다.' },
        { status: 400 }
      )
    }

    // Calculate derived fields
    const curr_unit_price_krw = body.curr_unit_price_foreign && body.curr_fx_rate_input
      ? body.curr_unit_price_foreign * body.curr_fx_rate_input
      : null

    const curr_total_krw = curr_unit_price_krw && body.est_qty_kg
      ? curr_unit_price_krw * body.est_qty_kg
      : null

    const our_unit_price_krw = body.our_unit_price_foreign && body.our_fx_rate_input
      ? body.our_unit_price_foreign * body.our_fx_rate_input
      : null

    const our_est_revenue_krw = our_unit_price_krw && body.est_qty_kg
      ? our_unit_price_krw * body.est_qty_kg
      : null

    const saving_per_kg = curr_unit_price_krw && our_unit_price_krw
      ? curr_unit_price_krw - our_unit_price_krw
      : null

    const total_saving_krw = saving_per_kg && body.est_qty_kg
      ? saving_per_kg * body.est_qty_kg
      : null

    const saving_rate = curr_unit_price_krw && saving_per_kg
      ? saving_per_kg / curr_unit_price_krw
      : null

    // Update target
    const { data, error } = await supabase
      .from('targets')
      .update({
        year: body.year,
        account_name: body.account_name,
        product_name: body.product_name,
        est_qty_kg: body.est_qty_kg,
        owner_name: body.owner_name,
        sales_2025_krw: body.sales_2025_krw,
        segment: body.segment, // ✨ 세그먼트 필드 추가
        curr_currency: body.curr_currency,
        curr_unit_price_foreign: body.curr_unit_price_foreign,
        curr_fx_rate_input: body.curr_fx_rate_input,
        curr_unit_price_krw,
        curr_total_krw,
        our_currency: body.our_currency,
        our_unit_price_foreign: body.our_unit_price_foreign,
        our_fx_rate_input: body.our_fx_rate_input,
        our_unit_price_krw,
        our_est_revenue_krw,
        saving_per_kg,
        total_saving_krw,
        saving_rate,
        note: body.note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating target:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Target updated successfully:', id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error in update-target API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
