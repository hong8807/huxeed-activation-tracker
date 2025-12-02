/**
 * 기존 외부회의에 대한 이메일 발송 스크립트
 *
 * 목적: 이미 등록된 외부회의에 대해 이메일 알림 발송
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Gmail SMTP Transporter 생성
 */
function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

/**
 * 외부회의 알림 이메일 HTML 생성
 */
function generateExternalMeetingEmailHTML({ meetingDate, accountName, content }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>외부회의 등록 알림</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #10b981; padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        📝 Huxeed V-track
      </h1>
      <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">
        신규품목 활성화 진도관리 시스템
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
        외부회의 회의록이 등록되었습니다
      </h2>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        안녕하세요,<br>
        ${meetingDate} ${accountName}과 진행된 회의록이 등록되었으니 업무에 참고하세요.
      </p>

      <!-- Info Box -->
      <div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; width: 120px;">
                회의 일시
              </td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                ${meetingDate}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                거래처명
              </td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                ${accountName}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; vertical-align: top;">
                회의 내용
              </td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px; line-height: 1.5;">
                ${content}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Login Info -->
      <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">
          📌 상세 내용 확인
        </p>
        <p style="margin: 8px 0 0 0; color: #1e3a8a; font-size: 13px; line-height: 1.5;">
          • 회의록 페이지: <a href="https://huxeed-activation-tracker.vercel.app/meetings" style="color: #1e40af; text-decoration: underline;">https://huxeed-activation-tracker.vercel.app/meetings</a><br>
          • 로그인 정보: <strong>huxeed@huxeed.com</strong> / 공용 비밀번호
        </p>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-bottom: 8px;">
        이 메일은 외부회의 등록 시 자동으로 발송됩니다.<br>
        문의사항이 있으시면 관리자에게 연락주세요.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
        © 2025 Huxeed V-track. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * 이메일 발송 함수
 */
async function sendExternalMeetingEmail({ to, meetingDate, accountName, content }) {
  const transporter = createEmailTransporter();
  const html = generateExternalMeetingEmailHTML({ meetingDate, accountName, content });

  const info = await transporter.sendMail({
    from: `"Huxeed V-track" <${process.env.EMAIL_USER}>`,
    to,
    subject: '[Huxeed V-track] 외부회의 회의록 등록 안내',
    html,
  });

  return info;
}

(async () => {
  console.log('📧 기존 외부회의 이메일 발송 시작...\n');

  // Step 1: 외부회의 조회
  const { data: externalMeetings, error: meetingError } = await supabase
    .from('meeting_items')
    .select('id, meeting_date, account_name, content, created_at')
    .eq('meeting_type', '외부회의')
    .order('meeting_date', { ascending: false });

  if (meetingError) {
    console.error('❌ 외부회의 조회 실패:', meetingError.message);
    return;
  }

  if (!externalMeetings || externalMeetings.length === 0) {
    console.log('✅ 등록된 외부회의가 없습니다\n');
    return;
  }

  console.log(`📊 외부회의 ${externalMeetings.length}건 발견\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  externalMeetings.forEach((meeting, index) => {
    console.log(`${index + 1}. [${meeting.meeting_date}] ${meeting.account_name || '(거래처명 없음)'}`);
    console.log(`   내용: ${meeting.content.substring(0, 50)}...`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 2: 활성화된 이메일 수신자 조회
  const { data: subscribers, error: subscriberError } = await supabase
    .from('email_subscribers')
    .select('email, name')
    .eq('is_active', true);

  if (subscriberError) {
    console.error('❌ 이메일 수신자 조회 실패:', subscriberError.message);
    return;
  }

  if (!subscribers || subscribers.length === 0) {
    console.log('❌ 활성화된 이메일 수신자가 없습니다\n');
    return;
  }

  console.log(`📮 이메일 수신자 ${subscribers.length}명 발견\n`);
  subscribers.forEach((sub, index) => {
    console.log(`   ${index + 1}. ${sub.name || '이름 없음'} (${sub.email})`);
  });
  console.log('\n');

  // Step 3: 각 외부회의에 대해 이메일 발송
  let totalSent = 0;
  let totalFailed = 0;

  for (const meeting of externalMeetings) {
    console.log(`\n📧 [${meeting.meeting_date}] ${meeting.account_name || '(거래처명 없음)'} 회의 이메일 발송 중...`);

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        await sendExternalMeetingEmail({
          to: subscriber.email,
          meetingDate: meeting.meeting_date,
          accountName: meeting.account_name || '(거래처명 없음)',
          content: meeting.content,
        });
        console.log(`   ✅ ${subscriber.email} - 발송 성공`);
        return { success: true, email: subscriber.email };
      } catch (err) {
        console.error(`   ❌ ${subscriber.email} - 발송 실패:`, err.message);
        return { success: false, email: subscriber.email };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    totalSent += successCount;
    totalFailed += failCount;

    console.log(`   📊 발송 결과: 성공 ${successCount}건 / 실패 ${failCount}건`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 이메일 발송 완료!`);
  console.log(`   - 외부회의: ${externalMeetings.length}건`);
  console.log(`   - 총 발송: ${totalSent}건`);
  console.log(`   - 실패: ${totalFailed}건`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
