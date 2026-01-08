# Admin Dashboard Setup Guide

This guide explains how to set up admin users for the club management dashboard.

## Overview

The admin dashboard allows club owners to:
- View all bookings for their clubs
- See daily/weekly/monthly revenue statistics
- Manage booking statuses (confirm, cancel, complete)
- View schedules and availability
- Track payment status

## Database Structure

### Admin Roles
- The `profiles` table has an `is_admin` boolean column
- Admins can be assigned to specific fields/clubs via the `field_owners` table

### Tables
1. **profiles**: Contains `is_admin` flag
2. **field_owners**: Links admin users to specific fields/clubs

## Setting Up an Admin User

### Step 1: Create a User Account
1. Sign up for a regular account at `/auth/signup`
2. Complete email verification

### Step 2: Make User an Admin
Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with the actual email
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

### Step 3: Assign Fields to Admin
Associate the admin with their club(s):

```sql
-- Replace 'your-email@example.com' with the admin email
-- Replace 'Tenis Club Activ' with the actual field name
INSERT INTO field_owners (field_id, user_id)
SELECT 
  f.id as field_id,
  u.id as user_id
FROM fields f
CROSS JOIN auth.users u
WHERE u.email = 'your-email@example.com'
  AND f.nume = 'Tenis Club Activ'
ON CONFLICT (field_id, user_id) DO NOTHING;
```

### Step 4: Access Admin Dashboard
1. Log in with the admin account
2. Click on your profile menu
3. You should see "Dashboard Admin" option
4. Navigate to `/admin/dashboard`

## Admin Features

### Dashboard (`/admin/dashboard`)
- Overview statistics (today's revenue, bookings, totals)
- Schedule view for selected date
- Field selector (if admin owns multiple fields)
- Quick actions

### Bookings Management (`/admin/bookings`)
- View all bookings for owned fields
- Filter by status (pending, confirmed, completed, cancelled)
- Update booking status
- View customer information

### Revenue Reports (`/admin/revenue`)
- View revenue by date range (today, week, month, all)
- Track paid vs unpaid bookings
- Export revenue data

## Security

- Only users with `is_admin = true` can access admin routes
- Admins can only see bookings for fields they own
- RLS (Row Level Security) policies enforce these restrictions

## Troubleshooting

### "Access Denied" or Redirect to Search Page
- Verify `is_admin = true` in profiles table
- Check that user is associated with at least one field in `field_owners` table

### No Fields Showing
- Ensure `field_owners` table has entries linking your user_id to field_ids
- Check that fields exist and are active (`is_active = true`)

### Can't See Bookings
- Verify the booking's `field_id` matches a field you own
- Check booking status filters
