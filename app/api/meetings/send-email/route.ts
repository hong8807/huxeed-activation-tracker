import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMeetingEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();

    // 오늘 날짜 (한국 시간 기준)
    const today = new Date();
    const koreaTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = koreaTime.toISOString().split('T')[0];

    // 요청된 날짜가 오늘인지 확인
    if (date !== todayStr) {
      return NextResponse.json(
        { error: `오늘 날짜(${todayStr})의 회의록만 발송 가능합니다.` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 오늘 날짜의 회의록 조회
    const { data: meetings, error: meetingError } = await supabase
      .from('meeting_items')
      .select('*')
      .eq('meeting_date', todayStr);

    if (meetingError) {
      return NextResponse.json(
        { error: 'DB 조회 오류', details: meetingError.message },
        { status: 500 }
      );
    }

    if (!meetings || meetings.length === 0) {
      return NextResponse.json(
        { error: `오늘(${todayStr}) 등록된 회의록이 없습니다.` },
        { status: 400 }
      );
    }

    // 활성화된 이메일 수신자 조회
    const { data: subscribers, error: subError } = await supabase
      .from('email_subscribers')
      .select('email, name')
      .eq('is_active', true);

    if (subError || !subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: '활성화된 이메일 수신자가 없습니다.' },
        { status: 400 }
      );
    }

    // 회의 타입별로 그룹화
    const meetingGroups = new Map<string, typeof meetings>();
    for (const item of meetings) {
      const key = item.meeting_type;
      if (!meetingGroups.has(key)) {
        meetingGroups.set(key, []);
      }
      meetingGroups.get(key)!.push(item);
    }

    let totalSent = 0;
    let totalFailed = 0;

    // 각 그룹에 대해 이메일 발송
    for (const [meetingType, items] of meetingGroups) {
      const firstMeeting = items[0];
      const accountName = firstMeeting.account_name;
      const itemCount = items.length;

      const emailPromises = subscribers.map(async (subscriber) => {
        try {
          await sendMeetingEmail({
            to: subscriber.email,
            meetingType,
            meetingDate: todayStr,
            accountName,
            itemCount,
          });
          console.log(`✅ ${meetingType} email sent to ${subscriber.email}`);
          return { success: true };
        } catch (err) {
          console.error(`❌ Error sending email to ${subscriber.email}:`, err);
          return { success: false };
        }
      });

      const results = await Promise.all(emailPromises);
      totalSent += results.filter(r => r.success).length;
      totalFailed += results.filter(r => !r.success).length;
    }

    return NextResponse.json({
      success: true,
      message: `이메일 발송 완료`,
      date: todayStr,
      meetingCount: meetings.length,
      emailsSent: totalSent,
      emailsFailed: totalFailed,
      subscriberCount: subscribers.length,
    });
  } catch (error) {
    console.error('Send Email Error:', error);
    return NextResponse.json(
      { error: '이메일 발송 중 오류 발생', details: String(error) },
      { status: 500 }
    );
  }
}
