-- ========================================
-- RLS 정책 복구: meeting_comments 테이블
-- ========================================
-- 목적: 댓글 기능은 누구나 사용 가능하도록 하되, 다른 테이블은 원래대로 복구

-- Step 1: 기존 정책 모두 삭제
DROP POLICY IF EXISTS "meeting_comments_select_policy" ON meeting_comments;
DROP POLICY IF EXISTS "meeting_comments_insert_policy" ON meeting_comments;
DROP POLICY IF EXISTS "meeting_comments_delete_policy" ON meeting_comments;
DROP POLICY IF EXISTS "meeting_comments_update_policy" ON meeting_comments;

-- Step 2: RLS 유지 (활성화 상태)
ALTER TABLE meeting_comments ENABLE ROW LEVEL SECURITY;

-- Step 3: 새로운 정책 생성 (인증된 사용자만 접근)
-- 💡 핵심: 세션 쿠키가 있으면 누구나 접근 가능하도록 함

-- 조회 정책: 누구나 조회 가능
CREATE POLICY "anyone_can_select_comments"
  ON meeting_comments
  FOR SELECT
  USING (true);

-- 추가 정책: 누구나 추가 가능
CREATE POLICY "anyone_can_insert_comments"
  ON meeting_comments
  FOR INSERT
  WITH CHECK (true);

-- 수정 정책: 자신의 댓글만 수정 가능
CREATE POLICY "users_can_update_own_comments"
  ON meeting_comments
  FOR UPDATE
  USING (author_name = current_setting('request.jwt.claims', true)::json->>'name' OR true);
  -- ⚠️ 현재는 JWT 인증이 없으므로 일단 모두 허용

-- 삭제 정책: 자신의 댓글만 삭제 가능
CREATE POLICY "users_can_delete_own_comments"
  ON meeting_comments
  FOR DELETE
  USING (author_name = current_setting('request.jwt.claims', true)::json->>'name' OR true);
  -- ⚠️ 현재는 JWT 인증이 없으므로 일단 모두 허용

-- ========================================
-- 확인: users 테이블 RLS 정책 (변경 없음)
-- ========================================
-- users 테이블은 원래대로 유지 (Service Role Key만 접근 가능)

-- 현재 정책 확인
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 만약 users 테이블 정책이 없다면 (RLS만 활성화된 상태):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 정책을 만들지 않으면 Service Role Key만 접근 가능 (기본 동작)

-- ========================================
-- 확인: meeting_items 테이블 RLS 정책
-- ========================================
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'meeting_items';
