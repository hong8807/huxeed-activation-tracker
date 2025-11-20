-- Migration: Add menu permissions to email_subscribers table
-- Date: 2025-01-20
-- Purpose: Enable menu-level access control based on user name

-- Add permissions column (JSONB for flexible menu permission structure)
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "dashboard": true,
  "pipeline": true,
  "sourcing": true,
  "report": true,
  "meetings": true,
  "admin": false
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN email_subscribers.permissions IS '메뉴별 접근 권한 (dashboard, pipeline, sourcing, report, meetings, admin)';

-- Update existing rows to have default permissions (all enabled except admin)
UPDATE email_subscribers
SET permissions = '{
  "dashboard": true,
  "pipeline": true,
  "sourcing": true,
  "report": true,
  "meetings": true,
  "admin": false
}'::jsonb
WHERE permissions IS NULL OR permissions::text = '{}'::text;

-- Create index on name for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_email_subscribers_name ON email_subscribers(name);

-- Sample data: Add comment explaining the permission structure
COMMENT ON TABLE email_subscribers IS '이메일 수신자 및 메뉴 접근 권한 관리
permissions 구조:
{
  "dashboard": boolean,  -- Dashboard 메뉴 접근 가능 여부
  "pipeline": boolean,   -- Pipeline 메뉴 접근 가능 여부
  "sourcing": boolean,   -- Sourcing 메뉴 접근 가능 여부
  "report": boolean,     -- Report 메뉴 접근 가능 여부
  "meetings": boolean,   -- Meetings 메뉴 접근 가능 여부
  "admin": boolean       -- Admin Settings 메뉴 접근 가능 여부
}';
