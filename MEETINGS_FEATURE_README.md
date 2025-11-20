# 회의 실행 항목 관리 기능 - 설치 및 사용 가이드

## 📌 기능 개요

회의록을 엑셀로 업로드하고, 각 실행 항목의 담당자, 답변, 완료 여부를 웹에서 관리할 수 있는 기능입니다.

### 주요 기능
- ✅ 엑셀 파일로 회의 실행 항목 일괄 등록
- ✅ 회의 타입별 필터링 (일간/월간/분기/년마감)
- ✅ 담당자명 및 답변 입력
- ✅ 완료 여부 체크
- ✅ 실시간 편집 및 저장
- ✅ 기존 HUXEED 웹앱 디자인 완벽 통합

---

## 🗄️ 데이터베이스 설정

### 1단계: Supabase SQL Editor 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **"SQL Editor"** 클릭

### 2단계: 마이그레이션 SQL 실행

아래 파일의 내용을 복사하여 SQL Editor에 붙여넣고 실행:

**파일 위치**: `huxeed-activation-tracker/supabase/migrations/20250120_create_meeting_items.sql`

```sql
-- 회의 실행 항목 관리 테이블 생성
CREATE TABLE IF NOT EXISTS meeting_items (
    id              BIGSERIAL PRIMARY KEY,
    meeting_type    VARCHAR(20) NOT NULL,
    meeting_date    DATE NOT NULL,
    content         TEXT NOT NULL,

    assignee_name   VARCHAR(100),
    reply_text      TEXT,
    is_done         BOOLEAN DEFAULT FALSE,

    created_by      VARCHAR(100),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_meeting_items_type ON meeting_items(meeting_type);
CREATE INDEX idx_meeting_items_date ON meeting_items(meeting_date DESC);
CREATE INDEX idx_meeting_items_done ON meeting_items(is_done);

-- 업데이트 시 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meeting_items_updated_at
    BEFORE UPDATE ON meeting_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE meeting_items IS '회의 실행 항목 관리 테이블';
COMMENT ON COLUMN meeting_items.meeting_type IS '회의 종류: 일간회의, 월간회의, 분기회의, 년마감회의';
COMMENT ON COLUMN meeting_items.meeting_date IS '회의 날짜 (YYYY-MM-DD)';
COMMENT ON COLUMN meeting_items.content IS '실행이 필요한 회의 내용';
COMMENT ON COLUMN meeting_items.assignee_name IS '담당자명 (웹에서 입력)';
COMMENT ON COLUMN meeting_items.reply_text IS '담당자 답변 내용';
COMMENT ON COLUMN meeting_items.is_done IS '완료 여부 체크';
```

### 3단계: 실행 확인

SQL Editor 우측 상단의 **"Run"** 버튼 클릭 후, 성공 메시지 확인

---

## 📥 엑셀 템플릿 사용 방법

### 1단계: 템플릿 다운로드

웹앱 접속 후:
1. 좌측 사이드바에서 **"Meetings"** 클릭
2. 우측 상단 **"엑셀 업로드"** 버튼 클릭
3. **"엑셀 템플릿 다운로드"** 버튼 클릭

또는 직접 경로: `/public/회의실행항목_템플릿.xlsx`

### 2단계: 엑셀 작성 가이드

| 컬럼명 | 설명 | 예시 | 주의사항 |
|--------|------|------|----------|
| **회의제목** | 회의 종류 (4가지 중 선택) | 일간회의 | 드롭다운에서 선택 필수 |
| **일시** | 회의 날짜 | 2025-11-20 | YYYY-MM-DD 형식 |
| **거래처명** | 관련 거래처명 | 한미약품 | 선택사항 (빈 값 허용) |
| **내용** | 실행 항목 내용 | 신규 거래처 견적 발송 | 빈 값 불가 |

#### ✅ 허용된 회의제목
- `일간회의`
- `월간회의`
- `분기회의`
- `년마감회의`

#### ✅ 선택사항 컬럼
- **거래처명**: 입력하지 않아도 업로드 가능 (특정 거래처와 무관한 항목)

#### ❌ 흔한 에러
- 회의제목에 오타 (예: "일간 회의" → 공백 불가)
- 일시 형식 오류 (예: "2025/11/20" → 슬래시 대신 하이픈 사용)
- 내용 빈 칸 (거래처명은 빈 칸 허용)

### 3단계: 엑셀 업로드

1. 작성한 엑셀 파일 저장
2. 웹앱 → Meetings → 엑셀 업로드
3. 파일 선택 또는 드래그앤드롭
4. **"업로드 시작"** 버튼 클릭

### 4단계: 결과 확인

- **성공**: 녹색 박스에 "N건 저장 완료" 메시지
- **실패**: 노란색 박스에 에러 행 번호 및 사유 표시

---

## 🖥️ 웹 화면 사용 방법

### 회의 실행 항목 목록 (`/meetings`)

#### 필터 기능
- **회의 타입**: 전체 / 일간 / 월간 / 분기 / 년마감
- **완료 항목 표시**: 체크박스로 완료된 항목 숨김/표시

#### 항목별 기능

1. **완료 체크**
   - 좌측 체크박스 클릭 → 완료 상태 전환
   - 완료된 항목은 녹색 배경 + 취소선

2. **편집**
   - "편집" 버튼 클릭
   - **담당자명** 입력
   - **관련 내용 답변** 입력
   - "저장" 버튼 클릭

3. **삭제**
   - "삭제" 버튼 클릭
   - 확인 다이얼로그 → 확인

