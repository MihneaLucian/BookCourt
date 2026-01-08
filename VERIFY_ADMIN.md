# Verify Admin Status - Troubleshooting Guide

If you don't see the "Dashboard Admin" link in your profile menu, follow these steps:

## Step 1: Verify in Supabase Database

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor** → **profiles** table
3. Find your user's row (by email or user ID)
4. Check the `is_admin` column:
   - It should be `true` (not `NULL` or `false`)
   - If it's `NULL`, update it to `true`

## Step 2: Update is_admin if Needed

Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## Step 3: Verify Field Ownership

Make sure you're linked to at least one field:

```sql
-- Check if you have any fields assigned
SELECT 
  fo.*,
  f.nume as field_name
FROM field_owners fo
JOIN fields f ON f.id = fo.field_id
WHERE fo.user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

If you don't have any fields, add one:

```sql
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
```

## Step 4: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Log in to your account
4. Look for these console logs:
   - `Profile data: {full_name: "...", is_admin: true}`
   - `Is admin: true`
   - `UserMenu - isAdmin prop: true Type: boolean`

If you see `is_admin: null` or `isAdmin prop: false`, the database value is not set correctly.

## Step 5: Clear Cache and Refresh

1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Or clear browser cache
3. Log out and log back in

## Step 6: Verify Profile Exists

If you don't have a profile row at all, create one:

```sql
-- Replace with your user ID and email
INSERT INTO profiles (id, full_name, is_admin)
SELECT 
  id,
  email,
  true
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

## Common Issues

### Issue: is_admin is NULL
**Solution**: Update it to `true` using the SQL in Step 2

### Issue: Profile doesn't exist
**Solution**: Create it using the SQL in Step 6

### Issue: No fields assigned
**Solution**: Link your user to a field using the SQL in Step 3

### Issue: Still not showing after all steps
**Solution**: 
1. Check browser console for errors
2. Verify you're logged in with the correct account
3. Try logging out and back in
4. Check that the migration `005_add_admin_support.sql` was applied
