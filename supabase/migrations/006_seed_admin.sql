-- This migration helps set up an admin user
-- IMPORTANT: First run migration 007_create_profiles_for_existing_users.sql to create profiles

-- Step 1: Create profile for admin user if it doesn't exist
-- Replace 'your-email@example.com' with your admin email
INSERT INTO profiles (id, full_name, is_admin)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  true as is_admin
FROM auth.users u
WHERE u.email = 'your-email@example.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Step 2: Make existing profile an admin
-- Replace 'your-email@example.com' with your admin email
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- Step 3: Associate a field with the admin user
-- Replace 'your-email@example.com' and 'Field Name' with actual values
INSERT INTO field_owners (field_id, user_id)
SELECT 
  f.id as field_id,
  u.id as user_id
FROM fields f
CROSS JOIN auth.users u
WHERE u.email = 'your-email@example.com'
  AND f.nume = 'Field Name'  -- Replace with your field name
ON CONFLICT (field_id, user_id) DO NOTHING;
