import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

type SafariOption = Database['public']['Tables']['safari_options']['Row'];
type SafariBooking = Database['public']['Tables']['safari_bookings']['Row'];
type SafariBookingInsert = Database['public']['Tables']['safari_bookings']['Insert'];

// Demo safari data for when Supabase is not configured
const DEMO_SAFARI_OPTIONS: SafariOption[] = [
  {
    id: 'morning-wildlife-safari',
    name: 'Morning Wildlife Safari',
    description: 'An early morning safari with the first light of day, a memorable journey through the wild landscape where you will get to see the diverse fauna and flora of the region.',
    duration: '4 hours',
    price_per_person: 0,
    max_persons: 6,
    images: ['/images/safari/tiger-safari.jpg', '/images/safari/morning-safari-1.png', '/images/safari/morning-safari-2.png'],
    timings: [
      { value: 'early-morning', label: 'Early Morning (5:30 AM - 9:30 AM)' },
      { value: 'morning', label: 'Morning (6:00 AM - 10:00 AM)' }
    ],
    highlights: [
      'Safari duration: 4 hours with professional guide',
      'All safety equipment and refreshments included',
      'Best wildlife viewing opportunities in early morning',
      'Photography assistance and tips included'
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'evening-wildlife-safari',
    name: 'Evening Wildlife Safari',
    description: 'Take a walk through the afternoon - evening hours of the jungle, when the animals come out to drink water and the birds return to their nests, creating a magical atmosphere.',
    duration: '3.5 hours',
    price_per_person: 0,
    max_persons: 6,
    images: ['/images/safari/evening-safari-1.png', '/images/safari/evening-safari-2.png', '/images/safari/tiger-safari.jpg'],
    timings: [
      { value: 'afternoon', label: 'Afternoon (2:00 PM - 5:30 PM)' },
      { value: 'evening', label: 'Evening (4:00 PM - 7:30 PM)' }
    ],
    highlights: [
      'Safari duration: 3.5 hours with professional guide',
      'Perfect for bird watching and sunset photography',
      'Refreshments and safety equipment included',
      'Guided nature walk with expert naturalist'
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'night-wildlife-safari',
    name: 'Night Wildlife Safari',
    description: 'Experience the night safari with our specialized night vision equipment through the dark forest with expert naturalists. Discover nocturnal wildlife and enjoy the unique sounds of the jungle at night.',
    duration: '3 hours',
    price_per_person: 0,
    max_persons: 6,
    images: ['/images/safari/tiger-safari.jpg', '/images/safari/evening-safari-1.png', '/images/safari/morning-safari-1.png'],
    timings: [
      { value: 'night', label: 'Night (8:00 PM - 11:00 PM)' },
      { value: 'late-night', label: 'Late Night (9:00 PM - 12:00 AM)' }
    ],
    highlights: [
      'Night safari duration: 3 hours with specialized equipment',
      'Night vision equipment and safety gear provided',
      'Unique nocturnal wildlife viewing experience',
      'Expert guide with extensive night safari experience'
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class SafariService {
  // Get all active safari options
  static async getActiveSafariOptions(): Promise<SafariOption[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('📝 Using demo safari data (Supabase not configured)');
        return DEMO_SAFARI_OPTIONS;
      }

      try {
        const { data, error } = await supabase
          .from('safari_options')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (dbError) {
        console.log('📝 Database connection failed, using demo safari data');
        return DEMO_SAFARI_OPTIONS;
      }
    } catch (error) {
      ErrorHandler.logError(error, 'get_active_safari_options');
      console.log('📝 Falling back to demo safari data');
      return DEMO_SAFARI_OPTIONS;
    }
  }

  // Get all safari options (admin)
  static async getAllSafariOptions(): Promise<SafariOption[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('📝 Using demo safari data (Supabase not configured)');
        return DEMO_SAFARI_OPTIONS;
      }

      const { data, error } = await supabase
        .from('safari_options')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logError(error, 'get_all_safari_options');
      return DEMO_SAFARI_OPTIONS;
    }
  }

  // Get safari option by ID
  static async getSafariOptionById(id: string): Promise<SafariOption | null> {
    try {
      const { data, error } = await supabase
        .from('safari_options')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      ErrorHandler.logError(error, 'get_safari_option_by_id');
      return null;
    }
  }

  // Create safari booking
  static async createSafariBooking(bookingData: SafariBookingInsert): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('safari_bookings')
        .insert(bookingData);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Update safari option (admin)
  static async updateSafariOption(id: string, updates: Partial<SafariOption>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('safari_options')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Create new safari option (admin)
  static async createSafariOption(safariData: Omit<SafariOption, 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('safari_options')
        .insert(safariData);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Delete safari option (admin)
  static async deleteSafariOption(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('safari_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Get safari bookings for a booking
  static async getSafariBookingsByBookingId(bookingId: string): Promise<SafariBooking[]> {
    try {
      const { data, error } = await supabase
        .from('safari_bookings')
        .select(`
          *,
          safari_options (*)
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logError(error, 'get_safari_bookings_by_booking_id');
      return [];
    }
  }

  // Update safari booking status (admin)
  static async updateSafariBookingStatus(
    id: string, 
    status: 'inquiry' | 'confirmed' | 'cancelled' | 'completed',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (notes) {
        updateData.confirmation_notes = notes;
      }

      const { error } = await supabase
        .from('safari_bookings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }
}