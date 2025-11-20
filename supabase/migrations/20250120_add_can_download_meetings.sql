-- users 테이블에 can_download_meetings 컬럼 추가
-- 회의록 엑셀 다운로드 권한 (기본값: false)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS can_download_meetings BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (다운로드 권한 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_users_can_download_meetings ON users(can_download_meetings);

-- 코멘트 추가
COMMENT ON COLUMN users.can_download_meetings IS '회의록 엑셀 다운로드 권한: true = 다운로드 가능, false = 다운로드 불가';

-- 5명의 사용자에게 다운로드 권한 부여
-- 참고: users 테이블의 실제 컬럼명(email 등)을 확인 후 Supabase Studio에서 수동 업데이트 권장
-- 예시: UPDATE users SET can_download_meetings = TRUE WHERE email = 'user@huxeed.com';
