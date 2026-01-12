"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  MapPin,
  Filter,
  Download,
  Plus,
  X,
  Phone,
  Settings
} from "lucide-react";
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
  court_id: string | null;
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
  courts: {
    id: string;
    name: string;
  } | null;
}

interface Trainer {
  id: string;
  field_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Lesson {
  id: string;
  field_id: string;
  court_id: string | null;
  trainer_id: string | null;
  trainer_name: string | null;
  trainer_phone: string | null;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  created_at: string;
  courts: {
    id: string;
    name: string;
  } | null;
  trainers: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

export function AdminDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    customerPhone: '',
    startTime: '',
    duration: '1h' as '1h' | '1h30' | '2h',
    courtId: null as string | null,
    price: 0,
  });
  const [courts, setCourts] = useState<any[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set());
  const [unavailableCourts, setUnavailableCourts] = useState<Map<string, Set<string>>>(new Map());
  const [memberships, setMemberships] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showManageTrainers, setShowManageTrainers] = useState(false);
  const [lessonDate, setLessonDate] = useState<Date>(new Date());
  const [newLesson, setNewLesson] = useState({
    trainerId: null as string | null,
    startTime: '',
    endTime: '',
    courtId: null as string | null,
  });
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayBookings: 0,
    totalRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/auth/login?redirect=/admin/dashboard');
        return;
      }

      setUser(currentUser);
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        router.push('/search');
        return;
      }

      // Explicitly check for true
      if (profile.is_admin !== true) {
        router.push('/search');
        return;
      }

      setIsAdmin(true);
      
      // Reload fields
      const { data: fieldsData } = await supabase
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

      if (fieldsData) {
        const fieldsList = fieldsData
          .map((fo: any) => fo.fields)
          .filter(Boolean);
        setFields(fieldsList);
        
        if (fieldsList.length > 0 && !selectedField) {
          setSelectedField(fieldsList[0].id);
        }
      }

      setLoading(false);
    }

    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login?redirect=/admin/dashboard');
      } else if (session) {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, selectedField]);

  // Load courts and trainers when field changes
  useEffect(() => {
    if (!selectedField) return;

    async function loadCourts() {
      const { data: courtsData } = await supabase
        .from('courts')
        .select('*')
        .eq('field_id', selectedField)
        .eq('is_active', true)
        .order('name');

      setCourts(courtsData || []);
    }

    async function loadTrainers() {
      const { data: trainersData, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('field_id', selectedField)
        .eq('is_active', true)
        .order('name');

      if (error) {
        // If table doesn't exist yet, just set empty array
        if (error.message.includes('relation "trainers" does not exist')) {
          setTrainers([]);
          return;
        }
        console.error('Error loading trainers:', error);
        setTrainers([]);
      } else {
        setTrainers((trainersData || []) as Trainer[]);
      }
    }

    loadCourts();
    loadTrainers();
  }, [selectedField]);

  // Calculate price for new booking
  useEffect(() => {
    if (!selectedField || !newBooking.startTime || !newBooking.duration) {
      setNewBooking(prev => ({ ...prev, price: 0 }));
      return;
    }

    async function getFieldPrice() {
      const { data } = await supabase
        .from('fields')
        .select('pret')
        .eq('id', selectedField)
        .single();

      if (data) {
        const basePrice = Number(data.pret);
        const multiplier = newBooking.duration === '1h' ? 1 : newBooking.duration === '1h30' ? 1.5 : 2;
        const finalPrice = newBooking.startTime === '22:00' ? basePrice * multiplier * 0.8 : basePrice * multiplier;
        setNewBooking(prev => ({ ...prev, price: finalPrice }));
      }
    }

    getFieldPrice();
  }, [selectedField, newBooking.startTime, newBooking.duration]);

  // Load availability for add booking modal
  useEffect(() => {
    if (!selectedField || !showAddBooking) {
      setUnavailableSlots(new Set());
      setUnavailableCourts(new Map());
      return;
    }

    async function loadAvailability() {
      const dateStr = format(bookingDate, 'yyyy-MM-dd');
      
      // Get all confirmed bookings for this field and date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('start_time, end_time, court_id')
        .eq('field_id', selectedField)
        .eq('booking_date', dateStr)
        .eq('status', 'confirmed');

      // Get all lessons for this field and date
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('start_time, end_time, court_id')
        .eq('field_id', selectedField)
        .eq('lesson_date', dateStr);

      if (!existingBookings && !existingLessons) {
        setUnavailableSlots(new Set());
        setUnavailableCourts(new Map());
        return;
      }

      // Calculate unavailable time slots
      const unavailable = new Set<string>();
      const courtUnavailable = new Map<string, Set<string>>();

      // Initialize court map
      courts.forEach(court => {
        courtUnavailable.set(court.id, new Set());
      });

      if (existingBookings) {
        existingBookings.forEach((booking: any) => {
          const startTime = booking.start_time.substring(0, 5); // HH:MM
          const endTime = booking.end_time.substring(0, 5);
          
          // Check each time slot to see if it conflicts
          timeSlots.forEach(slot => {
            const slotStart = timeToMinutes(slot);
            const slotEnd = slotStart + 120; // Check up to 2h slots
            
            const bookingStart = timeToMinutes(startTime);
            const bookingEnd = timeToMinutes(endTime);
            
            // Check if slot overlaps with booking
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
              // If booking has a court, mark that specific court as unavailable
              if (booking.court_id) {
                const courtUnavail = courtUnavailable.get(booking.court_id);
                if (courtUnavail) {
                  courtUnavail.add(slot);
                }
              } else {
                // If no court, mark the slot as unavailable for all courts
                unavailable.add(slot);
              }
            }
          });
        });
      }

      // Check lessons for conflicts
      if (existingLessons) {
        existingLessons.forEach((lesson: any) => {
          const startTime = lesson.start_time.substring(0, 5); // HH:MM
          const endTime = lesson.end_time.substring(0, 5);
          
          // Check each time slot to see if it conflicts
          timeSlots.forEach(slot => {
            const slotStart = timeToMinutes(slot);
            const slotEnd = slotStart + 120; // Check up to 2h slots
            
            const lessonStart = timeToMinutes(startTime);
            const lessonEnd = timeToMinutes(endTime);
            
            // Check if slot overlaps with lesson
            if (slotStart < lessonEnd && slotEnd > lessonStart) {
              // If lesson has a court, mark that specific court as unavailable
              if (lesson.court_id) {
                const courtUnavail = courtUnavailable.get(lesson.court_id);
                if (courtUnavail) {
                  courtUnavail.add(slot);
                }
              } else {
                // If no court, mark the slot as unavailable for all courts
                unavailable.add(slot);
              }
            }
          });
        });
      }

      // Also check memberships for this date
      const dayOfWeek = bookingDate.getDay();
      
      const { data: membershipsData } = await supabase
        .from('memberships')
        .select('*')
        .eq('field_id', selectedField)
        .eq('day_of_week', dayOfWeek)
        .lte('start_date', dateStr)
        .gte('end_date', dateStr);

      if (membershipsData && membershipsData.length > 0) {
        membershipsData.forEach((membership: any) => {
          const startTime = membership.start_time.substring(0, 5);
          const endTime = membership.end_time.substring(0, 5);
          
          timeSlots.forEach(slot => {
            const slotStart = timeToMinutes(slot);
            const slotEnd = slotStart + 120;
            
            const membershipStart = timeToMinutes(startTime);
            const membershipEnd = timeToMinutes(endTime);
            
            // Check if slot overlaps with membership
            if (slotStart < membershipEnd && slotEnd > membershipStart) {
              if (membership.court_id) {
                // Membership applies to specific court
                const courtUnavail = courtUnavailable.get(membership.court_id);
                if (courtUnavail) {
                  courtUnavail.add(slot);
                }
              } else {
                // Membership applies to all courts
                unavailable.add(slot);
                courts.forEach(court => {
                  const courtUnavail = courtUnavailable.get(court.id);
                  if (courtUnavail) {
                    courtUnavail.add(slot);
                  }
                });
              }
            }
          });
        });
      }

      setUnavailableSlots(unavailable);
      setUnavailableCourts(courtUnavailable);
    }

    loadAvailability();
  }, [selectedField, bookingDate, showAddBooking, courts]);

  // Load memberships for the selected date
  useEffect(() => {
    if (!selectedField) {
      setMemberships([]);
      return;
    }

    async function loadMemberships() {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Get memberships that apply to this date
      const { data, error } = await supabase
        .from('memberships')
        .select('*, courts(id, name)')
        .eq('field_id', selectedField)
        .eq('day_of_week', dayOfWeek)
        .lte('start_date', dateStr)
        .gte('end_date', dateStr);

      if (error) {
        // If table doesn't exist, just set empty array
        if (error.message.includes('relation "memberships" does not exist')) {
          setMemberships([]);
          return;
        }
        console.error('Error loading memberships:', error);
        setMemberships([]);
      } else {
        setMemberships((data || []) as any[]);
      }
    }

    loadMemberships();
  }, [selectedField, selectedDate]);

  // Load bookings when field or date changes
  useEffect(() => {
    if (!selectedField) return;

    async function loadBookings() {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('Loading bookings for field:', selectedField, 'date:', dateStr);
      
      // Get bookings for selected field and date (only confirmed, not cancelled)
      // Try with profiles join first, fallback to without if it fails
      let bookingsData: any[] | null = null;
      let error: any = null;
      
      // First try with profiles and courts join
      const { data, error: err } = await supabase
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
          ),
          courts (
            id,
            name
          )
        `)
        .eq('field_id', selectedField)
        .eq('booking_date', dateStr)
        .eq('status', 'confirmed')
        .order('start_time');
      
      if (err) {
        console.warn('Error with profiles join, trying without:', err);
        // Fallback: try without profiles/courts join
        const { data: dataWithoutJoins, error: err2 } = await supabase
          .from('bookings')
          .select(`
            *,
            fields (
              id,
              nume,
              sport,
              locatie,
              city
            )
          `)
          .eq('field_id', selectedField)
          .eq('booking_date', dateStr)
          .eq('status', 'confirmed')
          .order('start_time');
        
        if (err2) {
          error = err2;
        } else {
          bookingsData = dataWithoutJoins;
          // Manually fetch profiles and courts if needed
          if (bookingsData && bookingsData.length > 0) {
            const userIds = [...new Set(bookingsData.map((b: any) => b.user_id).filter(Boolean))];
            const courtIds = [...new Set(bookingsData.map((b: any) => b.court_id).filter(Boolean))];
            
            // Fetch profiles
            if (userIds.length > 0) {
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);
              
              if (profilesData) {
                const profilesMap = new Map(profilesData.map((p: any) => [p.id, p]));
                bookingsData = bookingsData.map((b: any) => ({
                  ...b,
                  profiles: profilesMap.get(b.user_id) || null
                }));
              }
            }
            
            // Fetch courts
            if (courtIds.length > 0) {
              const { data: courtsData } = await supabase
                .from('courts')
                .select('id, name')
                .in('id', courtIds);
              
              if (courtsData) {
                const courtsMap = new Map(courtsData.map((c: any) => [c.id, c]));
                bookingsData = bookingsData.map((b: any) => ({
                  ...b,
                  courts: b.court_id ? (courtsMap.get(b.court_id) || null) : null
                }));
              }
            }
          }
        }
      } else {
        bookingsData = data;
      }

      if (error) {
        console.error('Error loading bookings:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setBookings([]);
        return;
      }

      console.log('Bookings loaded:', bookingsData?.length || 0);
      setBookings((bookingsData as any[]) || []);
    }

    async function loadLessons() {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          courts (
            id,
            name
          ),
          trainers (
            id,
            name,
            phone
          )
        `)
        .eq('field_id', selectedField)
        .eq('lesson_date', dateStr)
        .order('start_time');

      if (lessonsError) {
        // If table doesn't exist yet, just set empty array
        if (lessonsError.message.includes('relation "lessons" does not exist')) {
          setLessons([]);
          return;
        }
        console.error('Error loading lessons:', lessonsError);
        setLessons([]);
      } else {
        setLessons((lessonsData || []) as Lesson[]);
      }
    }

    loadBookings();
    loadLessons();
  }, [selectedField, selectedDate]);

  // Load stats
  useEffect(() => {
    if (!selectedField) return;

    async function loadStats() {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Today's stats (only confirmed bookings)
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('total_price, payment_status')
        .eq('field_id', selectedField)
        .eq('booking_date', today)
        .eq('status', 'confirmed');

      const todayRevenue = (todayBookings || [])
        .filter((b: any) => b.payment_status === 'paid')
        .reduce((sum: number, b: any) => sum + Number(b.total_price), 0);

      // Total stats (only confirmed bookings)
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('total_price, payment_status')
        .eq('field_id', selectedField)
        .eq('status', 'confirmed');

      const totalRevenue = (allBookings || [])
        .filter((b: any) => b.payment_status === 'paid')
        .reduce((sum: number, b: any) => sum + Number(b.total_price), 0);

      setStats({
        todayRevenue,
        todayBookings: todayBookings?.length || 0,
        totalRevenue,
        totalBookings: allBookings?.length || 0,
        pendingBookings: 0, // No pending bookings anymore
      });
    }

    loadStats();
  }, [selectedField]);

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

  // Helper functions for time calculations
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const getEndTime = (startTime: string, duration: '1h' | '1h30' | '2h'): string => {
    const durationMinutes = duration === '1h' ? 60 : duration === '1h30' ? 90 : 120;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return minutesToTime(endMinutes);
  };

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  const handleCreateBooking = async () => {
    if (!selectedField || !newBooking.startTime || !newBooking.duration) {
      alert('Te rugăm să completezi toate câmpurile obligatorii.');
      return;
    }

    // For fields with courts, require court selection
    if (courts.length > 0 && !newBooking.courtId) {
      alert('Te rugăm să selectezi un teren.');
      return;
    }

    const bookingDateStr = format(bookingDate, 'yyyy-MM-dd');
    const startTime = newBooking.startTime + ':00';
    const endTime = getEndTime(newBooking.startTime, newBooking.duration) + ':00';
    const durationMinutes = newBooking.duration === '1h' ? 60 : newBooking.duration === '1h30' ? 90 : 120;

    // Check if time slot is available
      // Get all bookings for this field/date
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, court_id')
        .eq('field_id', selectedField)
        .eq('booking_date', bookingDateStr)
        .eq('status', 'confirmed');

      // Get all lessons for this field/date
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, start_time, end_time, court_id')
        .eq('field_id', selectedField)
        .eq('lesson_date', bookingDateStr);

    // Also check memberships
    const dayOfWeek = bookingDate.getDay();
    let membershipsData: any[] = [];
    const { data: membershipsResult } = await supabase
      .from('memberships')
      .select('*')
      .eq('field_id', selectedField)
      .eq('day_of_week', dayOfWeek)
      .lte('start_date', bookingDateStr)
      .gte('end_date', bookingDateStr);
    
    if (membershipsResult) {
      membershipsData = membershipsResult;
    }

    if (allBookings && allBookings.length > 0) {
      // Check for time overlap: booking conflicts if existing.start < our.end AND existing.end > our.start
      const hasConflict = allBookings.some((existing: any) => {
        const existingStart = existing.start_time;
        const existingEnd = existing.end_time;
        
        // If court is specified, only check conflicts on same court
        if (newBooking.courtId && existing.court_id !== newBooking.courtId) {
          return false;
        }
        
        // If no court specified, check all bookings
        // Check if times overlap
        return startTime < existingEnd && endTime > existingStart;
      });

      if (hasConflict) {
        alert('Acest interval orar este deja rezervat de o rezervare.');
        return;
      }
    }

    // Check for lesson conflicts
    if (allLessons && allLessons.length > 0) {
      const hasConflict = allLessons.some((existing: any) => {
        const existingStart = existing.start_time;
        const existingEnd = existing.end_time;
        
        if (newBooking.courtId && existing.court_id !== newBooking.courtId) {
          return false;
        }
        
        return startTime < existingEnd && endTime > existingStart;
      });

      if (hasConflict) {
        alert('Acest interval orar este deja rezervat de o lecție.');
        return;
      }
    }

    // Check memberships
    if (membershipsData && membershipsData.length > 0) {
      for (const membership of membershipsData) {
        // Check if membership applies to this court (or all courts if court_id is null)
        if (membership.court_id === null || membership.court_id === newBooking.courtId) {
          // Check if time overlaps
          if (startTime < membership.end_time && endTime > membership.start_time) {
            alert('Acest interval este deja rezervat de un membru cu abonament.');
            return;
          }
        }
      }
    }

    // Get field price
    const { data: fieldData } = await supabase
      .from('fields')
      .select('pret')
      .eq('id', selectedField)
      .single();

    if (!fieldData) {
      alert('Eroare la încărcarea datelor terenului.');
      return;
    }

    const basePrice = Number(fieldData.pret);
    const multiplier = newBooking.duration === '1h' ? 1 : newBooking.duration === '1h30' ? 1.5 : 2;
    const finalPrice = newBooking.startTime === '22:00' ? basePrice * multiplier * 0.8 : basePrice * multiplier;

    // Create a temporary user profile for phone bookings (or use admin's ID)
    // For phone bookings, we'll use the admin's user_id but note it's a phone booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        field_id: selectedField,
        user_id: user?.id, // Admin's ID
        court_id: newBooking.courtId || null,
        booking_date: bookingDateStr,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes as 60 | 90 | 120,
        price_per_hour: basePrice,
        total_price: finalPrice,
        status: 'confirmed',
        payment_status: 'unpaid',
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      alert('Eroare la crearea rezervării: ' + error.message);
      return;
    }

    // If customer info provided, create/update profile note (we can store in a comment field or separate table)
    // For now, we'll just refresh the bookings list
    setShowAddBooking(false);
    setNewBooking({
      customerName: '',
      customerPhone: '',
      startTime: '',
      duration: '1h',
      courtId: null,
      price: 0,
    });

    // Refresh bookings for the selected date (not bookingDate)
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: updatedBookings } = await supabase
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
        ),
        courts (
          id,
          name
        )
      `)
      .eq('field_id', selectedField)
      .eq('booking_date', dateStr)
      .eq('status', 'confirmed')
      .order('start_time');

    if (updatedBookings) {
      setBookings(updatedBookings as any[]);
    }

    // Refresh stats
    router.refresh();
  };

  const handleCreateLesson = async () => {
    if (!selectedField || !newLesson.startTime || !newLesson.endTime || !newLesson.trainerId) {
      alert('Te rugăm să completezi toate câmpurile obligatorii.');
      return;
    }

    // For fields with courts, require court selection
    if (courts.length > 0 && !newLesson.courtId) {
      alert('Te rugăm să selectezi un teren.');
      return;
    }

    // Validate time
    const startMinutes = timeToMinutes(newLesson.startTime);
    const endMinutes = timeToMinutes(newLesson.endTime);
    if (endMinutes <= startMinutes) {
      alert('Ora de sfârșit trebuie să fie după ora de început.');
      return;
    }

    const lessonDateStr = format(lessonDate, 'yyyy-MM-dd');
    const startTime = newLesson.startTime.includes(':') ? newLesson.startTime : newLesson.startTime + ':00';
    const endTime = newLesson.endTime.includes(':') ? newLesson.endTime : newLesson.endTime + ':00';
    const durationMinutes = endMinutes - startMinutes;

    // Check if time slot is available (check bookings, memberships, and other lessons)
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, court_id')
      .eq('field_id', selectedField)
      .eq('booking_date', lessonDateStr)
      .eq('status', 'confirmed');

    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id, start_time, end_time, court_id')
      .eq('field_id', selectedField)
      .eq('lesson_date', lessonDateStr);

    // Check for booking conflicts
    if (allBookings && allBookings.length > 0) {
      const hasConflict = allBookings.some((existing: any) => {
        if (newLesson.courtId && existing.court_id !== newLesson.courtId) {
          return false;
        }
        return startTime < existing.end_time && endTime > existing.start_time;
      });

      if (hasConflict) {
        alert('Acest interval orar este deja rezervat de o rezervare.');
        return;
      }
    }

    // Check for lesson conflicts
    if (allLessons && allLessons.length > 0) {
      const hasConflict = allLessons.some((existing: any) => {
        if (existing.id === newLesson.courtId) return false; // Skip if same lesson
        if (newLesson.courtId && existing.court_id !== newLesson.courtId) {
          return false;
        }
        return startTime < existing.end_time && endTime > existing.start_time;
      });

      if (hasConflict) {
        alert('Acest interval orar este deja rezervat de o lecție.');
        return;
      }
    }

    // Check memberships
    const dayOfWeek = lessonDate.getDay();
    const { data: membershipsData } = await supabase
      .from('memberships')
      .select('*')
      .eq('field_id', selectedField)
      .eq('day_of_week', dayOfWeek)
      .lte('start_date', lessonDateStr)
      .gte('end_date', lessonDateStr);

    if (membershipsData && membershipsData.length > 0) {
      for (const membership of membershipsData) {
        if (membership.court_id === null || membership.court_id === newLesson.courtId) {
          if (startTime < membership.end_time && endTime > membership.start_time) {
            alert('Acest interval este deja rezervat de un membru cu abonament.');
            return;
          }
        }
      }
    }

    // Get trainer info for backward compatibility
    const selectedTrainer = trainers.find(t => t.id === newLesson.trainerId);
    
    // Create lesson
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        field_id: selectedField,
        court_id: newLesson.courtId || null,
        trainer_id: newLesson.trainerId,
        trainer_name: selectedTrainer?.name || null,
        trainer_phone: selectedTrainer?.phone || null,
        lesson_date: lessonDateStr,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      alert('Eroare la crearea lecției: ' + error.message);
      return;
    }

    setShowAddLesson(false);
    setNewLesson({
      trainerId: null,
      startTime: '',
      endTime: '',
      courtId: null,
    });
    setLessonDate(new Date());

    // Refresh lessons for the selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: updatedLessons } = await supabase
      .from('lessons')
      .select(`
        *,
        courts (
          id,
          name
        ),
        trainers (
          id,
          name,
          phone
        )
      `)
      .eq('field_id', selectedField)
      .eq('lesson_date', dateStr)
      .order('start_time');

    if (updatedLessons) {
      setLessons(updatedLessons as Lesson[]);
    }

    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-200 rounded w-48"></div>
          <div className="h-64 bg-zinc-200 rounded"></div>
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
            <p className="text-zinc-500 mb-4">
              Nu ai terenuri asociate contului tău.
            </p>
            <p className="text-sm text-zinc-400">
              Contactează administratorul pentru a-ți asocia un teren.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentField = fields.find(f => f.id === selectedField) || fields[0];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Dashboard Admin</h1>
        <p className="text-zinc-600">Gestionează rezervările și vezi statisticile terenului tău</p>
      </div>

      {/* Field Selector */}
      {fields.length > 1 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-500">Selectează terenul:</span>
              <div className="flex gap-2 flex-wrap">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Venituri Azi</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.todayRevenue.toFixed(0)} RON</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Rezervări Azi</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.todayBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Venituri Totale</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalRevenue.toFixed(0)} RON</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
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
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Schedule View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-professional border border-zinc-200">
            <CardHeader className="border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <Calendar className="w-5 h-5 text-zinc-600" />
                  Programul pentru {format(selectedDate, "PPP", { locale: ro })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setBookingDate(selectedDate);
                      setShowAddBooking(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Rezervare
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setLessonDate(selectedDate);
                      setShowAddLesson(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Lecție
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManageTrainers(true)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Antrenori
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prev = new Date(selectedDate);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDate(prev);
                    }}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Azi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = new Date(selectedDate);
                      next.setDate(next.getDate() + 1);
                      setSelectedDate(next);
                    }}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 && memberships.length === 0 && lessons.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500">Nu sunt rezervări pentru această dată.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Display Lessons */}
                  {lessons.map((lesson) => {
                    const courtName = lesson.court_id 
                      ? (lesson.courts?.name || 'Teren necunoscut')
                      : 'Orice teren';
                    const trainerName = lesson.trainers?.name || lesson.trainer_name || 'Antrenor necunoscut';
                    const trainerPhone = lesson.trainers?.phone || lesson.trainer_phone;
                    return (
                      <div
                        key={lesson.id}
                        className="p-4 border-2 border-purple-300 bg-purple-50 rounded-md mb-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-purple-600 text-white">Lecție</Badge>
                              <p className="font-semibold text-zinc-900">
                                {lesson.start_time.substring(0, 5)} - {lesson.end_time.substring(0, 5)}
                              </p>
                            </div>
                            <p className="text-sm text-zinc-700 font-medium mb-1">
                              Antrenor: {trainerName}
                            </p>
                            {trainerPhone && (
                              <p className="text-sm text-zinc-600 mb-1">
                                Telefon: {trainerPhone}
                              </p>
                            )}
                            <p className="text-sm text-zinc-500">
                              {courtName} • {lesson.duration_minutes} min
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Display Memberships */}
                  {memberships.map((membership) => {
                    const courtName = membership.court_id 
                      ? (membership.courts?.name || 'Teren necunoscut')
                      : 'Orice teren';
                    return (
                      <div
                        key={`membership-${membership.id}`}
                        className="p-4 border-2 border-blue-300 bg-blue-50 rounded-md mb-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-blue-600 text-white">Abonament</Badge>
                              <p className="font-semibold text-zinc-900">
                                {membership.start_time.substring(0, 5)} - {membership.end_time.substring(0, 5)}
                              </p>
                            </div>
                            <p className="text-sm text-zinc-700 font-medium mb-1">
                              {membership.member_name}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {courtName}
                            </p>
                            {membership.notes && (
                              <p className="text-xs text-zinc-400 mt-1 italic">{membership.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Display Regular Bookings */}
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border border-zinc-200 rounded-md hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-zinc-900">
                              {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                            </p>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-600 mb-1">
                            {booking.profiles?.full_name || 'Utilizator'} • {booking.duration_minutes} min
                          </p>
                          {booking.courts && (
                            <p className="text-sm text-zinc-600">
                              Teren: {booking.courts.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200">
                        <span className={`text-sm ${
                          booking.payment_status === 'paid' 
                            ? 'text-emerald-600' 
                            : 'text-zinc-500'
                        }`}>
                          {booking.payment_status === 'paid' ? '✓ Plătit' : '⏳ Neplătit'}
                        </span>
                        <span className="font-bold text-lg text-zinc-900">
                          {booking.total_price} RON
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Field Info & Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informații Teren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-zinc-500">Nume</p>
                <p className="font-semibold">{currentField?.nume}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Sport</p>
                <p className="font-semibold">{currentField?.sport}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Locație
                </p>
                <p className="font-semibold">{currentField?.locatie}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acțiuni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`/admin/bookings?field=${selectedField}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Toate Rezervările
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`/admin/revenue?field=${selectedField}`}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Raport Venituri
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/admin/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Setări Teren
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Booking Modal */}
      {showAddBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Adaugă Rezervare Telefonică</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddBooking(false);
                    setNewBooking({
                      customerName: '',
                      customerPhone: '',
                      startTime: '',
                      duration: '1h',
                      courtId: null,
                      price: 0,
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">
                    Nume Client (opțional)
                  </label>
                  <input
                    type="text"
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ion Popescu"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">
                    Telefon Client (opțional)
                  </label>
                  <input
                    type="tel"
                    value={newBooking.customerPhone}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0712345678"
                  />
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">
                  Dată *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {bookingDate ? (
                        format(bookingDate, "PPP", { locale: ro })
                      ) : (
                        <span>Selectează o dată</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={bookingDate}
                      onSelect={(date) => {
                        if (date) {
                          setBookingDate(date);
                          // Clear selected time and court when date changes
                          setNewBooking(prev => ({
                            ...prev,
                            startTime: '',
                            courtId: null,
                            price: 0,
                          }));
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slot */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Ora Început *
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {timeSlots.map((slot) => {
                    // Check if slot is unavailable
                    let isDisabled = false;
                    let disabledReason = '';
                    
                    if (courts.length > 0) {
                      // For fields with courts, check if all courts are unavailable for this slot
                      if (newBooking.courtId) {
                        // If a court is selected, check if that specific court is unavailable
                        const courtUnavail = unavailableCourts.get(newBooking.courtId);
                        isDisabled = courtUnavail?.has(slot) || false;
                        disabledReason = isDisabled ? 'Terenul selectat este ocupat' : '';
                      } else {
                        // If no court selected yet, check if ALL courts are unavailable
                        const allCourtsUnavailable = courts.every(court => {
                          const courtUnavail = unavailableCourts.get(court.id);
                          return courtUnavail?.has(slot) || false;
                        });
                        isDisabled = allCourtsUnavailable || unavailableSlots.has(slot);
                        disabledReason = isDisabled ? 'Toate terenurile sunt ocupate' : '';
                      }
                    } else {
                      // For fields without courts, check general availability
                      isDisabled = unavailableSlots.has(slot);
                      disabledReason = isDisabled ? 'Interval ocupat' : '';
                    }
                    
                    return (
                      <Button
                        key={slot}
                        variant={newBooking.startTime === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (!isDisabled) {
                            setNewBooking(prev => ({ ...prev, startTime: slot }));
                          }
                        }}
                        disabled={isDisabled}
                        className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                        title={disabledReason}
                      >
                        {slot}
                      </Button>
                    );
                  })}
                </div>
                {courts.length > 0 && !newBooking.courtId && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Selectează un teren pentru a vedea disponibilitatea exactă
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Durată *
                </label>
                <div className="flex gap-2">
                  {[
                    { value: '1h' as const, label: '1h' },
                    { value: '1h30' as const, label: '1h 30min' },
                    { value: '2h' as const, label: '2h' },
                  ].map((interval) => (
                    <Button
                      key={interval.value}
                      variant={newBooking.duration === interval.value ? "default" : "outline"}
                      onClick={() => setNewBooking(prev => ({ ...prev, duration: interval.value }))}
                    >
                      {interval.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Court Selection (if applicable) */}
              {courts.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-2 block">
                    Teren *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {courts.map((court) => {
                      // Check if this court is unavailable for the selected time slot
                      const courtUnavail = unavailableCourts.get(court.id);
                      const isCourtUnavailable = newBooking.startTime 
                        ? (courtUnavail?.has(newBooking.startTime) || false)
                        : false;
                      
                      return (
                        <Button
                          key={court.id}
                          variant={newBooking.courtId === court.id ? "default" : "outline"}
                          onClick={() => {
                            if (!isCourtUnavailable || !newBooking.startTime) {
                              setNewBooking(prev => ({ ...prev, courtId: court.id }));
                            }
                          }}
                          disabled={isCourtUnavailable && newBooking.startTime !== ''}
                          className={isCourtUnavailable && newBooking.startTime ? "opacity-50 cursor-not-allowed" : ""}
                          title={isCourtUnavailable && newBooking.startTime ? `Teren ocupat la ${newBooking.startTime}` : ''}
                        >
                          {court.name}
                          {isCourtUnavailable && newBooking.startTime && (
                            <span className="ml-1 text-xs">🔒</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  {newBooking.startTime && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Terenurile ocupate la ora selectată sunt marcate cu 🔒
                    </p>
                  )}
                </div>
              )}

              {/* Price Display */}
              {newBooking.price > 0 && (
                <div className="p-4 bg-zinc-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700">Preț Total:</span>
                    <span className="text-2xl font-bold text-zinc-900">{newBooking.price.toFixed(0)} RON</span>
                  </div>
                  {newBooking.startTime === '22:00' && (
                    <p className="text-xs text-zinc-500 mt-1">Preț redus pentru ora 22:00</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddBooking(false);
                    setNewBooking({
                      customerName: '',
                      customerPhone: '',
                      startTime: '',
                      duration: '1h',
                      courtId: null,
                      price: 0,
                    });
                    setBookingDate(new Date());
                  }}
                  className="flex-1"
                >
                  Anulează
                </Button>
                <Button
                  onClick={handleCreateBooking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!bookingDate || !newBooking.startTime || !newBooking.duration || (courts.length > 0 && !newBooking.courtId)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Creează Rezervarea
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-zinc-900">
                  Adaugă Lecție
                </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddLesson(false);
                      setNewLesson({
                        trainerId: null,
                        startTime: '',
                        endTime: '',
                        courtId: null,
                      });
                      setLessonDate(new Date());
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Trainer Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700">
                    Antrenor *
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManageTrainers(true)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Gestionează Antrenori
                  </Button>
                </div>
                {trainers.length === 0 ? (
                  <div className="p-4 border border-zinc-300 rounded-md bg-zinc-50 text-center">
                    <p className="text-sm text-zinc-600 mb-2">Nu există antrenori adăugați.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManageTrainers(true)}
                    >
                      Adaugă Primul Antrenor
                    </Button>
                  </div>
                ) : (
                  <select
                    value={newLesson.trainerId || ''}
                    onChange={(e) => setNewLesson(prev => ({ ...prev, trainerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selectează un antrenor</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} {trainer.phone ? `(${trainer.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Data Lecției *
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {lessonDate ? format(lessonDate, "PPP", { locale: ro }) : <span>Alege o dată</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={lessonDate}
                      onSelect={(date) => date && setLessonDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Start Time */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Ora de Început *
                </label>
                <input
                  type="time"
                  value={newLesson.startTime}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Ora de Sfârșit *
                </label>
                <input
                  type="time"
                  value={newLesson.endTime}
                  onChange={(e) => setNewLesson(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Court Selection (if applicable) */}
              {courts.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-2 block">
                    Teren *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {courts.map((court) => {
                      const courtUnavail = unavailableCourts.get(court.id);
                      const isCourtUnavailable = newLesson.startTime 
                        ? (courtUnavail?.has(newLesson.startTime) || false)
                        : false;
                      
                      return (
                        <Button
                          key={court.id}
                          variant={newLesson.courtId === court.id ? "default" : "outline"}
                          onClick={() => {
                            if (!isCourtUnavailable || !newLesson.startTime) {
                              setNewLesson(prev => ({ ...prev, courtId: court.id }));
                            }
                          }}
                          disabled={false}
                          className=""
                          title=""
                        >
                          {court.name}
                          {isCourtUnavailable && newLesson.startTime && (
                            <span className="ml-1 text-xs">🔒</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddLesson(false);
                    setNewLesson({
                      trainerId: null,
                      startTime: '',
                      endTime: '',
                      courtId: null,
                    });
                    setLessonDate(new Date());
                  }}
                  className="flex-1"
                >
                  Anulează
                </Button>
                <Button
                  onClick={handleCreateLesson}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={!lessonDate || !newLesson.startTime || !newLesson.endTime || !newLesson.trainerId || (courts.length > 0 && !newLesson.courtId)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Creează Lecția
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage Trainers Modal */}
      {showManageTrainers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-zinc-900">
                  Gestionează Antrenori
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowManageTrainers(false);
                    setNewTrainer({
                      name: '',
                      phone: '',
                      email: '',
                      notes: '',
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Add New Trainer */}
              <div className="border-b border-zinc-200 pb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Adaugă Antrenor Nou</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">
                      Nume *
                    </label>
                    <input
                      type="text"
                      value={newTrainer.name}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Numele antrenorului"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={newTrainer.phone}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="07xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newTrainer.email}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">
                      Note
                    </label>
                    <input
                      type="text"
                      value={newTrainer.notes}
                      onChange={(e) => setNewTrainer(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Note suplimentare"
                    />
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    if (!selectedField || !newTrainer.name) {
                      alert('Te rugăm să completezi numele antrenorului.');
                      return;
                    }

                    const { error } = await supabase
                      .from('trainers')
                      .insert({
                        field_id: selectedField,
                        name: newTrainer.name,
                        phone: newTrainer.phone || null,
                        email: newTrainer.email || null,
                        notes: newTrainer.notes || null,
                      } as any);

                    if (error) {
                      console.error('Error creating trainer:', error);
                      alert('Eroare la crearea antrenorului: ' + error.message);
                      return;
                    }

                    // Refresh trainers
                    const { data: trainersData } = await supabase
                      .from('trainers')
                      .select('*')
                      .eq('field_id', selectedField)
                      .eq('is_active', true)
                      .order('name');

                    if (trainersData) {
                      setTrainers((trainersData || []) as Trainer[]);
                    }

                    setNewTrainer({
                      name: '',
                      phone: '',
                      email: '',
                      notes: '',
                    });
                  }}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  disabled={!newTrainer.name}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adaugă Antrenor
                </Button>
              </div>

              {/* Trainers List */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Antrenori Existenți</h3>
                {trainers.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">Nu există antrenori adăugați.</p>
                ) : (
                  <div className="space-y-2">
                    {trainers.map((trainer) => (
                      <div
                        key={trainer.id}
                        className="p-4 border border-zinc-200 rounded-md flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900">{trainer.name}</p>
                          {trainer.phone && (
                            <p className="text-sm text-zinc-600">Telefon: {trainer.phone}</p>
                          )}
                          {trainer.email && (
                            <p className="text-sm text-zinc-600">Email: {trainer.email}</p>
                          )}
                          {trainer.notes && (
                            <p className="text-sm text-zinc-500 italic">{trainer.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Ești sigur că vrei să ștergi antrenorul ${trainer.name}?`)) {
                              const { error } = await supabase
                                .from('trainers')
                                .update({ is_active: false })
                                .eq('id', trainer.id);

                              if (error) {
                                console.error('Error deleting trainer:', error);
                                alert('Eroare la ștergerea antrenorului: ' + error.message);
                                return;
                              }

                              // Refresh trainers
                              const { data: trainersData } = await supabase
                                .from('trainers')
                                .select('*')
                                .eq('field_id', selectedField)
                                .eq('is_active', true)
                                .order('name');

                              if (trainersData) {
                                setTrainers((trainersData || []) as Trainer[]);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