---

## 🎨 UI 디자인

### 색상 시스템
- **Primary**: `#95c11f` (브랜드 라임 그린)
- **회의 타입 배지**:
  - 일간회의: 파란색 (`bg-blue-100`)
  - 월간회의: 보라색 (`bg-purple-100`)
  - 분기회의: 주황색 (`bg-orange-100`)
  - 년마감회의: 빨간색 (`bg-red-100`)

### 반응형 디자인
- 모바일/태블릿/데스크톱 모두 지원
- Tailwind CSS 기반 반응형 레이아웃

---

## 🔌 API 엔드포인트

### 1. 엑셀 업로드
```
POST /api/meetings/upload
Content-Type: multipart/form-data

Request Body:
{
  file: [Excel File]
}

Response:
{
  success: true,
  inserted_count: 10,
  error_rows: [
    { row: 5, reason: "회의제목 오류" }
  ]
}
```

### 2. 회의 실행 항목 조회
```
GET /api/meetings?meeting_type=일간회의&is_done=false

Response:
{
  data: [
    {
      id: 1,
      meeting_type: "일간회의",
      meeting_date: "2025-11-20",
      content: "신규 거래처 견적 발송",
      assignee_name: "홍길동",
      reply_text: "견적서 발송 완료",
      is_done: false,
      created_at: "2025-11-20T10:00:00Z",
      updated_at: "2025-11-20T15:30:00Z"
    }
  ]
}
```

### 3. 회의 실행 항목 수정
```
PATCH /api/meetings/[id]
Content-Type: application/json

Request Body:
{
  assignee_name: "홍길동",
  reply_text: "진행 중",
  is_done: false
}

Response:
{
  data: { ... }
}
```

### 4. 회의 실행 항목 삭제
```
DELETE /api/meetings/[id]

Response:
{
  success: true
}
```

---

## 📂 파일 구조

```
huxeed-activation-tracker/
├── app/
│   ├── api/
│   │   └── meetings/
│   │       ├── route.ts              # GET (목록 조회)
│   │       ├── upload/
│   │       │   └── route.ts          # POST (엑셀 업로드)
│   │       └── [id]/
│   │           └── route.ts          # PATCH, DELETE
│   └── meetings/
│       ├── page.tsx                  # 회의 실행 항목 목록 페이지
│       └── upload/
│           └── page.tsx              # 엑셀 업로드 페이지
├── components/
│   └── layout/
│       └── Sidebar.tsx               # 사이드바 (Meetings 메뉴 추가)
├── public/
│   └── 회의실행항목_템플릿.xlsx      # 엑셀 템플릿 파일
├── scripts/
│   └── generate-meeting-template.js  # 템플릿 생성 스크립트
└── supabase/
    └── migrations/
        └── 20250120_create_meeting_items.sql  # DB 마이그레이션
```

---

## 🧪 테스트 시나리오

### 1. 엑셀 업로드 테스트
1. 템플릿 다운로드
2. 3개 행 작성 (각각 다른 회의 타입)
3. 업로드 → 3건 성공 확인
4. 회의 목록에서 3개 항목 표시 확인

### 2. 필터 테스트
1. "일간회의" 필터 선택 → 일간회의 항목만 표시
2. "완료 항목 표시" 체크 해제 → 미완료 항목만 표시

### 3. 편집 테스트
1. 항목 "편집" 클릭
2. 담당자명: "홍길동" 입력
3. 답변: "진행 중" 입력
4. "저장" 클릭 → 페이지 새로고침 없이 즉시 반영 확인

### 4. 완료 체크 테스트
1. 체크박스 클릭 → 녹색 배경 + 취소선 표시
2. 다시 클릭 → 원래대로 복귀

### 5. 삭제 테스트
1. "삭제" 클릭 → 확인 다이얼로그
2. "확인" 클릭 → 목록에서 즉시 제거

---

## 🚀 배포 체크리스트

- [x] DB 마이그레이션 실행 완료
- [x] 엑셀 템플릿 파일 `/public` 폴더에 존재
- [x] API 라우트 정상 작동 확인
- [x] 사이드바 "Meetings" 메뉴 표시 확인
- [x] 엑셀 업로드 성공 테스트
- [x] 회의 목록 조회 테스트
- [x] 편집/삭제 기능 테스트

---

## 🐛 트러블슈팅

### Q1. "회의제목 오류" 에러 발생
**A**: 엑셀 파일의 회의제목 컬럼에 정확히 4가지 값 중 하나가 입력되었는지 확인
- 올바른 예: `일간회의`, `월간회의`, `분기회의`, `년마감회의`
- 잘못된 예: `일간 회의` (공백), `Daily` (영문)

### Q2. "일시 형식 오류" 에러 발생
**A**: 날짜 형식이 `YYYY-MM-DD`인지 확인
- 올바른 예: `2025-11-20`
- 잘못된 예: `2025/11/20`, `11-20-2025`

### Q3. 템플릿 다운로드 404 에러
**A**: `/public/회의실행항목_템플릿.xlsx` 파일이 존재하는지 확인
- 없으면 `node scripts/generate-meeting-template.js` 실행

### Q4. DB 연결 오류
**A**: Supabase 환경 변수 확인
- `.env.local` 파일에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 존재 확인

---

## 📞 지원

추가 문의사항이나 버그 리포트는 프로젝트 관리자에게 연락해주세요.

---

**작성일**: 2025-11-20
**버전**: 1.0.0
**작성자**: Claude Code SuperClaude
