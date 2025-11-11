import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { PasswordChangeNotificationEmail } from '@/emails/password-change-notification';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // 1. 세션 확인 (관리자만 접근 가능)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증되지 않았습니다' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근 가능합니다' },
        { status: 403 }
      );
    }

    // 2. 요청 body 파싱
    const { newPassword, changedBy, changedAt } = await request.json();

    if (!newPassword || !changedBy || !changedAt) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 3. Supabase에서 활성화된 메일 수신자 목록 조회
    const supabase = await createClient();

    const { data: subscribers, error } = await supabase
      .from('email_subscribers')
      .select('email, name')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Failed to fetch subscribers:', error);
      return NextResponse.json(
        { error: '메일 수신자 목록 조회 실패' },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('⚠️ No active subscribers found');
      return NextResponse.json({
        success: true,
        message: '활성화된 메일 수신자가 없습니다',
        sent: 0,
      });
    }

    console.log(`📧 Sending emails to ${subscribers.length} subscribers...`);

    // 4. 각 수신자에게 메일 발송
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: subscriber.email,
          subject: '[Huxeed V-track] 공용 계정 비밀번호 변경 안내',
          react: PasswordChangeNotificationEmail({
            changedBy,
            changedAt,
            newPassword,
          }),
        });

        if (error) {
          console.error(`❌ Failed to send email to ${subscriber.email}:`, error);
          return { success: false, email: subscriber.email, error };
        }

        console.log(`✅ Email sent to ${subscriber.email}:`, data?.id);
        return { success: true, email: subscriber.email, id: data?.id };
      } catch (err) {
        console.error(`❌ Error sending email to ${subscriber.email}:`, err);
        return { success: false, email: subscriber.email, error: err };
      }
    });

    const results = await Promise.all(emailPromises);

    // 5. 결과 집계
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    console.log(`📊 Email sending results: ${successCount} succeeded, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: `${successCount}명에게 메일을 발송했습니다`,
      total: subscribers.length,
      succeeded: successCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error('❌ Send password notification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
