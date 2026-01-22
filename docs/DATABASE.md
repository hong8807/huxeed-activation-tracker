# 데이터베이스 스키마

**버전**: v2.12
**최종 업데이트**: 2025-01-22

---

## 📊 ERD 개요

```
┌─────────────────┐       ┌─────────────────┐
│     targets     │───────│  stage_history  │
│                 │  1:N  │                 │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    suppliers    │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    meetings     │       │email_subscribers│
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     users       │───────│password_history │
│                 │  1:N  │                 │
└─────────────────┘       └─────────────────┘
```

---

## 📋 targets (품목 테이블)

거래처별 신규 품목 정보를 관리합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `year` | int | 연도 | 2026 |
| `account_name` | text | 거래처명 | |
| `product_name` | text | 품목명 | |
| `est_qty_kg` | numeric | 예상 수량(kg) | |
| `owner_name` | text | 담당자명 | |
| `sales_2025_krw` | numeric | 2025년 매출액(원) | |
| `segment` | text | 세그먼트 | S, P, 일반 |
| `curr_currency` | text | 현재매입 통화 | USD, EUR, CNY, JPY, KRW |
| `curr_unit_price_foreign` | numeric | 현재매입 단가(외화) | |
| `curr_fx_rate_input` | numeric | 현재매입 환율 | |
| `curr_unit_price_krw` | numeric | 현재매입 단가(원) | 자동 계산 |
| `curr_total_krw` | numeric | 현재매입 총액(원) | 자동 계산 |
| `our_currency` | text | 우리예상 통화 | |
| `our_unit_price_foreign` | numeric | 우리예상 단가(외화) | |
| `our_fx_rate_input` | numeric | 우리예상 환율 | |
| `our_unit_price_krw` | numeric | 우리예상 단가(원) | 자동 계산 |
| `our_est_revenue_krw` | numeric | 예상 매출액(원) | 자동 계산 |
| `saving_per_kg` | numeric | kg당 절감액 | 자동 계산 |
| `total_saving_krw` | numeric | 총 절감액(원) | 자동 계산 |
| `saving_rate` | numeric | 절감률 | 0-1 범위 |
| `current_stage` | text | 현재 단계 | Stage enum |
| `stage_updated_at` | timestamp | 단계 변경일시 | |
| `stage_progress_rate` | numeric | 진행률 | 0-100 |
| `note` | text | 비고 | |
| `created_by` | uuid | 생성자 ID | |
| `created_at` | timestamp | 생성일시 | 자동 |
| `updated_at` | timestamp | 수정일시 | 자동 |

### Stage 값

```typescript
enum Stage {
  MARKET_RESEARCH = '시장조사',      // 0%
  SOURCING_REQUEST = '소싱요청',      // 5%
  SOURCING_COMPLETED = '소싱완료',    // 10%
  QUOTE_SENT = '견적발송',            // 20%
  SAMPLE_SHIPPED = '샘플배송',        // 30%
  QUALIFICATION = '품질테스트',       // 40%
  DMF_RA_REVIEW = 'DMF/RA검토',       // 50%
  PRICE_AGREED = '가격합의',          // 60%
  TRIAL_PO = '시험PO',                // 70%
  REGISTRATION = '완제연계심사중',    // 80%
  COMMERCIAL_PO = '상업PO',           // 90%
  WON = '완료',                       // 100%
  LOST = '실패',                      // 0%
  ON_HOLD = '보류'                    // 50%
}
```

---

## 📜 stage_history (단계 이력)

품목의 단계 변경 이력을 기록합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `target_id` | uuid | Foreign Key | targets.id 참조, CASCADE 삭제 |
| `stage` | text | 변경된 단계 | |
| `changed_at` | timestamp | 변경일시 | 자동 |
| `actor_name` | text | 변경자명 | |
| `comment` | text | 코멘트 | |

---

## 🏭 suppliers (제조원 테이블)

