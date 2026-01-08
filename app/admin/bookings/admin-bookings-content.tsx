"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, DollarSign, User, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Field {
  id: string;
  nume: string;
  sport: string;
  locatie: string;
  city: string;
}

interface Booking {
  id: string;
  field_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  fields: Field | null;
  profiles: {
    full_name: string | null;
    id: string;
  } | null;
}

export function AdminBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldParam = searchParams.get('field');
  
  const [user, setUser] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(fieldParam || null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/auth/login?redirect=/admin/bookings');
        return;
      }

      setUser(currentUser);

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profile || profile.is_admin !== true) {
        router.push('/search');
        return;
      }

      setIsAdmin(true);

      // Get fields owned by this admin
      const { data: ownedFields } = await supabase
        .from('field_owners')
        .select(`
          field_id,
          fields (
            id,
            nume,
            sport,
            locatie,
            city
          )
        `)
        .eq('user_id', currentUser.id);

      const fieldsList = ownedFields?.map((fo: any) => fo.fields).filter(Boolean) || [];
      setFields(fieldsList);

      if (fieldsList.length > 0 && !selectedField) {
        setSelectedField(fieldsList[0].id);
      }

      setLoading(false);
    }

    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login?redirect=/admin/bookings');
      } else if (session) {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (fields.length > 0 && !selectedField) {
      setSelectedField(fields[0].id);
    }
  }, [fields]);

  useEffect(() => {
    if (!selectedField) return;

    async function loadBookings() {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          fields (
            id,
            nume,
            sport,
            locatie,
            city
          ),
          profiles (
            id,
            full_name
          )
        `)
        .eq('field_id', selectedField)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (statusFilter === 'all') {
        // Show only confirmed and cancelled (not pending/completed)
        query = query.in('status', ['confirmed', 'cancelled']);
      } else {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading bookings:', error);
        setBookings([]);
      } else {
        setBookings((data as any[]) || []);
      }

      setLoading(false);
    }

    loadBookings();
  }, [selectedField, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmată';
      case 'cancelled':
        return 'Anulată';
      default:
        return status;
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking:', error);
      alert('Eroare la actualizarea rezervării');
      return;
    }

    // Refresh bookings
    setBookings(prev => 
      prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
    );
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-zinc-500">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500 mb-4">
              Nu ai permisiuni de administrator.
            </p>
            <Button onClick={() => router.push('/search')}>
              Mergi la Pagina Principală
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">Nu ai terenuri asociate.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Toate Rezervările</h1>
          <p className="text-zinc-600">Gestionează toate rezervările terenului tău</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          ← Înapoi la Dashboard
        </Button>
      </div>

      {/* Field Selector */}
      {fields.length > 1 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-zinc-500">Teren:</span>
              {fields.map((field) => (
                <Button
                  key={field.id}
                  variant={selectedField === field.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedField(field.id)}
                >
                  {field.nume}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-500">Filtru status:</span>
            {['all', 'confirmed', 'cancelled'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'Toate' : getStatusLabel(status)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-zinc-500">Se încarcă rezervările...</p>
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">Nu sunt rezervări.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const bookingDate = new Date(booking.booking_date);
            return (
              <Card key={booking.id} className="border border-zinc-200 shadow-professional">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                        {booking.fields?.nume || 'Teren'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(bookingDate, "PPP", { locale: ro })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.profiles?.full_name || 'Utilizator'}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-4 border-t border-zinc-200">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Durată</p>
                      <p className="font-medium text-zinc-900">{booking.duration_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Plată</p>
                      <p className="font-medium">
                        {booking.payment_status === 'paid' ? (
                          <span className="text-emerald-600">✓ Plătit</span>
                        ) : (
                          <span className="text-zinc-500">⏳ Neplătit</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Preț</p>
                      <p className="font-bold text-lg text-zinc-900">{booking.total_price} RON</p>
                    </div>
                  </div>

                  {/* Action Buttons - Only cancel option for confirmed bookings */}
                  {booking.status === 'confirmed' && (
                    <div className="flex gap-2 pt-4 border-t border-zinc-200">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Ești sigur că vrei să anulezi această rezervare?')) {
                            handleStatusChange(booking.id, 'cancelled');
                          }
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Anulează Rezervarea
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
