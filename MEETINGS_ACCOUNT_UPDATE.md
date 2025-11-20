# 회의 실행 항목 - 거래처명 필드 추가 (v1.1)

## 📝 업데이트 개요

회의 실행 항목에 **거래처명** 필드를 추가하여, 각 실행 항목이 어떤 거래처와 관련된 것인지 명확히 파악할 수 있도록 개선했습니다.

**업데이트 날짜**: 2025-11-20
**버전**: v1.1

---

## 🆕 변경 사항

### 1. 데이터베이스 스키마 업데이트

#### 추가된 컬럼
```sql
account_name VARCHAR(200)  -- 거래처명 (선택사항)
```

**위치**: `meeting_items` 테이블의 `meeting_date`와 `content` 사이

**특징**:
- ✅ NULL 허용 (선택사항)
- ✅ 최대 200자
- ✅ 기존 데이터에 영향 없음 (NULL로 자동 설정)

#### 마이그레이션 SQL
```sql
-- 기존 테이블이 있다면 컬럼 추가
ALTER TABLE meeting_items ADD COLUMN IF NOT EXISTS account_name VARCHAR(200);

-- 코멘트 추가
COMMENT ON COLUMN meeting_items.account_name IS '거래처명 (엑셀에서 입력, 선택사항)';
```

---

### 2. 엑셀 템플릿 업데이트

#### 변경 전 (3개 컬럼)
| 회의제목 | 일시 | 내용 |
|---------|------|------|

#### 변경 후 (4개 컬럼)
| 회의제목 | 일시 | **거래처명** | 내용 |
|---------|------|------------|------|

#### 예시 데이터
| 회의제목 | 일시 | 거래처명 | 내용 |
|---------|------|---------|------|
| 일간회의 | 2025-11-20 | **한미약품** | 신규 거래처 가격 견적서 발송 완료 확인 |
| 월간회의 | 2025-11-15 | **대웅제약** | Q4 매출 목표 달성을 위한 전략 수립 회의 |
| 분기회의 | 2025-10-01 | **셀트리온제약** | 신규 제조원 발굴 현황 공유 및 평가 |

---

### 3. API 업데이트

#### 업로드 API (`POST /api/meetings/upload`)

**변경 사항**:
- 3번째 컬럼을 `account_name`으로 인식
- 4번째 컬럼을 `content`로 인식
- `account_name`이 빈 값이면 `null`로 저장

**파싱 로직**:
```typescript
const meetingType = row.getCell(1).value?.toString().trim() || '';
const meetingDate = row.getCell(2).value;
const accountName = row.getCell(3).value?.toString().trim() || null;  // ✨ NEW
const content = row.getCell(4).value?.toString().trim() || '';
```

**DB 삽입**:
```typescript
{
  meeting_type: row.meeting_type,
  meeting_date: row.meeting_date,
  account_name: row.account_name,  // ✨ NEW
  content: row.content,
  assignee_name: null,
  reply_text: null,
  is_done: false
}
```

#### 조회 API (`GET /api/meetings`)

**응답에 추가**:
```json
{
  "data": [
    {
      "id": 1,
      "meeting_type": "일간회의",
      "meeting_date": "2025-11-20",
      "account_name": "한미약품",  // ✨ NEW
      "content": "신규 거래처 견적 발송",
      "assignee_name": "홍길동",
      "reply_text": "견적서 발송 완료",
      "is_done": false,
      "created_at": "2025-11-20T10:00:00Z",
      "updated_at": "2025-11-20T15:30:00Z"
    }
  ]
}
```

---

### 4. UI 업데이트

#### 회의 목록 페이지 (`/meetings`)

**변경 사항**:
- 거래처명이 있는 경우 배지로 표시
- 회의 타입, 일시 옆에 회색 배지로 표시

**표시 예시**:
```
┌─────────────────────────────────────────┐
│ [일간회의] 2025-11-20 [한미약품]       │
│ 신규 거래처 가격 견적서 발송 완료 확인 │
└─────────────────────────────────────────┘
```

**코드**:
```tsx
{item.account_name && (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
    {item.account_name}
  </span>
)}
```

#### 업로드 페이지 (`/meetings/upload`)

**가이드 업데이트**:
- 3번 항목으로 "거래처명" 추가
- "선택사항" 명시
- 예시 추가 (한미약품, 대웅제약 등)

---

## 🚀 배포 가이드

### 1단계: 데이터베이스 마이그레이션

**Supabase SQL Editor**에서 실행:

