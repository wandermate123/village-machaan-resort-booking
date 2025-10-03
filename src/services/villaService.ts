import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

type Villa = Database['public']['Tables']['villas']['Row'];
type VillaInsert = Database['public']['Tables']['villas']['Insert'];
type VillaUpdate = Database['public']['Tables']['villas']['Update'];

// Villa inventory configuration for unit counts
export const VILLA_INVENTORY = {
  'glass-cottage': { total: 14, type: 'cottage' },
  'hornbill-villa': { total: 4, type: 'villa' },
  'kingfisher-villa': { total: 4, type: 'villa' }
} as const;

// Demo villa data for when Supabase is not configured
const DEMO_VILLAS: Villa[] = [
  {
    id: 'glass-cottage',
    name: 'Glass Cottage',
    description: 'A unique eco-friendly cottage with glass walls offering panoramic forest views. Perfect for nature lovers seeking a modern yet sustainable retreat.',
    base_price: 15000,
    max_guests: 4,
    amenities: ['Forest View', 'Glass Walls', 'Eco-Friendly', 'Private Deck', 'Air Conditioning', 'Mini Bar'],
    images: ['/images/glass-cottage/main.jpg'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'hornbill-villa',
    name: 'Hornbill Villa',
    description: 'Spacious family villa with traditional architecture and modern amenities. Features a beautiful garden and outdoor seating area.',
    base_price: 18000,
    max_guests: 6,
    amenities: ['Garden View', 'Family Room', 'BBQ Area', 'Spacious Living', 'Modern Kitchen', 'Outdoor Seating'],
    images: ['/images/hornbill/main.png', '/images/hornbill/exterior.jpg', '/images/hornbill/garden.jpg'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'kingfisher-villa',
    name: 'Kingfisher Villa',
    description: 'Premium lakeside villa with private pool and butler service. The ultimate luxury experience with stunning lake views.',
    base_price: 22000,
    max_guests: 8,
    amenities: ['Lake View', 'Private Pool', 'Premium Suite', 'Butler Service', 'Jacuzzi', 'Wine Cellar'],
    images: ['/images/kingfisher/main.jpg'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class VillaService {
  // Get all villas
  static async getAllVillas(): Promise<Villa[]> {
    try {
      if (!isSupabaseConfigured) {
        console.log('📝 Supabase not configured, using demo villa data');
        return DEMO_VILLAS;
      }

      console.log('🔍 Fetching all villas from Supabase...');
      
      const { data, error } = await supabase
        .from('villas')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Supabase query failed:', error);
        throw new Error(`Failed to fetch villas: ${error.message}`);
      }
      
      // If no data in database, return demo data
      if (!data || data.length === 0) {
        console.log('📝 No villas in database, inserting demo data...');
        await this.insertDemoVillas();
        // Fetch again after inserting demo data
        const { data: newData, error: newError } = await supabase
          .from('villas')
          .select('*')
          .order('name');
        
        if (newError) {
          throw new Error(`Failed to fetch villas after demo insert: ${newError.message}`);
        }
        
        return DEMO_VILLAS;
      }
      
      console.log('✅ Successfully fetched', data.length, 'villas from Supabase');
      return data;
    } catch (error) {
      console.error('❌ Failed to get all villas:', error);
      throw error;
    }
  }

  // Get active villas only
  static async getActiveVillas(): Promise<Villa[]> {
    try {
      if (!isSupabaseConfigured) {
        console.log('📝 Supabase not configured, using demo villa data');
        return DEMO_VILLAS.filter(villa => villa.status === 'active');
      }

      const { data, error } = await supabase
        .from('villas')
        .select('*')
        .eq('status', 'active')
        .order('base_price');

      if (error) {
        throw new Error(`Failed to fetch active villas: ${error.message}`);
      }
      
      // If no data in database, return demo data
      if (!data || data.length === 0) {
        console.log('📝 No active villas in database, inserting demo data...');
        await this.insertDemoVillas();
        return DEMO_VILLAS.filter(villa => villa.status === 'active');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get active villas:', error);
      throw error;
    }
  }

  // Insert demo villas if database is empty
  private static async insertDemoVillas(): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      console.log('➕ Inserting demo villa data into Supabase...');
      
      const { error } = await supabase
        .from('villas')
        .insert(DEMO_VILLAS);

      if (error) {
        console.error('❌ Failed to insert demo villas:', error);
        // Don't throw here, just log the error
      } else {
        console.log('✅ Demo villas inserted successfully');
      }
    } catch (error) {
      console.error('❌ Error inserting demo villas:', error);
    }
  }

  // Get villa by ID
  static async getVillaById(id: string): Promise<Villa | null> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('villas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Villa not found:', id);
          return null;
        }
        throw new Error(`Failed to fetch villa: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get villa by ID:', error);
      throw error;
    }
  }

  // Create new villa
  static async createVilla(villaData: VillaInsert): Promise<{ success: boolean; villa?: Villa; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('villas')
        .insert(villaData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create villa: ${error.message}`);
      }
      
      console.log('✅ Villa created successfully:', data.id);
      return { success: true, villa: data };
    } catch (error) {
      console.error('❌ Failed to create villa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create villa';
      return { success: false, error: errorMessage };
    }
  }

  // Update villa
  static async updateVilla(id: string, updates: VillaUpdate): Promise<{ success: boolean; villa?: Villa; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('villas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update villa: ${error.message}`);
      }
      
      console.log('✅ Villa updated successfully:', id);
      return { success: true, villa: data };
    } catch (error) {
      console.error('❌ Failed to update villa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update villa';
      return { success: false, error: errorMessage };
    }
  }

  // Delete villa
  static async deleteVilla(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      // Check if villa has any bookings
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('villa_id', id)
        .limit(1);

      if (bookingError) {
        throw new Error(`Failed to check villa bookings: ${bookingError.message}`);
      }

      if (bookings && bookings.length > 0) {
        return { success: false, error: 'Cannot delete villa with existing bookings. Please cancel or complete all bookings first.' };
      }

      const { error } = await supabase
        .from('villas')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete villa: ${error.message}`);
      }
      
      console.log('✅ Villa deleted successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete villa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete villa';
      return { success: false, error: errorMessage };
    }
  }

  // Toggle villa status
  static async toggleVillaStatus(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      // First get current status
      const { data: villa, error: fetchError } = await supabase
        .from('villas')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch villa status: ${fetchError.message}`);
      }

      const newStatus = villa.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('villas')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to toggle villa status: ${error.message}`);
      }
      
      console.log('✅ Villa status toggled successfully:', id, 'to', newStatus);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to toggle villa status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle villa status';
      return { success: false, error: errorMessage };
    }
  }

  // Get villa statistics
  static async getVillaStats(villaId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    avgBookingValue: number;
  }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('total_amount, villa_price, status, payment_status, check_in, check_out')
        .eq('villa_id', villaId);

      if (error) {
        throw new Error(`Failed to fetch villa bookings: ${error.message}`);
      }

      const totalBookings = bookings?.length || 0;
      const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
      const totalRevenue = paidBookings.reduce((sum, b) => sum + b.total_amount, 0);
      const avgBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;

      // Calculate occupancy rate for current month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
      
      const monthlyBookings = bookings?.filter(b => 
        b.check_in >= startOfMonth && 
        b.check_out <= endOfMonth && 
        b.status !== 'cancelled'
      ) || [];

      const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const totalAvailableNights = totalUnits * daysInMonth;
      
      let occupiedNights = 0;
      monthlyBookings.forEach(booking => {
        const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
        occupiedNights += nights;
      });

      const occupancyRate = totalAvailableNights > 0 ? (occupiedNights / totalAvailableNights) * 100 : 0;

      return {
        totalBookings,
        totalRevenue,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        avgBookingValue: Math.round(avgBookingValue)
      };
    } catch (error) {
      console.error('❌ Failed to get villa stats:', error);
      throw error;
    }
  }

  // Get villa inventory
  static async getVillaInventory(villaId: string): Promise<any[]> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('villa_inventory')
        .select('*')
        .eq('villa_id', villaId)
        .order('unit_number');

      if (error) {
        throw new Error(`Failed to fetch villa inventory: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get villa inventory:', error);
      throw error;
    }
  }

  // Update villa pricing
  static async updateVillaPricing(villaId: string, newPrice: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { error } = await supabase
        .from('villas')
        .update({ 
          base_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', villaId);

      if (error) {
        throw new Error(`Failed to update villa pricing: ${error.message}`);
      }
      
      console.log('✅ Villa pricing updated successfully:', villaId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update villa pricing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update villa pricing';
      return { success: false, error: errorMessage };
    }
  }

  // Bulk update villa status
  static async bulkUpdateVillaStatus(villaIds: string[], status: 'active' | 'inactive' | 'maintenance'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { error } = await supabase
        .from('villas')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', villaIds);

      if (error) {
        throw new Error(`Failed to bulk update villa status: ${error.message}`);
      }
      
      console.log('✅ Bulk villa status update successful:', villaIds.length, 'villas');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to bulk update villa status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update villa status';
      return { success: false, error: errorMessage };
    }
  }
}