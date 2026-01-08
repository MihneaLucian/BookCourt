// Data utilities for Supabase
import { createClient } from './supabase/server';
import { Database } from './supabase/types';

type Field = Database['public']['Tables']['fields']['Row'];

// Transform Supabase field to match our interface
export interface Teren {
  id: string;
  nume: string;
  sport: string;
  suprafata: string;
  pret: number;
  locatie: string;
  imagine: string | null;
  liber: boolean;
  rating?: number;
  reviewCount?: number;
}

// Convert database field to Teren interface
function fieldToTeren(field: Field): Teren {
  return {
    id: field.id,
    nume: field.nume,
    sport: field.sport,
    suprafata: field.suprafata,
    pret: Number(field.pret),
    locatie: field.locatie,
    imagine: field.imagine,
    liber: true, // We'll calculate this based on bookings
    rating: field.rating ? Number(field.rating) : undefined,
    reviewCount: field.review_count,
  };
}

// Get all fields (optional: filter by city)
export async function getAllFields(city?: string): Promise<Teren[]> {
  const supabase = await createClient();
  let query = supabase
    .from('fields')
    .select('*')
    .eq('is_active', true);

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  const { data, error } = await query.order('nume');

  if (error) {
    console.error('Error fetching fields:', error);
    return [];
  }

  return (data || []).map(fieldToTeren);
}

// Get field by ID
export async function getTerenById(id: string): Promise<Teren | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching field:', error);
    return null;
  }

  return data ? fieldToTeren(data) : null;
}

// Check if field is available for a specific date and time
export async function isFieldAvailable(
  fieldId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('field_id', fieldId)
    .eq('booking_date', date)
    .eq('status', 'confirmed')
    .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
    .limit(1);

  if (error) {
    console.error('Error checking availability:', error);
    return false;
  }

  return !data || data.length === 0;
}
