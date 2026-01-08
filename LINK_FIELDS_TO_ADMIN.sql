-- Script to link fields to your admin account
-- Replace 'YOUR_EMAIL@example.com' with your actual admin email

-- Step 1: Find your user ID
-- Run this first to get your user ID:
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- Step 2: Link ALL fields to your admin account
-- Replace 'YOUR_USER_ID_HERE' with the ID from Step 1
-- This will link all existing fields to your admin account
INSERT INTO field_owners (field_id, user_id)
SELECT f.id, 'YOUR_USER_ID_HERE'
FROM fields f
WHERE NOT EXISTS (
  SELECT 1 FROM field_owners fo 
  WHERE fo.field_id = f.id AND fo.user_id = 'YOUR_USER_ID_HERE'
);

-- Alternative: Link only specific fields by name
-- Replace 'YOUR_USER_ID_HERE' with your user ID and adjust the field names
INSERT INTO field_owners (field_id, user_id)
SELECT f.id, 'YOUR_USER_ID_HERE'
FROM fields f
WHERE f.nume IN ('Nume Teren 1', 'Nume Teren 2', 'Nume Teren 3')
AND NOT EXISTS (
  SELECT 1 FROM field_owners fo 
  WHERE fo.field_id = f.id AND fo.user_id = 'YOUR_USER_ID_HERE'
);

-- Alternative: Link fields by city
-- Replace 'YOUR_USER_ID_HERE' with your user ID and 'Arad' with your city
INSERT INTO field_owners (field_id, user_id)
SELECT f.id, 'YOUR_USER_ID_HERE'
FROM fields f
WHERE f.city = 'Arad'
AND NOT EXISTS (
  SELECT 1 FROM field_owners fo 
  WHERE fo.field_id = f.id AND fo.user_id = 'YOUR_USER_ID_HERE'
);

-- Verify the links were created
SELECT 
  fo.id,
  fo.field_id,
  fo.user_id,
  f.nume as field_name,
  f.sport,
  f.locatie,
  u.email as owner_email
FROM field_owners fo
JOIN fields f ON f.id = fo.field_id
JOIN auth.users u ON u.id = fo.user_id
WHERE u.email = 'YOUR_EMAIL@example.com';
