# Supabase Storage 설정 가이드

## 📦 supplier-documents 버킷 생성

파일 업로드 기능을 사용하려면 Supabase Storage에 버킷을 생성해야 합니다.

### 방법 1: Supabase Dashboard (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 로그인
   - 프로젝트 선택

2. **Storage 메뉴로 이동**
   - 왼쪽 메뉴에서 `Storage` 클릭

3. **새 버킷 생성**
   - `Create a new bucket` 버튼 클릭
   - **Name**: `supplier-documents`
   - **Public**: `OFF` (비공개 - 중요!)
   - **File size limit**: `50MB`
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`

4. **RLS 정책 확인**
   - Policies 탭에서 다음 정책이 자동 적용되었는지 확인
   - 없으면 아래 SQL 실행

### 방법 2: SQL 스크립트 실행

Supabase SQL Editor에서 다음 스크립트 실행:

```sql
-- Storage bucket 생성
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-documents',
  'supplier-documents',
  false,  -- 비공개
  52428800,  -- 50MB in bytes
  array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]::text[]
)
on conflict (id) do nothing;
```

### 방법 3: Supabase CLI (개발 환경)

로컬 개발 환경에서 테스트용 버킷 생성:

```bash
# Supabase CLI 설치 확인
supabase --version

# 로컬 개발 환경 시작
supabase start

# Storage 설정 파일 생성 (supabase/config/storage.json)
# 자동으로 버킷이 생성됩니다
```

## ✅ 설정 확인

1. **버킷 생성 확인**
   - Supabase Dashboard > Storage
   - `supplier-documents` 버킷이 목록에 표시되어야 함

2. **파일 업로드 테스트**
   - 웹앱 실행: `npm run dev`
   - `/pipeline/sourcing` 페이지 접속
   - 제조원 추가 시 파일 업로드
   - 업로드 성공 메시지 확인

3. **Documents 페이지 확인**
   - `/pipeline/documents` 페이지 접속
   - 품목명 폴더 확인
   - 제조원명 폴더 확인
   - 파일 다운로드 테스트

## 🔧 문제 해결

### 업로드 실패: "Bucket not found"
- Supabase Dashboard에서 `supplier-documents` 버킷 생성 확인
- 버킷 이름 철자 확인 (하이픈 포함)

### 업로드 실패: "RLS policy violation"
- RLS 정책 확인: `supabase/migrations/20250107_add_rls_policies_supplier_documents.sql`
- 정책 적용 확인: Supabase Dashboard > Authentication > Policies

### 파일이 Documents 페이지에 표시되지 않음
- `supplier_documents` 테이블에 데이터가 저장되었는지 확인
- Supabase Dashboard > Table Editor > `supplier_documents`
- 콘솔 로그 확인: 브라우저 개발자 도구 (F12)

### Service Role Key가 없음
- `.env.local` 파일에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- Supabase Dashboard > Settings > API > Service Role Key (secret) 복사
- 환경 변수 추가 후 개발 서버 재시작

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 추가
```

## 📊 폴더 구조

업로드된 파일은 다음과 같은 구조로 저장됩니다:

```
supplier-documents/
├── Erdosteine/                    # 품목명 (sanitized)
│   ├── Farmabios/                 # 제조원명 (sanitized)
│   │   ├── 1673456789_DMF.pdf
│   │   └── 1673456790_COA.pdf
│   └── Zambon/
│       └── 1673456791_Certificate.pdf
└── Thioctic_acid/
    └── Alpha_Lipoic/
        └── 1673456792_Specification.pdf
```

**주의**: 한글 폴더명은 자동으로 영문/숫자로 변환됩니다 (sanitized).

## 🔒 보안 참고사항

- **비공개 버킷**: 인증된 사용자만 파일 접근 가능
- **파일 크기 제한**: 50MB (서버 부하 방지)
- **MIME 타입 제한**: 허용된 파일 형식만 업로드 가능
- **Service Role Key**: 서버 사이드에서만 사용 (클라이언트 노출 금지)

## 📝 데이터베이스 스키마

```sql
-- supplier_documents 테이블 구조
create table supplier_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  product_name text not null,      -- 품목명
  supplier_name text not null,     -- 제조원명
  file_name text not null,         -- 원본 파일명
  file_path text not null,         -- Storage 경로
  file_size bigint not null,       -- 파일 크기 (bytes)
  file_type text not null,         -- MIME type
  uploaded_by text not null,       -- 업로드한 사람
  description text,                -- 파일 설명 (선택)
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```
