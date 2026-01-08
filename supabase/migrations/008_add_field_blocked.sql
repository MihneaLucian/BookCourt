-- Add blocked field to fields table for maintenance/works
ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_until DATE;

-- Add index for blocked fields
CREATE INDEX IF NOT EXISTS idx_fields_is_blocked ON fields(is_blocked);
