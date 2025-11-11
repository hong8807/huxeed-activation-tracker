-- v2.5: 제조원 관리 시스템 고도화
-- 작성일: 2025-11-06
-- 목적: 입력자명, 관세, 부대비용 필드 추가

-- 1. 입력자명 필드 추가
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100);

-- 2. 관세율 필드 추가 (%)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tariff_rate NUMERIC DEFAULT 0;

-- 3. 부대비용율 필드 추가 (%)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS additional_cost_rate NUMERIC DEFAULT 0;

-- 4. 주석 추가
COMMENT ON COLUMN suppliers.created_by_name IS '제조원 정보 입력자명';
COMMENT ON COLUMN suppliers.tariff_rate IS '관세율 (%), 기본값 0';
COMMENT ON COLUMN suppliers.additional_cost_rate IS '부대비용율 (%), 기본값 0';

-- 5. 기존 데이터 기본값 설정 (NULL을 0으로)
UPDATE suppliers
SET tariff_rate = 0
WHERE tariff_rate IS NULL;

UPDATE suppliers
SET additional_cost_rate = 0
WHERE additional_cost_rate IS NULL;

-- 6. unit_price_krw 재계산은 애플리케이션 레벨에서 처리
-- (기존 데이터는 관세/부대비용 없이 계산되었으므로 그대로 유지)
