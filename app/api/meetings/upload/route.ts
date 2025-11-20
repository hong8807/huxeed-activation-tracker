import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

// 허용된 회의 타입
const ALLOWED_MEETING_TYPES = ['일간회의', '월간회의', '분기회의', '년마감회의'] as const;

interface ParsedRow {
  meeting_type: string;
  meeting_date: string;
  account_name: string | null;
  content: string;
}

interface ErrorRow {
  row: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다' },
        { status: 400 }
      );
    }

    // 파일 확장자 검증
    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: '.xlsx 파일만 업로드 가능합니다' },
        { status: 400 }
      );
    }

    // ExcelJS로 파싱
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { error: '워크시트를 찾을 수 없습니다' },
        { status: 400 }
      );
    }

    const validRows: ParsedRow[] = [];
    const errorRows: ErrorRow[] = [];

    // 헤더 행 건너뛰고 데이터 행부터 파싱 (row 2부터 시작)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뛰기

      const meetingType = row.getCell(1).value?.toString().trim() || '';
      const meetingDate = row.getCell(2).value;
      const accountName = row.getCell(3).value?.toString().trim() || null;
      const content = row.getCell(4).value?.toString().trim() || '';

      // 검증: 회의제목
      if (!ALLOWED_MEETING_TYPES.includes(meetingType as any)) {
        errorRows.push({
          row: rowNumber,
          reason: `회의제목 오류 (허용: ${ALLOWED_MEETING_TYPES.join(', ')})`
        });
        return;
      }

      // 검증: 일시 (날짜 형식)
      let parsedDate: string;
      try {
        if (meetingDate instanceof Date) {
          parsedDate = meetingDate.toISOString().split('T')[0];
        } else if (typeof meetingDate === 'string') {
          const date = new Date(meetingDate);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
          parsedDate = date.toISOString().split('T')[0];
        } else if (typeof meetingDate === 'number') {
          // Excel serial date number
          const date = new Date((meetingDate - 25569) * 86400 * 1000);
          parsedDate = date.toISOString().split('T')[0];
        } else {
          throw new Error('Invalid date format');
        }
      } catch (err) {
        errorRows.push({
          row: rowNumber,
          reason: '일시 형식 오류 (YYYY-MM-DD 필요)'
        });
        return;
      }

      // 검증: 내용
      if (!content || content.length === 0) {
        errorRows.push({
          row: rowNumber,
          reason: '내용이 비어있습니다'
        });
        return;
      }

      // 유효한 행 추가
      validRows.push({
        meeting_type: meetingType,
        meeting_date: parsedDate,
        account_name: accountName,
        content: content
      });
    });

    // Supabase에 삽입
    const supabase = await createClient();
    let insertedCount = 0;

    if (validRows.length > 0) {
      const { data, error } = await supabase
        .from('meeting_items')
        .insert(
          validRows.map(row => ({
            meeting_type: row.meeting_type,
            meeting_date: row.meeting_date,
            account_name: row.account_name,
            content: row.content,
            assignee_name: null,
            reply_text: null,
            is_done: false
          }))
        );

      if (error) {
        console.error('DB Insert Error:', error);
        return NextResponse.json(
          { error: 'DB 저장 중 오류 발생', details: error.message },
          { status: 500 }
        );
      }

      insertedCount = validRows.length;
    }

    return NextResponse.json({
      success: true,
      inserted_count: insertedCount,
      error_rows: errorRows
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: '엑셀 업로드 중 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
