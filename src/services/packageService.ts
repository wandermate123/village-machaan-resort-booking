import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

type Package = Database['public']['Tables']['packages']['Row'];
type PackageInsert = Database['public']['Tables']['packages']['Insert'];
type PackageUpdate = Database['public']['Tables']['packages']['Update'];

// Demo package data for when Supabase is not configured
const DEMO_PACKAGES: Package[] = [
  {
    id: 'basic-stay',
    name: 'Basic Stay Package',
    description: 'Comfortable accommodation with essential amenities. Perfect for guests who prefer to explore dining options outside the resort.',
    inclusions: [
      'Comfortable villa accommodation',
      'Daily housekeeping service',
      'Welcome refreshments on arrival',
      'Access to resort facilities',
      'Complimentary WiFi',
      '24/7 front desk assistance'
    ],
    price: 0,
    duration: 'Per night',
    images: ['/images/glass-cottage/main.jpg'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'breakfast-package',
    name: 'Breakfast Package',
    description: 'Includes daily breakfast with your stay. Start your day with a delicious meal featuring local and continental options.',
    inclusions: [
      'All Basic Stay Package amenities',
      'Daily breakfast for all guests',
      'Fresh local and continental options',
      'Special dietary accommodations',
      'Early morning tea/coffee service',
      'Seasonal fruit platter'
    ],
    price: 500,
    duration: 'Per night',
    images: ['/images/hornbill/main.jpg'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class PackageService {
  // Get all packages
  static async getAllPackages(): Promise<Package[]> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch packages: ${error.message}`);
      }
      
      // If no data in database, return demo data
      if (!data || data.length === 0) {
        console.log('📝 No packages in database, inserting demo data...');
        await this.insertDemoPackages();
        return DEMO_PACKAGES;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get all packages:', error);
      throw error;
    }
  }

  // Get active packages only
  static async getActivePackages(): Promise<Package[]> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) {
        throw new Error(`Failed to fetch active packages: ${error.message}`);
      }
      
      // If no data in database, return demo data
      if (!data || data.length === 0) {
        console.log('📝 No active packages in database, inserting demo data...');
        await this.insertDemoPackages();
        return DEMO_PACKAGES.filter(pkg => pkg.is_active);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get active packages:', error);
      throw error;
    }
  }

  // Insert demo packages if database is empty
  private static async insertDemoPackages(): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      console.log('➕ Inserting demo package data into Supabase...');
      
      const { error } = await supabase
        .from('packages')
        .insert(DEMO_PACKAGES);

      if (error) {
        console.error('❌ Failed to insert demo packages:', error);
      } else {
        console.log('✅ Demo packages inserted successfully');
      }
    } catch (error) {
      console.error('❌ Error inserting demo packages:', error);
    }
  }

  // Get package by ID
  static async getPackageById(id: string): Promise<Package | null> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch package: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get package by ID:', error);
      throw error;
    }
  }

  // Create new package
  static async createPackage(packageData: PackageInsert): Promise<{ success: boolean; package?: Package; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('packages')
        .insert(packageData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create package: ${error.message}`);
      }
      
      console.log('✅ Package created successfully:', data.id);
      return { success: true, package: data };
    } catch (error) {
      console.error('❌ Failed to create package:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create package';
      return { success: false, error: errorMessage };
    }
  }

  // Update package
  static async updatePackage(id: string, updates: PackageUpdate): Promise<{ success: boolean; package?: Package; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { data, error } = await supabase
        .from('packages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update package: ${error.message}`);
      }
      
      console.log('✅ Package updated successfully:', id);
      return { success: true, package: data };
    } catch (error) {
      console.error('❌ Failed to update package:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update package';
      return { success: false, error: errorMessage };
    }
  }

  // Delete package
  static async deletePackage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      // Check if package has any bookings
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('package_id', id)
        .limit(1);

      if (bookingError) {
        throw new Error(`Failed to check package bookings: ${bookingError.message}`);
      }

      if (bookings && bookings.length > 0) {
        return { success: false, error: 'Cannot delete package with existing bookings. Please update or cancel bookings first.' };
      }

      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete package: ${error.message}`);
      }
      
      console.log('✅ Package deleted successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete package:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete package';
      return { success: false, error: errorMessage };
    }
  }

  // Toggle package status
  static async togglePackageStatus(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      // First get current status
      const { data: pkg, error: fetchError } = await supabase
        .from('packages')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch package status: ${fetchError.message}`);
      }

      const newStatus = !pkg.is_active;

      const { error } = await supabase
        .from('packages')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to toggle package status: ${error.message}`);
      }
      
      console.log('✅ Package status toggled successfully:', id, 'to', newStatus);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to toggle package status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle package status';
      return { success: false, error: errorMessage };
    }
  }

  // Get package statistics
  static async getPackageStats(packageId?: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    popularityScore: number;
  }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      let query = supabase
        .from('bookings')
        .select('package_price, status, total_amount');

      if (packageId) {
        query = query.eq('package_id', packageId);
      } else {
        query = query.not('package_id', 'is', null);
      }

      const { data: bookings, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch package stats: ${error.message}`);
      }

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings
        ?.filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.package_price || 0), 0) || 0;

      const popularityScore = totalBookings > 0 ? Math.min(70 + totalBookings * 2, 95) : 0;

      return {
        totalBookings,
        totalRevenue,
        popularityScore: Math.round(popularityScore)
      };
    } catch (error) {
      console.error('❌ Failed to get package stats:', error);
      throw error;
    }
  }

  // Bulk update package status
  static async bulkUpdatePackageStatus(packageIds: string[], isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      const { error } = await supabase
        .from('packages')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .in('id', packageIds);

      if (error) {
        throw new Error(`Failed to bulk update package status: ${error.message}`);
      }
      
      console.log('✅ Bulk package status update successful:', packageIds.length, 'packages');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to bulk update package status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update package status';
      return { success: false, error: errorMessage };
    }
  }
}