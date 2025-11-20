import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // 필터 파라미터
    const meetingType = searchParams.get('meeting_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const isDone = searchParams.get('is_done');

    // 쿼리 빌드
    let query = supabase
      .from('meeting_items')
      .select('*')
      .order('meeting_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (meetingType && meetingType !== 'all') {
      query = query.eq('meeting_type', meetingType);
    }

    if (startDate) {
      query = query.gte('meeting_date', startDate);
    }

    if (endDate) {
      query = query.lte('meeting_date', endDate);
    }

    if (isDone !== null && isDone !== undefined && isDone !== 'all') {
      query = query.eq('is_done', isDone === 'true');
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json(
        { error: '데이터 조회 중 오류 발생', details: error.message },
        { status: 500 }
      );
    }

    // 엑셀 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('회의 실행 항목');

    // 컬럼 정의
    worksheet.columns = [
      { header: '회의제목', key: 'meeting_type', width: 15 },
      { header: '일시', key: 'meeting_date', width: 15 },
      { header: '거래처명', key: 'account_name', width: 25 },
      { header: '내용', key: 'content', width: 60 },
      { header: '담당자명', key: 'assignee_name', width: 15 },
      { header: '답변', key: 'reply_text', width: 60 },
      { header: '완료여부', key: 'is_done', width: 10 },
      { header: '최종수정일', key: 'updated_at', width: 20 },
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
    headerRow.height = 25;

    // 데이터 추가
    items?.forEach((item) => {
      worksheet.addRow({
        meeting_type: item.meeting_type,
        meeting_date: item.meeting_date,
        account_name: item.account_name || '',
        content: item.content,
        assignee_name: item.assignee_name || '',
        reply_text: item.reply_text || '',
        is_done: item.is_done ? 'O' : 'X',
        updated_at: new Date(item.updated_at).toLocaleString('ko-KR'),
      });
    });

    // 데이터 행 스타일
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'top', wrapText: true };
        row.height = 30;

        // 완료된 항목은 연한 녹색 배경
        const isDoneCell = row.getCell(7);
        if (isDoneCell.value === 'O') {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE8F5E9' },
            };
          });
        }

        // 테두리
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          };
        });
      }
    });

    // 엑셀 버퍼 생성
    const buffer = await workbook.xlsx.writeBuffer();

    // 파일명 생성 (현재 날짜 포함)
    const now = new Date();
    const dateString = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const filename = `회의실행항목_${dateString}_${timeString}.xlsx`;

    // 응답 반환
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { error: '엑셀 다운로드 중 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
