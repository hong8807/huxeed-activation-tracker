-- 20250106_add_tariff_to_targets.sql
-- targets 테이블에 개별 관세율/부대비용율 필드 추가 (v2.10)

-- 현재매입 관세율/부대비용율 필드 추가
ALTER TABLE targets
  ADD COLUMN curr_tariff_rate NUMERIC DEFAULT 0,
  ADD COLUMN curr_additional_cost_rate NUMERIC DEFAULT 0;

-- 우리예상 관세율/부대비용율 필드 추가
ALTER TABLE targets
  ADD COLUMN our_tariff_rate NUMERIC DEFAULT 0,
  ADD COLUMN our_additional_cost_rate NUMERIC DEFAULT 0;

-- 필드 설명 추가
COMMENT ON COLUMN targets.curr_tariff_rate IS '현재매입 관세율 (%, 선택 입력, 기본값 0)';
COMMENT ON COLUMN targets.curr_additional_cost_rate IS '현재매입 부대비용율 (%, 선택 입력, 기본값 0)';
COMMENT ON COLUMN targets.our_tariff_rate IS '우리예상 관세율 (%, 선택 입력, 기본값 0)';
COMMENT ON COLUMN targets.our_additional_cost_rate IS '우리예상 부대비용율 (%, 선택 입력, 기본값 0)';

-- 기존 데이터 기본값 설정 (0으로 초기화)
UPDATE targets
SET
  curr_tariff_rate = 0,
  curr_additional_cost_rate = 0,
  our_tariff_rate = 0,
  our_additional_cost_rate = 0
WHERE
  curr_tariff_rate IS NULL OR
  curr_additional_cost_rate IS NULL OR
  our_tariff_rate IS NULL OR
  our_additional_cost_rate IS NULL;
