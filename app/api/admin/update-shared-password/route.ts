import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { sendPasswordChangeEmail } from '@/lib/email';
import bcryptjs from 'bcryptjs';

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
    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: '비밀번호가 필요합니다' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다' },
        { status: 400 }
      );
    }

    // 3. 비밀번호 해싱 (서버에서 처리)
    const passwordHash = await bcryptjs.hash(newPassword, 10);
    console.log('🔐 [Admin API] Password hashed successfully');

    // 4. 관리자 권한 Supabase 클라이언트 생성 (Service Role Key 사용)
    // RLS 정책을 우회하여 users 테이블을 직접 수정할 수 있습니다
    const supabase = await createAdminClient();

    console.log('🔐 [Admin API] Updating shared account password...');

    // 5. 공용 계정 비밀번호 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('email', 'huxeed@huxeed.com')
      .eq('role', 'shared')
      .select();

    if (error) {
      console.error('❌ Password update error:', error);
      return NextResponse.json(
        { error: '비밀번호 업데이트 실패' },
        { status: 500 }
      );
    }

    console.log('✅ Password updated successfully:', data);

    // 6. 비밀번호 변경 이력 기록 (is_notified: false)
    const changedAt = new Date().toISOString();
    const changedBy = session.email || 'admin';

    const { data: historyData, error: historyError } = await supabase
      .from('password_history')
      .insert({
        user_email: 'huxeed@huxeed.com',
        password_hash: passwordHash,
        changed_by: changedBy,
        is_notified: false,
        changed_at: changedAt,
      })
      .select()
      .single();

    if (historyError) {
      console.error('❌ Password history insert error:', historyError);
      // 이력 기록 실패는 치명적이지 않으므로 계속 진행
    }

    console.log('✅ Password history recorded:', historyData?.id);

    // 7. 메일 수신자 목록 조회
    const { data: subscribers, error: subscribersError } = await supabase
      .from('email_subscribers')
      .select('email, name')
      .eq('is_active', true);

    if (subscribersError) {
      console.error('❌ Failed to fetch subscribers:', subscribersError);
      return NextResponse.json({
        success: true,
        message: '비밀번호가 변경되었으나 메일 발송에 실패했습니다',
        emailSent: false,
      });
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('⚠️ No active subscribers found');
      return NextResponse.json({
        success: true,
        message: '비밀번호가 변경되었습니다 (메일 수신자 없음)',
        emailSent: false,
      });
    }

    console.log(`📧 Sending emails to ${subscribers.length} subscribers...`);

    // 8. 메일 발송
    const formattedDate = new Date(changedAt).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const info = await sendPasswordChangeEmail({
          to: subscriber.email,
          changedBy,
          changedAt: formattedDate,
          newPassword: newPassword, // 평문 비밀번호 전달
        });

        console.log(`✅ Email sent to ${subscriber.email}:`, info.messageId);
        return { success: true, email: subscriber.email };
      } catch (err) {
        console.error(`❌ Error sending email to ${subscriber.email}:`, err);
        return { success: false, email: subscriber.email };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    console.log(`📊 Email sending results: ${successCount} succeeded, ${failedCount} failed`);

    // 9. 메일 발송 성공 시 is_notified 업데이트
    if (successCount > 0 && historyData?.id) {
      const { error: updateError } = await supabase
        .from('password_history')
        .update({ is_notified: true })
        .eq('id', historyData.id);

      if (updateError) {
        console.error('❌ Failed to update is_notified:', updateError);
      } else {
        console.log('✅ is_notified updated to true');
      }
    }

    return NextResponse.json({
      success: true,
      message: `비밀번호가 변경되었고 ${successCount}명에게 메일이 발송되었습니다`,
      emailSent: true,
      emailResults: {
        total: subscribers.length,
        succeeded: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('❌ Update shared password error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
