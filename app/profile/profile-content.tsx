"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Phone, MapPin, Edit, Shield, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface ProfileContentProps {
  initialUser: any;
}

export function ProfileContent({ initialUser }: ProfileContentProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ bookings: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Check auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/auth/login?redirect=/profile');
        return;
      }

      setUser(currentUser);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      setProfile(profileData);

      // Get stats
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      const { count: completedBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'completed');

      setStats({
        bookings: bookingsCount || 0,
        completed: completedBookings || 0,
      });

      setLoading(false);
    }

    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login?redirect=/profile');
      } else if (session) {
        setUser(session.user);
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-200 rounded w-48"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Utilizator';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-6 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-2xl font-semibold">
            {initials}
          </div>
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
            <p className="text-zinc-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-professional border border-zinc-200">
            <CardHeader className="border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                    <User className="w-5 h-5 text-zinc-600" />
                    Informații Personale
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Gestionează informațiile tale personale
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editează
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Nume Complet
                  </label>
                  <p className="text-lg text-zinc-900">
                    {profile?.full_name || 'Nu este setat'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-lg text-zinc-900">{user.email}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {user.email_confirmed_at ? '✓ Email confirmat' : '⚠ Email neconfirmat'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    Telefon
                  </label>
                  <p className="text-lg text-zinc-900">
                    {profile?.phone || 'Nu este setat'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Membru din
                  </label>
                  <p className="text-lg text-zinc-900">
                    {user.created_at 
                      ? format(new Date(user.created_at), "PPP", { locale: ro })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Setări Cont
              </CardTitle>
              <CardDescription>
                Gestionează setările contului tău
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-200">
                <div>
                  <p className="font-medium">Schimbă Parola</p>
                  <p className="text-sm text-zinc-500">Actualizează parola contului tău</p>
                </div>
                <Button variant="outline" size="sm">
                  Schimbă
                </Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-zinc-200">
                <div>
                  <p className="font-medium">Notificări Email</p>
                  <p className="text-sm text-zinc-500">Primește notificări despre rezervări</p>
                </div>
                <Button variant="outline" size="sm">
                  Activează
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Șterge Cont</p>
                  <p className="text-sm text-zinc-500">Șterge permanent contul tău</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  Șterge
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Quick Actions */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="shadow-professional border border-zinc-200">
            <CardHeader className="border-b border-zinc-200">
              <CardTitle className="text-lg font-semibold text-zinc-900">Statistici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-md">
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Total Rezervări</p>
                  <p className="text-2xl font-bold text-zinc-900">{stats.bookings}</p>
                </div>
                <Calendar className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-md">
                <div>
                  <p className="text-sm text-zinc-600 mb-1">Rezervări Finalizate</p>
                  <p className="text-2xl font-bold text-zinc-900">{stats.completed}</p>
                </div>
                <CreditCard className="w-6 h-6 text-zinc-400" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-professional border border-zinc-200">
            <CardHeader className="border-b border-zinc-200">
              <CardTitle className="text-lg font-semibold text-zinc-900">Acțiuni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/bookings">
                  <Calendar className="w-4 h-4 mr-2" />
                  Vezi Rezervările Mele
                </a>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/search">
                  <MapPin className="w-4 h-4 mr-2" />
                  Caută Terenuri
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
