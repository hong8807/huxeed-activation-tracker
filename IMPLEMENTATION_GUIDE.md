# 📘 HUXEED V-track 구현 기능 가이드

**최종 업데이트**: 2025-11-11
**버전**: v3.0 - 통합 구현 가이드

---

## 📋 목차

1. [개발 워크플로우](#개발-워크플로우)
2. [구현된 전체 기능](#구현된-전체-기능)
3. [페이지별 기능 상세](#페이지별-기능-상세)
4. [API 엔드포인트 전체 목록](#api-엔드포인트-전체-목록)
5. [데이터베이스 구조](#데이터베이스-구조)
6. [배포 프로세스](#배포-프로세스)

---

## 🔄 개발 워크플로우

### 기본 원칙

**⚠️ 중요**: 모든 코드 수정 후 **반드시** 개발 서버에서 테스트 후 배포 요청

### 개발 → 배포 프로세스

```
1. 코드 수정
   ↓
2. 로컬 개발 서버 실행
   $ cd huxeed-activation-tracker
   $ npm run dev
   ↓
3. 브라우저에서 기능 테스트
   http://localhost:3000
   ↓
4. 문제 없음 확인
   ↓
5. 배포 요청
   "수정 확인했습니다. 배포해주세요"
   ↓
6. Vercel 프로덕션 배포
   $ npx vercel --prod
   ↓
7. 배포 완료 확인
   https://huxeed-activation-tracker.vercel.app
```

### 개발 서버 명령어

```bash
# 개발 서버 시작 (Turbopack)
npm run dev

# 빌드 테스트
npm run build

# TypeScript 타입 체크
npx tsc --noEmit

# ESLint 검사
npm run lint
```

---

## 🎯 구현된 전체 기능

### 1. 인증 시스템 (Authentication)

#### 1.1 로그인 (`/login`)
- **관리자 로그인**: 개인 이메일 + 비밀번호
- **공용 계정 로그인**: huxeed@huxeed.com + 공용 비밀번호
- JWT 기반 세션 관리
- 로그인 후 자동으로 `/dashboard`로 리다이렉트

#### 1.2 관리자 설정 (`/admin/settings`)
- **공용 계정 비밀번호 관리**
  - 비밀번호 변경
  - 변경 이력 조회 (날짜, 변경자, 메일 발송 여부)
  - 변경 시 자동 이메일 알림 발송

- **이메일 수신자 관리**
  - 수신자 추가/삭제
  - 활성화/비활성화 토글
  - 이메일 중복 검증

### 2. Dashboard (`/dashboard`)

#### 2.1 핵심 KPI 카드 (4개)
- **평균 진척률**: 전체 품목의 평균 진행률 (%)
- **완료 건수**: WON 단계 품목 개수
- **Target매출액**: 모든 품목의 예상매출액 합계 (백만원)
- **전략달성율**: (예상 신규 매출액 / Target매출액) × 100 (%)

#### 2.2 3대 성장 전략 카드
- **White Space 전략**
  - 대상 품목: Cefaclor, Rebamipide, Clarithromycin
  - Target매출액, 예상 신규 매출액, 달성율
  - 전체 건수, WON 건수

- **Erdosteine 전략**
  - 대상 품목: Erdosteine
  - Target매출액, 예상 신규 매출액, 달성율
  - 전체 건수, WON 건수

- **S/P Segment 전략**
  - 대상: S, P 세그먼트 거래처 (전략 품목 제외)
  - Target매출액, 예상 신규 매출액, 달성율
  - 전체 건수, WON 건수

#### 2.3 거래처별 품목 현황 테이블
- 거래처명, 품목명, 담당자
- TARGET 매출액 (백만원)
- 절감율 (% - 색상 코딩)
- 현재 단계 (배지)

#### 2.4 ISR 캐싱
- 30초마다 재검증
- 첫 방문: 서버 렌더링
- 30초 이내 재방문: 캐시된 HTML 반환 (초고속)

### 3. Pipeline 관리 (`/pipeline`)

#### 3.1 Kanban Board (12단계)
1. **MARKET_RESEARCH** (시장조사, 0%)
2. **SOURCING_REQUEST** (소싱요청, 5%)
3. **SOURCING_COMPLETED** (소싱완료, 10%)
4. **QUOTE_SENT** (견적발송, 20%)
5. **SAMPLE_SHIPPED** (샘플배송, 30%)
6. **QUALIFICATION** (품질테스트, 40%)
7. **DMF_RA_REVIEW** (DMF/RA검토, 50%)
8. **PRICE_AGREED** (가격합의, 60%)
9. **TRIAL_PO** (시험PO, 70%)
10. **REGISTRATION** (완제연계심사중, 80%)
11. **COMMERCIAL_PO** (상업PO, 90%)
12. **WON** (완료, 100%)
- **LOST** (실패, 0%)
- **ON_HOLD** (보류, 50%)

#### 3.2 Kanban 기능
- **드래그앤드롭**: 단계 간 카드 이동
- **단계 자동 전환**: 제조원 1개 이상 등록 시 SOURCING_REQUEST → SOURCING_COMPLETED
- **단계 이동 제한**: 제조원 0개 시 SOURCING_REQUEST 이후 단계로 이동 불가
- **카드 삭제**: 점 3개 메뉴 → 삭제 (CASCADE: stage_history, suppliers 함께 삭제)
- **상세 보기**: 카드 클릭 → 상세 모달
- **제조원 정보 확인**: SOURCING_COMPLETED 이후 단계 카드에 버튼 표시

#### 3.3 카드 정보 표시
- 거래처명 / 품목명
- 담당자명
- 현재 단계 (배지)
- 진행률 (%)
- 절감율 (% - 색상 코딩)
- 최종 업데이트 날짜

#### 3.4 상세 모달 (`TargetDetailModal`)
- **기본 정보**
  - 거래처, 품목, 담당자
  - 2025년 매출액, 예상 수량
  - 세그먼트 (S/P/일반)

- **가격 비교**
  - 현재 매입가 (통화, 단가, 환율, KRW)
  - 우리 예상가 (통화, 단가, 환율, KRW)
  - 절감 분석 (총액, 절감률)

- **제조원 정보** (SOURCING_COMPLETED 이후)
  - 제조원명, 입력자명
  - 소싱 원가 (통화, 단가, 환율)
  - 관세율(%), 부대비용율(%)
  - 최종 원가 (KRW)
  - DMF 등록여부, 연계심사 상태

- **단계 이력**
  - 타임라인 형태 표시
  - 변경 날짜, 변경자, 코멘트

- **다음 단계로 이동**
  - 코멘트 입력
  - 이동 버튼

#### 3.5 신규 품목 등록 (`/pipeline/add`)

**입력 필드** (22개 컬럼):
- **기본 정보** (노란색 배경)
  - 연도, 거래처명*, 품목명*, 수량(kg)*, 담당자명*
  - 2025년 매출액(KRW), 세그먼트* (S/P/일반)

- **현재 매입가** (노란색 배경)
  - 통화* (USD/EUR/CNY/JPY/KRW)
  - 단가(외화)*, 환율*

- **우리 예상 판매가** (노란색 배경)
  - 통화* (USD/EUR/CNY/JPY/KRW)
  - 단가(외화)*, 환율*

- **자동 계산** (회색 배경)
  - 현재매입_단가_KRW = 외화단가 × 환율
  - 현재매입_총액_KRW = 단가_KRW × 수량
  - 우리예상_단가_KRW = 외화단가 × 환율
  - 우리예상_예상매출_KRW = 단가_KRW × 수량
  - 절감_kg당 = 현재매입_단가_KRW - 우리예상_단가_KRW
  - 절감_총액_KRW = 절감_kg당 × 수량
  - 절감률 = (절감_kg당 / 현재매입_단가_KRW) × 100

- **비고** (선택)

**기능**:
- **자동완성**: 거래처명, 품목명 (기존 데이터 기반)
- **환율 자동 조회**: 통화 선택 시 한국수출입은행 API로 실시간 환율 자동 입력
- **실시간 계산**: 입력값 변경 시 자동 계산 필드 즉시 업데이트
- **저장**: 자동으로 MARKET_RESEARCH 단계로 생성

#### 3.6 엑셀 업로드 (`/pipeline/upload`)

**엑셀 템플릿 다운로드**:
- 22개 컬럼 구조 (targets 테이블 전용)
- 수식 자동 적용 (L, M, Q, R, S, T, U)
- 드롭다운 검증 (통화, 세그먼트)
- 조건부 서식 (절감액 음수 → 빨간 배경)
- 시트 보호 (수식 필드만 잠금)
- 파일명: `HUXEED_Activation_Template_YYYY-MM-DD.xlsx`

**엑셀 업로드**:
- 드래그앤드롭 또는 클릭하여 선택
- .xlsx 파일만 허용
- 서버 사이드 재계산 (엑셀 수식 무시)
- Upsert 로직 (거래처 + 품목명 기준)
- 자동으로 MARKET_RESEARCH 단계 설정
- 결과 요약 (신규 추가, 업데이트, 에러)

### 4. 소싱 관리 (`/pipeline/sourcing`)

#### 4.1 소싱요청 리스트
- SOURCING_REQUEST 단계 품목만 표시
- 품목명, 거래처명, 담당자명, 등록일자
- 각 품목 클릭 → 제조원 정보 입력 모달

#### 4.2 제조원 정보 입력 모달 (`SupplierManagementModal`)

**신규 제조원 추가**:
- 제조원명* (자동완성)
- 입력자명* (필수)
- 통화* (USD/EUR/CNY/JPY/KRW)
- 단가(외화)*
- 환율* (통화 선택 시 자동 조회)
- 관세율(%) (선택, 기본값 0)
- 부대비용율(%) (선택, 기본값 0)
- DMF 등록여부 (O/X)
- 완제연계심사 상태 (준비중/진행중/완료)
- 비고 (선택)

**최종 원가 계산**:
```
기본 원가 = 외화단가 × 환율
관세 = 기본 원가 × (관세율 / 100)
부대비용 = 기본 원가 × (부대비용율 / 100)
최종 원가 = 기본 원가 + 관세 + 부대비용
```

**제조원 수정**:
- 기존 제조원 카드에 "수정" 버튼
- 모든 필드 수정 가능
- 낙관적 업데이트 (Optimistic Update)

**제조원 삭제**:
- 카드별 "삭제" 버튼
- 확인 다이얼로그

**대량 등록**:
- 여러 제조원 한 번에 추가
- 품목명 기준으로 동일 품목에 모두 등록

#### 4.3 환율 정보 테이블

**실시간 환율 조회** (한국수출입은행 API):
- USD, EUR, CNY, JPY 환율 표시
- 매매기준율, 전신환(송금) 받으실때, 전신환(송금) 보내실때
- 환율 유형 필터 (드롭다운)
- 최근 7영업일 환율 추이 (테이블)
- 일일 호출 제한: 1000회

**환율 차트 모달**:
- 통화명 클릭 → 모달 오픈
- 최근 30영업일 환율 추이 차트
- 깔끔한 라인 그래프 (Catmull-Rom Spline)
- 현재 환율 및 변동률 통계
- 검은 그라데이션 배경 (#4DA3FF 라인)

### 5. 리포트 (`/report`)

#### 5.1 핵심 성과 지표 (KPI)
- 평균 진척률, 완료 건수, 전체 품목
- 매출목표 (억원), 전략 달성율 (%)
- SVG 다운로드 버튼

#### 5.2 단계별 전환율
- 12단계 퍼널 차트
- 각 단계별 품목 개수
- 단계별 고유 색상
- 0개인 단계는 회색 표시
- SVG 다운로드 버튼

#### 5.3 소싱요청 제조원 등록 현황
- SOURCING_COMPLETED ~ WON 단계 품목
- 품목명, 제조원 등록 개수
- DMF 등록현황 (X/Y)
- 연계심사 완료 (X/Y)
- 제조원 0개: "미등록" 빨간 배지
- 제조원 1개 이상: 녹색 점 + 개수 표시
- SVG 다운로드 버튼

#### 5.4 전체 품목 타임라인 (Gantt Chart)
- **헤더**: 담당자, 거래처, 품목, 시작일, 완료일
- **시작일**: 품목 최초 생성일 (`created_at`)
- **완료일**: WON 단계 도달일 (`stage_updated_at` - WON인 경우만)
- **진행률 바**: 각 단계별 진행 상황 시각화
- **9단계 표시**: SOURCING_REQUEST ~ WON
- 단계별 색상 그라데이션
- WON 단계 품목을 먼저 표시
- SVG 다운로드 버튼

#### 5.5 담당자 필터
- 전체 담당자 / 개별 담당자 선택
- 선택한 담당자의 품목만 표시
- KPI, 차트 모두 필터 적용

#### 5.6 전체 리포트 다운로드
- A4 Landscape 사이즈 (1123×794)
- KPI + 단계별 전환율 + 소싱 현황 + Gantt Chart
- 단일 SVG 파일로 다운로드
- 파일명: `전략품목-전체리포트-A4-[담당자]-YYYY-MM-DD.svg`

### 6. 문서 관리 (`/pipeline/documents`)

#### 6.1 문서 업로드
- 드래그앤드롭 또는 클릭하여 선택
- 파일 타입 제한 없음
- Supabase Storage에 저장

#### 6.2 문서 리스트
- 파일명, 업로드 날짜, 파일 크기
- 다운로드 버튼
- 삭제 버튼 (확인 다이얼로그)

#### 6.3 코멘트 시스템
- 문서별 코멘트 작성
- 작성자, 작성일시 표시
- 코멘트 수정/삭제

---

## 📄 페이지별 기능 상세

### `/` (Home)
- 자동으로 `/dashboard`로 리다이렉트

### `/login` (로그인)
- 관리자 로그인 폼
- 공용 계정 로그인 폼
- "Remember me" 체크박스
- 로그인 성공 → `/dashboard` 리다이렉트

### `/dashboard` (대시보드)
- KPI 카드 4개
- 3대 성장 전략 카드
- 거래처별 품목 현황 테이블
- ISR 캐싱 (30초)

### `/pipeline` (파이프라인)
- Kanban Board (12단계)
- 드래그앤드롭 단계 이동
- 카드 삭제, 상세 보기
- "신규 등록" 버튼

### `/pipeline/add` (신규 품목 등록)
- 22개 필드 입력 폼
- 자동완성 (거래처, 품목)
- 환율 자동 조회
- 실시간 계산

### `/pipeline/upload` (엑셀 업로드)
- 템플릿 다운로드
- 엑셀 업로드
- 결과 요약

### `/pipeline/sourcing` (소싱 관리)
- 소싱요청 리스트
- 제조원 정보 입력/수정/삭제
- 환율 정보 테이블
- 환율 차트 모달

### `/pipeline/documents` (문서 관리)
- 문서 업로드/다운로드/삭제
- 코멘트 시스템

### `/report` (리포트)
- KPI
- 단계별 전환율
- 소싱 현황
- Gantt Chart
- 담당자 필터
- SVG 다운로드

### `/admin/settings` (관리자 설정)
- 공용 계정 비밀번호 관리
- 이메일 수신자 관리

---

## 🔌 API 엔드포인트 전체 목록

### 인증 (Authentication)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/login` | 로그인 (관리자/공용) |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/session` | 세션 확인 |
| POST | `/api/auth/set-accessor` | Accessor 설정 |

### 관리자 (Admin)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/admin/update-shared-password` | 공용 비밀번호 변경 + 이메일 발송 |
| GET | `/api/admin/password-history` | 비밀번호 변경 이력 조회 |
| GET | `/api/admin/email-subscribers` | 이메일 수신자 목록 조회 |
| POST | `/api/admin/email-subscribers` | 이메일 수신자 추가 |
| PUT | `/api/admin/email-subscribers/[id]` | 이메일 수신자 수정 |
| DELETE | `/api/admin/email-subscribers/[id]` | 이메일 수신자 삭제 |

### 품목 관리 (Targets)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/targets` | 시스템 내 신규 품목 등록 |
| DELETE | `/api/targets/[id]` | 품목 삭제 (CASCADE) |
| POST | `/api/update-target/[id]` | 품목 정보 수정 |
| POST | `/api/update-stage/[id]` | 단계 변경 + 이력 저장 + 제조원 검증 |
| GET | `/api/stage-history/[id]` | 단계 이력 조회 |
| POST | `/api/import-targets` | 엑셀 업로드 및 Upsert |
| GET | `/api/download-template` | 엑셀 템플릿 다운로드 |
| POST | `/api/validate-targets` | 품목 데이터 검증 |

### 제조원 관리 (Suppliers)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/suppliers` | 제조원 정보 등록 |
| POST | `/api/suppliers/bulk` | 제조원 대량 등록 (품목명 기준) |
| GET | `/api/suppliers/by-product?productName=xxx` | 품목명으로 제조원 조회 |
| PUT | `/api/suppliers/[id]` | 제조원 정보 수정 |
| DELETE | `/api/suppliers/[id]` | 제조원 삭제 (ID 기반) |
| DELETE | `/api/suppliers/delete-by-name?productName=xxx&supplierName=xxx` | 제조원 삭제 (이름 기반) |

### Dashboard & Reports
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/visualization-data` | Dashboard KPI 및 차트 데이터 |
| GET | `/api/dashboard-strategy` | 전략별 진행 현황 |

### 자동완성 (Autocomplete)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/autocomplete/accounts` | 거래처명 목록 조회 |
| GET | `/api/autocomplete/products` | 품목명 목록 조회 |
| GET | `/api/autocomplete/suppliers` | 제조원명 목록 조회 |

### 환율 (Exchange Rate)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/exchange-rate?currency=USD` | 실시간 환율 조회 (한국수출입은행 API) |
| GET | `/api/exchange-rate-history?currency=USD&rateType=deal_bas_r` | 7영업일 환율 데이터 |
| GET | `/api/exchange-rate-monthly?currency=USD&rateType=deal_bas_r` | 30영업일 환율 데이터 |

### 문서 관리 (Documents)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/upload-document` | 문서 업로드 (Supabase Storage) |
| GET | `/api/download-document?path=xxx` | 문서 다운로드 |
| GET | `/api/comments` | 문서 코멘트 조회 |
| POST | `/api/comments` | 문서 코멘트 작성 |

### 유틸리티 (Utilities)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/test-db` | 데이터베이스 연결 테스트 |

---

## 💾 데이터베이스 구조

### targets 테이블 (품목 기본 정보)
```sql
create table targets (
  id uuid primary key default gen_random_uuid(),
  year int,
  account_name text,
  product_name text,
  est_qty_kg numeric,
  owner_name text,
  sales_2025_krw numeric,
  segment text,  -- S/P/일반

  -- 거래처 현재 매입가
  curr_currency text,
  curr_unit_price_foreign numeric,
  curr_fx_rate_input numeric,
  curr_unit_price_krw numeric,
  curr_total_krw numeric,

  -- 우리 예상 판매가
  our_currency text,
  our_unit_price_foreign numeric,
  our_fx_rate_input numeric,
  our_unit_price_krw numeric,
  our_est_revenue_krw numeric,

  -- 절감 지표
  saving_per_kg numeric,
  total_saving_krw numeric,
  saving_rate numeric,  -- 0-1 범위

  -- 진도 관리
  current_stage text,
  stage_updated_at timestamp,
  stage_progress_rate numeric,

  note text,
  created_by uuid,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

### stage_history 테이블 (단계 이력)
```sql
create table stage_history (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references targets(id) on delete cascade,
  stage text,
  changed_at timestamp default now(),
  actor_name text,
  comment text
);
```

### suppliers 테이블 (제조원 정보)
```sql
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references targets(id) on delete cascade,
  product_name text not null,

  -- 제조원 기본 정보
  supplier_name text not null,
  created_by_name varchar(100),  -- 입력자명

  -- 가격 정보
  currency text not null,
  unit_price_foreign numeric not null,
  fx_rate numeric not null,
  tariff_rate numeric default 0,  -- 관세율 (%)
  additional_cost_rate numeric default 0,  -- 부대비용율 (%)
  unit_price_krw numeric not null,  -- 최종 원가

  -- DMF 및 연계심사
  dmf_registered boolean default false,
  linkage_status text default 'PREPARING',

  note text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 인덱스
create index idx_suppliers_target_id on suppliers(target_id);
create index idx_suppliers_product_name on suppliers(product_name);
create index idx_suppliers_product_created on suppliers(product_name, created_at DESC);
```

### users 테이블 (사용자 정보)
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  role text default 'user',  -- admin, user
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

### email_subscribers 테이블 (이메일 수신자)
```sql
create table email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

### password_history 테이블 (비밀번호 변경 이력)
```sql
create table password_history (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  password_hash text not null,
  changed_by text not null,
  changed_at timestamp not null,
  is_notified boolean default false,  -- 메일 발송 여부
  created_at timestamp default now()
);
```

### documents 테이블 (문서 정보)
```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references users(id),
  created_at timestamp default now()
);
```

### comments 테이블 (코멘트)
```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  created_by uuid references users(id),
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

---

## 🚀 배포 프로세스

### 배포 전 체크리스트

```bash
# 1. 로컬 개발 서버 테스트
npm run dev
# → http://localhost:3000에서 기능 확인

# 2. TypeScript 타입 체크
npx tsc --noEmit
# → 에러 없어야 함

# 3. ESLint 검사
npm run lint
# → 에러 없어야 함

# 4. 프로덕션 빌드 테스트
npm run build
# → 빌드 성공 확인
```

### Vercel 배포 명령어

```bash
# 프로덕션 배포
cd huxeed-activation-tracker
npx vercel --prod

# 배포 로그 확인
npx vercel inspect [deployment-url] --logs

# 환경 변수 확인
npx vercel env ls

# 환경 변수 추가
echo "value" | npx vercel env add ENV_VAR_NAME production

# 환경 변수 제거
echo "y" | npx vercel env rm ENV_VAR_NAME production
```

### 배포 후 확인사항

1. **프로덕션 URL 접속**: https://huxeed-activation-tracker.vercel.app
2. **로그인 테스트**: 관리자/공용 계정 모두 확인
3. **주요 기능 테스트**:
   - Dashboard KPI 표시
   - Pipeline Kanban 드래그앤드롭
   - 신규 품목 등록
   - 제조원 정보 입력
   - 리포트 생성 및 다운로드
4. **이메일 발송 테스트**: 비밀번호 변경 시 이메일 수신 확인

### 환경 변수 (필수)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://eikqjezcngsxskjpleyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Email (Gmail SMTP)
EMAIL_USER=hosj2002@gmail.com
EMAIL_APP_PASSWORD=vqqxayozjltdsnyd

# App URL
NEXT_PUBLIC_APP_URL=https://huxeed-activation-tracker.vercel.app
```

### 롤백 프로세스

```bash
# 1. 이전 배포 목록 확인
npx vercel list

# 2. 특정 배포로 롤백
npx vercel promote [deployment-url]

# 3. 또는 이전 배포 재배포
npx vercel redeploy [deployment-url] --prod
```

---

## 📊 성능 최적화

### Next.js 설정 (`next.config.ts`)
- **압축 활성화**: gzip, brotli
- **이미지 최적화**: AVIF, WebP 포맷
- **패키지 최적화**: Supabase, ExcelJS, Nodemailer
- **HTTP 헤더**: DNS Prefetch, HSTS, Cache-Control

### ISR 캐싱
- Dashboard 페이지: 30초마다 재검증
- 첫 방문: 서버 렌더링
- 30초 이내 재방문: 캐시된 HTML (초고속)

### 예상 성능
- 첫 페이지 로드: 1-1.5초
- 재방문 로드: 0.3-0.5초
- Dashboard API: 100ms (캐시)

상세한 성능 분석은 `PERFORMANCE.md` 참조

---

## 📚 관련 문서

- `CLAUDE.md` - PRD 문서 (요구사항 정의)
- `README.md` - 프로젝트 개요
- `DEPLOYMENT.md` - 배포 가이드
- `PERFORMANCE.md` - 성능 최적화 가이드
- `GMAIL_SETUP.md` - Gmail SMTP 설정 가이드
- `PROJECT_STATUS.md` - 프로젝트 현황
- `UI_DESIGN_SYSTEM.md` - UI 디자인 시스템

---

**작성자**: Claude
**문서 버전**: v3.0
**최종 업데이트**: 2025-11-11
