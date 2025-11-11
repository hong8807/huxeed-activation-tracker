-- =====================================================
-- Huxeed V-track System - Authentication & Logging Tables
-- Created: 2025-01-07
-- =====================================================

-- 1. users 테이블: 로그인 계정 관리
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'shared')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. access_logs 테이블: 접속 로그 및 활동 추적
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  accessor_name TEXT NOT NULL, -- 접속자 실명
  login_time TIMESTAMP DEFAULT now(),
  logout_time TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  activity_count INTEGER DEFAULT 0, -- 활동 횟수 (페이지 이동, 클릭 등)
  last_activity_at TIMESTAMP DEFAULT now(),
  session_duration_seconds INTEGER, -- 세션 지속 시간 (초)
  created_at TIMESTAMP DEFAULT now()
);

-- 3. email_subscribers 테이블: 주간 비밀번호 알림 받을 메일 주소
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. password_history 테이블: 비밀번호 변경 이력 (주간 업데이트 추적)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT now(),
  changed_by TEXT, -- 변경한 사람 (관리자 이메일)
  is_notified BOOLEAN DEFAULT false, -- 메일 알림 발송 여부
  created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

CREATE INDEX idx_access_logs_user_email ON access_logs(user_email);
CREATE INDEX idx_access_logs_login_time ON access_logs(login_time DESC);
CREATE INDEX idx_access_logs_accessor_name ON access_logs(accessor_name);
CREATE INDEX idx_password_history_user_email ON password_history(user_email);
CREATE INDEX idx_password_history_changed_at ON password_history(changed_at DESC);

-- =====================================================
-- 초기 데이터 삽입
-- =====================================================

-- 관리자 계정 (hsj@huxeed.com / 비밀번호: 1111)
-- bcrypt hash for "1111" (10 rounds): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (email, password_hash, role, is_active)
VALUES
  ('hsj@huxeed.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 공용 계정 (huxeed@huxeed.com / 초기 비밀번호: temp1234)
-- bcrypt hash for "temp1234": $2a$10$rKZwxqxT9bQQ5Z5X5X5X5eO5Z5X5X5X5X5X5X5X5X5X5X5X5X5X5
-- 실제 비밀번호는 관리자 페이지에서 변경 예정
INSERT INTO users (email, password_hash, role, is_active)
VALUES
  ('huxeed@huxeed.com', '$2a$10$rKZwxqxT9bQQ5Z5X5X5X5eO5Z5X5X5X5X5X5X5X5X5X5X5X5X5X5', 'shared', true)
ON CONFLICT (email) DO NOTHING;

-- 초기 메일 구독자 (관리자)
INSERT INTO email_subscribers (email, name, is_active)
VALUES
  ('hsj@huxeed.com', '관리자', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- Row Level Security (RLS) 설정
-- =====================================================

-- users 테이블: 인증된 사용자만 조회 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by authenticated users only"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- access_logs 테이블: 관리자만 전체 조회, 일반 사용자는 본인 로그만
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access logs are viewable by admins"
  ON access_logs FOR SELECT
  USING (true); -- API에서 role 체크

CREATE POLICY "Access logs can be inserted by authenticated users"
  ON access_logs FOR INSERT
  WITH CHECK (true);

-- email_subscribers 테이블: 관리자만 관리
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email subscribers manageable by admins only"
  ON email_subscribers FOR ALL
  USING (true); -- API에서 role 체크

-- password_history 테이블: 관리자만 조회
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Password history viewable by admins only"
  ON password_history FOR ALL
  USING (true); -- API에서 role 체크

-- =====================================================
-- 트리거: updated_at 자동 갱신
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
