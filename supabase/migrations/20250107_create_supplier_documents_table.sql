-- Create supplier_documents table for file management
-- 제조원별 서류 관리 테이블

create table if not exists supplier_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,  -- suppliers.id가 uuid
  product_name text not null,           -- 품목명 (폴더 구조용)
  supplier_name text not null,          -- 제조원명 (폴더 구조용)

  -- File information
  file_name text not null,              -- 원본 파일명
  file_path text not null,              -- Supabase Storage 경로
  file_size bigint not null,            -- 파일 크기 (bytes)
  file_type text not null,              -- MIME type (application/pdf, image/jpeg, etc.)

  -- Metadata
  uploaded_by text not null,            -- 업로드한 사람
  description text,                     -- 파일 설명 (선택)

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_supplier_documents_supplier_id on supplier_documents(supplier_id);
create index if not exists idx_supplier_documents_product_name on supplier_documents(product_name);
create index if not exists idx_supplier_documents_supplier_name on supplier_documents(supplier_name);
create index if not exists idx_supplier_documents_created_at on supplier_documents(created_at desc);

-- Create Supabase Storage bucket for supplier documents
-- Note: This needs to be created via Supabase Dashboard or API
-- Bucket name: 'supplier-documents'
-- Public: false (private files)
-- File size limit: 50MB per file

-- Comments
comment on table supplier_documents is '제조원별 서류 관리 테이블';
comment on column supplier_documents.product_name is '품목명 - 폴더 구조 1단계';
comment on column supplier_documents.supplier_name is '제조원명 - 폴더 구조 2단계';
comment on column supplier_documents.file_path is 'Storage 경로: product_name/supplier_name/filename';
