-- meeting_items 테이블에 is_record 컬럼 추가
-- 기록 여부: true = 단순 기록, false = 실행 항목 (담당자/답변 필요)

ALTER TABLE meeting_items
ADD COLUMN IF NOT EXISTS is_record BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (기록/실행 항목 구분 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_meeting_items_is_record ON meeting_items(is_record);

-- 코멘트 추가
COMMENT ON COLUMN meeting_items.is_record IS '기록 여부: true = 단순 기록 (담당자/답변 불필요), false = 실행 항목 (담당자/답변 필요)';
