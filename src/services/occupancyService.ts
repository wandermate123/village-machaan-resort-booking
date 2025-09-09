import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

export interface VillaOccupancyData {
  villa_id: string;
  villa_name: string;
  total_units: number;
  occupied_units: number;
  available_units: number;
  occupancy_rate: number;
  rooms: {
    room_number: string;
    status: 'occupied' | 'available' | 'maintenance';
    guest_name?: string;
    booking_id?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
    email?: string;
    phone?: string;
  }[];
  bookings: {
    booking_id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    guests: number;
    status: string;
    email?: string;
    phone?: string;
    unit_number?: string;
  }[];
}

export interface OccupancyStats {
  total_units: number;
  occupied_units: number;
  available_units: number;
  occupancy_rate: number;
}

// Villa inventory configuration
const VILLA_CONFIG = {
  'hornbill-villa': { name: 'Hornbill Villa', total: 4, type: 'villa' },
  'kingfisher-villa': { name: 'Kingfisher Villa', total: 4, type: 'villa' },
  'glass-cottage': { name: 'Glass Cottage', total: 14, type: 'cottage' }
};

export class OccupancyService {
  // Get occupancy data for all villas on a specific date
  static async getOccupancyForDate(date: string): Promise<VillaOccupancyData[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return this.getDemoOccupancyData(date);
      }

      const villaData: VillaOccupancyData[] = [];

      // Process each villa
      for (const [villaId, config] of Object.entries(VILLA_CONFIG)) {
        try {
          // Get total units for this villa
          const totalUnits = await this.getVillaTotalUnits(villaId);
          
          // Get occupied units from bookings
          const occupiedUnits = await this.getOccupiedUnitsForVilla(villaId, date);
          
          // Get booking details
          const bookings = await this.getBookingsForVilla(villaId, date);
          
          // Get room-wise occupancy data
          const rooms = await this.getRoomWiseOccupancy(villaId, date, totalUnits);
          
          const availableUnits = Math.max(0, totalUnits - occupiedUnits);
          const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

          villaData.push({
            villa_id: villaId,
            villa_name: config.name,
            total_units: totalUnits,
            occupied_units: occupiedUnits,
            available_units: availableUnits,
            occupancy_rate: occupancyRate,
            rooms: rooms,
            bookings: bookings
          });
        } catch (error) {
          console.error(`Error processing villa ${villaId}:`, error);
          // Add fallback data for this villa
          const roomNumbers = this.generateRoomNumbers(villaId, config.total);
          const rooms = roomNumbers.map(roomNumber => ({
            room_number: roomNumber,
            status: 'available' as const
          }));
          
          villaData.push({
            villa_id: villaId,
            villa_name: config.name,
            total_units: config.total,
            occupied_units: 0,
            available_units: config.total,
            occupancy_rate: 0,
            rooms: rooms,
            bookings: []
          });
        }
      }

