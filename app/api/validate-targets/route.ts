import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ValidatedRow {
  row: number
  data: {
    year: number | null
    account_name: string | null
    product_name: string | null
    est_qty_kg: number | null
    owner_name: string | null
    sales_2025_krw: number | null
    segment: string | null
    curr_currency: string | null
    curr_unit_price_foreign: number | null
    curr_fx_rate_input: number | null
    curr_tariff_rate: number
    curr_additional_cost_rate: number
    curr_unit_price_krw: number | null
    curr_total_krw: number | null
    our_currency: string | null
    our_unit_price_foreign: number | null
    our_fx_rate_input: number | null
    our_tariff_rate: number
    our_additional_cost_rate: number
    our_unit_price_krw: number | null
    our_est_revenue_krw: number | null
    saving_per_kg: number | null
    total_saving_krw: number | null
    saving_rate: number | null
    note: string | null
  }
  isValid: boolean
  errors: string[]
}

interface ValidationResult {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  rows: ValidatedRow[]
  errors: ValidationError[]
}

/**
 * POST /api/validate-targets
 * 엑셀 파일 검증 (DB 저장 없이 검증 결과만 반환)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('❌ No file uploaded')
      return NextResponse.json(
        { error: 'No file uploaded', details: '파일이 선택되지 않았습니다' },
        { status: 400 }
      )
    }

    console.log('📄 File info:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // 엑셀 파일 파싱
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer) as any
    const workbook = new ExcelJS.Workbook()

    try {
      await workbook.xlsx.load(buffer)
    } catch (parseError) {
      console.error('❌ Excel parsing error:', parseError)
      return NextResponse.json(
        {
          error: '엑셀 파일 파싱 실패',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { status: 400 }
      )
    }

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      console.error('❌ No worksheet found')
      return NextResponse.json(
        { error: '엑셀 파일에 시트가 없습니다' },
        { status: 400 }
      )
    }

    console.log('📊 Worksheet info:', {
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount
    })

    const validationErrors: ValidationError[] = []
    const validatedRows: ValidatedRow[] = []

    // 각 행 파싱 및 검증 (2행부터 시작, 헤더 제외)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 헤더 스킵

      const rowErrors: string[] = []
      const rowData: any = {}

      try {
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
          console.log(`\n🔍 [VALIDATION DEBUG] 행 ${rowNumber}:`)
          console.log(`  원본 셀 값:`)
          console.log(`    [9] getCell(9).value: ${JSON.stringify(row.getCell(9).value)} (type: ${typeof row.getCell(9).value})`)
          console.log(`    [10] getCell(10).value: ${JSON.stringify(row.getCell(10).value)} (type: ${typeof row.getCell(10).value})`)
          console.log(`    [11] getCell(11).value: ${JSON.stringify(row.getCell(11).value)} (type: ${typeof row.getCell(11).value})`)
          console.log(`  중간 변수:`)
          console.log(`    currCurrencyValue: ${JSON.stringify(currCurrencyValue)} (type: ${typeof currCurrencyValue})`)
          console.log(`    currCurrencyStr: ${JSON.stringify(currCurrencyStr)}`)
          console.log(`    currPriceForeign: ${JSON.stringify(currPriceForeign)} (type: ${typeof currPriceForeign})`)
          console.log(`    currFxRate: ${JSON.stringify(currFxRate)} (type: ${typeof currFxRate})`)
          console.log(`  최종 rowData:`)
          console.log(`    curr_currency: ${JSON.stringify(rowData.curr_currency)}`)
          console.log(`    curr_unit_price_foreign: ${JSON.stringify(rowData.curr_unit_price_foreign)}`)
          console.log(`    curr_fx_rate_input: ${JSON.stringify(rowData.curr_fx_rate_input)}`)
        }

        rowData.curr_tariff_rate = (row.getCell(12).value as number) || 0  // v2.10: 현재매입 관세율
        rowData.curr_additional_cost_rate = (row.getCell(13).value as number) || 0  // v2.10: 현재매입 부대비용율

        // v2.13: 우리예상 필드 - 빈 셀 처리 (현재매입과 동일하게)
        const ourCurrencyValue = row.getCell(16).value
        const ourCurrencyStr = ourCurrencyValue?.toString().trim()
        rowData.our_currency = (ourCurrencyStr && ourCurrencyStr !== 'null') ? ourCurrencyStr : null

        const ourPriceForeign = row.getCell(17).value
        rowData.our_unit_price_foreign = (typeof ourPriceForeign === 'number' && ourPriceForeign > 0) ? ourPriceForeign : null

        const ourFxRate = row.getCell(18).value
        rowData.our_fx_rate_input = (typeof ourFxRate === 'number' && ourFxRate > 0) ? ourFxRate : null

        rowData.our_tariff_rate = (row.getCell(19).value as number) || 0  // v2.10: 우리예상 관세율
        rowData.our_additional_cost_rate = (row.getCell(20).value as number) || 0  // v2.10: 우리예상 부대비용율
        rowData.note = row.getCell(26).value?.toString() || null

        // ===== 필수 필드 검증 (거래처명, 품목명만 필수) =====
        if (!rowData.account_name) {
          rowErrors.push('거래처명이 누락되었습니다')
          validationErrors.push({ row: rowNumber, field: 'account_name', message: '거래처명이 누락되었습니다' })
        }
        if (!rowData.product_name) {
          rowErrors.push('품목명이 누락되었습니다')
          validationErrors.push({ row: rowNumber, field: 'product_name', message: '품목명이 누락되었습니다' })
        }

        // ===== 선택 필드 기본값 처리 =====
        // 수량이 없으면 0으로 설정 (나중에 시스템에서 수정 가능)
        if (!rowData.est_qty_kg || rowData.est_qty_kg <= 0) {
          rowData.est_qty_kg = 0
        }

        // 세그먼트 검증 (값이 있을 때만)
        if (rowData.segment && !['S', 'P', '일반'].includes(rowData.segment)) {
          rowErrors.push('세그먼트는 S, P, 일반 중 하나여야 합니다')
          validationErrors.push({ row: rowNumber, field: 'segment', message: '세그먼트는 S, P, 일반 중 하나여야 합니다' })
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
            rowErrors.push('현재매입 통화가 누락되었습니다 (전부 입력하거나 전부 비워두세요)')
            validationErrors.push({ row: rowNumber, field: 'curr_currency', message: '현재매입 통화가 누락되었습니다' })
          }
          if (rowData.curr_unit_price_foreign === null || rowData.curr_unit_price_foreign === undefined || rowData.curr_unit_price_foreign <= 0) {
            rowErrors.push('현재매입 단가가 유효하지 않습니다 (전부 입력하거나 전부 비워두세요)')
            validationErrors.push({ row: rowNumber, field: 'curr_unit_price_foreign', message: '현재매입 단가가 유효하지 않습니다' })
          }
          if (rowData.curr_currency !== 'KRW' && (rowData.curr_fx_rate_input === null || rowData.curr_fx_rate_input === undefined || rowData.curr_fx_rate_input <= 0)) {
            rowErrors.push('현재매입 환율이 누락되었습니다 (전부 입력하거나 전부 비워두세요)')
            validationErrors.push({ row: rowNumber, field: 'curr_fx_rate_input', message: '현재매입 환율이 누락되었습니다' })
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
            rowErrors.push('우리예상 통화가 누락되었습니다 (전부 입력하거나 전부 비워두세요)')
            validationErrors.push({ row: rowNumber, field: 'our_currency', message: '우리예상 통화가 누락되었습니다' })
          }
          if (!rowData.our_unit_price_foreign || rowData.our_unit_price_foreign <= 0) {
            rowErrors.push('우리예상 단가가 유효하지 않습니다 (전부 입력하거나 전부 비워두세요)')
            validationErrors.push({ row: rowNumber, field: 'our_unit_price_foreign', message: '우리예상 단가가 유효하지 않습니다' })
          }
        }

        // 우리예상 환율 검증 (통화와 단가가 있을 때만)
        if (hasOurPrice && rowData.our_currency !== 'KRW' && (!rowData.our_fx_rate_input || rowData.our_fx_rate_input <= 0)) {
          rowErrors.push('우리예상 환율이 누락되었습니다')
          validationErrors.push({ row: rowNumber, field: 'our_fx_rate_input', message: '우리예상 환율이 누락되었습니다' })
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

        validatedRows.push({
          row: rowNumber,
          data: rowData,
          isValid: rowErrors.length === 0,
          errors: rowErrors
        })

      } catch (error) {
        console.error(`❌ Error parsing row ${rowNumber}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        rowErrors.push(`파싱 오류: ${errorMessage}`)
        validationErrors.push({ row: rowNumber, field: 'general', message: errorMessage })

        validatedRows.push({
          row: rowNumber,
          data: rowData,
          isValid: false,
          errors: rowErrors
        })
      }
    })

    const validRows = validatedRows.filter(r => r.isValid).length
    const invalidRows = validatedRows.filter(r => !r.isValid).length

    console.log('✅ Validation complete:', {
      totalRows: validatedRows.length,
      validRows,
      invalidRows,
      errorCount: validationErrors.length
    })

    const result: ValidationResult = {
      success: validationErrors.length === 0,
      totalRows: validatedRows.length,
      validRows,
      invalidRows,
      rows: validatedRows,
      errors: validationErrors
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Validation failed:', error)
    return NextResponse.json(
      {
        error: '엑셀 파일 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
