-- Quick script to create profile for your admin user
-- Replace 'your-email@example.com' with your actual admin email

-- Step 1: Create profile if it doesn't exist
INSERT INTO profiles (id, full_name, is_admin)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  true as is_admin
FROM auth.users u
WHERE u.email = 'your-email@example.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Step 2: If profile already exists, just update is_admin
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- Step 3: Verify it worked
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.is_admin,
  CASE WHEN p.is_admin = true THEN '✓ Admin' ELSE '✗ Not Admin' END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-email@example.com';
