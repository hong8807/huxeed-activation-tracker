/**
 * 엑셀 파일 데이터 확인 스크립트
 */
const ExcelJS = require('exceljs')
const path = require('path')

async function checkExcelData() {
  const filePath = path.join(__dirname, '..', '..', 'HUXEED_Activation_Template_2025-11-10 정보수정.xlsx')

  console.log(`📂 파일 경로: ${filePath}`)

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      console.error('❌ 시트를 찾을 수 없습니다')
      return
    }

    console.log(`\n📊 시트명: ${worksheet.name}`)
    console.log(`📏 행 개수: ${worksheet.rowCount}\n`)

    // 헤더 확인
    const headerRow = worksheet.getRow(1)
    console.log('📋 헤더:')
    for (let i = 1; i <= 26; i++) {
      const cell = headerRow.getCell(i)
      console.log(`  [${i}] ${cell.value}`)
    }

    // 데이터 행 확인 (2행부터)
    console.log('\n📝 데이터 행:')
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 헤더 스킵

      console.log(`\n--- 행 ${rowNumber} ---`)
      console.log(`  [3] 거래처: "${row.getCell(3).value}"`)
      console.log(`  [4] 품목: "${row.getCell(4).value}"`)
      console.log(`  [5] 수량: ${row.getCell(5).value}`)
      console.log(`  [6] 담당자: "${row.getCell(6).value}"`)

      console.log(`\n  현재매입:`)
      console.log(`    [9] 통화: "${row.getCell(9).value}" (type: ${typeof row.getCell(9).value})`)
      console.log(`    [10] 단가(외화): ${row.getCell(10).value} (type: ${typeof row.getCell(10).value})`)
      console.log(`    [11] 환율: ${row.getCell(11).value} (type: ${typeof row.getCell(11).value})`)

      console.log(`\n  우리예상:`)
      console.log(`    [16] 통화: "${row.getCell(16).value}" (type: ${typeof row.getCell(16).value})`)
      console.log(`    [17] 단가(외화): ${row.getCell(17).value} (type: ${typeof row.getCell(17).value})`)
      console.log(`    [18] 환율: ${row.getCell(18).value} (type: ${typeof row.getCell(18).value})`)

      // 검증 로직 시뮬레이션
      const currCurrencyValue = row.getCell(9).value
      const curr_currency = currCurrencyValue ? currCurrencyValue.toString().trim() : null

      const currPriceForeign = row.getCell(10).value
      const curr_unit_price_foreign = (typeof currPriceForeign === 'number' && currPriceForeign > 0) ? currPriceForeign : null

      const currFxRate = row.getCell(11).value
      const curr_fx_rate_input = (typeof currFxRate === 'number' && currFxRate > 0) ? currFxRate : null

      console.log(`\n  변환 후:`)
      console.log(`    curr_currency: ${curr_currency}`)
      console.log(`    curr_unit_price_foreign: ${curr_unit_price_foreign}`)
      console.log(`    curr_fx_rate_input: ${curr_fx_rate_input}`)

      const hasCurrentPrice = !!(
        curr_currency &&
        curr_unit_price_foreign !== null &&
        curr_unit_price_foreign > 0 &&
        curr_fx_rate_input !== null &&
        curr_fx_rate_input > 0
      )

      console.log(`\n  ✅ hasCurrentPrice: ${hasCurrentPrice}`)

      // 부분 입력 체크
      if (curr_currency || curr_unit_price_foreign !== null || curr_fx_rate_input !== null) {
        console.log(`  ⚠️  현재 매입가 필드 중 일부 입력됨`)

        if (!curr_currency) {
          console.log(`    ❌ 현재매입 통화 누락`)
        }
        if (curr_unit_price_foreign === null || curr_unit_price_foreign <= 0) {
          console.log(`    ❌ 현재매입 단가 유효하지 않음`)
        }
        if (curr_currency !== 'KRW' && (curr_fx_rate_input === null || curr_fx_rate_input <= 0)) {
          console.log(`    ❌ 현재매입 환율 누락`)
        }
      }
    })

  } catch (error) {
    console.error('❌ 에러:', error.message)
  }
}

checkExcelData()
