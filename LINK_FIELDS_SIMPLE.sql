-- SIMPLE VERSION: Link all fields to your admin account
-- Just replace 'YOUR_EMAIL@example.com' with your admin email

-- This will automatically find your user ID and link all fields
INSERT INTO field_owners (field_id, user_id)
SELECT 
  f.id as field_id,
  u.id as user_id
FROM fields f
CROSS JOIN auth.users u
WHERE u.email = 'YOUR_EMAIL@example.com'
AND NOT EXISTS (
  SELECT 1 FROM field_owners fo 
  WHERE fo.field_id = f.id AND fo.user_id = u.id
);

-- Verify it worked
SELECT 
  f.nume as "Nume Teren",
  f.sport,
  f.locatie,
  u.email as "Email Admin"
FROM field_owners fo
JOIN fields f ON f.id = fo.field_id
JOIN auth.users u ON u.id = fo.user_id
WHERE u.email = 'YOUR_EMAIL@example.com'
ORDER BY f.nume;
