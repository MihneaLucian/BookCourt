"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, DollarSign, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Booking {
  id: string;
  field_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_per_hour: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  fields: {
    nume: string;
    locatie: string;
    sport: string;
    suprafata: string;
  } | null;
}

interface BookingsContentProps {
  initialBookings: Booking[];
  initialUser: any;
}

export function BookingsContent({ initialBookings, initialUser }: BookingsContentProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [user, setUser] = useState(initialUser);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Check auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/auth/login?redirect=/bookings');
        return;
      }

      setUser(currentUser);

      // If we don't have bookings, fetch them
      if (!initialBookings || initialBookings.length === 0) {
        const { data: bookingsData } = await supabase
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
          .eq('user_id', currentUser.id)
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: false });
        
        setBookings(bookingsData || []);
      }

      setLoading(false);
    }

    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login?redirect=/bookings');
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, initialBookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-zinc-100 text-zinc-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmată';
      case 'pending':
        return 'În Așteptare';
      case 'cancelled':
        return 'Anulată';
      case 'completed':
        return 'Finalizată';
      default:
        return status;
    }
  };

  const handleFinalize = async (bookingId: string) => {
    setLoadingIds(prev => new Set(prev).add(bookingId));
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error finalizing booking:', error);
        alert('Eroare la finalizarea rezervării. Te rugăm să încerci din nou.');
        return;
      }

      // Update local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'completed' as const }
            : booking
        )
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Eroare la finalizarea rezervării.');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
      router.refresh();
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Ești sigur că vrei să anulezi această rezervare?')) {
      return;
    }

    setLoadingIds(prev => new Set(prev).add(bookingId));
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        alert('Eroare la anularea rezervării. Te rugăm să încerci din nou.');
        return;
      }

      // Update local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Eroare la anularea rezervării.');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
      router.refresh();
    }
  };

  const canFinalize = (booking: Booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed';
  };

  const canCancel = (booking: Booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Rezervările Mele</h1>
        <p className="text-zinc-600">Vezi și gestionează toate rezervările tale</p>
      </div>
      
      {bookings.length === 0 ? (
        <Card className="shadow-professional-lg border-2 border-zinc-100">
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl font-semibold text-zinc-700 mb-2">Nu ai rezervări încă.</p>
            <a href="/search" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-2">
              Caută terenuri disponibile →
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => {
            const field = booking.fields;
            const bookingDate = new Date(booking.booking_date);
            const isLoading = loadingIds.has(booking.id);
            const isPast = new Date(`${booking.booking_date}T${booking.end_time}`) < new Date();
            
            return (
              <Card key={booking.id} className="card-hover border border-zinc-200">
                <CardHeader className="border-b border-zinc-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-semibold mb-2 text-zinc-900">{field?.nume || 'Teren'}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <MapPin className="w-4 h-4" />
                        {field?.locatie || 'Locatie necunoscută'}
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Dată</p>
                      <p className="font-medium text-zinc-900">
                        {format(bookingDate, "PPP", { locale: ro })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Oră</p>
                      <p className="font-medium text-zinc-900">
                        {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Preț</p>
                      <p className="font-bold text-lg text-zinc-900">{booking.total_price} RON</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <p className="text-sm text-zinc-600">
                      Durată: {booking.duration_minutes} min • Sport: {field?.sport || 'N/A'} • Suprafață: {field?.suprafata || 'N/A'}
                    </p>
                    {booking.payment_status === 'paid' && (
                      <p className="text-sm text-emerald-600 mt-2">
                        ✓ Plată efectuată
                      </p>
                    )}
                  </div>
                </CardContent>
                {(canFinalize(booking) || canCancel(booking)) && (
                  <CardFooter className="flex gap-2 pt-0">
                    {canFinalize(booking) && (
                      <Button
                        onClick={() => handleFinalize(booking.id)}
                        disabled={isLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        variant="default"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Se finalizează...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Finalizează Rezervarea
                          </>
                        )}
                      </Button>
                    )}
                    {canCancel(booking) && (
                      <Button
                        onClick={() => handleCancel(booking.id)}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Se anulează...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Anulează
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
