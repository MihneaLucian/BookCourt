# Supabase Setup Guide

This guide will help you set up Supabase for your BookCourt project.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js installed on your machine

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: bookcourt (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to be set up (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Install Supabase Dependencies

Run the following command in your project root:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

**Important**: Never commit `.env.local` to git! It should already be in `.gitignore`.

## Step 5: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration
6. Repeat for `supabase/migrations/002_seed_data.sql` to add sample data

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Settings → General → Reference ID)

4. Run migrations:
   ```bash
   supabase db push
   ```

## Step 6: Verify Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see the following tables:
   - `fields`
   - `bookings`
   - `reviews`
   - `profiles`
   - `amenities`
   - `field_amenities`

3. Check that the `fields` table has 3 rows (from the seed data)

## Step 7: Configure Authentication (Optional but Recommended)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable the authentication methods you want:
   - **Email**: Enable for email/password login
   - **Google**: Enable if you want Google OAuth
   - **GitHub**: Enable if you want GitHub OAuth

3. Configure email templates in **Authentication** → **Email Templates**

## Step 8: Test the Connection

You can test if everything is working by creating a simple test file:

```typescript
// test-supabase.ts (delete after testing)
import { supabase } from '@/lib/supabase/client';

async function testConnection() {
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Data:', data);
  }
}

testConnection();
```

## Database Schema Overview

### Tables

1. **fields** - Stores sports fields/clubs information
2. **bookings** - Stores user bookings with date, time, and payment info
3. **reviews** - Stores user reviews and ratings for fields
4. **profiles** - Extends Supabase auth.users with additional user info
5. **amenities** - Stores available amenities (Wi-Fi, parking, etc.)
6. **field_amenities** - Junction table linking fields to amenities

### Key Features

- **Row Level Security (RLS)**: Enabled on all tables for data protection
- **Auto-updating timestamps**: `updated_at` fields update automatically
- **Rating calculation**: Field ratings update automatically when reviews are added
- **Constraints**: Data validation at the database level

## Next Steps

1. Update your code to use Supabase instead of hardcoded data:
   - Replace `lib/data.ts` with Supabase queries
   - Update `app/search/page.tsx` to fetch from Supabase
   - Update `app/book/[id]/page.tsx` to fetch from Supabase

2. Implement authentication:
   - Create login/signup pages
   - Add authentication middleware
   - Protect booking routes

3. Implement booking functionality:
   - Create booking API routes
   - Add payment integration (Stripe/Netopia)
   - Send confirmation emails

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure `.env.local` exists and has the correct values
   - Restart your Next.js dev server after adding env variables

2. **"relation does not exist"**
   - Make sure you ran the migrations (Step 5)
   - Check that tables exist in the Table Editor

3. **RLS blocking queries**
   - Check your RLS policies in Supabase dashboard
   - Make sure you're authenticated if policies require it

4. **Type errors**
   - Run `npm run build` to check for TypeScript errors
   - Update `lib/supabase/types.ts` if you modify the schema

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
