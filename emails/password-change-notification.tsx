import * as React from 'react';

interface PasswordChangeNotificationEmailProps {
  changedBy: string;
  changedAt: string;
  newPassword: string;
}

export const PasswordChangeNotificationEmail = ({
  changedBy,
  changedAt,
  newPassword,
}: PasswordChangeNotificationEmailProps) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>공용 계정 비밀번호 변경 안내</title>
    </head>
    <body
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#2563eb',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
            }}
          >
            🔐 Huxeed V-track
          </h1>
          <p
            style={{
              color: '#dbeafe',
              margin: '8px 0 0 0',
              fontSize: '14px',
            }}
          >
            신규품목 활성화 진도관리 시스템
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <h2
            style={{
              color: '#1f2937',
              fontSize: '20px',
              fontWeight: 600,
              marginTop: 0,
              marginBottom: '16px',
            }}
          >
            공용 계정 비밀번호가 변경되었습니다
          </h2>

          <p
            style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px',
            }}
          >
            안녕하세요,
            <br />
            Huxeed V-track 공용 계정의 비밀번호가 변경되었습니다.
          </p>

          {/* Info Box */}
          <div
            style={{
              backgroundColor: '#f3f4f6',
              borderLeft: '4px solid #2563eb',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '24px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: 600,
                      width: '120px',
                    }}
                  >
                    변경자
                  </td>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#1f2937',
                      fontSize: '14px',
                    }}
                  >
                    {changedBy}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    변경일시
                  </td>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#1f2937',
                      fontSize: '14px',
                    }}
                  >
                    {changedAt}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    새 비밀번호
                  </td>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#1f2937',
                      fontSize: '14px',
                    }}
                  >
                    <code
                      style={{
                        backgroundColor: '#dbeafe',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: '#1e40af',
                      }}
                    >
                      {newPassword}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Login Info */}
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#92400e',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              📌 로그인 정보
            </p>
            <p
              style={{
                margin: '8px 0 0 0',
                color: '#78350f',
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              • 이메일: <strong>huxeed@huxeed.com</strong>
              <br />
              • 비밀번호: 위의 새 비밀번호를 사용하세요
              <br />• URL:{' '}
              <a
                href="http://localhost:3000/login"
                style={{ color: '#1e40af', textDecoration: 'underline' }}
              >
                http://localhost:3000/login
              </a>
            </p>
          </div>

          <p
            style={{
              color: '#6b7280',
              fontSize: '13px',
              lineHeight: '1.6',
              marginBottom: '8px',
            }}
          >
            이 메일은 공용 계정 비밀번호 변경 시 자동으로 발송됩니다.
            <br />
            문의사항이 있으시면 관리자에게 연락주세요.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#f9fafb',
            padding: '24px 32px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#9ca3af',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            © 2025 Huxeed V-track. All rights reserved.
          </p>
        </div>
      </div>
    </body>
  </html>
);
