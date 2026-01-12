import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'
import { Stage } from '@/types/database.types'

interface ImportError {
  row: number
  message: string
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  created: number
  errors: ImportError[]
}

/**
 * POST /api/import-targets
 * 엑셀 파일 업로드하여 targets 테이블에 데이터 추가/수정
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // 엑셀 파일 파싱
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer) as any
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      return NextResponse.json(
        { error: '엑셀 파일에 시트가 없습니다' },
        { status: 400 }
      )
    }

    const errors: ImportError[] = []
    const rowsToImport: any[] = []

    // 각 행 파싱 및 검증 (2행부터 시작, 헤더 제외)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 헤더 스킵

      const rowData: any = {}

      // 컬럼 매핑
      rowData.id = row.getCell(1).value?.toString() || null
      rowData.year = row.getCell(2).value as number
      rowData.account_name = row.getCell(3).value?.toString() || null
      rowData.product_name = row.getCell(4).value?.toString() || null
      rowData.est_qty_kg = row.getCell(5).value as number

      // 빈 행 스킵 (거래처, 품목, 수량이 모두 비어있으면 무시)
      if (!rowData.account_name && !rowData.product_name && !rowData.est_qty_kg) {
        return
      }

      rowData.owner_name = row.getCell(6).value?.toString() || null
      rowData.sales_2025_krw = row.getCell(7).value as number
      rowData.segment = row.getCell(8).value?.toString() || null

      // v2.11: 현재매입 필드 - 빈 셀 처리 (null, undefined, 빈 문자열, "null" 문자열 모두 null로 변환)
      const currCurrencyValue = row.getCell(9).value
      const currCurrencyStr = currCurrencyValue?.toString().trim()
      rowData.curr_currency = (currCurrencyStr && currCurrencyStr !== 'null') ? currCurrencyStr : null

      const currPriceForeign = row.getCell(10).value
      rowData.curr_unit_price_foreign = (typeof currPriceForeign === 'number' && currPriceForeign > 0) ? currPriceForeign : null

      const currFxRate = row.getCell(11).value
      rowData.curr_fx_rate_input = (typeof currFxRate === 'number' && currFxRate > 0) ? currFxRate : null

      // 디버깅: 행 10 데이터 로그
      if (rowNumber === 10) {
        console.log(`\n🔍 [DEBUG] 행 ${rowNumber} 파싱 결과:`)
        console.log(`  원본 값:`)
        console.log(`    [9] currCurrencyValue: ${JSON.stringify(currCurrencyValue)} (type: ${typeof currCurrencyValue})`)
        console.log(`    [10] currPriceForeign: ${JSON.stringify(currPriceForeign)} (type: ${typeof currPriceForeign})`)
        console.log(`    [11] currFxRate: ${JSON.stringify(currFxRate)} (type: ${typeof currFxRate})`)
        console.log(`  변환 후:`)
        console.log(`    curr_currency: ${JSON.stringify(rowData.curr_currency)}`)
        console.log(`    curr_unit_price_foreign: ${JSON.stringify(rowData.curr_unit_price_foreign)}`)
        console.log(`    curr_fx_rate_input: ${JSON.stringify(rowData.curr_fx_rate_input)}`)
      }

      rowData.curr_tariff_rate = (row.getCell(12).value as number) || 0  // v2.10: 현재매입 관세율
      rowData.curr_additional_cost_rate = (row.getCell(13).value as number) || 0  // v2.10: 현재매입 부대비용율

      rowData.our_currency = row.getCell(16).value?.toString() || null
      rowData.our_unit_price_foreign = row.getCell(17).value as number
      rowData.our_fx_rate_input = row.getCell(18).value as number
      rowData.our_tariff_rate = (row.getCell(19).value as number) || 0  // v2.10: 우리예상 관세율
      rowData.our_additional_cost_rate = (row.getCell(20).value as number) || 0  // v2.10: 우리예상 부대비용율
      rowData.note = row.getCell(26).value?.toString() || null

      // ===== 필수 필드 검증 (거래처명, 품목명만 필수) =====
      if (!rowData.account_name) {
        errors.push({ row: rowNumber, message: '거래처명이 누락되었습니다' })
        return
      }
      if (!rowData.product_name) {
        errors.push({ row: rowNumber, message: '품목명이 누락되었습니다' })
        return
      }

      // ===== 선택 필드 기본값 처리 =====
      // 수량이 없으면 0으로 설정 (나중에 시스템에서 수정 가능)
      if (!rowData.est_qty_kg || rowData.est_qty_kg <= 0) {
        rowData.est_qty_kg = 0
      }

      // 세그먼트 검증 (값이 있을 때만)
      if (rowData.segment && !['S', 'P', '일반'].includes(rowData.segment)) {
        errors.push({ row: rowNumber, message: '세그먼트는 S, P, 일반 중 하나여야 합니다' })
        return
      }

      // ===== 현재 매입가 처리 (선택 입력) =====
      const hasCurrentPrice = !!(
        rowData.curr_currency &&
        rowData.curr_unit_price_foreign !== null &&
        rowData.curr_unit_price_foreign > 0 &&
        rowData.curr_fx_rate_input !== null &&
        rowData.curr_fx_rate_input > 0
      )

      // 부분 입력 검증: 하나라도 값이 있으면 나머지도 입력 필요
      const hasAnyCurrPrice = !!(
        rowData.curr_currency ||
        (rowData.curr_unit_price_foreign !== null && rowData.curr_unit_price_foreign !== undefined && rowData.curr_unit_price_foreign > 0) ||
        (rowData.curr_fx_rate_input !== null && rowData.curr_fx_rate_input !== undefined && rowData.curr_fx_rate_input > 0)
      )

      if (hasAnyCurrPrice && !hasCurrentPrice) {
        // 현재 매입가 필드 중 일부만 입력된 경우 검증
        if (!rowData.curr_currency) {
          errors.push({ row: rowNumber, message: '현재매입 통화가 누락되었습니다 (전부 입력하거나 전부 비워두세요)' })
          return
        }
        if (rowData.curr_unit_price_foreign === null || rowData.curr_unit_price_foreign === undefined || rowData.curr_unit_price_foreign <= 0) {
          errors.push({ row: rowNumber, message: '현재매입 단가가 유효하지 않습니다 (전부 입력하거나 전부 비워두세요)' })
          return
        }
        if (rowData.curr_currency !== 'KRW' && (rowData.curr_fx_rate_input === null || rowData.curr_fx_rate_input === undefined || rowData.curr_fx_rate_input <= 0)) {
          errors.push({ row: rowNumber, message: '현재매입 환율이 누락되었습니다 (전부 입력하거나 전부 비워두세요)' })
          return
        }
      }

      // ===== 우리예상 판매가 처리 (선택 입력) =====
      const hasOurPrice = !!(
        rowData.our_currency &&
        rowData.our_unit_price_foreign !== null &&
        rowData.our_unit_price_foreign > 0
      )

      // 부분 입력 검증
      const hasAnyOurPrice = !!(
        rowData.our_currency ||
        (rowData.our_unit_price_foreign !== null && rowData.our_unit_price_foreign !== undefined && rowData.our_unit_price_foreign > 0) ||
        (rowData.our_fx_rate_input !== null && rowData.our_fx_rate_input !== undefined && rowData.our_fx_rate_input > 0)
      )

      if (hasAnyOurPrice && !hasOurPrice) {
        if (!rowData.our_currency) {
          errors.push({ row: rowNumber, message: '우리예상 통화가 누락되었습니다 (전부 입력하거나 전부 비워두세요)' })
          return
        }
        if (!rowData.our_unit_price_foreign || rowData.our_unit_price_foreign <= 0) {
          errors.push({ row: rowNumber, message: '우리예상 단가가 유효하지 않습니다 (전부 입력하거나 전부 비워두세요)' })
          return
        }
      }

      // 우리예상 환율 검증 (통화와 단가가 있을 때만)
      if (hasOurPrice && rowData.our_currency !== 'KRW' && (!rowData.our_fx_rate_input || rowData.our_fx_rate_input <= 0)) {
        errors.push({ row: rowNumber, message: '우리예상 환율이 누락되었습니다' })
        return
      }

      // ===== KRW인 경우 환율 자동 설정 =====
      if (hasCurrentPrice && rowData.curr_currency === 'KRW') {
        rowData.curr_fx_rate_input = 1
      }
      if (hasOurPrice && rowData.our_currency === 'KRW') {
        rowData.our_fx_rate_input = 1
      }

      // ===== 서버 사이드 계산 =====
      // 현재 매입가 계산
      if (hasCurrentPrice) {
        rowData.curr_unit_price_krw = rowData.curr_unit_price_foreign * rowData.curr_fx_rate_input *
          (1 + (rowData.curr_tariff_rate || 0) / 100 + (rowData.curr_additional_cost_rate || 0) / 100)
        rowData.curr_total_krw = rowData.curr_unit_price_krw * rowData.est_qty_kg
      } else {
        rowData.curr_currency = null
        rowData.curr_unit_price_foreign = null
        rowData.curr_fx_rate_input = null
        rowData.curr_tariff_rate = null
        rowData.curr_additional_cost_rate = null
        rowData.curr_unit_price_krw = null
        rowData.curr_total_krw = null
      }

      // 우리예상 판매가 계산
      if (hasOurPrice) {
        rowData.our_unit_price_krw = rowData.our_unit_price_foreign * rowData.our_fx_rate_input *
          (1 + (rowData.our_tariff_rate || 0) / 100 + (rowData.our_additional_cost_rate || 0) / 100)
        rowData.our_est_revenue_krw = rowData.our_unit_price_krw * rowData.est_qty_kg
      } else {
        rowData.our_currency = null
        rowData.our_unit_price_foreign = null
        rowData.our_fx_rate_input = null
        rowData.our_tariff_rate = null
        rowData.our_additional_cost_rate = null
        rowData.our_unit_price_krw = null
        rowData.our_est_revenue_krw = null
      }

      // 절감 계산 (현재 매입가와 우리예상 둘 다 있을 때만)
      if (hasCurrentPrice && hasOurPrice) {
        rowData.saving_per_kg = rowData.curr_unit_price_krw - rowData.our_unit_price_krw
        rowData.total_saving_krw = rowData.saving_per_kg * rowData.est_qty_kg
        rowData.saving_rate = rowData.curr_unit_price_krw !== 0
          ? rowData.saving_per_kg / rowData.curr_unit_price_krw
          : 0
      } else {
        rowData.saving_per_kg = null
        rowData.total_saving_krw = null
        rowData.saving_rate = null
      }

      // 자동 설정 필드
      rowData.current_stage = Stage.MARKET_RESEARCH
      rowData.stage_updated_at = new Date().toISOString()
      rowData.stage_progress_rate = 0 // MARKET_RESEARCH는 0%

      rowsToImport.push(rowData)
    })

    // 에러가 있으면 중단
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          updated: 0,
          created: 0,
          errors,
        } as ImportResult,
        { status: 400 }
      )
    }

    // Upsert 로직 (거래처 + 품목 기준)
    let updated = 0
    let created = 0

    console.log(`📊 Processing ${rowsToImport.length} rows for upsert...`)

    for (const rowData of rowsToImport) {
      // 기존 데이터 확인 (error 처리 포함)
      const { data: existing, error: selectError } = await supabase
        .from('targets')
        .select('id')
        .eq('account_name', rowData.account_name)
        .eq('product_name', rowData.product_name)
        .maybeSingle()  // single() 대신 maybeSingle() 사용

      console.log(`🔍 Checking: ${rowData.account_name} - ${rowData.product_name}`)
      console.log(`   Existing ID: ${existing?.id || 'none'}`)

      if (selectError) {
        console.error('❌ Select error:', selectError)
        errors.push({
          row: 0,
          message: `${rowData.account_name} - ${rowData.product_name} 조회 실패: ${selectError.message}`,
        })
        continue
      }

      if (existing) {
        // 업데이트
        console.log(`   ⬆️ Updating existing record...`)
        const { error } = await supabase
          .from('targets')
          .update({
            year: rowData.year,
            est_qty_kg: rowData.est_qty_kg,
            owner_name: rowData.owner_name,
            sales_2025_krw: rowData.sales_2025_krw,
            segment: rowData.segment,
            curr_currency: rowData.curr_currency,
            curr_unit_price_foreign: rowData.curr_unit_price_foreign,
            curr_fx_rate_input: rowData.curr_fx_rate_input,
            curr_tariff_rate: rowData.curr_tariff_rate,  // v2.10
            curr_additional_cost_rate: rowData.curr_additional_cost_rate,  // v2.10
            curr_unit_price_krw: rowData.curr_unit_price_krw,
            curr_total_krw: rowData.curr_total_krw,
            our_currency: rowData.our_currency,
            our_unit_price_foreign: rowData.our_unit_price_foreign,
            our_fx_rate_input: rowData.our_fx_rate_input,
            our_tariff_rate: rowData.our_tariff_rate,  // v2.10
            our_additional_cost_rate: rowData.our_additional_cost_rate,  // v2.10
            our_unit_price_krw: rowData.our_unit_price_krw,
            our_est_revenue_krw: rowData.our_est_revenue_krw,
            saving_per_kg: rowData.saving_per_kg,
            total_saving_krw: rowData.total_saving_krw,
            saving_rate: rowData.saving_rate,
            note: rowData.note,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          console.error('❌ Update error:', error)
          errors.push({
            row: 0,
            message: `${rowData.account_name} - ${rowData.product_name} 업데이트 실패: ${error.message}`,
          })
        } else {
          console.log(`   ✅ Updated successfully`)
          updated++
        }
      } else {
        // 신규 생성
        console.log(`   ➕ Creating new record...`)
        const { error } = await supabase
          .from('targets')
          .insert({
            year: rowData.year,
            account_name: rowData.account_name,
            product_name: rowData.product_name,
            est_qty_kg: rowData.est_qty_kg,
            owner_name: rowData.owner_name,
            sales_2025_krw: rowData.sales_2025_krw,
            segment: rowData.segment,
            curr_currency: rowData.curr_currency,
            curr_unit_price_foreign: rowData.curr_unit_price_foreign,
            curr_fx_rate_input: rowData.curr_fx_rate_input,
            curr_tariff_rate: rowData.curr_tariff_rate,  // v2.10
            curr_additional_cost_rate: rowData.curr_additional_cost_rate,  // v2.10
            curr_unit_price_krw: rowData.curr_unit_price_krw,
            curr_total_krw: rowData.curr_total_krw,
            our_currency: rowData.our_currency,
            our_unit_price_foreign: rowData.our_unit_price_foreign,
            our_fx_rate_input: rowData.our_fx_rate_input,
            our_tariff_rate: rowData.our_tariff_rate,  // v2.10
            our_additional_cost_rate: rowData.our_additional_cost_rate,  // v2.10
            our_unit_price_krw: rowData.our_unit_price_krw,
            our_est_revenue_krw: rowData.our_est_revenue_krw,
            saving_per_kg: rowData.saving_per_kg,
            total_saving_krw: rowData.total_saving_krw,
            saving_rate: rowData.saving_rate,
            current_stage: rowData.current_stage,
            stage_updated_at: rowData.stage_updated_at,
            stage_progress_rate: rowData.stage_progress_rate,
            note: rowData.note,
          })

        if (error) {
          console.error('Insert error:', error)
          errors.push({
            row: 0,
            message: `${rowData.account_name} - ${rowData.product_name} 생성 실패`,
          })
        } else {
          created++
        }
      }
    }

    const imported = updated + created

    return NextResponse.json({
      success: true,
      imported,
      updated,
      created,
      errors,
    } as ImportResult)
  } catch (error) {
    console.error('Error importing targets:', error)
    return NextResponse.json(
      {
        error: '엑셀 파일 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
