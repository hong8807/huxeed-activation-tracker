# HUXEED V-track

**신규품목 활성화 진도관리 시스템**

**버전**: v2.12 | **최종 업데이트**: 2025-01-22

---

## 📌 개요

거래처별 신규 품목(타겟 API)의 활성화 과정을 체계적으로 관리하는 웹 애플리케이션입니다.

### 핵심 기능

- **Pipeline**: 12단계 칸반보드로 품목 활성화 진행 추적
- **제조원 관리**: 소싱 제조원 정보 등록 및 관리
- **환율 조회**: 한국수출입은행 실시간 환율 자동 조회
- **회의록**: 회의록 업로드, 관리, 이메일 발송
- **대시보드**: KPI 및 전략 달성율 시각화
- **리포트**: 활성화 현황 PDF 출력

### 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel |

---

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 편집

# 개발 서버 실행
npm run dev
```

http://localhost:3000 접속

---

## 📚 문서

상세 문서는 `docs/` 폴더를 참조하세요:

| 문서 | 설명 |
|------|------|
| [docs/README.md](./docs/README.md) | 프로젝트 개요 |
| [docs/FEATURES.md](./docs/FEATURES.md) | 구현된 기능 목록 |
| [docs/API.md](./docs/API.md) | API 엔드포인트 문서 |
| [docs/SETUP.md](./docs/SETUP.md) | 환경 설정 가이드 |
| [docs/DATABASE.md](./docs/DATABASE.md) | 데이터베이스 스키마 |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | 배포 가이드 |

---

## 🔧 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gmail SMTP
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_digit_app_password
```

---

## 🚀 배포

```bash
# Vercel CLI 배포
vercel --prod
```

---

## 📄 라이선스

Private Project - HUXEED Corporation
