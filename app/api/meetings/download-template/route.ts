import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    // 엑셀 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('회의 실행 항목');

    // 컬럼 정의
    worksheet.columns = [
      { header: '회의제목', key: 'meeting_type', width: 15 },
      { header: '일시', key: 'meeting_date', width: 15 },
      { header: '거래처명', key: 'account_name', width: 25 },
      { header: '내용', key: 'content', width: 60 },
      { header: '기록여부', key: 'is_record', width: 12 },
      { header: '담당자명', key: 'assignee_name', width: 15 },
      { header: '답변', key: 'reply_text', width: 60 },
    ];

    // 헤더 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF95c11f' }, // HUXEED 브랜드 컬러
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // 예시 데이터 3행 추가
    const exampleRows = [
      {
        meeting_type: '일간회의',
        meeting_date: '2025-11-07',
        account_name: '한미약품',
        content: '신규 API 품목 견적 요청 검토',
        is_record: '',
        assignee_name: '홍길동',
        reply_text: '견적서 작성 중, 내일까지 완료 예정'
      },
      {
        meeting_type: '월간회의',
        meeting_date: '2025-11-07',
        account_name: '대웅제약',
        content: 'Q4 매출 목표 달성을 위한 프로모션 기획',
        is_record: '',
        assignee_name: '김철수',
        reply_text: ''
      },
      {
        meeting_type: '분기회의',
        meeting_date: '2025-11-07',
        account_name: '',
        content: '2025년 1분기 전략 수립 회의 일정 공지',
        is_record: '기록',
        assignee_name: '',
        reply_text: ''
      }
    ];

    exampleRows.forEach((row) => {
      worksheet.addRow(row);
    });

    // 예시 데이터 행 스타일
    for (let i = 2; i <= 4; i++) {
      const row = worksheet.getRow(i);
      row.alignment = { vertical: 'top', wrapText: true };
      row.height = 40;

      // 예시 데이터는 연한 노란색 배경
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3CD' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };
      });
    }

    // 빈 입력 행 10개 추가
    for (let i = 0; i < 10; i++) {
      const row = worksheet.addRow({
        meeting_type: '',
        meeting_date: '',
        account_name: '',
        content: '',
        is_record: '',
        assignee_name: '',
        reply_text: ''
      });

      row.alignment = { vertical: 'top', wrapText: true };
      row.height = 40;

      // 빈 행은 흰색 배경
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        };
      });
    }

    // 안내사항 시트 추가
    const guideSheet = workbook.addWorksheet('작성 가이드');

    guideSheet.columns = [
      { width: 20 },
      { width: 80 }
    ];

    // 가이드 내용
    const guides = [
      ['📋 회의 실행 항목 엑셀 작성 가이드', ''],
      ['', ''],
      ['1. 회의제목', '다음 5가지 중 하나를 정확히 입력하세요: 일간회의, 월간회의, 분기회의, 년마감회의, 외부회의'],
      ['2. 일시', '날짜만 입력 (형식: YYYY-MM-DD, 예: 2025-11-20)'],
      ['3. 거래처명', '관련 거래처명 (선택사항, 예: 한미약품, 대웅제약)'],
      ['4. 내용', '실행이 필요한 회의 내용 (한 줄 액션 아이템으로 작성 권장)'],
      ['5. 기록여부', '단순 기록인 경우 "기록" 또는 "O" 입력 (선택사항, 기본값: 실행 필요)'],
      ['6. 담당자명 ✨NEW', '실행 항목을 담당할 사람 이름 (선택사항, 예: 홍길동)'],
      ['7. 답변 ✨NEW', '담당자의 진행 상황이나 관련 내용 (선택사항)'],
      ['', ''],
      ['💡 주의사항', ''],
      ['', '- 예시 데이터(노란색 배경)는 참고용입니다. 삭제하거나 수정해서 사용하세요.'],
      ['', '- 회의제목과 일시, 내용은 필수 입력 항목입니다.'],
      ['', '- 담당자명과 답변은 엑셀에서 미리 작성하면 업로드 시 자동으로 등록됩니다.'],
      ['', '- 파일을 저장한 후 웹에서 업로드하세요.']
    ];

    guides.forEach((guide, index) => {
      const row = guideSheet.addRow(guide);

      if (index === 0) {
        // 제목
        row.font = { bold: true, size: 16, color: { argb: 'FF95c11f' } };
        row.height = 30;
      } else if (guide[0].startsWith('💡')) {
        // 주의사항 제목
        row.font = { bold: true, size: 12, color: { argb: 'FFFF6B6B' } };
        row.height = 25;
      } else if (guide[0] && guide[0].match(/^\d+\./)) {
        // 가이드 항목
        row.getCell(1).font = { bold: true, color: { argb: 'FF2563EB' } };
        row.getCell(2).font = { size: 11 };
        row.height = 30;
      } else {
        // 일반 텍스트
        row.getCell(2).font = { size: 11 };
        row.height = 25;
      }

      row.getCell(2).alignment = { vertical: 'middle', wrapText: true };
    });

    // 엑셀 버퍼 생성
    const buffer = await workbook.xlsx.writeBuffer();

    // 파일명 생성
    const now = new Date();
    const dateString = now.toISOString().split('T')[0].replace(/-/g, '');
    const filename = `회의실행항목_템플릿_${dateString}.xlsx`;

    // 응답 반환
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Template Download Error:', error);
    return NextResponse.json(
      { error: '템플릿 다운로드 중 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
