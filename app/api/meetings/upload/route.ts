import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';
import { sendMeetingEmail } from '@/lib/email';

// 허용된 회의 타입
const ALLOWED_MEETING_TYPES = ['일간회의', '월간회의', '분기회의', '년마감회의', '외부회의'] as const;

interface ParsedRow {
  meeting_type: string;
  meeting_date: string;
  account_name: string | null;
  content: string;
  is_record: boolean;
  assignee_name: string | null;
  reply_text: string | null;
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
      const isRecordValue = row.getCell(5).value?.toString().trim() || '';
      const assigneeName = row.getCell(6).value?.toString().trim() || null;
      const replyText = row.getCell(7).value?.toString().trim() || null;

      // 기록 여부 파싱: "기록", "O", "o", "TRUE", "true" 등을 true로 인식
      const isRecord = ['기록', 'O', 'o', 'TRUE', 'true', 'Y', 'y', '1'].includes(isRecordValue);

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
        content: content,
        is_record: isRecord,
        assignee_name: assigneeName,
        reply_text: replyText
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
            is_record: row.is_record,
            assignee_name: row.assignee_name,
            reply_text: row.reply_text,
            // 단순 기록은 자동으로 완료 처리 (액션 아이템이 아니므로)
            is_done: row.is_record
          }))
        )
        .select();

      if (error) {
        console.error('DB Insert Error:', error);
        return NextResponse.json(
          { error: 'DB 저장 중 오류 발생', details: error.message },
          { status: 500 }
        );
      }

      insertedCount = validRows.length;

      // 모든 회의록에 대해 이메일 발송
      if (data && data.length > 0) {
        // 활성화된 이메일 수신자 조회
        const { data: subscribers } = await supabase
          .from('email_subscribers')
          .select('email, name')
          .eq('is_active', true);

        if (subscribers && subscribers.length > 0) {
          // 회의 타입 + 날짜별로 그룹화
          const meetingGroups = new Map<string, typeof data>();
          for (const item of data) {
            const key = `${item.meeting_type}_${item.meeting_date}`;
            if (!meetingGroups.has(key)) {
              meetingGroups.set(key, []);
            }
            meetingGroups.get(key)!.push(item);
          }

          // 각 그룹에 대해 이메일 발송
          for (const [, meetings] of meetingGroups) {
            const firstMeeting = meetings[0];
            const meetingType = firstMeeting.meeting_type;
            const meetingDate = firstMeeting.meeting_date;
            const accountName = firstMeeting.account_name;
            const itemCount = meetings.length;

            const emailPromises = subscribers.map(async (subscriber) => {
              try {
                await sendMeetingEmail({
                  to: subscriber.email,
                  meetingType,
                  meetingDate,
                  accountName,
                  itemCount,
                });
                console.log(`✅ ${meetingType} email sent to ${subscriber.email}`);
                return { success: true, email: subscriber.email };
              } catch (err) {
                console.error(`❌ Error sending email to ${subscriber.email}:`, err);
                return { success: false, email: subscriber.email };
              }
            });

            await Promise.all(emailPromises);
          }
        }
      }
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
