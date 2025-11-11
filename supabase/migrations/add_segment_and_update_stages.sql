-- Migration: Add segment column and update stages (12-stage support)
-- Date: 2025-11-05
-- Description:
--   1. Add segment column to targets table
--   2. Migrate segment data from note column
--   3. Clean up note column

-- Step 1: Add segment column to targets table
ALTER TABLE targets
ADD COLUMN IF NOT EXISTS segment text;

-- Step 2: Update segment column based on note content
-- Extract segment information from note and move to segment column
UPDATE targets
SET segment =
  CASE
    WHEN note LIKE '%S 세그먼트%' OR note LIKE '%S세그먼트%' THEN 'S'
    WHEN note LIKE '%P 세그먼트%' OR note LIKE '%P세그먼트%' THEN 'P'
    WHEN note LIKE '%일반%' THEN '일반'
    ELSE '일반'  -- Default to '일반' if no segment info found
  END
WHERE note IS NOT NULL;

-- Step 3: Set default segment for records with NULL note
UPDATE targets
SET segment = '일반'
WHERE note IS NULL AND segment IS NULL;

-- Step 4: Clean up note column - remove segment information
-- Remove "S 세그먼트 거래처", "P 세그먼트 거래처" etc from note
UPDATE targets
SET note =
  CASE
    WHEN note LIKE '%S 세그먼트 거래처%' THEN TRIM(REPLACE(note, 'S 세그먼트 거래처', ''))
    WHEN note LIKE '%S세그먼트 거래처%' THEN TRIM(REPLACE(note, 'S세그먼트 거래처', ''))
    WHEN note LIKE '%P 세그먼트 거래처%' THEN TRIM(REPLACE(note, 'P 세그먼트 거래처', ''))
    WHEN note LIKE '%P세그먼트 거래처%' THEN TRIM(REPLACE(note, 'P세그먼트 거래처', ''))
    WHEN note LIKE '%일반 세그먼트 거래처%' THEN TRIM(REPLACE(note, '일반 세그먼트 거래처', ''))
    WHEN note LIKE '%일반세그먼트 거래처%' THEN TRIM(REPLACE(note, '일반세그먼트 거래처', ''))
    ELSE note
  END
WHERE note IS NOT NULL;

-- Step 5: Set note to NULL if it becomes empty after cleanup
UPDATE targets
SET note = NULL
WHERE note = '' OR note = ' ';

-- Step 6: Add comment to segment column
COMMENT ON COLUMN targets.segment IS 'Segment classification: S (전략), P (우선순위), 일반 (일반)';

-- Verification query (run separately to check results)
-- SELECT id, account_name, product_name, segment, note FROM targets ORDER BY segment, account_name;