      console.log('📊 Occupancy data loaded:', villaData);
      return villaData;
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      return this.getDemoOccupancyData(date);
    }
  }

  // Get total units for a villa
  private static async getVillaTotalUnits(villaId: string): Promise<number> {
    try {
      // First try to get from villa_inventory table
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('villa_inventory')
        .select('id')
        .eq('villa_id', villaId)
        .eq('status', 'available');

      if (!inventoryError && inventoryData) {
        return inventoryData.length;
      }

      // Fallback to hardcoded values
      return VILLA_CONFIG[villaId as keyof typeof VILLA_CONFIG]?.total || 1;
    } catch (error) {
      console.warn(`Could not get total units for ${villaId}, using fallback`);
      return VILLA_CONFIG[villaId as keyof typeof VILLA_CONFIG]?.total || 1;
    }
  }

  // Get occupied units for a villa on a specific date
  private static async getOccupiedUnitsForVilla(villaId: string, date: string): Promise<number> {
    try {
      // Get from bookings table (main source of truth)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('villa_id', villaId)
        .lte('check_in', date)
        .gte('check_out', date)
        .neq('status', 'cancelled')
        .neq('payment_status', 'failed');

      if (bookingsError) throw bookingsError;
      return bookings?.length || 0;
    } catch (error) {
      console.warn(`Could not get occupied units for ${villaId}, using fallback`);
      return 0;
    }
  }

  // Get booking details for a villa on a specific date
  private static async getBookingsForVilla(villaId: string, date: string) {
    try {
      // Get from bookings table (main source of truth)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          guest_name,
          check_in,
          check_out,
          guests,
          status,
          email,
          phone
        `)
        .eq('villa_id', villaId)
        .lte('check_in', date)
        .gte('check_out', date)
        .neq('status', 'cancelled')
        .neq('payment_status', 'failed');

      if (bookingsError) throw bookingsError;
      
      return (bookings || []).map(booking => ({
        booking_id: booking.booking_id,
        guest_name: booking.guest_name,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        status: booking.status,
        email: booking.email,
        phone: booking.phone,
        unit_number: this.generateUnitNumber(villaId, booking.booking_id)
      }));
    } catch (error) {
      console.warn(`Could not get bookings for ${villaId}, using fallback`);
      return [];
    }
  }

  // Get room-wise occupancy data
  private static async getRoomWiseOccupancy(villaId: string, date: string, totalUnits: number) {
    try {
      // Get all bookings for this villa on this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          guest_name,
          check_in,
          check_out,
          guests,
          status,
          email,
          phone
        `)
        .eq('villa_id', villaId)
        .lte('check_in', date)
        .gte('check_out', date)
        .neq('status', 'cancelled')
        .neq('payment_status', 'failed');

      if (bookingsError) throw bookingsError;

      // Generate room numbers for this villa
      const roomNumbers = this.generateRoomNumbers(villaId, totalUnits);
      
      // Create room occupancy data
      const rooms = roomNumbers.map((roomNumber, index) => {
        // Find booking for this room (assign rooms based on booking order)
        const booking = bookings && bookings[index] ? bookings[index] : null;
        
        if (booking) {
          return {
            room_number: roomNumber,
            status: 'occupied' as const,
            guest_name: booking.guest_name,
            booking_id: booking.booking_id,
            check_in: booking.check_in,
            check_out: booking.check_out,
            guests: booking.guests,
            email: booking.email,
            phone: booking.phone
          };
        } else {
          return {
            room_number: roomNumber,
            status: 'available' as const
          };
        }
      });

      return rooms;
    } catch (error) {
      console.warn(`Could not get room-wise occupancy for ${villaId}, using fallback`);
      // Fallback: generate empty rooms
      const roomNumbers = this.generateRoomNumbers(villaId, totalUnits);
      return roomNumbers.map(roomNumber => ({
        room_number: roomNumber,
        status: 'available' as const
      }));
    }
  }

  // Generate room numbers for a villa
  private static generateRoomNumbers(villaId: string, totalUnits: number): string[] {
    const roomNumbers: string[] = [];
    
    for (let i = 1; i <= totalUnits; i++) {
      switch (villaId) {
        case 'glass-cottage':
          roomNumbers.push(`GC-${i.toString().padStart(2, '0')}`);
          break;
        case 'hornbill-villa':
          roomNumbers.push(`HV-${i.toString().padStart(2, '0')}`);
          break;
        case 'kingfisher-villa':
          roomNumbers.push(`KF-${i.toString().padStart(2, '0')}`);
          break;
        default:
          roomNumbers.push(`R-${i.toString().padStart(2, '0')}`);
      }
    }
    
    return roomNumbers;
  }

  // Generate unit number for fallback
  private static generateUnitNumber(villaId: string, bookingId: string): string {
    const hash = bookingId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const totalUnits = VILLA_CONFIG[villaId as keyof typeof VILLA_CONFIG]?.total || 1;
    const unitNum = Math.abs(hash % totalUnits) + 1;
    
    switch (villaId) {
      case 'glass-cottage': return `GC-${unitNum.toString().padStart(2, '0')}`;
      case 'hornbill-villa': return `HV-${unitNum.toString().padStart(2, '0')}`;
      case 'kingfisher-villa': return `KF-${unitNum.toString().padStart(2, '0')}`;
      default: return `U-${unitNum}`;
    }
  }

  // Get demo data for when Supabase is not available
  private static getDemoOccupancyData(date: string): VillaOccupancyData[] {
    const villaData: VillaOccupancyData[] = [];
    
    for (const [villaId, config] of Object.entries(VILLA_CONFIG)) {
      const occupiedUnits = Math.floor(Math.random() * Math.min(3, config.total));
      const availableUnits = config.total - occupiedUnits;
      const occupancyRate = Math.round((occupiedUnits / config.total) * 100);

      // Generate room numbers
      const roomNumbers = this.generateRoomNumbers(villaId, config.total);
      const rooms = roomNumbers.map((roomNumber, index) => {
        if (index < occupiedUnits) {
          return {
            room_number: roomNumber,
            status: 'occupied' as const,
            guest_name: `Demo Guest ${index + 1}`,
            booking_id: `demo-${villaId}-${index + 1}`,
            check_in: date,
            check_out: new Date(Date.now() + 86400000 * (index + 1)).toISOString().split('T')[0],
            guests: Math.floor(Math.random() * 4) + 1,
            email: `guest${index + 1}@example.com`,
            phone: `+123456789${index}`
          };
        } else {
          return {
            room_number: roomNumber,
            status: 'available' as const
          };
        }
      });

      villaData.push({
        villa_id: villaId,
        villa_name: config.name,
        total_units: config.total,
        occupied_units: occupiedUnits,
        available_units: availableUnits,
        occupancy_rate: occupancyRate,
        rooms: rooms,
        bookings: this.generateDemoBookings(villaId, occupiedUnits)
      });
    }

    return villaData;
  }

  // Generate demo bookings
  private static generateDemoBookings(villaId: string, count: number) {
    const bookings = [];
    for (let i = 0; i < count; i++) {
      bookings.push({
        booking_id: `demo-${villaId}-${i + 1}`,
        guest_name: `Guest ${i + 1}`,
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 86400000 * (i + 1)).toISOString().split('T')[0],
        guests: Math.floor(Math.random() * 4) + 1,
        status: 'confirmed',
        unit_number: this.generateUnitNumber(villaId, `demo-${i + 1}`)
      });
    }
    return bookings;
  }

  // Get overall occupancy statistics
  static async getOverallStats(date: string): Promise<OccupancyStats> {
    try {
      const villaData = await this.getOccupancyForDate(date);
      
      const totalUnits = villaData.reduce((sum, villa) => sum + villa.total_units, 0);
      const occupiedUnits = villaData.reduce((sum, villa) => sum + villa.occupied_units, 0);
      const availableUnits = totalUnits - occupiedUnits;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      return {
        total_units: totalUnits,
        occupied_units: occupiedUnits,
        available_units: availableUnits,
        occupancy_rate: occupancyRate
      };
    } catch (error) {
      console.error('Error getting overall stats:', error);
      return {
        total_units: 22, // Total across all villas
        occupied_units: 0,
        available_units: 22,
        occupancy_rate: 0
      };
    }
  }

  // Get weekly occupancy data
  static async getWeeklyOccupancy(startDate: string): Promise<VillaOccupancyData[][]> {
    const weeklyData: VillaOccupancyData[][] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = await this.getOccupancyForDate(dateStr);
      weeklyData.push(dayData);
    }

    return weeklyData;
  }

  // Get monthly occupancy data
  static async getMonthlyOccupancy(year: number, month: number): Promise<VillaOccupancyData[][]> {
    const monthlyData: VillaOccupancyData[][] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = await this.getOccupancyForDate(dateStr);
      monthlyData.push(dayData);
    }

    return monthlyData;
  }
}
