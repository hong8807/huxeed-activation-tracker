-- Migration: Add account_name column to existing meeting_items table
-- Date: 2025-01-20
-- Purpose: Add 거래처명 (account name) field to track which client each meeting item relates to

-- Add account_name column (if not already exists)
ALTER TABLE meeting_items ADD COLUMN IF NOT EXISTS account_name VARCHAR(200);

-- Add comment for documentation
COMMENT ON COLUMN meeting_items.account_name IS '거래처명 (엑셀에서 입력, 선택사항)';

-- No default value needed as this is an optional field (NULL allowed)
-- Existing rows will have NULL for account_name, which is acceptable
