-- Fix RLS policies for bookings to allow admins to see all bookings for their fields
-- Run this in Supabase SQL Editor if admin dashboard can't see bookings

-- First, make sure the user_owns_field function exists and works correctly
CREATE OR REPLACE FUNCTION user_owns_field(field_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM field_owners
    WHERE field_id = field_uuid
    AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the SELECT policy for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR user_owns_field(field_id)
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'bookings';
