const ExcelJS = require('exceljs');
const path = require('path');

async function generateMeetingTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('회의실행항목');

  // 1. 컬럼 정의 (5개 컬럼)
  worksheet.columns = [
    { header: '회의제목', key: 'meeting_type', width: 15 },
    { header: '일시', key: 'meeting_date', width: 15 },
    { header: '거래처명', key: 'account_name', width: 25 },
    { header: '내용', key: 'content', width: 60 },
    { header: '기록여부', key: 'is_record', width: 12 },
  ];

  // 2. 헤더 스타일
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF95c11f' } // 브랜드 라임 그린
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  // 3. 예시 데이터 (3행)
  const exampleData = [
    {
      meeting_type: '일간회의',
      meeting_date: new Date('2025-11-20'),
      account_name: '한미약품',
      content: '신규 거래처 가격 견적서 발송 완료 확인',
      is_record: ''
    },
    {
      meeting_type: '월간회의',
      meeting_date: new Date('2025-11-15'),
      account_name: '대웅제약',
      content: 'Q4 매출 목표 달성을 위한 전략 수립 회의',
      is_record: ''
    },
    {
      meeting_type: '분기회의',
      meeting_date: new Date('2025-10-01'),
      account_name: '셀트리온제약',
      content: '신규 제조원 발굴 현황 공유 및 평가',
      is_record: '기록'
    }
  ];

  exampleData.forEach((data, index) => {
    const row = worksheet.addRow(data);

    // 날짜 형식 지정
    row.getCell(2).numFmt = 'yyyy-mm-dd';

    // 예시 행 배경색 (연한 회색)
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    });
  });

  // 4. 드롭다운 검증 (회의제목 컬럼)
  const MEETING_TYPES = ['일간회의', '월간회의', '분기회의', '년마감회의'];

  // 헤더 다음 행부터 100행까지 드롭다운 적용
  for (let row = 2; row <= 100; row++) {
    worksheet.getCell('A' + row).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"' + MEETING_TYPES.join(',') + '"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: '입력 오류',
      error: '허용된 값: ' + MEETING_TYPES.join(', ')
    };
  }

  // 기록여부 컬럼 드롭다운 (E열)
  for (let row = 2; row <= 100; row++) {
    worksheet.getCell('E' + row).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"기록"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: '입력 안내',
      error: '담당자/답변이 필요 없는 단순 기록은 "기록"을 입력하세요'
    };
  }

  // 5. 일시 컬럼 날짜 형식 지정
  for (let row = 2; row <= 100; row++) {
    worksheet.getCell('B' + row).numFmt = 'yyyy-mm-dd';

    // 거래처명 컬럼 정렬
    worksheet.getCell('C' + row).alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // 6. 테두리 및 정렬
  for (let row = 1; row <= 100; row++) {
    const currentRow = worksheet.getRow(row);
    currentRow.eachCell((cell, colNumber) => {
      if (row === 1) {
        // 헤더는 이미 스타일 적용됨
        return;
      }

      // 데이터 행 테두리
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      // 정렬
      if (colNumber === 1 || colNumber === 2 || colNumber === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    });
  }

  // 7. 파일 저장
  const outputPath = path.join(__dirname, '../public/회의실행항목_템플릿.xlsx');
  await workbook.xlsx.writeFile(outputPath);

  console.log('✅ 회의실행항목 엑셀 템플릿 생성 완료!');
  console.log('📁 저장 위치: ' + outputPath);
  console.log('\n📋 컬럼 구성:');
  console.log('  1. 회의제목 (드롭다운: 일간회의, 월간회의, 분기회의, 년마감회의)');
  console.log('  2. 일시 (YYYY-MM-DD 형식)');
  console.log('  3. 거래처명 (선택사항)');
  console.log('  4. 내용 (자유 입력)');
  console.log('  5. 기록여부 (선택사항: "기록" 입력 시 단순 기록으로 처리)');
}

generateMeetingTemplate().catch(console.error);
