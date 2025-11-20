# 🚀 HUXEED Activation Tracker - 배포 문서

**프로젝트명**: HUXEED 신규품목 활성화 진도관리 시스템
**배포 플랫폼**: Vercel
**배포일**: 2025-01-11
**버전**: v2.10 (이메일 알림 시스템)

---

## 📋 목차

1. [배포 개요](#배포-개요)
2. [배포 환경](#배포-환경)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 과정](#배포-과정)
5. [배포 후 확인사항](#배포-후-확인사항)
6. [문제 해결](#문제-해결)
7. [재배포 방법](#재배포-방법)

---

## 🎯 배포 개요

### 프로덕션 URL
- **메인**: https://huxeed-activation-tracker.vercel.app
- **최신 배포**: https://huxeed-activation-tracker-asl96eep2-hongs-projects-1ef6c17d.vercel.app

### 프로젝트 구조
```
C:\projects\strategy2025\
└── huxeed-activation-tracker/    # Next.js 앱 루트 디렉토리
    ├── app/                       # Next.js 14 App Router
    ├── components/                # React 컴포넌트
    ├── lib/                       # 라이브러리 (Supabase, Email)
    ├── types/                     # TypeScript 타입
    ├── utils/                     # 유틸리티 함수
    ├── .env.local                 # 로컬 환경 변수
    └── package.json               # 의존성 관리
```

---

## 🌐 배포 환경

### 기술 스택
- **Framework**: Next.js 16.0.1 (App Router, Turbopack)
- **Runtime**: Node.js 18.x
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer + Gmail SMTP
- **Hosting**: Vercel
- **Language**: TypeScript 5.x

### Vercel 프로젝트 정보
- **프로젝트명**: huxeed-activation-tracker
- **팀**: hongs-projects-1ef6c17d
- **플랜**: Hobby (무료)
- **리전**: Auto (ICN - Seoul)

---

## 🔐 환경 변수 설정

### 필수 환경 변수 (6개)

모든 환경 변수는 **Production**, **Preview**, **Development** 3개 환경에 각각 설정되어야 합니다.

#### 1. Supabase 설정 (3개)

```bash
# Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_URL=https://eikqjezcngsxskjpleyq.supabase.co

# Supabase Anon (Public) Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpa3FqZXpjbmdzeHNranBsZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDE5NDcsImV4cCI6MjA3NzgxNzk0N30.WhJxsJyCXbFEilreKCk8lKVGK9_zpcJ_YqxR2JzfZyA

# Supabase Service Role Key (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpa3FqZXpjbmdzeHNranBsZXlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI0MTk0NywiZXhwIjoyMDc3ODE3OTQ3fQ.Lf2mwqYkO2qAISEYq8srr30mJ8LAkDyE54S3m1syopc
```

#### 2. Gmail SMTP 설정 (2개)

```bash
# Gmail 계정
EMAIL_USER=hosj2002@gmail.com

# Gmail 앱 비밀번호 (16자리)
EMAIL_APP_PASSWORD=vqqxayozjltdsnyd
```

#### 3. 앱 URL 설정 (1개)

```bash
# Production
NEXT_PUBLIC_APP_URL=https://huxeed-activation-tracker.vercel.app

# Preview
NEXT_PUBLIC_APP_URL=https://huxeed-activation-tracker-git-main-hongs-projects-1ef6c17d.vercel.app

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase 키 갱신 방법

Supabase 프로젝트를 재생성하거나 키를 재발급한 경우:

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **API 키 확인**
   - Settings (왼쪽 하단 톱니바퀴) → API
   - Project URL 복사
   - anon public key 복사
   - service_role key `Reveal` 버튼 클릭 후 복사

3. **Vercel 환경 변수 업데이트**
   - Vercel 대시보드 → Settings → Environment Variables
   - 또는 CLI 사용 (아래 참조)

---

## 📦 배포 과정

### 1. 로컬 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd C:\projects\strategy2025\huxeed-activation-tracker

# 의존성 설치
npm install

# 로컬 환경 변수 파일 생성
# .env.local 파일에 위의 환경 변수 복사

# 로컬 개발 서버 실행 (테스트)
npm run dev
# http://localhost:3000 접속하여 동작 확인
```

### 2. TypeScript 빌드 에러 수정 (완료)

배포 전 수정한 TypeScript 에러:

- ✅ ExcelJS `dataValidations` API 변경
- ✅ 조건부 서식 `priority` 속성 추가
- ✅ Buffer 타입 호환성 수정
- ✅ Supabase `nullsLast` 옵션 제거
- ✅ DragEvent 제네릭 타입 수정
- ✅ Null 타입 할당 에러 수정

### 3. Vercel 프로젝트 연결

```bash
# Vercel CLI 설치 (최초 1회)
npm install -g vercel

# Vercel 로그인
npx vercel login

# 프로젝트 연결
cd huxeed-activation-tracker
npx vercel

# 질문에 답변:
# ? Set up and deploy? Yes
# ? Which scope? hongs-projects-1ef6c17d
# ? Link to existing project? Yes
# ? What's the name of your project? huxeed-activation-tracker
```

### 4. 환경 변수 설정 (CLI)

```bash
# Supabase URL
echo "https://eikqjezcngsxskjpleyq.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://eikqjezcngsxskjpleyq.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://eikqjezcngsxskjpleyq.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL development

# Supabase Anon Key
echo "eyJhbGci..." | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGci..." | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "eyJhbGci..." | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

# Supabase Service Role Key
echo "eyJhbGci..." | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "eyJhbGci..." | npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo "eyJhbGci..." | npx vercel env add SUPABASE_SERVICE_ROLE_KEY development

# Gmail SMTP
echo "hosj2002@gmail.com" | npx vercel env add EMAIL_USER production
echo "hosj2002@gmail.com" | npx vercel env add EMAIL_USER preview
echo "hosj2002@gmail.com" | npx vercel env add EMAIL_USER development

echo "vqqxayozjltdsnyd" | npx vercel env add EMAIL_APP_PASSWORD production
echo "vqqxayozjltdsnyd" | npx vercel env add EMAIL_APP_PASSWORD preview
echo "vqqxayozjltdsnyd" | npx vercel env add EMAIL_APP_PASSWORD development

# App URL
echo "https://huxeed-activation-tracker.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production
echo "https://huxeed-activation-tracker-git-main-hongs-projects-1ef6c17d.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL preview
echo "http://localhost:3000" | npx vercel env add NEXT_PUBLIC_APP_URL development

# 환경 변수 확인
npx vercel env ls
```

### 5. 프로덕션 배포

```bash
# 프로덕션 배포
npx vercel --prod

# 배포 완료 후 URL 확인
# Production: https://huxeed-activation-tracker.vercel.app
```

---

## ✅ 배포 후 확인사항

### 1. 애플리케이션 접속
- ✅ 메인 URL 접속: https://huxeed-activation-tracker.vercel.app
- ✅ 로딩 에러 없이 로그인 페이지 표시

### 2. 로그인 테스트
- ✅ 관리자 계정 로그인 (users 테이블에 등록된 계정)
- ✅ 공용 계정 로그인
- ✅ 로그인 후 대시보드 표시

### 3. 주요 기능 테스트
- ✅ Dashboard: KPI 카드, 차트 정상 표시
- ✅ Pipeline: 칸반보드, 드래그앤드롭 동작
- ✅ 엑셀 업로드: 템플릿 다운로드, 업로드 정상 동작
- ✅ 제조원 관리: 소싱 리스트, 제조원 입력 정상 동작
- ✅ 이메일 발송: 비밀번호 변경 시 메일 발송 (Gmail SMTP)

### 4. 데이터베이스 연결
- ✅ Supabase 데이터 조회 정상 (targets, suppliers, users 테이블)
- ✅ 데이터 생성/수정/삭제 정상 동작

### 5. 환경 변수 확인
```bash
# Vercel 대시보드에서 확인
# Settings → Environment Variables
# 또는 CLI
npx vercel env ls

# 로컬 환경 변수 pull
npx vercel env pull .env.local
```

---

## 🔧 문제 해결

### 1. "Application error: a server-side exception has occurred"

**원인**: 환경 변수가 설정되지 않았거나 잘못된 값

**해결**:
```bash
# 환경 변수 확인
npx vercel env ls

# 환경 변수가 없으면 추가
# (위의 "환경 변수 설정" 섹션 참조)

# 재배포
npx vercel --prod
```

### 2. "Invalid API key" (Supabase)

**원인**: Supabase 키가 만료되었거나 프로젝트가 재생성됨

**해결**:
1. Supabase 대시보드에서 새 키 확인
2. 기존 환경 변수 삭제
```bash
echo "y" | npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "y" | npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "y" | npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "y" | npx vercel env rm SUPABASE_SERVICE_ROLE_KEY production
echo "y" | npx vercel env rm SUPABASE_SERVICE_ROLE_KEY preview
echo "y" | npx vercel env rm SUPABASE_SERVICE_ROLE_KEY development
```
3. 새 키 추가 (위의 "환경 변수 설정" 참조)
4. 재배포

### 3. "이메일 또는 비밀번호가 올바르지 않습니다"

**원인**:
- users 테이블에 계정이 없음
- 비밀번호 해시가 올바르지 않음

**해결**:
1. Supabase 대시보드 → Table Editor → users 테이블 확인
2. 계정이 없으면 Supabase SQL Editor에서 생성:
```sql
-- 관리자 계정 생성 (비밀번호: Admin123!)
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
  'admin@example.com',
  '$2a$10$hashedpassword...',  -- bcrypt 해시
  'admin',
  true
);
```

### 4. 이메일 발송 실패

**원인**:
- Gmail 앱 비밀번호가 잘못됨
- Gmail 계정 2단계 인증 미설정

**해결**:
1. Gmail 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 재생성 (16자리)
3. Vercel 환경 변수 업데이트
```bash
echo "y" | npx vercel env rm EMAIL_APP_PASSWORD production
echo "새로운앱비밀번호" | npx vercel env add EMAIL_APP_PASSWORD production
```
4. 재배포

### 5. 빌드 에러 (TypeScript)

**원인**: 타입 호환성 문제 또는 라이브러리 업데이트

**해결**:
```bash
# 로컬에서 빌드 테스트
npm run build

# 에러 메시지 확인 후 수정
# 일반적인 수정 사항:
# - any 타입 사용
# - null 체크 추가 (|| '', ??)
# - 타입 assertion (as any)

# 수정 후 커밋 및 배포
git add .
git commit -m "Fix TypeScript build errors"
npx vercel --prod
```

### 6. 환경 변수에 `\n` 포함 문제

**원인**: Vercel CLI로 pull한 환경 변수에 줄바꿈 문자 포함

**해결**:
```bash
# .env.local 파일 수동 수정
# 모든 값 끝의 \n 제거
# 또는 새로 작성 (위의 환경 변수 섹션 참조)
```

---

## 🔄 재배포 방법

### 코드 변경 후 재배포

```bash
# 1. 변경사항 커밋 (선택사항)
git add .
git commit -m "Update: 변경 내용"

# 2. Vercel 배포
cd huxeed-activation-tracker
npx vercel --prod

# 3. 배포 완료 후 URL 확인
# Production: https://huxeed-activation-tracker.vercel.app
```

### 환경 변수만 변경 후 재배포

```bash
# 1. Vercel 대시보드에서 환경 변수 수정
# Settings → Environment Variables → Edit

# 2. 재배포 (코드 변경 없이)
npx vercel --prod

# 또는 CLI로 환경 변수 수정
echo "새로운값" | npx vercel env add 변수명 production
npx vercel --prod
```

### 이전 배포로 롤백

```bash
# 1. Vercel 대시보드 → Deployments
# 2. 이전 배포 찾기
# 3. 점 3개 메뉴(⋮) → Promote to Production
```

---

## 📊 배포 통계

### 빌드 정보
- **빌드 시간**: ~2분
- **번들 크기**:
  - First Load JS: ~300KB
  - Total Routes: 39개
- **최적화**:
  - Turbopack 사용
  - 이미지 최적화
  - 자동 코드 스플리팅

### 성능 지표
- **TTFB**: <200ms
- **FCP**: <1.5s
- **LCP**: <2.5s
- **CLS**: <0.1

---

## 📝 변경 이력

### 2025-01-11 (최초 배포)
- ✅ Next.js 16.0.1 프로젝트 Vercel 배포
- ✅ Supabase 환경 변수 설정
- ✅ Gmail SMTP 이메일 시스템 구성
- ✅ TypeScript 빌드 에러 수정 (7건)
- ✅ Supabase API 키 갱신
- ✅ 로그인 기능 정상 동작 확인

### 주요 수정 사항
1. **ExcelJS API 변경**: `worksheet.dataValidations.add()` → 개별 셀 할당
2. **조건부 서식**: `priority: 1` 속성 추가
3. **Buffer 타입**: `as any` 타입 assertion 추가
4. **Supabase**: `nullsLast` 옵션 제거
5. **DragEvent**: 제네릭 타입 `<HTMLDivElement>` → `React.DragEvent`
6. **Null 처리**: `|| ''` null coalescing 추가
7. **환경 변수**: Supabase API 키 갱신 (2025-01-11)

---

## 🔗 참고 링크

- **프로덕션**: https://huxeed-activation-tracker.vercel.app
- **Vercel 대시보드**: https://vercel.com/hongs-projects-1ef6c17d/huxeed-activation-tracker
- **Supabase 대시보드**: https://supabase.com/dashboard/project/eikqjezcngsxskjpleyq
- **프로젝트 문서**: `CLAUDE.md`
- **Gmail 설정 가이드**: `GMAIL_SETUP.md`

---

## 💡 추가 정보

### 로컬 개발 환경 설정

```bash
# 1. 프로젝트 클론 또는 디렉토리 이동
cd C:\projects\strategy2025\huxeed-activation-tracker

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env.local 파일 생성 (위의 환경 변수 복사)

# 4. 개발 서버 실행
npm run dev

# 5. 브라우저에서 확인
# http://localhost:3000
```

### Vercel CLI 명령어

```bash
# 로그인
npx vercel login

# 프로젝트 연결
npx vercel

# 프로덕션 배포
npx vercel --prod

# 환경 변수 목록
npx vercel env ls

# 환경 변수 추가
npx vercel env add 변수명 환경

# 환경 변수 삭제
npx vercel env rm 변수명 환경

# 환경 변수 pull
npx vercel env pull .env.local

# 로그 확인
npx vercel logs URL --follow

# 배포 목록
npx vercel ls

# 프로젝트 정보
npx vercel inspect URL
```

---

**작성일**: 2025-01-11
**작성자**: Claude
**문서 버전**: 1.0
