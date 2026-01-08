-- Test script to verify admin can see bookings
-- Run this in Supabase SQL Editor while logged in as your admin user

-- 1. Check if you're an admin
SELECT 
  id,
  email,
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) as is_admin
FROM auth.users
WHERE id = auth.uid();

-- 2. Check which fields you own
SELECT 
  fo.field_id,
  f.nume as field_name,
  f.sport
FROM field_owners fo
JOIN fields f ON f.id = fo.field_id
WHERE fo.user_id = auth.uid();

-- 3. Check if user_owns_field function works
SELECT user_owns_field('YOUR_FIELD_ID_HERE'::uuid) as can_view_field;
-- Replace YOUR_FIELD_ID_HERE with an actual field_id from step 2

-- 4. Try to see bookings directly (this should work if RLS is correct)
SELECT 
  b.*,
  f.nume as field_name
FROM bookings b
JOIN fields f ON f.id = b.field_id
WHERE b.field_id IN (
  SELECT field_id FROM field_owners WHERE user_id = auth.uid()
)
LIMIT 10;

-- 5. Check RLS policies on bookings
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
