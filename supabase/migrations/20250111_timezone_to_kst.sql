-- =====================================================
-- 한국 시간(KST, Asia/Seoul) 자동 적용 마이그레이션
-- =====================================================
-- 생성일: 2025-01-11
-- 목적: 모든 timestamp 필드를 한국 시간(UTC+9)으로 자동 저장
-- =====================================================

-- 1. 한국 시간 반환 함수 생성
CREATE OR REPLACE FUNCTION now_kst()
RETURNS timestamp WITH TIME ZONE
LANGUAGE plpgsql
AS $$
BEGIN
  -- 현재 시간을 한국 시간대(Asia/Seoul)로 변환하여 반환
  RETURN (NOW() AT TIME ZONE 'Asia/Seoul');
END;
$$;

COMMENT ON FUNCTION now_kst() IS '한국 시간(KST, UTC+9)을 반환하는 함수';

-- =====================================================
-- 2. targets 테이블의 timestamp 필드 기본값 변경
-- =====================================================

-- stage_updated_at 필드
ALTER TABLE targets
  ALTER COLUMN stage_updated_at SET DEFAULT now_kst();

-- created_at 필드
ALTER TABLE targets
  ALTER COLUMN created_at SET DEFAULT now_kst();

-- updated_at 필드
ALTER TABLE targets
  ALTER COLUMN updated_at SET DEFAULT now_kst();

COMMENT ON COLUMN targets.stage_updated_at IS '단계 업데이트 일시 (한국 시간 기준)';
COMMENT ON COLUMN targets.created_at IS '생성 일시 (한국 시간 기준)';
COMMENT ON COLUMN targets.updated_at IS '수정 일시 (한국 시간 기준)';

-- =====================================================
-- 3. stage_history 테이블의 timestamp 필드 기본값 변경
-- =====================================================

-- changed_at 필드
ALTER TABLE stage_history
  ALTER COLUMN changed_at SET DEFAULT now_kst();

COMMENT ON COLUMN stage_history.changed_at IS '단계 변경 일시 (한국 시간 기준)';

-- =====================================================
-- 4. suppliers 테이블의 timestamp 필드 기본값 변경
-- =====================================================

-- created_at 필드
ALTER TABLE suppliers
  ALTER COLUMN created_at SET DEFAULT now_kst();

-- updated_at 필드
ALTER TABLE suppliers
  ALTER COLUMN updated_at SET DEFAULT now_kst();

COMMENT ON COLUMN suppliers.created_at IS '생성 일시 (한국 시간 기준)';
COMMENT ON COLUMN suppliers.updated_at IS '수정 일시 (한국 시간 기준)';

-- =====================================================
-- 5. email_subscribers 테이블의 timestamp 필드 기본값 변경
-- =====================================================

-- created_at 필드
ALTER TABLE email_subscribers
  ALTER COLUMN created_at SET DEFAULT now_kst();

-- updated_at 필드
ALTER TABLE email_subscribers
  ALTER COLUMN updated_at SET DEFAULT now_kst();

COMMENT ON COLUMN email_subscribers.created_at IS '생성 일시 (한국 시간 기준)';
COMMENT ON COLUMN email_subscribers.updated_at IS '수정 일시 (한국 시간 기준)';

-- =====================================================
-- 6. password_history 테이블의 timestamp 필드 기본값 변경
-- =====================================================

-- created_at 필드
ALTER TABLE password_history
  ALTER COLUMN created_at SET DEFAULT now_kst();

COMMENT ON COLUMN password_history.created_at IS '생성 일시 (한국 시간 기준)';

-- =====================================================
-- 7. updated_at 자동 업데이트 트리거 함수 생성 (KST 기준)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column_kst()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now_kst();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column_kst() IS 'updated_at 필드를 한국 시간으로 자동 업데이트하는 트리거 함수';

-- =====================================================
-- 8. updated_at 트리거 적용
-- =====================================================

-- targets 테이블
DROP TRIGGER IF EXISTS update_targets_updated_at ON targets;
CREATE TRIGGER update_targets_updated_at
  BEFORE UPDATE ON targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column_kst();

-- suppliers 테이블
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column_kst();

-- email_subscribers 테이블
DROP TRIGGER IF EXISTS update_email_subscribers_updated_at ON email_subscribers;
CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column_kst();

-- =====================================================
-- 마이그레이션 완료
-- =====================================================
-- 이제 모든 새로운 데이터는 한국 시간(KST)으로 자동 저장됩니다.
-- 기존 데이터는 UTC로 저장되어 있으므로, 클라이언트에서 표시할 때
-- timeZone: 'Asia/Seoul' 옵션으로 변환하여 표시합니다.
-- =====================================================
