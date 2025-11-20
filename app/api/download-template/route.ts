import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

/**
 * GET /api/download-template
 * 엑셀 템플릿 다운로드 (수식 및 서식 포함)
 */
export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('신규품목 활성화')

    // 컬럼 정의 (26개) - v2.10: 관세율/부대비용율 추가
    const columns = [
      { header: 'ID', key: 'id', width: 10, hidden: true },
      { header: '연도', key: 'year', width: 10 },
      { header: '거래처', key: 'account_name', width: 20 },
      { header: '품목', key: 'product_name', width: 25 },
      { header: '수량_kg', key: 'est_qty_kg', width: 12 },
      { header: '담당자명', key: 'owner_name', width: 12 },
      { header: '2025년_매출액_KRW', key: 'sales_2025_krw', width: 18 },
      { header: '세그먼트', key: 'segment', width: 10 },
      { header: '현재매입_통화', key: 'curr_currency', width: 14 },
      { header: '현재매입_단가(외화)', key: 'curr_unit_price_foreign', width: 18 },
      { header: '현재매입_기준환율', key: 'curr_fx_rate_input', width: 18 },
      { header: '현재매입_관세율(%)', key: 'curr_tariff_rate', width: 16 },  // v2.10 NEW
      { header: '현재매입_부대비용율(%)', key: 'curr_additional_cost_rate', width: 18 },  // v2.10 NEW
      { header: '현재매입_단가_KRW', key: 'curr_unit_price_krw', width: 18 },
      { header: '현재매입_총액_KRW', key: 'curr_total_krw', width: 18 },
      { header: '우리예상_통화', key: 'our_currency', width: 14 },
      { header: '우리예상_단가(외화)', key: 'our_unit_price_foreign', width: 18 },
      { header: '우리예상_기준환율', key: 'our_fx_rate_input', width: 18 },
      { header: '우리예상_관세율(%)', key: 'our_tariff_rate', width: 16 },  // v2.10 NEW
      { header: '우리예상_부대비용율(%)', key: 'our_additional_cost_rate', width: 18 },  // v2.10 NEW
      { header: '우리예상_단가_KRW', key: 'our_unit_price_krw', width: 18 },
      { header: '우리예상_예상매출_KRW', key: 'our_est_revenue_krw', width: 18 },
      { header: '절감_kg당', key: 'saving_per_kg', width: 15 },
      { header: '절감_총액_KRW', key: 'total_saving_krw', width: 18 },
      { header: '절감률', key: 'saving_rate', width: 12 },
      { header: '비고', key: 'note', width: 30 },
    ]

    worksheet.columns = columns

    // 헤더 행 스타일 (1행)
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 25

    // 예시 데이터 행 추가 (2행 - 수식 예시용)
    const exampleRow = worksheet.getRow(2)
    exampleRow.getCell('B').value = 2026
    exampleRow.getCell('C').value = 'ABC제약'
    exampleRow.getCell('D').value = 'API-001'
    exampleRow.getCell('E').value = 100
    exampleRow.getCell('F').value = '홍길동'
    exampleRow.getCell('G').value = 50000000
    exampleRow.getCell('H').value = 'S'
    exampleRow.getCell('I').value = 'USD'
    exampleRow.getCell('J').value = 100
    exampleRow.getCell('K').value = 1300
    exampleRow.getCell('L').value = 5  // v2.10: 현재매입 관세율 예시
    exampleRow.getCell('M').value = 3  // v2.10: 현재매입 부대비용율 예시
    exampleRow.getCell('P').value = 'USD'
    exampleRow.getCell('Q').value = 90
    exampleRow.getCell('R').value = 1300
    exampleRow.getCell('S').value = 5  // v2.10: 우리예상 관세율 예시
    exampleRow.getCell('T').value = 3  // v2.10: 우리예상 부대비용율 예시

    // 수식 적용 (v2.11: 현재 매입가 선택 입력, 절감 조건 처리)
    for (let row = 2; row <= 100; row++) {
      // 현재매입_단가_KRW = 현재 매입가 입력 있으면 계산, 없으면 빈값
      worksheet.getCell(`N${row}`).value = {
        formula: `IF(OR(ISBLANK(J${row}),ISBLANK(K${row})),"",J${row}*K${row}*(1+L${row}/100+M${row}/100))`
      }
      worksheet.getCell(`O${row}`).value = {
        formula: `IF(N${row}="","",N${row}*E${row})`
      }

      // 우리예상_단가_KRW = 단가 × 환율 × (1 + 관세율/100 + 부대비용율/100)
      worksheet.getCell(`U${row}`).value = { formula: `Q${row}*R${row}*(1+S${row}/100+T${row}/100)` }
      worksheet.getCell(`V${row}`).value = { formula: `U${row}*E${row}` } // 우리예상_예상매출_KRW

      // 절감_kg당 = 현재 매입가 없으면 "정보 없음", 있으면 계산
      worksheet.getCell(`W${row}`).value = {
        formula: `IF(N${row}="","정보 없음",N${row}-U${row})`
      }
      // 절감_총액_KRW = 현재 매입가 없으면 "정보 없음", 있으면 계산
      worksheet.getCell(`X${row}`).value = {
        formula: `IF(N${row}="","정보 없음",W${row}*E${row})`
      }
      // 절감률 = 현재 매입가 없으면 "정보 없음", 있으면 계산
      worksheet.getCell(`Y${row}`).value = {
        formula: `IF(N${row}="","정보 없음",IF(N${row}=0,"정보 없음",W${row}/N${row}))`
      }
    }

    // 서식 적용 (2행부터 100행까지)
    for (let row = 2; row <= 100; row++) {
      // 사용자 입력 필드: 노란색 배경 (B-K, L, M, P-R, S, T, Z)
      const inputColumns = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S', 'T', 'Z']
      inputColumns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${row}`)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' },
        }
        cell.protection = { locked: false }  // 사용자가 입력 가능하도록 잠금 해제
      })

      // 수식 필드: 회색 배경, 읽기 전용 (N, O, U, V, W, X, Y)
      const formulaColumns = ['N', 'O', 'U', 'V', 'W', 'X', 'Y']
      formulaColumns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${row}`)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        }
        cell.protection = { locked: true }
      })

      // 숫자 형식 적용
      worksheet.getCell(`E${row}`).numFmt = '#,##0'  // 수량
      worksheet.getCell(`G${row}`).numFmt = '#,##0'  // 매출액
      worksheet.getCell(`J${row}`).numFmt = '#,##0.00'  // 현재매입 단가(외화)
      worksheet.getCell(`K${row}`).numFmt = '#,##0.00'  // 현재매입 환율
      worksheet.getCell(`L${row}`).numFmt = '#,##0.00'  // 현재매입 관세율
      worksheet.getCell(`M${row}`).numFmt = '#,##0.00'  // 현재매입 부대비용율
      worksheet.getCell(`N${row}`).numFmt = '#,##0'  // 현재매입 단가_KRW
      worksheet.getCell(`O${row}`).numFmt = '#,##0'  // 현재매입 총액_KRW
      worksheet.getCell(`Q${row}`).numFmt = '#,##0.00'  // 우리예상 단가(외화)
      worksheet.getCell(`R${row}`).numFmt = '#,##0.00'  // 우리예상 환율
      worksheet.getCell(`S${row}`).numFmt = '#,##0.00'  // 우리예상 관세율
      worksheet.getCell(`T${row}`).numFmt = '#,##0.00'  // 우리예상 부대비용율
      worksheet.getCell(`U${row}`).numFmt = '#,##0'  // 우리예상 단가_KRW
      worksheet.getCell(`V${row}`).numFmt = '#,##0'  // 우리예상 예상매출_KRW
      worksheet.getCell(`W${row}`).numFmt = '#,##0'  // 절감_kg당
      worksheet.getCell(`X${row}`).numFmt = '#,##0'  // 절감_총액_KRW
      worksheet.getCell(`Y${row}`).numFmt = '0.00%'  // 절감률
    }

    // 드롭다운 검증 추가
    // 현재매입_통화 필드 (I 컬럼) - 선택 입력
    const currencyValidation = {
      type: 'list' as const,
      allowBlank: true,
      formulae: ['"USD,EUR,CNY,JPY,KRW"'],
      showErrorMessage: true,
      errorTitle: '입력 오류',
      error: 'USD, EUR, CNY, JPY, KRW 중 하나를 선택하세요',
    }
    for (let i = 2; i <= 100; i++) {
      worksheet.getCell(`I${i}`).dataValidation = currencyValidation
    }

    // 우리예상_통화 필드 (P 컬럼) - 필수 입력
    const currencyValidationRequired = {
      type: 'list' as const,
      allowBlank: false,
      formulae: ['"USD,EUR,CNY,JPY,KRW"'],
      showErrorMessage: true,
      errorTitle: '입력 오류',
      error: 'USD, EUR, CNY, JPY, KRW 중 하나를 선택하세요',
    }
    for (let i = 2; i <= 100; i++) {
      worksheet.getCell(`P${i}`).dataValidation = currencyValidationRequired
    }

    // 세그먼트 필드 (H 컬럼)
    const segmentValidation = {
      type: 'list' as const,
      allowBlank: false,
      formulae: ['"S,P,일반"'],
      showErrorMessage: true,
      errorTitle: '입력 오류',
      error: 'S, P, 일반 중 하나를 선택하세요',
    }
    for (let i = 2; i <= 100; i++) {
      worksheet.getCell(`H${i}`).dataValidation = segmentValidation
    }

    // 조건부 서식: 절감_총액_KRW < 0 → 빨간 배경 (역마진 경고)
    worksheet.addConditionalFormatting({
      ref: 'X2:X100',
      rules: [
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: [0],
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFF0000' },
            },
            font: {
              color: { argb: 'FFFFFFFF' },
              bold: true,
            },
          },
        },
      ],
    })

    // 조건부 서식: 절감_kg당 < 0 → 빨간 배경 (역마진 경고)
    worksheet.addConditionalFormatting({
      ref: 'W2:W100',
      rules: [
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: [0],
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFF0000' },
            },
            font: {
              color: { argb: 'FFFFFFFF' },
              bold: true,
            },
          },
        },
      ],
    })

    // 조건부 서식: 절감률 < 0 → 빨간 배경 (역마진 경고)
    worksheet.addConditionalFormatting({
      ref: 'Y2:Y100',
      rules: [
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: [0],
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFF0000' },
            },
            font: {
              color: { argb: 'FFFFFFFF' },
              bold: true,
            },
          },
        },
      ],
    })

    // 시트 보호 (수식 필드만 잠금)
    await worksheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
    })

    // 엑셀 파일 생성
    const buffer = await workbook.xlsx.writeBuffer()

    // 파일명 생성
    const date = new Date().toISOString().split('T')[0]
    const filename = `HUXEED_Activation_Template_${date}.xlsx`

    // 응답 헤더 설정
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

    return response
  } catch (error) {
    console.error('Error generating Excel template:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate Excel template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
