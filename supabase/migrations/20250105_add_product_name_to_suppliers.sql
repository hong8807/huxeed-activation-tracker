-- ============================================
-- suppliers 테이블에 product_name 컬럼 추가
-- 제조원 정보를 품목명 기준으로 관리하기 위함
-- ============================================

-- 1. product_name 컬럼 추가 (nullable로 먼저 추가)
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS product_name text;

-- 2. 기존 데이터 마이그레이션 (target_id → product_name)
UPDATE suppliers
SET product_name = targets.product_name
FROM targets
WHERE suppliers.target_id = targets.id
AND suppliers.product_name IS NULL;

-- 3. product_name NOT NULL 제약 추가
ALTER TABLE suppliers
ALTER COLUMN product_name SET NOT NULL;

-- 4. 인덱스 추가 (빠른 조회를 위함)
CREATE INDEX IF NOT EXISTS idx_suppliers_product_name ON suppliers(product_name);

-- 5. 복합 인덱스 추가 (product_name + created_at)
CREATE INDEX IF NOT EXISTS idx_suppliers_product_created ON suppliers(product_name, created_at DESC);

-- 확인 쿼리
-- SELECT product_name, COUNT(*) as supplier_count
-- FROM suppliers
-- GROUP BY product_name
-- ORDER BY product_name;
