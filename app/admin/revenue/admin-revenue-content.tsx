"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { ro } from "date-fns/locale";

interface Field {
  id: string;
  nume: string;
  sport: string;
  locatie: string;
  city: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

export function AdminRevenueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldParam = searchParams.get('field');
  
  const [user, setUser] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(fieldParam || null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    paidBookings: 0,
    unpaidBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/auth/login?redirect=/admin/revenue');
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
        router.push('/auth/login?redirect=/admin/revenue');
      } else if (session) {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, selectedField]);

  useEffect(() => {
    if (fields.length > 0 && !selectedField) {
      setSelectedField(fields[0].id);
    }
  }, [fields, selectedField]);

  useEffect(() => {
    if (!selectedField) return;

    async function loadRevenueData() {
      setLoading(true);

      let startDate: Date;
      const endDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          break;
        case 'all':
          startDate = new Date(2020, 0, 1); // Far back date
          break;
        default:
          startDate = startOfMonth(new Date());
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('field_id', selectedField)
        .gte('booking_date', startDateStr)
        .lte('booking_date', endDateStr)
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: true });

      if (error) {
        console.error('Error loading revenue data:', error);
        setRevenueData([]);
        setLoading(false);
        return;
      }

      // Group by date
      const grouped = (bookings || []).reduce((acc: any, booking: any) => {
        const date = booking.booking_date;
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, bookings: 0 };
        }
        if (booking.payment_status === 'paid') {
          acc[date].revenue += Number(booking.total_price);
        }
        acc[date].bookings += 1;
        return acc;
      }, {});

      const data = Object.values(grouped) as RevenueData[];
      setRevenueData(data);

      // Calculate stats
      const paid = (bookings || []).filter((b: any) => b.payment_status === 'paid');
      const unpaid = (bookings || []).filter((b: any) => b.payment_status === 'unpaid');

      setStats({
        totalRevenue: paid.reduce((sum: number, b: any) => sum + Number(b.total_price), 0),
        totalBookings: bookings?.length || 0,
        paidBookings: paid.length,
        unpaidBookings: unpaid.length,
      });

      setLoading(false);
    }

    loadRevenueData();
  }, [selectedField, dateRange]);

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
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Raport Venituri</h1>
          <p className="text-zinc-600">Analizează veniturile terenului tău</p>
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

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-500">Perioadă:</span>
            {[
              { value: 'today', label: 'Astăzi' },
              { value: 'week', label: 'Săptămâna Aceasta' },
              { value: 'month', label: 'Luna Aceasta' },
              { value: 'all', label: 'Toate' },
            ].map((range) => (
              <Button
                key={range.value}
                variant={dateRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range.value as any)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Venituri Totale</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalRevenue.toFixed(0)} RON</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Total Rezervări</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Plătite</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.paidBookings}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Neplătite</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unpaidBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart/Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Evoluția Veniturilor</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportă
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-zinc-500">Se încarcă datele...</p>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">Nu sunt date pentru această perioadă.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueData.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {format(new Date(item.date), "PPP", { locale: ro })}
                    </p>
                    <p className="text-sm text-zinc-500">{item.bookings} rezervări</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600">{item.revenue.toFixed(0)} RON</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
