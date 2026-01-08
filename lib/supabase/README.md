# Supabase Integration

This directory contains the Supabase client configuration and TypeScript types for your database.

## Files

- `client.ts` - Client-side Supabase client (for use in React components)
- `server.ts` - Server-side Supabase client (for use in Server Components, API routes, etc.)
- `types.ts` - TypeScript types generated from your database schema

## Usage

### Client-Side (React Components)

```typescript
import { supabase } from '@/lib/supabase/client';

// Fetch fields
const { data: fields, error } = await supabase
  .from('fields')
  .select('*');

// Create a booking
const { data: booking, error } = await supabase
  .from('bookings')
  .insert({
    field_id: '...',
    user_id: '...',
    booking_date: '2024-01-15',
    start_time: '10:00:00',
    end_time: '11:00:00',
    duration_minutes: 60,
    price_per_hour: 120,
    total_price: 120,
  });
```

### Server-Side (Server Components, API Routes)

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function ServerComponent() {
  const supabase = createClient();
  
  const { data: fields } = await supabase
    .from('fields')
    .select('*');
  
  return <div>...</div>;
}
```

## Database Tables

- `fields` - Sports fields/clubs
- `bookings` - User bookings
- `reviews` - User reviews and ratings
- `profiles` - User profile information
- `amenities` - Available amenities
- `field_amenities` - Junction table for field amenities

See `SUPABASE_SETUP.md` in the project root for complete setup instructions.
