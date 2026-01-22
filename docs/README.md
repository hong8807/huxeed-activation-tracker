# HUXEED V-track (신규품목 활성화 진도관리 시스템)

**버전**: v2.12
**최종 업데이트**: 2025-01-22

## 📌 프로젝트 개요

거래처별 신규 품목(타겟 API)의 활성화 과정을 체계적으로 관리하는 시스템입니다.

### 핵심 기능

- **Pipeline 관리**: 12단계 칸반보드로 품목 활성화 진행 상황 추적
- **제조원 관리**: 소싱 제조원 정보 등록 및 관리
- **환율 조회**: 실시간 한국수출입은행 환율 자동 조회
- **회의록 관리**: 회의록 업로드, 관리, 이메일 발송
- **대시보드**: KPI 및 전략 달성율 시각화
- **리포트**: 활성화 현황 PDF 출력

### 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| State | Zustand, TanStack Query |
| DnD | @dnd-kit |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel |

---

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 필요한 값 입력
```

### 2. 필수 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gmail SMTP (이메일 발송용)
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_digit_app_password
```

### 3. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

---

## 📁 프로젝트 구조

```
huxeed-activation-tracker/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (40+ endpoints)
│   ├── dashboard/         # 대시보드 페이지
│   ├── pipeline/          # Pipeline 관리
│   │   ├── add/          # 신규 품목 등록
│   │   ├── sourcing/     # 제조원 관리
│   │   └── upload/       # 엑셀 업로드
│   ├── meetings/          # 회의록 관리
│   ├── report/            # 리포트 페이지
│   └── admin/settings/    # 관리자 설정
├── components/            # React 컴포넌트
├── lib/                   # 라이브러리 (Supabase, Email)
├── types/                 # TypeScript 타입
├── utils/                 # 유틸리티 함수
├── scripts/               # 스크립트
├── docs/                  # 문서
└── supabase/             # DB 마이그레이션
```

---

## 📚 문서 목록

| 문서 | 설명 |
|------|------|
| [FEATURES.md](./FEATURES.md) | 구현된 기능 상세 목록 |
| [API.md](./API.md) | API 엔드포인트 문서 |
| [SETUP.md](./SETUP.md) | 환경 설정 가이드 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 배포 가이드 |
| [DATABASE.md](./DATABASE.md) | 데이터베이스 스키마 |

---

## 🔐 로그인 정보

- **URL**: https://huxeed-activation-tracker.vercel.app
- **공용 계정**: 관리자 설정 페이지에서 비밀번호 관리

---

## 📞 지원

문의사항은 개발팀에 연락해주세요.
