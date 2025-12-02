-- ========================================
-- RLS 정책 복구: users 테이블
-- ========================================
-- 목적: users 테이블은 Service Role Key로만 접근 가능하도록 설정
-- 문제: 현재 Anon Key로도 조회 가능 (보안 취약)

-- Step 1: 기존 정책 모두 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Step 2: RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: 정책 생성하지 않음 (Service Role Key만 접근 가능)
-- 💡 핵심: RLS가 활성화되어 있지만 정책이 없으면, Service Role Key만 접근 가능

-- 확인: users 테이블 RLS 정책 목록 (비어있어야 정상)
SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 만약 위 결과가 비어있다면 정상 (Service Role Key만 접근 가능)
-- 만약 정책이 있다면 삭제 후 재실행
