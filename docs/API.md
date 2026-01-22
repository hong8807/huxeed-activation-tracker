# API 엔드포인트 문서

**버전**: v2.12
**최종 업데이트**: 2025-01-22

---

## 📊 Targets (품목 관리)

### `GET /api/targets`
품목 목록 조회

**응답**:
```json
{
  "data": [
    {
      "id": "uuid",
      "account_name": "거래처명",
      "product_name": "품목명",
      "current_stage": "MARKET_RESEARCH",
      "segment": "S",
      ...
    }
  ]
}
```

### `POST /api/targets`
신규 품목 등록 (MARKET_RESEARCH 단계로 생성)

**요청**:
```json
{
  "year": 2026,
  "account_name": "거래처명",
  "product_name": "품목명",
  "est_qty_kg": 1000,
  "owner_name": "담당자",
  "segment": "S",
  "curr_currency": "USD",
  "curr_unit_price_foreign": 100,
  "curr_fx_rate_input": 1350,
  ...
}
```

### `DELETE /api/targets/[id]`
품목 삭제 (CASCADE: stage_history, suppliers 함께 삭제)

### `POST /api/update-target/[id]`
품목 정보 수정

### `POST /api/update-stage/[id]`
단계 변경 (이력 자동 기록)

**요청**:
```json
{
  "stage": "QUOTE_SENT",
  "actorName": "홍길동",
  "comment": "견적 발송 완료"
}
```

**에러 (제조원 없음)**:
```json
{
  "error": "제조원 정보를 먼저 등록해주세요",
  "code": "SUPPLIER_REQUIRED"
}
```

---

## 🏭 Suppliers (제조원 관리)

### `GET /api/suppliers/by-product?productName=xxx`
품목명으로 제조원 조회 (case-insensitive)

### `POST /api/suppliers`
제조원 정보 등록

**요청**:
```json
{
  "product_name": "품목명",
  "supplier_name": "제조원명",
  "currency": "USD",
  "unit_price_foreign": 50,
  "fx_rate": 1350,
  "tariff_rate": 5,
  "additional_cost_rate": 3,
  "dmf_registered": true,
  "linkage_status": "PREPARING",
  "created_by_name": "입력자명"
}
```

### `POST /api/suppliers/bulk`
제조원 대량 등록

### `PUT /api/suppliers/[id]`
제조원 정보 수정

### `DELETE /api/suppliers/[id]`
제조원 삭제

### `DELETE /api/suppliers/delete-by-name?productName=xxx&supplierName=xxx`
이름 기반 제조원 삭제

---

## 📈 Dashboard & Report

### `GET /api/visualization-data`
Dashboard/Report용 데이터

**응답**:
```json
{
  "kpis": {
    "totalTargets": 100,
    "avgProgress": 45.5,
    "completedTargets": 10,
    "targetRevenue": 1500000000,
    "achievedRevenue": 500000000,
    "achievementRate": 33.3
  },
  "stageFunnel": [...],
  "accountProgress": [...],
  "sourcingSupplierStatus": [...]
}
```

### `GET /api/dashboard-strategy`
전략별 데이터 (S/P 세그먼트)

### `GET /api/stage-history/[id]`
특정 품목의 단계 이력

---

## 💱 환율 조회

### `GET /api/exchange-rate?currency=USD`
실시간 환율 조회 (한국수출입은행 API)

**응답**:
```json
{
  "currency": "USD",
  "rate": 1350.5,
  "currencyName": "미국 달러",
  "source": "koreaexim"
}
```

### `GET /api/exchange-rate-history?currencies=USD,EUR,CNY,JPY&rateType=deal_bas_r`
7영업일 환율 히스토리

### `GET /api/exchange-rate-monthly?currency=USD&rateType=deal_bas_r`
30영업일 환율 데이터 (차트용)

---

## 📋 Meetings (회의록)

### `GET /api/meetings`
회의록 목록 조회

### `POST /api/meetings/upload`
회의록 엑셀 업로드

### `GET /api/meetings/export`
회의록 엑셀 다운로드

### `PATCH /api/meetings/[id]`
회의록 항목 수정

### `DELETE /api/meetings/[id]`
회의록 항목 삭제

### `POST /api/meetings/send-email`
회의록 이메일 발송 (오늘 날짜만)

**요청**:
```json
{
  "date": "2025-01-22"
}
```

---

## 💡 자동완성

### `GET /api/autocomplete/accounts`
거래처명 목록

### `GET /api/autocomplete/products`
품목명 목록

### `GET /api/autocomplete/suppliers`
제조원명 목록

---

## 📥 엑셀 다운로드/업로드

### `GET /api/download-template`
품목 등록용 엑셀 템플릿 다운로드

### `POST /api/import-targets`
엑셀 파일 업로드 및 Upsert

**응답**:
```json
{
  "success": true,
  "imported": 10,
  "updated": 3,
  "created": 7,
  "errors": []
}
```

### `GET /api/meetings/download-template`
회의록 엑셀 템플릿 다운로드

---

## 🔐 인증

### `POST /api/auth/login`
로그인

**요청**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### `POST /api/auth/logout`
로그아웃

### `GET /api/auth/session`
현재 세션 확인

---

## ⚙️ 관리자

### `GET /api/admin/email-subscribers`
이메일 수신자 목록

### `POST /api/admin/email-subscribers`
수신자 추가

### `DELETE /api/admin/email-subscribers/[id]`
수신자 삭제

### `POST /api/admin/update-shared-password`
공용 비밀번호 변경 (이메일 알림 포함)

### `GET /api/admin/password-history`
비밀번호 변경 이력

---

## 🛠️ 유틸리티

### `GET /api/test-db`
데이터베이스 연결 테스트

### `POST /api/validate-targets`
엑셀 데이터 검증 (업로드 전)
