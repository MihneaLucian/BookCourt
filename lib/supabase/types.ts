export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      fields: {
        Row: {
          id: string
          nume: string
          sport: string
          suprafata: string
          pret: number
          locatie: string
          imagine: string | null
          rating: number
          review_count: number
          is_active: boolean
          opening_time: string
          closing_time: string
          city: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nume: string
          sport: string
          suprafata: string
          pret: number
          locatie: string
          imagine?: string | null
          rating?: number
          review_count?: number
          is_active?: boolean
          opening_time?: string
          closing_time?: string
          city: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nume?: string
          sport?: string
          suprafata?: string
          pret?: number
          locatie?: string
          imagine?: string | null
          rating?: number
          review_count?: number
          is_active?: boolean
          opening_time?: string
          closing_time?: string
          city?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          field_id: string
          user_id: string
          booking_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          price_per_hour: number
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'unpaid' | 'paid' | 'refunded'
          payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_id: string
          user_id: string
          booking_date: string
          start_time: string
          end_time: string
          duration_minutes: 60 | 90 | 120
          price_per_hour: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'unpaid' | 'paid' | 'refunded'
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_id?: string
          user_id?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          duration_minutes?: 60 | 90 | 120
          price_per_hour?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'unpaid' | 'paid' | 'refunded'
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          field_id: string
          user_id: string
          booking_id: string | null
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_id: string
          user_id: string
          booking_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_id?: string
          user_id?: string
          booking_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      amenities: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string
        }
      }
      field_amenities: {
        Row: {
          field_id: string
          amenity_id: string
        }
        Insert: {
          field_id: string
          amenity_id: string
        }
        Update: {
          field_id?: string
          amenity_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
