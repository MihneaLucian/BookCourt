"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Lock, Unlock, Calendar, AlertCircle, CheckCircle, Users, Plus, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Field {
  id: string;
  nume: string;
  sport: string;
  locatie: string;
  city: string;
  is_blocked?: boolean;
  blocked_reason?: string | null;
  blocked_until?: string | null;
}

interface Court {
  id: string;
  name: string;
  field_id: string;
  is_active: boolean;
  is_blocked?: boolean;
  blocked_reason?: string | null;
  blocked_until?: string | null;
}

interface Membership {
  id: string;
  field_id: string;
  court_id: string | null;
  member_name: string;
  user_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  notes: string | null;
}

export function FieldSettingsContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState<Map<string, boolean>>(new Map());
  
  const [courtBlockSettings, setCourtBlockSettings] = useState<Map<string, {
    isBlocked: boolean;
    reason: string;
    blockedUntil: Date | null;
  }>>(new Map());
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [newMembership, setNewMembership] = useState({
    memberName: '',
    courtId: null as string | null,
    dayOfWeek: 1,
    startTime: '18:00',
    endTime: '19:00',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    notes: '',
  });
  const [savingMembership, setSavingMembership] = useState(false);
  const [deletingMembership, setDeletingMembership] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/auth/login?redirect=/admin/settings');
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

      // Get field IDs owned by this admin
      const { data: ownedFields, error: fieldsError } = await supabase
        .from('field_owners')
        .select('field_id')
        .eq('user_id', currentUser.id);

      if (fieldsError) {
        console.error('Error fetching owned fields:', fieldsError);
        alert('Eroare la încărcarea terenurilor: ' + fieldsError.message);
        setLoading(false);
        return;
      }

      console.log('Owned field IDs:', ownedFields);

      if (!ownedFields || ownedFields.length === 0) {
        console.log('No fields found in field_owners table');
        setFields([]);
        setLoading(false);
        return;
      }

      // Get the actual field data
      const fieldIds = ownedFields.map((fo: any) => fo.field_id);
      
      // First, try to get fields with blocked columns (if migration was run)
      let fieldsData: any = null;
      let fieldsDataError: any = null;
      
      // Try with blocked columns first
      const { data: dataWithBlocked, error: errorWithBlocked } = await supabase
        .from('fields')
        .select('id, nume, sport, locatie, city, is_blocked, blocked_reason, blocked_until')
        .in('id', fieldIds);
      
      if (errorWithBlocked && errorWithBlocked.message.includes('is_blocked')) {
        // Migration not run yet, fetch without blocked columns
        console.log('Blocked columns not found, fetching without them');
        const { data: dataWithoutBlocked, error: errorWithoutBlocked } = await supabase
          .from('fields')
          .select('id, nume, sport, locatie, city')
          .in('id', fieldIds);
        
        fieldsData = dataWithoutBlocked;
        fieldsDataError = errorWithoutBlocked;
        
        // Add default values for blocked fields
        if (fieldsData) {
          fieldsData = fieldsData.map((f: any) => ({
            ...f,
            is_blocked: false,
            blocked_reason: null,
            blocked_until: null,
          }));
        }
      } else {
        fieldsData = dataWithBlocked;
        fieldsDataError = errorWithBlocked;
      }

      if (fieldsDataError) {
        console.error('Error fetching fields data:', fieldsDataError);
        // Don't show alert for missing column error, just log it
        if (!fieldsDataError.message.includes('is_blocked')) {
          alert('Eroare la încărcarea detaliilor terenurilor: ' + fieldsDataError.message);
        }
        setFields([]);
        setLoading(false);
        return;
      }

      console.log('Fields data:', fieldsData);

      const fieldsList = (fieldsData || []) as Field[];
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
        router.push('/auth/login?redirect=/admin/settings');
      } else if (session) {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Load courts when field is selected
  useEffect(() => {
    if (!selectedField) {
      setCourts([]);
      return;
    }

    async function loadCourts() {
      // Try to fetch with blocked columns first
      let courtsData: any = null;
      let courtsError: any = null;

      const { data: dataWithBlocked, error: errorWithBlocked } = await supabase
        .from('courts')
        .select('id, name, field_id, is_active, is_blocked, blocked_reason, blocked_until')
        .eq('field_id', selectedField)
        .eq('is_active', true)
        .order('name');

      if (errorWithBlocked && errorWithBlocked.message.includes('is_blocked')) {
        // Migration not run yet, fetch without blocked columns
        const { data: dataWithoutBlocked, error: errorWithoutBlocked } = await supabase
          .from('courts')
          .select('id, name, field_id, is_active')
          .eq('field_id', selectedField)
          .eq('is_active', true)
          .order('name');

        courtsData = dataWithoutBlocked;
        courtsError = errorWithoutBlocked;

        // Add default values for blocked fields
        if (courtsData) {
          courtsData = courtsData.map((c: any) => ({
            ...c,
            is_blocked: false,
            blocked_reason: null,
            blocked_until: null,
          }));
        }
      } else {
        courtsData = dataWithBlocked;
        courtsError = errorWithBlocked;
      }

      if (courtsError) {
        console.error('Error loading courts:', courtsError);
      } else {
        setCourts(courtsData || []);
        
        // Initialize block settings for each court
        const settingsMap = new Map<string, {
          isBlocked: boolean;
          reason: string;
          blockedUntil: Date | null;
        }>();
        
        (courtsData || []).forEach((court: any) => {
          settingsMap.set(court.id, {
            isBlocked: court.is_blocked || false,
            reason: court.blocked_reason || '',
            blockedUntil: court.blocked_until ? new Date(court.blocked_until) : null,
          });
        });
        
        setCourtBlockSettings(settingsMap);
      }
    }

    loadCourts();
    loadMemberships();
  }, [selectedField]);

  // Load memberships when field is selected
  async function loadMemberships() {
    if (!selectedField) {
      setMemberships([]);
      return;
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('field_id', selectedField)
      .order('day_of_week, start_time');

    if (error) {
      console.error('Error loading memberships:', error);
      // If table doesn't exist yet, just set empty array
      if (error.message.includes('relation "memberships" does not exist')) {
        setMemberships([]);
        return;
      }
    } else {
      setMemberships((data || []) as Membership[]);
    }
  }

  const handleSaveCourt = async (courtId: string) => {
    const settings = courtBlockSettings.get(courtId);
    if (!settings) return;

    setSaving(prev => new Map(prev).set(courtId, true));

    const updateData: any = {
      is_blocked: settings.isBlocked,
      blocked_reason: settings.isBlocked ? settings.reason : null,
      blocked_until: settings.isBlocked && settings.blockedUntil 
        ? format(settings.blockedUntil, 'yyyy-MM-dd')
        : null,
    };

    console.log('Updating court:', courtId, 'with data:', updateData);
    
    const { data: updatedCourt, error } = await supabase
      .from('courts')
      .update(updateData)
      .eq('id', courtId)
      .select()
      .single();
    
    console.log('Update result:', { updatedCourt, error });
    
    // If error is about missing columns, inform user to run migration
    if (error && error.message.includes('is_blocked')) {
      alert('Coloanele pentru blocare nu există încă. Te rugăm să rulezi migrația 009_add_court_blocked.sql în Supabase.');
      setSaving(prev => {
        const newMap = new Map(prev);
        newMap.set(courtId, false);
        return newMap;
      });
      return;
    }

    if (error) {
      console.error('Error updating court:', error);
      alert('Eroare la actualizarea setărilor terenului: ' + error.message);
      setSaving(prev => {
        const newMap = new Map(prev);
        newMap.set(courtId, false);
        return newMap;
      });
      return;
    }

    if (!updatedCourt) {
      console.error('No data returned from update');
      alert('Eroare: Nu s-au returnat date după actualizare. Verifică permisiunile RLS.');
      setSaving(prev => {
        const newMap = new Map(prev);
        newMap.set(courtId, false);
        return newMap;
      });
      return;
    }

    // Update local state with the returned data
    setCourts(prev => prev.map(c => 
      c.id === courtId 
        ? { ...c, ...updatedCourt }
        : c
    ));

    // Also update the block settings map
    setCourtBlockSettings(prev => {
      const newMap = new Map(prev);
      newMap.set(courtId, {
        isBlocked: updatedCourt.is_blocked || false,
        reason: updatedCourt.blocked_reason || '',
        blockedUntil: updatedCourt.blocked_until ? new Date(updatedCourt.blocked_until) : null,
      });
      return newMap;
    });

    alert('Setările terenului au fost actualizate cu succes!');
    setSaving(prev => {
      const newMap = new Map(prev);
      newMap.set(courtId, false);
      return newMap;
    });
    
    // Reload courts to ensure we have the latest data
    if (selectedField) {
      const { data: reloadedCourts } = await supabase
        .from('courts')
        .select('id, name, field_id, is_active, is_blocked, blocked_reason, blocked_until')
        .eq('field_id', selectedField)
        .eq('is_active', true)
        .order('name');
      
      if (reloadedCourts) {
        setCourts(reloadedCourts);
        const settingsMap = new Map<string, {
          isBlocked: boolean;
          reason: string;
          blockedUntil: Date | null;
        }>();
        
        reloadedCourts.forEach((court: any) => {
          settingsMap.set(court.id, {
            isBlocked: court.is_blocked || false,
            reason: court.blocked_reason || '',
            blockedUntil: court.blocked_until ? new Date(court.blocked_until) : null,
          });
        });
        
        setCourtBlockSettings(settingsMap);
      }
    }
  };

  const updateCourtBlockSettings = (courtId: string, updates: Partial<{
    isBlocked: boolean;
    reason: string;
    blockedUntil: Date | null;
  }>) => {
    const current = courtBlockSettings.get(courtId) || {
      isBlocked: false,
      reason: '',
      blockedUntil: null,
    };
    
    setCourtBlockSettings(prev => {
      const newMap = new Map(prev);
      newMap.set(courtId, { ...current, ...updates });
      return newMap;
    });
  };

  const handleSaveMembership = async () => {
    if (!selectedField || !user) return;
    if (!newMembership.memberName.trim()) {
      alert('Te rugăm să introduci numele membrului.');
      return;
    }

    setSavingMembership(true);

    const membershipData = {
      field_id: selectedField,
      court_id: newMembership.courtId || null,
      member_name: newMembership.memberName.trim(),
      user_id: null,
      day_of_week: newMembership.dayOfWeek,
      start_time: newMembership.startTime,
      end_time: newMembership.endTime,
      start_date: format(newMembership.startDate, 'yyyy-MM-dd'),
      end_date: format(newMembership.endDate, 'yyyy-MM-dd'),
      notes: newMembership.notes.trim() || null,
      created_by: user.id,
    };

    const { error } = await supabase
      .from('memberships')
      .insert(membershipData);

    if (error) {
      console.error('Error creating membership:', error);
      if (error.message.includes('relation "memberships" does not exist')) {
        alert('Tabelul pentru membrii nu există încă. Te rugăm să rulezi migrația 011_add_memberships.sql în Supabase.');
      } else {
        alert('Eroare la crearea membrului: ' + error.message);
      }
      setSavingMembership(false);
      return;
    }

    // Reset form
    setNewMembership({
      memberName: '',
      courtId: null,
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '19:00',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      notes: '',
    });
    setShowAddMembership(false);
    setSavingMembership(false);
    
    // Reload memberships
    loadMemberships();
    alert('Membru adăugat cu succes!');
  };

  const handleDeleteMembership = async (membershipId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest membru?')) return;

    setDeletingMembership(membershipId);
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId);

    if (error) {
      console.error('Error deleting membership:', error);
      alert('Eroare la ștergerea membrului: ' + error.message);
      setDeletingMembership(null);
      return;
    }

    setDeletingMembership(null);
    loadMemberships();
    alert('Membru șters cu succes!');
  };

  const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

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

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Setări Teren</h1>
          <p className="text-zinc-600">Gestionează disponibilitatea terenurilor tale</p>
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

      {/* Field Info */}
      {selectedFieldData && (
        <Card className="mb-6 border border-zinc-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-zinc-700 mb-1">Club selectat:</p>
            <p className="text-lg font-semibold text-zinc-900">{selectedFieldData.nume}</p>
            <p className="text-sm text-zinc-600">{selectedFieldData.locatie} • {selectedFieldData.sport}</p>
          </CardContent>
        </Card>
      )}

      {/* Courts List */}
      {courts.length === 0 ? (
        <Card className="border border-zinc-200 shadow-professional">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500 mb-2">Acest club nu are terenuri individuale configurate.</p>
            <p className="text-sm text-zinc-400">Terenurile individuale (courts) pot fi adăugate din baza de date.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Terenuri Individuale</h2>
            <p className="text-sm text-zinc-600 mb-4">Blochează terenurile individuale pentru lucrări de întreținere sau alte motive</p>
          </div>
          
          {courts.map((court) => {
            const settings = courtBlockSettings.get(court.id) || {
              isBlocked: false,
              reason: '',
              blockedUntil: null,
            };
            const isSaving = saving.get(court.id) || false;
            const isBlocked = court.is_blocked || settings.isBlocked;

            return (
              <Card key={court.id} className="border border-zinc-200 shadow-professional">
                <CardHeader className="border-b border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-zinc-900">{court.name}</CardTitle>
                      <CardDescription>
                        {isBlocked ? 'Terenul este blocat' : 'Terenul este disponibil pentru rezervări'}
                      </CardDescription>
                    </div>
                    <Badge className={isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                      {isBlocked ? 'Blocat' : 'Disponibil'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Block Toggle */}
                  <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-md">
                    <div className="flex items-center gap-3">
                      {settings.isBlocked ? (
                        <Lock className="w-5 h-5 text-red-600" />
                      ) : (
                        <Unlock className="w-5 h-5 text-emerald-600" />
                      )}
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {settings.isBlocked ? 'Terenul este blocat' : 'Terenul este disponibil'}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {settings.isBlocked 
                            ? 'Terenul nu va apărea ca disponibil pentru rezervări'
                            : 'Terenul este disponibil pentru rezervări'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={settings.isBlocked ? "outline" : "default"}
                      onClick={() => updateCourtBlockSettings(court.id, { isBlocked: !settings.isBlocked })}
                    >
                      {settings.isBlocked ? 'Deblochează' : 'Blochează'}
                    </Button>
                  </div>

                  {/* Block Details - Only show if blocked */}
                  {settings.isBlocked && (
                    <div className="space-y-4 p-4 bg-red-50 rounded-md border border-red-200">
                      <div>
                        <label className="text-sm font-medium text-zinc-700 mb-2 block">
                          Motivul blocării <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          value={settings.reason}
                          onChange={(e) => updateCourtBlockSettings(court.id, { reason: e.target.value })}
                          placeholder="Ex: Lucrări de întreținere, renovare, eveniment special..."
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-zinc-700 mb-2 block">
                          Blocat până la (opțional)
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {settings.blockedUntil 
                                ? format(settings.blockedUntil, "PPP", { locale: ro })
                                : "Selectează o dată"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={settings.blockedUntil || undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateCourtBlockSettings(court.id, { blockedUntil: date });
                                }
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-zinc-500 mt-1">
                          Dacă nu selectezi o dată, terenul va rămâne blocat până când îl deblochezi manual
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Status */}
                  {court.is_blocked && (
                    <div className="p-4 bg-zinc-50 rounded-md border border-zinc-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-semibold text-red-600">Status: Blocat</span>
                      </div>
                      {court.blocked_reason && (
                        <p className="text-sm text-zinc-600 mb-1">
                          <strong>Motiv:</strong> {court.blocked_reason}
                        </p>
                      )}
                      {court.blocked_until && (
                        <p className="text-sm text-zinc-600">
                          <strong>Blocat până la:</strong> {format(new Date(court.blocked_until), "PPP", { locale: ro })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex gap-3 pt-4 border-t border-zinc-200">
                    <Button
                      onClick={() => handleSaveCourt(court.id)}
                      disabled={isSaving || (settings.isBlocked && !settings.reason.trim())}
                      className="flex-1"
                    >
                      {isSaving ? 'Se salvează...' : 'Salvează Setările'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Memberships Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Membri cu Abonament</h2>
            <p className="text-sm text-zinc-600">Gestionează membrii care au rezervări recurente săptămânale</p>
          </div>
          <Button onClick={() => setShowAddMembership(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adaugă Membru
          </Button>
        </div>

        {/* Add Membership Modal */}
        {showAddMembership && (
          <Card className="mb-6 border-2 border-blue-200">
            <CardHeader className="border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-zinc-900">Adaugă Membru Nou</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddMembership(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Nume Membru <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newMembership.memberName}
                  onChange={(e) => setNewMembership(prev => ({ ...prev, memberName: e.target.value }))}
                  placeholder="Ex: Ion Popescu"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Teren (opțional)
                </label>
                <select
                  value={newMembership.courtId || ''}
                  onChange={(e) => setNewMembership(prev => ({ ...prev, courtId: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Toate terenurile</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-1">
                  Dacă nu selectezi un teren, membru va rezerva pe orice teren disponibil
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-2 block">
                    Ziua Săptămânii <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newMembership.dayOfWeek}
                    onChange={(e) => setNewMembership(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {dayNames.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-2 block">
                    Interval Orar <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={newMembership.startTime}
                      onChange={(e) => setNewMembership(prev => ({ ...prev, startTime: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="time"
                      value={newMembership.endTime}
                      onChange={(e) => setNewMembership(prev => ({ ...prev, endTime: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-2 block">
                    Data Început <span className="text-red-600">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(newMembership.startDate, "PPP", { locale: ro })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newMembership.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setNewMembership(prev => {
                              const updated = { ...prev, startDate: date };
                              if (date > prev.endDate) {
                                updated.endDate = date;
                              }
                              return updated;
                            });
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-2 block">
                    Data Sfârșit <span className="text-red-600">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(newMembership.endDate, "PPP", { locale: ro })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newMembership.endDate}
                        onSelect={(date) => {
                          if (date && date >= newMembership.startDate) {
                            setNewMembership(prev => ({ ...prev, endDate: date }));
                          }
                        }}
                        disabled={(date) => date < newMembership.startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Note (opțional)
                </label>
                <textarea
                  value={newMembership.notes}
                  onChange={(e) => setNewMembership(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Membru premium, contact: 0712345678..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200">
                <Button
                  onClick={handleSaveMembership}
                  disabled={savingMembership || !newMembership.memberName.trim()}
                  className="flex-1"
                >
                  {savingMembership ? 'Se salvează...' : 'Salvează Membru'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMembership(false);
                    setNewMembership({
                      memberName: '',
                      courtId: null,
                      dayOfWeek: 1,
                      startTime: '18:00',
                      endTime: '19:00',
                      startDate: new Date(),
                      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                      notes: '',
                    });
                  }}
                >
                  Anulează
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Memberships List */}
        {memberships.length === 0 ? (
          <Card className="border border-zinc-200">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 mb-2">Nu există membri cu abonament.</p>
              <p className="text-sm text-zinc-400">Adaugă primul membru pentru a începe.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {memberships.map((membership) => {
              const isExpired = new Date(membership.end_date) < new Date();
              const isActive = new Date(membership.start_date) <= new Date() && !isExpired;
              const courtName = membership.court_id 
                ? courts.find(c => c.id === membership.court_id)?.name || 'Teren necunoscut'
                : 'Orice teren';

              return (
                <Card key={membership.id} className="border border-zinc-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-zinc-900">{membership.member_name}</h3>
                          <Badge className={isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}>
                            {isActive ? 'Activ' : isExpired ? 'Expirat' : 'Viitor'}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-zinc-600 ml-8">
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{dayNames[membership.day_of_week]}</span>
                            <span>{membership.start_time} - {membership.end_time}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(membership.start_date), "PPP", { locale: ro })} - {format(new Date(membership.end_date), "PPP", { locale: ro })}
                            </span>
                          </p>
                          <p className="text-zinc-500">Teren: {courtName}</p>
                          {membership.notes && (
                            <p className="text-zinc-500 italic">Note: {membership.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMembership(membership.id)}
                        disabled={deletingMembership === membership.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingMembership === membership.id ? 'Se șterge...' : <X className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
