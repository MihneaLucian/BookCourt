"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import type { Teren } from "@/lib/data";

// Componente Shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Iconițe
import { Calendar as CalendarIcon, MapPin, Check, Wifi, Car, Star, Trophy } from "lucide-react";
import { NavbarClient } from "@/components/navbar-client";

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [teren, setTeren] = useState<Teren | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"1h" | "1h30" | "2h" | null>("1h");
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [courtAvailability, setCourtAvailability] = useState<Map<string, boolean>>(new Map());
  const [courtBlockedByMembership, setCourtBlockedByMembership] = useState<Map<string, string>>(new Map());

  // Fetch field data
  useEffect(() => {
    async function fetchField() {
      if (!id) return;
      
      const idString = Array.isArray(id) ? id[0] : id;
      
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('id', idString)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Error fetching field:', error);
        setLoading(false);
        return;
      }

      const fieldData = data as any;
      
      // Check if field is blocked
      if (fieldData.is_blocked) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (fieldData.blocked_until) {
          const blockedUntil = new Date(fieldData.blocked_until);
          blockedUntil.setHours(0, 0, 0, 0);
          if (blockedUntil >= today) {
            // Still blocked
            alert(`Acest teren este blocat${fieldData.blocked_reason ? `: ${fieldData.blocked_reason}` : ''}${fieldData.blocked_until ? ` până la ${format(blockedUntil, 'PPP', { locale: ro })}` : ''}.`);
            router.push('/search');
            setLoading(false);
            return;
          }
        } else {
          // Blocked indefinitely
          alert(`Acest teren este blocat${fieldData.blocked_reason ? `: ${fieldData.blocked_reason}` : ''}.`);
          router.push('/search');
          setLoading(false);
          return;
        }
      }
      
      setTeren({
        id: fieldData.id,
        nume: fieldData.nume,
        sport: fieldData.sport,
        suprafata: fieldData.suprafata,
        pret: Number(fieldData.pret),
        locatie: fieldData.locatie,
        imagine: fieldData.imagine,
        liber: true,
        rating: fieldData.rating ? Number(fieldData.rating) : undefined,
        reviewCount: fieldData.review_count,
      });

      // Fetch courts for this field
      // Try with blocked columns first
      let courtsData: any = null;
      const { data: dataWithBlocked, error: errorWithBlocked } = await supabase
        .from('courts')
        .select('*')
        .eq('field_id', fieldData.id)
        .eq('is_active', true)
        .order('name');

      if (errorWithBlocked && errorWithBlocked.message.includes('is_blocked')) {
        // Migration not run yet, fetch without blocked columns
        const { data: dataWithoutBlocked } = await supabase
          .from('courts')
          .select('id, name, field_id, is_active')
          .eq('field_id', fieldData.id)
          .eq('is_active', true)
          .order('name');
        
        courtsData = (dataWithoutBlocked || []).map((c: any) => ({
          ...c,
          is_blocked: false,
          blocked_reason: null,
          blocked_until: null,
        }));
      } else {
        courtsData = dataWithBlocked || [];
      }

      setCourts(courtsData);
      setLoading(false);
    }

    fetchField();
  }, [id]);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  const amenities = [
    { icon: <Wifi className="w-4 h-4" />, label: "Wi-Fi Gratuit" },
    { icon: <Car className="w-4 h-4" />, label: "Parcare Privată" },
    { icon: <Trophy className="w-4 h-4" />, label: "Nocturnă Pro" },
    { icon: <Check className="w-4 h-4" />, label: "Vestiare Încălzite" },
  ];

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];
  
  const intervals = [
    { value: "1h" as const, label: "1h", hours: 1 },
    { value: "1h30" as const, label: "1h 30min", hours: 1.5 },
    { value: "2h" as const, label: "2h", hours: 2 },
  ];
  
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };
  
  const getEndTime = (startTime: string, interval: "1h" | "1h30" | "2h"): string => {
    const intervalMinutes = interval === "1h" ? 60 : interval === "1h30" ? 90 : 120;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + intervalMinutes;
    return minutesToTime(endMinutes);
  };
  
  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedInterval) return true;
    const endTime = getEndTime(time, selectedInterval);
    const closingTime = "22:00";
    return timeToMinutes(endTime) <= timeToMinutes(closingTime);
  };
  
  useEffect(() => {
    if (selectedSlot && selectedInterval && !isTimeSlotAvailable(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [selectedInterval, selectedSlot]);

  // Check court availability when date, time, or interval changes
  useEffect(() => {
    async function checkCourtAvailability() {
      if (!date || !selectedSlot || !selectedInterval || courts.length === 0 || !teren) {
        setCourtAvailability(new Map());
        return;
      }

      const bookingDate = format(date, 'yyyy-MM-dd');
      const startTime = selectedSlot + ':00';
      const endTime = getEndTime(selectedSlot, selectedInterval) + ':00';

      const availabilityMap = new Map<string, boolean>();
      const membershipBlockReasons = new Map<string, string>();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDateObj = new Date(bookingDate);
      bookingDateObj.setHours(0, 0, 0, 0);

      for (const court of courts) {
        let isAvailable = true;

        // First check if court is blocked
        if (court.is_blocked) {
          if (court.blocked_until) {
            const blockedUntil = new Date(court.blocked_until);
            blockedUntil.setHours(0, 0, 0, 0);
            
            if (blockedUntil >= bookingDateObj) {
              // Court is blocked on this date
              isAvailable = false;
              availabilityMap.set(court.id, false);
              continue;
            }
          } else {
            // Blocked indefinitely
            isAvailable = false;
            availabilityMap.set(court.id, false);
            continue;
          }
        }

        // Check if this court is already booked for this time slot
        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('id, start_time, end_time')
          .eq('court_id', court.id)
          .eq('booking_date', bookingDate)
          .eq('status', 'confirmed');
        
        if (existingBookings && existingBookings.length > 0) {
          // Check for time overlap
          for (const booking of existingBookings as any[]) {
            const existingStart = booking.start_time;
            const existingEnd = booking.end_time;
            
            // Check if times overlap: our start < existing end AND our end > existing start
            if (startTime < existingEnd && endTime > existingStart) {
              isAvailable = false;
              break;
            }
          }
        }

        // Check if this court has a lesson for this time slot
        if (isAvailable) {
          const { data: existingLessons } = await supabase
            .from('lessons')
            .select('id, start_time, end_time')
            .eq('court_id', court.id)
            .eq('lesson_date', bookingDate);
          
          if (existingLessons && existingLessons.length > 0) {
            // Check for time overlap
            for (const lesson of existingLessons as any[]) {
              const lessonStart = lesson.start_time;
              const lessonEnd = lesson.end_time;
              
              // Check if times overlap: our start < lesson end AND our end > lesson start
              if (startTime < lessonEnd && endTime > lessonStart) {
                isAvailable = false;
                break;
              }
            }
          }
        }

        // Check for memberships that block this time slot
        if (isAvailable && teren) {
          const bookingDayOfWeek = bookingDateObj.getDay(); // 0 = Sunday, 6 = Saturday
          
          // Check memberships for this field and court
          const { data: memberships } = await supabase
            .from('memberships')
            .select('*')
            .eq('field_id', teren.id)
            .eq('day_of_week', bookingDayOfWeek)
            .lte('start_date', bookingDate)
            .gte('end_date', bookingDate);
          
          if (memberships && memberships.length > 0) {
            for (const membership of memberships as any[]) {
              // Check if membership applies to this court (or all courts if court_id is null)
              if (membership.court_id === null || membership.court_id === court.id) {
                // Check if time overlaps
                if (startTime < membership.end_time && endTime > membership.start_time) {
                  isAvailable = false;
                  membershipBlockReasons.set(court.id, `Abonament: ${membership.member_name}`);
                  break;
                }
              }
            }
          }
        }

        availabilityMap.set(court.id, isAvailable);
      }

      setCourtAvailability(availabilityMap);
      setCourtBlockedByMembership(membershipBlockReasons);
    }

    checkCourtAvailability();
  }, [date, selectedSlot, selectedInterval, courts, teren]);

  // Clear selected court if it becomes unavailable
  useEffect(() => {
    if (selectedCourt && courtAvailability.has(selectedCourt)) {
      const isAvailable = courtAvailability.get(selectedCourt);
      if (!isAvailable) {
        setSelectedCourt(null);
      }
    }
  }, [selectedCourt, courtAvailability]);
  
  const basePrice = teren?.pret || 0;
  const getIntervalMultiplier = (interval: "1h" | "1h30" | "2h" | null): number => {
    if (!interval) return 1;
    return interval === "1h" ? 1 : interval === "1h30" ? 1.5 : 2;
  };
  
  const intervalMultiplier = getIntervalMultiplier(selectedInterval);
  const baseTotal = basePrice * intervalMultiplier;
  const finalPrice = selectedSlot === "22:00" ? baseTotal * 0.8 : baseTotal;

  const handleBooking = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/book/' + id);
      return;
    }

    if (!teren || !date || !selectedSlot || !selectedInterval) return;

    // For fields with courts (like tennis), require court selection
    if (courts.length > 0 && !selectedCourt) {
      alert('Te rugăm să selectezi un teren.');
      return;
    }

    const bookingDate = format(date, 'yyyy-MM-dd');
    const startTime = selectedSlot + ':00';
    const endTime = getEndTime(selectedSlot, selectedInterval) + ':00';
    const durationMinutes = selectedInterval === "1h" ? 60 : selectedInterval === "1h30" ? 90 : 120;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        field_id: teren.id,
        user_id: user.id,
        court_id: selectedCourt || null,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes as 60 | 90 | 120,
        price_per_hour: basePrice,
        total_price: finalPrice,
        status: 'confirmed' as const,
        payment_status: 'unpaid' as const,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      alert('Eroare la crearea rezervării. Te rugăm să încerci din nou.');
      return;
    }

    router.push('/success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!teren) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Terenul nu a fost găsit</h1>
          <Link href="/search">
            <Button>Înapoi la Căutare</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <NavbarClient />
      
      {/* HERO SECTION */}
      <div className="h-64 bg-zinc-900 relative">
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 max-w-7xl mx-auto text-white">
            <Badge className="bg-zinc-800 text-white mb-3 border border-zinc-700">
              {teren.sport} • {teren.suprafata}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-white">
              {teren.nume}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-zinc-300 text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> 
                  <span>{teren.locatie}</span>
                </span>
                {teren.rating && teren.reviewCount && (
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 
                      <span>{teren.rating.toFixed(1)}</span>
                      <span className="text-zinc-400">({teren.reviewCount} {teren.reviewCount === 1 ? 'recenzie' : 'recenzii'})</span>
                    </span>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 relative z-10">
        
        {/* STÂNGA: Calendar, Ore, Facilități */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Selector Dată & Oră */}
            <Card className="shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Alege Data și Ora
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* DATE PICKER */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-zinc-500">Data Rezervării</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ro }) : <span>Alege o dată</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* INTERVAL SELECTOR */}
                    <div>
                        <label className="text-sm font-medium text-zinc-700 mb-2 block">Durata Rezervării</label>
                        <div className="flex gap-3">
                            {intervals.map((interval) => (
                                <button
                                    key={interval.value}
                                    onClick={() => setSelectedInterval(interval.value)}
                                    className={`
                                        flex-1 py-2.5 px-4 rounded-md text-sm font-medium border transition-colors
                                        ${selectedInterval === interval.value
                                            ? "bg-blue-600 text-white border-blue-600" 
                                            : "bg-white text-zinc-700 border-zinc-300 hover:border-blue-500 hover:bg-zinc-50"}
                                    `}
                                >
                                    {interval.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TIME SLOTS */}
                    <div>
                        <label className="text-sm font-medium text-zinc-500 mb-2 block">Ora de Început</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {timeSlots.map((time) => {
                                const isAvailable = isTimeSlotAvailable(time);
                                const isSelected = selectedSlot === time;
                                return (
                                    <button
                                        key={time}
                                        onClick={() => isAvailable && setSelectedSlot(time)}
                                        disabled={!isAvailable}
                                        className={`
                                            py-2 px-1 rounded-md text-sm font-semibold border transition-all
                                            ${!isAvailable
                                                ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-50"
                                                : isSelected
                                                ? "bg-zinc-900 text-white border-zinc-900 shadow-md transform scale-105" 
                                                : "bg-white text-zinc-700 border-zinc-200 hover:border-blue-500 hover:bg-blue-50"}
                                        `}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedSlot && selectedInterval && (
                            <p className="text-sm text-zinc-500 mt-2">
                                Interval: {selectedSlot} - {getEndTime(selectedSlot, selectedInterval)}
                            </p>
                        )}
                    </div>

                    {/* COURT SELECTION (only for fields with courts) */}
                    {courts.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-zinc-500 mb-2 block">
                                Selectează Terenul {courts.length > 1 ? '(Obligatoriu)' : ''}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {courts.map((court) => {
                                    const bookingAvailable = courtAvailability.get(court.id) ?? true;
                                    const isSelected = selectedCourt === court.id;
                                    
                                    // Check if court is blocked
                                    let isBlocked = false;
                                    if (court.is_blocked && date) {
                                      const bookingDate = new Date(format(date, 'yyyy-MM-dd'));
                                      bookingDate.setHours(0, 0, 0, 0);
                                      
                                      if (court.blocked_until) {
                                        const blockedUntil = new Date(court.blocked_until);
                                        blockedUntil.setHours(0, 0, 0, 0);
                                        isBlocked = blockedUntil >= bookingDate;
                                      } else {
                                        // Blocked indefinitely
                                        isBlocked = true;
                                      }
                                    }
                                    
                                    const membershipBlocked = courtBlockedByMembership.has(court.id);
                                    const isAvailable = bookingAvailable && !isBlocked && !membershipBlocked;
                                    const isBooked = !bookingAvailable;
                                    const displayText = !bookingAvailable 
                                      ? 'Ocupat' 
                                      : isBlocked 
                                      ? 'Blocat' 
                                      : membershipBlocked
                                      ? 'Abonament'
                                      : '';
                                    
                                    const tooltipText = isBlocked && court.blocked_reason 
                                      ? `Blocat: ${court.blocked_reason}` 
                                      : membershipBlocked 
                                      ? courtBlockedByMembership.get(court.id) || 'Rezervat pentru abonament'
                                      : undefined;
                                    
                                    return (
                                        <button
                                            key={court.id}
                                            onClick={() => isAvailable && setSelectedCourt(court.id)}
                                            disabled={!isAvailable}
                                            className={`
                                                py-3 px-4 rounded-md text-sm font-semibold border transition-all relative
                                                ${isBooked
                                                    ? "bg-red-50 text-red-600 border-red-200 cursor-not-allowed"
                                                    : !isAvailable
                                                    ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-50"
                                                    : isSelected
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105" 
                                                    : "bg-white text-zinc-700 border-zinc-200 hover:border-blue-500 hover:bg-blue-50"}
                                            `}
                                            title={tooltipText}
                                        >
                                            <div className="flex flex-col items-center">
                                                <span>{court.name}</span>
                                                {isAvailable && !isSelected && (
                                                    <span className="text-xs mt-1 font-medium text-emerald-600">Liber</span>
                                                )}
                                                {displayText && (
                                                    <span className="block text-xs mt-1">{displayText}</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedCourt && (
                                <p className="text-sm text-emerald-600 mt-2">
                                    ✓ Teren selectat: {courts.find(c => c.id === selectedCourt)?.name}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Facilități */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Facilități Incluse</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {amenities.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-zinc-600">
                                <div className="p-2 bg-zinc-100 rounded-full">{item.icon}</div>
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* DREAPTA: Sticky Summary Card */}
        <div className="lg:col-span-1">
            <div className="sticky top-6">
                <Card className="shadow-professional border border-zinc-200">
                    <CardHeader className="border-b border-zinc-200 pb-4">
                        <CardTitle className="text-lg font-semibold text-zinc-900">Sumar Rezervare</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Dată:</span>
                            <span className="font-medium">{date ? format(date, "dd MMM yyyy", { locale: ro }) : "-"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Oră:</span>
                            <span className="font-medium">
                                {selectedSlot 
                                    ? `${selectedSlot}${selectedInterval && selectedSlot ? ` - ${getEndTime(selectedSlot, selectedInterval)}` : ""}`
                                    : "-"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Durată:</span>
                            <span className="font-medium">
                                {selectedInterval 
                                    ? intervals.find(i => i.value === selectedInterval)?.label || "-"
                                    : "-"}
                            </span>
                        </div>
                        {selectedCourt && (
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Teren:</span>
                                <span className="font-medium">
                                    {courts.find(c => c.id === selectedCourt)?.name || "-"}
                                </span>
                            </div>
                        )}
                        
                        <Separator />

                        <div className="flex justify-between items-center">
                            <span className="text-zinc-600">Preț Teren ({selectedInterval ? intervals.find(i => i.value === selectedInterval)?.label : "1h"})</span>
                            <span className="font-medium">{basePrice} RON × {intervalMultiplier}</span>
                        </div>
                        {selectedSlot === "22:00" && (
                            <div className="flex justify-between items-center text-emerald-600 text-sm">
                                <span>Promoție (Last Hour)</span>
                                <span>- {(baseTotal - finalPrice).toFixed(0)} RON</span>
                            </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-2xl">{selectedSlot && selectedInterval ? finalPrice.toFixed(0) : 0} RON</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 bg-zinc-50 p-6 rounded-b-lg">
                        <Button 
                            className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                            disabled={!selectedSlot || !date || !selectedInterval || (courts.length > 0 && !selectedCourt)}
                            onClick={handleBooking}
                        >
                            {user ? 'Confirmă și Plătește' : 'Autentifică-te pentru Rezervare'}
                        </Button>
                        {courts.length > 0 && !selectedCourt && (
                            <p className="text-xs text-center text-red-500 mt-1">
                                Te rugăm să selectezi un teren
                            </p>
                        )}
                        <p className="text-xs text-center text-zinc-400">
                            🔒 Plată securizată prin Netopia/Stripe
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>

      </div>
    </div>
  );
}
