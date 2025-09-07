import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { VILLA_INVENTORY } from './villaService';

export interface SimpleOccupancyData {
  date: string;
  villa_id: string;
  villa_name: string;
  total_units: number;
  occupied_units: number;
  available_units: number;
  occupancy_rate: number;
  bookings: {
    booking_id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    guests: number;
    status: string;
  }[];
}

export class SimpleOccupancyService {
  // Get occupancy for a specific date range
  static async getOccupancyForDateRange(startDate: string, endDate: string): Promise<SimpleOccupancyData[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return this.getDemoOccupancyData(startDate, endDate);
      }

      // Get all bookings in the date range
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          villa_id,
          villa_name,
          guest_name,
          check_in,
          check_out,
          guests,
          status,
          payment_status
        `)
        .or(`and(check_in.lte.${endDate},check_out.gt.${startDate})`)
        .neq('status', 'cancelled')
        .neq('payment_status', 'failed')
        .order('check_in');

      if (error) throw error;

      // Generate date range
      const dates = this.generateDateRange(startDate, endDate);
      const occupancyData: SimpleOccupancyData[] = [];

      for (const date of dates) {
        for (const villaId of Object.keys(VILLA_INVENTORY)) {
          const villaName = this.getVillaName(villaId);
          const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
          
          // Find bookings that are active on this date for this villa
          const activeBookings = (bookings || []).filter(booking => {
            return booking.villa_id === villaId &&
                   this.isDateInRange(date, booking.check_in, booking.check_out);
          });

          const occupiedUnits = activeBookings.length;
          const availableUnits = Math.max(0, totalUnits - occupiedUnits);
          const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

          occupancyData.push({
            date,
            villa_id: villaId,
            villa_name: villaName,
            total_units: totalUnits,
            occupied_units: occupiedUnits,
            available_units: availableUnits,
            occupancy_rate: occupancyRate,
            bookings: activeBookings.map(booking => ({
              booking_id: booking.booking_id,
              guest_name: booking.guest_name,
              check_in: booking.check_in,
              check_out: booking.check_out,
              guests: booking.guests,
              status: booking.status
            }))
          });
        }
      }

      console.log(`📊 Simple occupancy data loaded for ${dates.length} dates:`, occupancyData.length, 'records');
      return occupancyData;
    } catch (error) {
      console.error('Error fetching simple occupancy data:', error);
      return this.getDemoOccupancyData(startDate, endDate);
    }
  }

  // Get occupancy for a specific date
  static async getOccupancyForDate(date: string): Promise<SimpleOccupancyData[]> {
    return this.getOccupancyForDateRange(date, date);
  }

  // Get occupancy summary for all villas on a specific date
  static async getOccupancySummary(date: string): Promise<{
    total_units: number;
    occupied_units: number;
    available_units: number;
    occupancy_rate: number;
    villa_breakdown: SimpleOccupancyData[];
  }> {
    const occupancyData = await this.getOccupancyForDate(date);
    
    const totalUnits = occupancyData.reduce((sum, villa) => sum + villa.total_units, 0);
    const occupiedUnits = occupancyData.reduce((sum, villa) => sum + villa.occupied_units, 0);
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      total_units: totalUnits,
      occupied_units: occupiedUnits,
      available_units: availableUnits,
      occupancy_rate: occupancyRate,
      villa_breakdown: occupancyData
    };
  }

  // Get weekly occupancy data
  static async getWeeklyOccupancy(startDate: string): Promise<SimpleOccupancyData[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return this.getOccupancyForDateRange(startDate, endDate.toISOString().split('T')[0]);
  }

  // Get monthly occupancy data
  static async getMonthlyOccupancy(year: number, month: number): Promise<SimpleOccupancyData[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return this.getOccupancyForDateRange(startDate, endDate);
  }

  // Helper methods
  private static generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private static isDateInRange(date: string, checkIn: string, checkOut: string): boolean {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const currentDate = new Date(date);
    
    return currentDate >= checkInDate && currentDate < checkOutDate;
  }

  private static getVillaName(villaId: string): string {
    const names: { [key: string]: string } = {
      'glass-cottage': 'Glass Cottage',
      'hornbill-villa': 'Hornbill Villa',
      'kingfisher-villa': 'Kingfisher Villa'
    };
    return names[villaId] || villaId;
  }

  private static getDemoOccupancyData(startDate: string, endDate: string): SimpleOccupancyData[] {
    const dates = this.generateDateRange(startDate, endDate);
    const occupancyData: SimpleOccupancyData[] = [];

    for (const date of dates) {
      for (const villaId of Object.keys(VILLA_INVENTORY)) {
        const villaName = this.getVillaName(villaId);
        const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;
        const occupiedUnits = Math.floor(Math.random() * Math.min(3, totalUnits));
        const availableUnits = totalUnits - occupiedUnits;
        const occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);

        occupancyData.push({
          date,
          villa_id: villaId,
          villa_name: villaName,
          total_units: totalUnits,
          occupied_units: occupiedUnits,
          available_units: availableUnits,
          occupancy_rate: occupancyRate,
          bookings: []
        });
      }
    }

    return occupancyData;
  }
}
