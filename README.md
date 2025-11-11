# 🔐 Huxeed V-track - 신규품목 활성화 진도관리 시스템

**버전**: v2.10
**최종 업데이트**: 2025-11-07

거래처별 신규 품목(타겟 API)의 활성화 과정을 체계적으로 관리하는 Next.js 기반 웹 애플리케이션입니다.

## ✨ 주요 기능

### 📊 대시보드
- 평균 진척률, 완료 건수, Target매출액, 전략달성율 KPI 표시
- 단계별 진행 퍼널, 거래처별 진행률 차트
- S/P 세그먼트별 전략 카드

### 🎯 파이프라인 관리 (Kanban Board)
- 12단계 칸반보드 (시장조사 → WON/LOST)
- 드래그 앤 드롭으로 단계 이동
- 실시간 진행률 표시
- 카드 상세 정보 모달

### 🏭 제조원 관리
- 소싱요청 리스팅
- 제조원 정보 등록/수정/삭제
- 관세율, 부대비용율 계산
- DMF 등록여부, 연계심사 상태 관리

### 📧 이메일 알림 시스템 ✨ NEW
- Gmail SMTP를 통한 무료 이메일 발송 (500개/일)
- 비밀번호 변경 시 자동 알림
- HTML 이메일 템플릿
- 병렬 발송 및 발송 결과 추적

### 📥 엑셀 업로드/다운로드
- 템플릿 다운로드 (수식 포함)
- 데이터 일괄 업로드 (Upsert)
- 자동 계산 및 검증

### 💱 환율 자동 조회
- 한국수출입은행 API 연동
- 통화 선택 시 실시간 환율 자동 조회
- 환율 히스토리 차트 (최근 30영업일)

### 🔍 자동완성
- 거래처명, 품목명, 제조원명 자동완성
- 데이터 일관성 향상

## 🛠️ 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS 4, @dnd-kit (Drag & Drop)
- **Email**: Nodemailer + Gmail SMTP
- **Charts**: Recharts (환율 차트)
- **File Handling**: ExcelJS
- **State Management**: Zustand, TanStack Query

## 🚀 시작하기

### 1. 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- Supabase 계정
- Gmail 계정 (이메일 발송용)

### 2. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd huxeed-activation-tracker

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail SMTP Email Service (완전 무료)
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_digit_app_password
```

### 4. Gmail SMTP 설정

이메일 알림 기능을 사용하려면 Gmail 앱 비밀번호가 필요합니다.

**상세 가이드**: [`GMAIL_SETUP.md`](./GMAIL_SETUP.md) 참조

**간단 요약**:
1. Gmail 계정에서 2단계 인증 활성화
2. Gmail 앱 비밀번호 생성 (16자리)
3. `.env.local`에 `EMAIL_USER`와 `EMAIL_APP_PASSWORD` 입력
4. 개발 서버 재시작

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
huxeed-activation-tracker/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   ├── dashboard/                # Dashboard 페이지
│   ├── pipeline/                 # Pipeline 관리 (Kanban, 신규 등록, 소싱)
│   ├── report/                   # 리포트 페이지
│   └── admin/                    # 관리자 설정
├── components/                   # React Components
│   ├── dashboard/                # Dashboard 컴포넌트
│   ├── kanban/                   # Kanban Board 컴포넌트
│   ├── report/                   # Report 컴포넌트
│   └── sourcing/                 # Sourcing 컴포넌트
├── lib/                          # 라이브러리
│   ├── email.ts                  # 이메일 발송 (Nodemailer + Gmail SMTP) ✨
│   └── supabase/                 # Supabase 클라이언트
├── types/                        # TypeScript 타입 정의
├── utils/                        # 유틸리티 함수
├── scripts/                      # 유틸리티 스크립트
└── supabase/migrations/          # DB 마이그레이션
```

## 🗄️ 데이터베이스

Supabase PostgreSQL을 사용합니다.

**주요 테이블**:
- `targets` - 거래처별 품목 정보
- `suppliers` - 제조원 정보
- `stage_history` - 단계 이력
- `email_subscribers` - 이메일 수신자 ✨
- `password_history` - 비밀번호 변경 이력 ✨

## 📧 이메일 시스템 사용법

### 기본 사용

비밀번호 변경 시 자동으로 이메일이 발송됩니다:
1. 관리자 설정 (`/admin/settings`) 접속
2. "메일 수신자 관리"에서 이메일 추가
3. "공용 계정 비밀번호"에서 비밀번호 변경
4. 등록된 이메일로 자동 발송 ✅

### 다른 알림 기능에 재사용

`lib/email.ts`의 함수들을 재사용하여 새로운 알림을 추가할 수 있습니다.

**예시**:
```typescript
import { createEmailTransporter } from '@/lib/email';

// 1. 새 템플릿 함수 추가
export function generateMyNotificationHTML({ userName, message }) {
  return `<html>...</html>`;
}

// 2. 새 발송 함수 추가
export async function sendMyNotification({ to, userName, message }) {
  const transporter = createEmailTransporter();  // 기존 함수 재사용

  const html = generateMyNotificationHTML({ userName, message });

  return await transporter.sendMail({
    from: `"Huxeed V-track" <${process.env.EMAIL_USER}>`,
    to,
    subject: '[Huxeed V-track] 알림 제목',
    html,
  });
}

// 3. API에서 사용
import { sendMyNotification } from '@/lib/email';

const info = await sendMyNotification({
  to: 'user@example.com',
  userName: 'John',
  message: 'Your notification here',
});
```

## 🔑 로그인 정보

### 관리자 계정
```
이메일: hsj@huxeed.com
비밀번호: [관리자 비밀번호]
```

### 공용 계정 (일반 사용자)
```
이메일: huxeed@huxeed.com
비밀번호: [공용 비밀번호]
```

## 📚 추가 문서

- **[CLAUDE.md](../CLAUDE.md)** - 상세 PRD 문서 (2,200+ 줄)
- **[GMAIL_SETUP.md](./GMAIL_SETUP.md)** - Gmail SMTP 설정 가이드
- **[PROJECT_STATUS.md](../PROJECT_STATUS.md)** - 프로젝트 현황 요약

## 🎯 주요 워크플로우

### 신규 품목 등록
1. `/pipeline/add` 접속
2. 폼 입력 (거래처, 품목, 가격 정보 등)
3. 자동 계산된 절감 지표 확인
4. 저장 → MARKET_RESEARCH 단계로 자동 등록

### 제조원 관리
1. `/pipeline/sourcing` 접속
2. 소싱요청 품목 확인
3. 제조원 정보 입력 (제조원명, 가격, 관세율, 부대비용율 등)
4. 저장 → 자동으로 SOURCING_COMPLETED 단계로 전환

### 진행 상황 추적
1. `/pipeline` (Kanban Board) 접속
2. 드래그 앤 드롭으로 단계 이동
3. 카드 클릭 → 상세 정보, 단계 이력, 제조원 정보 확인

## 🐛 문제 해결

### 이메일 발송 실패
- Gmail 2단계 인증 활성화 확인
- Gmail 앱 비밀번호 재생성
- `.env.local` 파일에 공백 없이 입력 확인
- 개발 서버 재시작

### 환율 조회 실패
- 한국수출입은행 API 호출 제한 확인 (1000회/일)
- 영업일 11시 전후 업데이트 확인

## 📄 라이선스

Private Project - HUXEED Corporation

---

**개발**: Claude Code SuperClaude Framework
**문의**: Huxeed V-track 개발팀