```sql
-- 컬럼 추가 (기존 테이블이 있는 경우)
ALTER TABLE meeting_items ADD COLUMN IF NOT EXISTS account_name VARCHAR(200);

-- 코멘트 추가
COMMENT ON COLUMN meeting_items.account_name IS '거래처명 (엑셀에서 입력, 선택사항)';
```

또는 전체 마이그레이션 파일 재실행:
```sql
-- supabase/migrations/20250120_create_meeting_items.sql
-- (전체 내용 복사하여 실행)
```

### 2단계: 엑셀 템플릿 재생성

```bash
cd huxeed-activation-tracker
node scripts/generate-meeting-template.js
```

**확인**:
- `public/회의실행항목_템플릿.xlsx` 파일이 4개 컬럼으로 생성되었는지 확인

### 3단계: 앱 재배포

```bash
npm run build
# 또는 Vercel 자동 배포
```

### 4단계: 테스트

1. **템플릿 다운로드**
   - `/meetings/upload` 접속
   - "엑셀 템플릿 다운로드" 클릭
   - 4개 컬럼 확인 (회의제목, 일시, 거래처명, 내용)

2. **데이터 입력**
   ```
   일간회의 | 2025-11-20 | 한미약품 | 신규 견적 발송
   월간회의 | 2025-11-15 | 대웅제약 | 매출 목표 회의
   분기회의 | 2025-10-01 |          | 일반 회의 (거래처 없음)
   ```

3. **업로드 및 확인**
   - 파일 업로드
   - `/meetings` 목록에서 거래처명 배지 표시 확인
   - 거래처명이 없는 항목은 배지 미표시 확인

---

## 📊 데이터 마이그레이션

### 기존 데이터 처리

**기존 데이터에 미치는 영향**:
- ✅ 모든 기존 데이터의 `account_name`은 자동으로 `NULL`
- ✅ UI에서 거래처명 배지 미표시
- ✅ 기능 정상 작동 (완료 체크, 편집, 삭제 등)

**수동 업데이트 (선택사항)**:
```sql
-- 특정 항목의 거래처명 추가
UPDATE meeting_items
SET account_name = '한미약품'
WHERE id = 1;

-- 내용에서 거래처명 추출하여 일괄 업데이트 (예시)
UPDATE meeting_items
SET account_name = '한미약품'
WHERE content LIKE '%한미약품%' AND account_name IS NULL;
```

---

## 🔍 검증 체크리스트

### 데이터베이스
- [ ] `meeting_items` 테이블에 `account_name` 컬럼 존재
- [ ] 컬럼 타입: `VARCHAR(200)`
- [ ] NULL 허용 확인

### 엑셀 템플릿
- [ ] 4개 컬럼 (회의제목, 일시, 거래처명, 내용)
- [ ] 거래처명 컬럼 너비: 25
- [ ] 예시 데이터에 거래처명 포함

### API
- [ ] 업로드 시 거래처명 정상 처리
- [ ] 거래처명 빈 값 → `null`로 저장
- [ ] 조회 시 거래처명 포함

### UI
- [ ] 회의 목록에 거래처명 배지 표시
- [ ] 거래처명 없으면 배지 미표시
- [ ] 업로드 가이드에 거래처명 설명 추가

---

## 🎯 사용 시나리오

### 시나리오 1: 거래처 관련 회의
```
회의제목: 일간회의
일시: 2025-11-20
거래처명: 한미약품  ← 입력
내용: 신규 API 견적서 발송 완료 확인
```

→ **결과**: 목록에 "한미약품" 배지 표시

### 시나리오 2: 일반 회의 (거래처 무관)
```
회의제목: 월간회의
일시: 2025-11-15
거래처명: (빈 칸)  ← 입력 안 함
내용: Q4 전체 매출 목표 달성 전략 회의
```

→ **결과**: 거래처명 배지 미표시, 정상 업로드

### 시나리오 3: 여러 거래처 관련
각 거래처별로 별도 행 작성:
```
일간회의 | 2025-11-20 | 한미약품 | 견적 발송
일간회의 | 2025-11-20 | 대웅제약 | 샘플 배송
일간회의 | 2025-11-20 | 셀트리온 | 가격 협상
```

---

## 💡 향후 개선 제안

1. **거래처명 자동완성**
   - 기존 `targets` 테이블의 `account_name` 목록 활용
   - 드롭다운 또는 자동완성 입력

2. **거래처명 필터**
   - 회의 목록에서 거래처명으로 필터링
   - 특정 거래처의 회의 항목만 조회

3. **거래처별 통계**
   - 거래처별 회의 항목 개수
   - 거래처별 완료율

---

**작성자**: Claude Code SuperClaude
**업데이트 버전**: v1.1
**날짜**: 2025-11-20
