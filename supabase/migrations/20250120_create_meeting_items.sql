-- 회의 실행 항목 관리 테이블 생성
CREATE TABLE IF NOT EXISTS meeting_items (
    id              BIGSERIAL PRIMARY KEY,
    meeting_type    VARCHAR(20) NOT NULL,   -- 일간회의 / 월간회의 / 분기회의 / 년마감회의
    meeting_date    DATE NOT NULL,          -- YYYY-MM-DD (시간 없음)
    account_name    VARCHAR(200),           -- 거래처명 (엑셀에서 입력)
    content         TEXT NOT NULL,          -- 회의 내용(액션 아이템)

    assignee_name   VARCHAR(100),           -- 담당자 이름 (웹에서 입력)
    reply_text      TEXT,                   -- 관련 내용 답변
    is_done         BOOLEAN DEFAULT FALSE,  -- 완료 여부

    created_by      VARCHAR(100),           -- 업로드한 사람(선택)
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
COMMENT ON COLUMN meeting_items.account_name IS '거래처명 (엑셀에서 입력, 선택사항)';
COMMENT ON COLUMN meeting_items.content IS '실행이 필요한 회의 내용';
COMMENT ON COLUMN meeting_items.assignee_name IS '담당자명 (웹에서 입력)';
COMMENT ON COLUMN meeting_items.reply_text IS '담당자 답변 내용';
COMMENT ON COLUMN meeting_items.is_done IS '완료 여부 체크';
