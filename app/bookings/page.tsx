import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "@/components/navbar-client";
import { BookingsContent } from "./bookings-content";

export default async function BookingsPage() {
  const supabase = await createClient();
  
  // Try to get user, but don't redirect immediately
  // Let the client component handle the redirect if needed
  const { data: { user } } = await supabase.auth.getUser();

  // Get user bookings if user exists
  let bookings = null;
  if (user) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        fields (
          nume,
          locatie,
          sport,
          suprafata
        )
      `)
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });
    bookings = data;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavbarClient />
      <BookingsContent initialBookings={bookings || []} initialUser={user} />
    </div>
  );
}
