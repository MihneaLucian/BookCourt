-- Add blocked fields to courts table for individual court maintenance
ALTER TABLE courts 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_until DATE;

-- Add index for blocked courts
CREATE INDEX IF NOT EXISTS idx_courts_is_blocked ON courts(is_blocked);
