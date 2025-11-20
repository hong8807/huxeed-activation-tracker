import nodemailer from 'nodemailer';

/**
 * Nodemailer Transporter 생성
 * Gmail SMTP 사용
 */
export function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS 사용
    auth: {
      user: process.env.EMAIL_USER, // Gmail 주소
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail 앱 비밀번호
    },
  });
}

/**
 * 비밀번호 변경 알림 이메일 HTML 생성
 */
export function generatePasswordChangeEmailHTML({
  changedBy,
  changedAt,
  newPassword,
}: {
  changedBy: string;
  changedAt: string;
  newPassword: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>공용 계정 비밀번호 변경 안내</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #2563eb; padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        🔐 Huxeed V-track
      </h1>
      <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 14px;">
        신규품목 활성화 진도관리 시스템
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
        공용 계정 비밀번호가 변경되었습니다
      </h2>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        안녕하세요,<br>
        Huxeed V-track 공용 계정의 비밀번호가 변경되었습니다.
      </p>

      <!-- Info Box -->
      <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600; width: 120px;">
                변경자
              </td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                ${changedBy}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                변경일시
              </td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                ${changedAt}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                새 비밀번호
              </td>
              <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                <code style="background-color: #dbeafe; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #1e40af;">
                  ${newPassword}
                </code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Login Info -->
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
          📌 로그인 정보
        </p>
        <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.5;">
          • 이메일: <strong>huxeed@huxeed.com</strong><br>
          • 비밀번호: 위의 새 비밀번호를 사용하세요<br>
          • URL: <a href="https://huxeed-activation-tracker.vercel.app/login" style="color: #1e40af; text-decoration: underline;">https://huxeed-activation-tracker.vercel.app/login</a>
        </p>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-bottom: 8px;">
        이 메일은 공용 계정 비밀번호 변경 시 자동으로 발송됩니다.<br>
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
export async function sendPasswordChangeEmail({
  to,
  changedBy,
  changedAt,
  newPassword,
}: {
  to: string;
  changedBy: string;
  changedAt: string;
  newPassword: string;
}) {
  const transporter = createEmailTransporter();

  const html = generatePasswordChangeEmailHTML({
    changedBy,
    changedAt,
    newPassword,
  });

  const info = await transporter.sendMail({
    from: `"Huxeed V-track" <${process.env.EMAIL_USER}>`,
    to,
    subject: '[Huxeed V-track] 공용 계정 비밀번호 변경 안내',
    html,
  });

  return info;
}