품목별 제조원 정보를 관리합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `target_id` | uuid | Foreign Key | targets.id 참조, CASCADE 삭제 |
| `product_name` | text | 품목명 | Not Null |
| `supplier_name` | text | 제조원명 | Not Null |
| `created_by_name` | varchar(100) | 입력자명 | v2.5 추가 |
| `currency` | text | 통화 | Not Null |
| `unit_price_foreign` | numeric | 단가(외화) | Not Null |
| `fx_rate` | numeric | 환율 | Not Null |
| `tariff_rate` | numeric | 관세율(%) | 기본값 0, v2.5 추가 |
| `additional_cost_rate` | numeric | 부대비용율(%) | 기본값 0, v2.5 추가 |
| `unit_price_krw` | numeric | 최종 단가(원) | 관세+부대비용 포함 |
| `dmf_registered` | boolean | DMF 등록여부 | 기본값 false |
| `linkage_status` | text | 연계심사 상태 | PREPARING, IN_PROGRESS, COMPLETED |
| `note` | text | 비고 | |
| `created_at` | timestamp | 생성일시 | 자동 |
| `updated_at` | timestamp | 수정일시 | 자동 |

### 인덱스

```sql
create index idx_suppliers_target_id on suppliers(target_id);
create index idx_suppliers_product_name on suppliers(product_name);
create index idx_suppliers_product_created on suppliers(product_name, created_at DESC);
```

### 원가 계산 공식

```
기본_KRW = unit_price_foreign × fx_rate
최종_KRW = 기본_KRW × (1 + tariff_rate/100 + additional_cost_rate/100)
```

---

## 📋 meetings (회의록 테이블)

회의록 액션 아이템을 관리합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `meeting_type` | text | 회의 타입 | 외부회의, 일간회의, 월간회의, 분기회의, 년마감회의 |
| `meeting_date` | date | 회의 날짜 | Not Null |
| `account_name` | text | 거래처명 | 외부회의 시 |
| `action_item` | text | 액션 아이템 | |
| `assignee_name` | text | 담당자명 | |
| `reply` | text | 답변 | |
| `is_done` | boolean | 완료 여부 | 기본값 false |
| `created_at` | timestamp | 생성일시 | 자동 |
| `updated_at` | timestamp | 수정일시 | 자동 |

### 회의 타입별 색상

| 회의 타입 | 색상 |
|-----------|------|
| 외부회의 | 초록색 (#10b981) |
| 일간회의 | 파란색 (#3b82f6) |
| 월간회의 | 보라색 (#8b5cf6) |
| 분기회의 | 주황색 (#f59e0b) |
| 년마감회의 | 빨간색 (#ef4444) |

---

## 📧 email_subscribers (이메일 수신자)

이메일 알림 수신자를 관리합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `email` | text | 이메일 | Unique, Not Null |
| `name` | text | 이름 | |
| `is_active` | boolean | 활성화 여부 | 기본값 true |
| `created_at` | timestamp | 생성일시 | 자동 |
| `updated_at` | timestamp | 수정일시 | 자동 |

---

## 👤 users (사용자)

로그인 사용자를 관리합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `email` | text | 이메일 | Unique, Not Null |
| `password_hash` | text | 비밀번호 해시 | bcrypt |
| `name` | text | 이름 | |
| `created_at` | timestamp | 생성일시 | 자동 |

---

## 🔐 password_history (비밀번호 이력)

비밀번호 변경 이력을 기록합니다.

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `id` | uuid | Primary Key | 자동 생성 |
| `user_email` | text | 사용자 이메일 | Not Null |
| `password_hash` | text | 변경된 비밀번호 해시 | |
| `changed_by` | text | 변경자명 | Not Null |
| `changed_at` | timestamp | 변경일시 | Not Null |
| `is_notified` | boolean | 알림 발송 여부 | 기본값 false |
| `created_at` | timestamp | 생성일시 | 자동 |

---

## 🔗 관계 요약

| 관계 | 설명 |
|------|------|
| targets → stage_history | 1:N, CASCADE 삭제 |
| targets → suppliers | 1:N, CASCADE 삭제 |
| users → password_history | 1:N (email 기준) |
