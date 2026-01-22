# 환경 설정 가이드

**버전**: v2.12
**최종 업데이트**: 2025-01-22

---

## 📋 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상
- Git
- Supabase 계정
- Gmail 계정 (이메일 발송용)

---

## 🚀 설치

### 1. 프로젝트 클론

```bash
git clone https://github.com/hong8807/huxeed-activation-tracker.git
cd huxeed-activation-tracker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 필요한 값을 입력합니다.

---

## 🔧 환경 변수

### 필수 환경 변수

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gmail SMTP (이메일 발송용)
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_digit_app_password
```

### Supabase 설정

1. [Supabase](https://supabase.com) 접속
2. 프로젝트 생성 또는 선택
3. Settings > API에서 URL과 키 복사
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key

### Gmail SMTP 설정

Gmail 앱 비밀번호가 필요합니다:

1. Google 계정 > 보안 > 2단계 인증 활성화
2. Google 계정 > 보안 > 앱 비밀번호
3. 앱 선택: "메일", 기기 선택: "기타(맞춤 이름)"
4. 생성된 16자리 비밀번호를 `EMAIL_APP_PASSWORD`에 입력

---

## 🗄️ 데이터베이스 설정

### 테이블 생성

Supabase SQL Editor에서 다음 마이그레이션 실행:

```sql
-- 1. targets 테이블
create table targets (
  id uuid primary key default gen_random_uuid(),
  year int,
  account_name text,
  product_name text,
  est_qty_kg numeric,
  owner_name text,
  sales_2025_krw numeric,
  segment text,
  curr_currency text,
  curr_unit_price_foreign numeric,
  curr_fx_rate_input numeric,
  curr_unit_price_krw numeric,
  curr_total_krw numeric,
  our_currency text,
  our_unit_price_foreign numeric,
  our_fx_rate_input numeric,
  our_unit_price_krw numeric,
  our_est_revenue_krw numeric,
  saving_per_kg numeric,
  total_saving_krw numeric,
  saving_rate numeric,
  current_stage text default 'MARKET_RESEARCH',
  stage_updated_at timestamp,
  stage_progress_rate numeric default 0,
  note text,
  created_by uuid,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 2. stage_history 테이블
create table stage_history (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references targets(id) on delete cascade,
  stage text,
  changed_at timestamp default now(),
  actor_name text,
  comment text
);

-- 3. suppliers 테이블
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references targets(id) on delete cascade,
  product_name text not null,
  supplier_name text not null,
  created_by_name varchar(100),
  currency text not null,
  unit_price_foreign numeric not null,
  fx_rate numeric not null,
  tariff_rate numeric default 0,
  additional_cost_rate numeric default 0,
  unit_price_krw numeric not null,
  dmf_registered boolean default false,
  linkage_status text default 'PREPARING',
  note text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 4. meetings 테이블
create table meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_type text not null,
  meeting_date date not null,
  account_name text,
  action_item text,
  assignee_name text,
  reply text,
  is_done boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 5. email_subscribers 테이블
create table email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 6. users 테이블 (인증용)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  created_at timestamp default now()
);

-- 7. password_history 테이블
create table password_history (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  password_hash text not null,
  changed_by text not null,
  changed_at timestamp not null,
  is_notified boolean default false,
  created_at timestamp default now()
);

-- 인덱스 생성
create index idx_suppliers_target_id on suppliers(target_id);
create index idx_suppliers_product_name on suppliers(product_name);
create index idx_stage_history_target_id on stage_history(target_id);
create index idx_meetings_date on meetings(meeting_date);
```

---

## 🏃 실행

### 개발 서버

```bash
npm run dev
```

http://localhost:3000 에서 확인

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 타입 체크

```bash
npm run type-check
```

### 린트

```bash
npm run lint
```

---

## 🚀 배포 (Vercel)

### CLI 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 배포
vercel --prod
```

### 환경 변수 설정

Vercel 대시보드에서 환경 변수 설정:

1. Project Settings > Environment Variables
2. 위의 모든 환경 변수 추가
3. Production, Preview, Development 모두 선택

---

## 🔍 문제 해결

### 빌드 에러

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### 환경 변수 오류

```bash
# 환경 변수 확인
cat .env.local
```

### 데이터베이스 연결 오류

```bash
# 연결 테스트
curl http://localhost:3000/api/test-db
```

### 이메일 발송 오류

- Gmail 2단계 인증 확인
- 앱 비밀번호 정확히 입력 (16자리, 공백 없이)
- EMAIL_USER와 EMAIL_APP_PASSWORD 확인
