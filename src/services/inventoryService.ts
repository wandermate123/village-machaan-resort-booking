import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';
import { VILLA_INVENTORY } from './villaService';

export interface VillaUnit {
  id: string;
  villa_id: string;
  unit_number: string;
  room_type: string;
  floor: number;
  view_type: string | null;
  status: 'available' | 'maintenance' | 'out_of_order';
  amenities: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingUnit {
  id: string;
  booking_id: string;
  villa_inventory_id: string;
  check_in: string;
  check_out: string;
  status: 'reserved' | 'occupied' | 'checked_out' | 'cancelled';
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryBlock {
  id: string;
  villa_inventory_id: string;
  block_date: string;
  block_type: 'maintenance' | 'owner_use' | 'seasonal_closure' | 'deep_cleaning';
  notes: string | null;
  created_at: string;
}

export interface OccupancyData {
  villa_id: string;
  villa_name: string;
  unit_number: string;
  guest_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  booking_id: string;
  status: string;
}

export class InventoryService {
  // Get all villa units
  static async getVillaUnits(villaId?: string): Promise<VillaUnit[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Return demo inventory
        if (villaId) {
          const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
          return Array.from({ length: totalUnits }, (_, i) => ({
            id: `${villaId}-unit-${i + 1}`,
            villa_id: villaId,
            unit_number: `${villaId.split('-')[0].toUpperCase()}-${(i + 1).toString().padStart(2, '0')}`,
            room_type: VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.type || 'room',
            floor: Math.floor(i / 4) + 1,
            view_type: i % 2 === 0 ? 'Forest View' : 'Garden View',
            status: 'available',
            amenities: ['Air Conditioning', 'WiFi'],
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
        }
        
        // Return all demo units
        const allUnits: VillaUnit[] = [];
        Object.keys(VILLA_INVENTORY).forEach(villaId => {
          const units = this.getVillaUnits(villaId);
          allUnits.push(...units);
        });
        return allUnits;
      }

      let query = supabase
        .from('villa_inventory')
        .select('*')
        .order('unit_number');

      if (villaId) {
        query = query.eq('villa_id', villaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VillaUnit[];
    } catch (error) {
      console.error('Error fetching villa units:', error);
      return [];
    }
  }

  // Get available units for a date range
  static async getAvailableUnits(villaId: string, checkIn: string, checkOut: string) {
    try {
      // Get total units for this villa from inventory config
      const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
      
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode - simulate some bookings
        const simulatedBookings = Math.floor(Math.random() * Math.min(3, totalUnits));
        return {
          availableUnits: Math.max(0, totalUnits - simulatedBookings),
          totalUnits
        };
      }

      // Count overlapping bookings
      const { data: overlappingBookings, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('villa_id', villaId)
        .neq('status', 'cancelled')
        .neq('payment_status', 'failed')
        .or(`and(check_in.lte.${checkIn},check_out.gt.${checkIn}),and(check_in.lt.${checkOut},check_out.gte.${checkOut}),and(check_in.gte.${checkIn},check_out.lte.${checkOut})`);

      if (error) throw error;

      const bookedUnits = overlappingBookings?.length || 0;
      const availableUnits = Math.max(0, totalUnits - bookedUnits);
      
      return {
        availableUnits,
        totalUnits
      };
    } catch (error) {
      ErrorHandler.logError(error, 'get_available_units');
      // Return fallback data
      const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
      return {
        availableUnits: Math.floor(totalUnits * 0.7),
        totalUnits
      };
    }
  }

  // Get current occupancy
  static async getCurrentOccupancy(): Promise<OccupancyData[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          guest_name,
          email,
          phone,
          check_in,
          check_out,
          guests,
          status,
          villa_id,
          villa_name
        `)
        .lte('check_in', today)
        .gte('check_out', today)
        .neq('status', 'cancelled')
        .neq('status', 'no_show');

      if (error) throw error;

      return (bookings || []).map(booking => ({
        villa_id: booking.villa_id,
        villa_name: booking.villa_name,
        unit_number: this.generateUnitNumber(booking.villa_id, booking.booking_id),
        guest_name: booking.guest_name,
        email: booking.email,
        phone: booking.phone,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        booking_id: booking.booking_id,
        status: booking.status
      }));
    } catch (error) {
      console.error('Error fetching current occupancy:', error);
      return [];
    }
  }

  // Get occupancy for date range
  static async getOccupancyForDates(startDate: string, endDate: string): Promise<OccupancyData[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          guest_name,
          email,
          phone,
          check_in,
          check_out,
          guests,
          status,
          villa_id,
          villa_name
        `)
        .or(`and(check_in.lte.${endDate},check_out.gt.${startDate})`)
        .neq('status', 'cancelled')
        .neq('status', 'no_show');

      if (error) throw error;

      return (bookings || []).map(booking => ({
        villa_id: booking.villa_id,
        villa_name: booking.villa_name,
        unit_number: this.generateUnitNumber(booking.villa_id, booking.booking_id),
        guest_name: booking.guest_name,
        email: booking.email,
        phone: booking.phone,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        booking_id: booking.booking_id,
        status: booking.status
      }));
    } catch (error) {
      console.error('Error fetching occupancy for dates:', error);
      return [];
    }
  }

  // Generate consistent unit numbers
  private static generateUnitNumber(villaId: string, bookingId: string): string {
    const hash = bookingId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
    const unitNum = Math.abs(hash % totalUnits) + 1;
    
    switch (villaId) {
      case 'glass-cottage': return `GC-${unitNum.toString().padStart(2, '0')}`;
      case 'hornbill-villa': return `HV-${unitNum.toString().padStart(2, '0')}`;
      case 'kingfisher-villa': return `KV-${unitNum.toString().padStart(2, '0')}`;
      default: return `U-${unitNum}`;
    }
  }

  // Block unit for maintenance
  static async blockUnit(
    villaInventoryId: string, 
    blockDate: string, 
    blockType: 'maintenance' | 'owner_use' | 'seasonal_closure' | 'deep_cleaning', 
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured. Please connect to Supabase first.' };
      }

      const { data, error } = await supabase
        .from('inventory_blocks')
        .insert({
          villa_inventory_id: villaInventoryId,
          block_date: blockDate,
          block_type: blockType,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Unit blocked successfully:', villaInventoryId, 'for', blockDate);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to block unit:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Update unit status
  static async updateUnitStatus(
    unitId: string, 
    status: 'available' | 'maintenance' | 'out_of_order'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured. Please connect to Supabase first.' };
      }

      const { data, error } = await supabase
        .from('villa_inventory')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Unit status updated successfully:', unitId, 'to', status);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update unit status:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Get occupancy statistics
  static async getOccupancyStats(date: string): Promise<{
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Return demo stats
        const total = 22; // Total units across all villas
        const occupied = Math.floor(Math.random() * 15) + 5;
        return {
          total,
          occupied,
          available: total - occupied,
          occupancyRate: Math.round((occupied / total) * 100)
        };
      }

      // Get total units
      const { data: totalUnits, error: unitsError } = await supabase
        .from('villa_inventory')
        .select('id')
        .eq('status', 'available');

      if (unitsError) throw unitsError;

      // Get occupied units for the date
      const { data: occupiedUnits, error: occupiedError } = await supabase
        .from('booking_units')
        .select('villa_inventory_id')
        .lte('check_in', date)
        .gte('check_out', date)
        .in('status', ['reserved', 'occupied']);

      if (occupiedError) throw occupiedError;

      const total = totalUnits?.length || 0;
      const occupied = occupiedUnits?.length || 0;
      const available = total - occupied;
      const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

      return {
        total,
        occupied,
        available,
        occupancyRate
      };
    } catch (error) {
      console.error('Error fetching occupancy stats:', error);
      return {
        total: 0,
        occupied: 0,
        available: 0,
        occupancyRate: 0
      };
    }
  }

  // Get villa inventory for admin
  static async getVillaInventory(villaId: string): Promise<VillaUnit[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Return demo inventory
        const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
        return Array.from({ length: totalUnits }, (_, i) => ({
          id: `${villaId}-unit-${i + 1}`,
          villa_id: villaId,
          unit_number: `${villaId.split('-')[0].toUpperCase()}-${(i + 1).toString().padStart(2, '0')}`,
          room_type: VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.type || 'room',
          floor: Math.floor(i / 4) + 1,
          view_type: i % 2 === 0 ? 'Forest View' : 'Garden View',
          status: 'available',
          amenities: ['Air Conditioning', 'WiFi'],
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      const { data, error } = await supabase
        .from('villa_inventory')
        .select('*')
        .eq('villa_id', villaId)
        .order('unit_number');

      if (error) throw error;
      return data as VillaUnit[];
    } catch (error) {
      console.error('Error fetching villa inventory:', error);
      return [];
    }
  }

  // Create villa inventory unit
  static async createVillaUnit(unitData: Omit<VillaUnit, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured. Please connect to Supabase first.' };
      }

      const { error } = await supabase
        .from('villa_inventory')
        .insert(unitData);

      if (error) throw error;
      
      console.log('✅ Villa unit created successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to create villa unit:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Update villa unit
  static async updateVillaUnit(unitId: string, updates: Partial<VillaUnit>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured. Please connect to Supabase first.' };
      }

      const { error } = await supabase
        .from('villa_inventory')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', unitId);

      if (error) throw error;
      
      console.log('✅ Villa unit updated successfully:', unitId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update villa unit:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Delete villa unit
  static async deleteVillaUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured. Please connect to Supabase first.' };
      }

      // Check if unit has any active bookings
      const { data: activeBookings, error: bookingError } = await supabase
        .from('booking_units')
        .select('id')
        .eq('villa_inventory_id', unitId)
        .in('status', ['reserved', 'occupied'])
        .limit(1);

      if (bookingError) throw bookingError;

      if (activeBookings && activeBookings.length > 0) {
        return { success: false, error: 'Cannot delete unit with active bookings' };
      }

      const { error } = await supabase
        .from('villa_inventory')
        .delete()
        .eq('id', unitId);

      if (error) throw error;
      
      console.log('✅ Villa unit deleted successfully:', unitId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete villa unit:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }
}