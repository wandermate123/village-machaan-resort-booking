import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url' && supabaseAnonKey !== 'your_supabase_anon_key');

// Create client only if configured, otherwise use null
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role: 'admin' | 'manager' | 'staff';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
      };
      villas: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_price: number;
          max_guests: number;
          amenities: string[];
          images: string[];
          status: 'active' | 'inactive' | 'maintenance';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['villas']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['villas']['Insert']>;
      };
      packages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          inclusions: string[];
          price: number;
          duration: string | null;
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['packages']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['packages']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          booking_id: string;
          session_id: string | null;
          guest_name: string;
          email: string;
          phone: string;
          check_in: string;
          check_out: string;
          guests: number;
          villa_id: string;
          villa_name: string;
          villa_price: number;
          package_id: string | null;
          package_name: string | null;
          package_price: number;
          safari_requests: any[];
          safari_total: number;
          subtotal: number;
          taxes: number;
          total_amount: number;
          special_requests: string | null;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
          status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'completed' | 'no_show';
          payment_status: 'pending' | 'paid' | 'advance_paid' | 'failed' | 'refunded' | 'partial_refund';
          advance_amount: number;
          remaining_amount: number;
          advance_paid_at: string | null;
          advance_payment_method: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          payment_reference: string | null;
          admin_notes: string | null;
          verified_by: string | null;
          verification_date: string | null;
          verification_notes: string | null;
          booking_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      availability: {
        Row: {
          id: string;
          villa_id: string;
          date: string;
          is_available: boolean;
          price_override: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['availability']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['availability']['Insert']>;
      };
      pricing_rules: {
        Row: {
          id: string;
          villa_id: string;
          rule_name: string;
          rule_type: 'seasonal' | 'weekend' | 'holiday' | 'demand';
          start_date: string | null;
          end_date: string | null;
          price_modifier: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pricing_rules']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pricing_rules']['Insert']>;
      };
      booking_holds: {
        Row: {
          id: string;
          villa_id: string;
          check_in: string;
          check_out: string;
          session_id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['booking_holds']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['booking_holds']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          razorpay_payment_id: string;
          razorpay_order_id: string;
          amount: number;
          currency: string;
          status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
          method: string | null;
          gateway_response: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      email_logs: {
        Row: {
          id: string;
          booking_id: string | null;
          email_type: 'confirmation' | 'cancellation' | 'reminder' | 'admin_notification';
          recipient_email: string;
          subject: string;
          status: 'pending' | 'sent' | 'failed' | 'bounced';
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['email_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['email_logs']['Insert']>;
      };
      safari_queries: {
        Row: {
          id: string;
          booking_id: string | null;
          guest_name: string;
          email: string;
          phone: string | null;
          safari_option_id: string | null;
          safari_name: string;
          preferred_date: string | null;
          preferred_timing: string | null;
          number_of_persons: number;
          special_requirements: string | null;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          admin_notes: string | null;
          response: string | null;
          responded_at: string | null;
          responded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['safari_queries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['safari_queries']['Insert']>;
      };
      safari_options: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration: string | null;
          price_per_person: number;
          max_persons: number;
          images: string[];
          timings: any[];
          highlights: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['safari_options']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['safari_options']['Insert']>;
      };
    };
  };
}