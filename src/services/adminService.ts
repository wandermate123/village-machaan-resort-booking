import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';
import { BookingService } from './bookingService';

export interface AdminStats {
  totalBookings: number;
  totalRevenue: number;
  advancePaymentCount: number;
  advanceRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalVillas: number;
  activeVillas: number;
  totalPackages: number;
  activePackages: number;
  occupancyRate: number;
  avgBookingValue: number;
  recentBookings: any[];
  topVillas: any[];
  monthlyRevenue: any[];
}

export interface VillaPerformance {
  villa_id: string;
  villa_name: string;
  total_bookings: number;
  total_revenue: number;
  occupancy_rate: number;
  avg_booking_value: number;
  last_booking_date: string | null;
}

export interface BookingAnalytics {
  booking_date: string;
  total_bookings: number;
  total_revenue: number;
  avg_booking_value: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
}

export interface OccupancyOverview {
  villa_id: string;
  villa_name: string;
  total_units: number;
  occupied_units: number;
  available_units: number;
  occupancy_rate: number;
  current_guests: any[];
}

export class AdminService {
  // Get comprehensive dashboard statistics
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
      }

      console.log('📊 Fetching real dashboard stats from Supabase...');
      
      // Get real booking statistics
      const bookingStats = await BookingService.getBookingStats();
      
      // Get villa and package counts
      const [
        { count: totalVillas },
        { count: activeVillas },
        { count: totalPackages },
        { count: activePackages },
        { data: recentBookings }
      ] = await Promise.all([
        supabase!.from('villas').select('*', { count: 'exact', head: true }),
        supabase!.from('villas').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase!.from('packages').select('*', { count: 'exact', head: true }),
        supabase!.from('packages').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase!.from('bookings').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      const occupancyRate = this.calculateOccupancyRate(bookingStats.totalBookings, totalVillas || 0);

      const stats: AdminStats = {
        totalBookings: bookingStats.totalBookings,
        totalRevenue: bookingStats.totalRevenue,
        advancePaymentCount: 0, // Will be calculated from bookings
        advanceRevenue: 0, // Will be calculated from bookings
        pendingBookings: bookingStats.pendingBookings,
        confirmedBookings: bookingStats.confirmedBookings,
        completedBookings: bookingStats.completedBookings,
        cancelledBookings: bookingStats.cancelledBookings,
        totalVillas: totalVillas || 0,
        activeVillas: activeVillas || 0,
        totalPackages: totalPackages || 0,
        activePackages: activePackages || 0,
        occupancyRate,
        avgBookingValue: bookingStats.avgBookingValue,
        recentBookings: recentBookings || [],
        topVillas: [],
        monthlyRevenue: []
      };

      console.log('✅ Dashboard stats loaded successfully');
      return stats;
    } catch (error) {
      console.error('❌ Failed to get dashboard stats:', error);
      throw error;
    }
  }

  // Calculate occupancy rate
  private static calculateOccupancyRate(totalBookings: number, totalVillas: number): number {
    if (totalVillas === 0) return 0;
    
    // Simple occupancy calculation - can be enhanced
    const baseOccupancy = Math.min((totalBookings / (totalVillas * 30)) * 100, 100);
    return Math.round(baseOccupancy * 100) / 100;
  }

  // Get villa performance metrics
  static async getVillaPerformance(villaId?: string): Promise<VillaPerformance[]> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      let query = supabase!
        .from('bookings')
        .select('villa_id, villa_name, total_amount, status, payment_status, created_at');

      if (villaId) {
        query = query.eq('villa_id', villaId);
      }

      const { data: bookings, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch villa performance: ${error.message}`);
      }

      // Group bookings by villa
      const villaStats = new Map();
      
      bookings?.forEach(booking => {
        const villaId = booking.villa_id;
        if (!villaStats.has(villaId)) {
          villaStats.set(villaId, {
            villa_id: villaId,
            villa_name: booking.villa_name,
            total_bookings: 0,
            total_revenue: 0,
            last_booking_date: null
          });
        }
        
        const stats = villaStats.get(villaId);
        stats.total_bookings += 1;
        
        if (booking.payment_status === 'paid') {
          stats.total_revenue += booking.total_amount;
        }
        
        if (!stats.last_booking_date || new Date(booking.created_at) > new Date(stats.last_booking_date)) {
          stats.last_booking_date = booking.created_at;
        }
      });

      // Convert to array and calculate additional metrics
      const performance = Array.from(villaStats.values()).map(stats => ({
        ...stats,
        occupancy_rate: this.calculateVillaOccupancy(stats.total_bookings),
        avg_booking_value: stats.total_bookings > 0 ? Math.round(stats.total_revenue / stats.total_bookings) : 0
      }));

      return performance;
    } catch (error) {
      console.error('❌ Failed to get villa performance:', error);
      throw error;
    }
  }

  // Calculate villa occupancy rate
  private static calculateVillaOccupancy(totalBookings: number): number {
    // Simple calculation - can be enhanced with actual date ranges
    return Math.min(totalBookings * 5, 100); // Rough estimate
  }

  // Get booking analytics
  static async getBookingAnalytics(startDate?: string, endDate?: string): Promise<BookingAnalytics[]> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      let query = supabase!
        .from('bookings')
        .select('created_at, total_amount, status');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: bookings, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch booking analytics: ${error.message}`);
      }

      // Group by date and calculate metrics
      const analytics = new Map();
      
      bookings?.forEach(booking => {
        const date = booking.created_at.split('T')[0];
        if (!analytics.has(date)) {
          analytics.set(date, {
            booking_date: date,
            total_bookings: 0,
            total_revenue: 0,
            confirmed_bookings: 0,
            cancelled_bookings: 0
          });
        }
        
        const dayStats = analytics.get(date);
        dayStats.total_bookings += 1;
        dayStats.total_revenue += booking.total_amount;
        
        if (booking.status === 'confirmed') {
          dayStats.confirmed_bookings += 1;
        } else if (booking.status === 'cancelled') {
          dayStats.cancelled_bookings += 1;
        }
      });

      // Convert to array and add avg booking value
      const analyticsArray = Array.from(analytics.values()).map(stats => ({
        ...stats,
        avg_booking_value: stats.total_bookings > 0 ? Math.round(stats.total_revenue / stats.total_bookings) : 0
      }));

      return analyticsArray.sort((a, b) => a.booking_date.localeCompare(b.booking_date));
    } catch (error) {
      console.error('❌ Failed to get booking analytics:', error);
      throw error;
    }
  }

  // Get occupancy overview
  static async getOccupancyOverview(targetDate?: string): Promise<OccupancyOverview[]> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      const date = targetDate || new Date().toISOString().split('T')[0];
      
      // Get all villas
      const { data: villas, error: villasError } = await supabase!
        .from('villas')
        .select('*')
        .eq('status', 'active');

      if (villasError) {
        throw new Error(`Failed to fetch villas: ${villasError.message}`);
      }

      // Get bookings for the target date
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('*')
        .lte('check_in', date)
        .gte('check_out', date)
        .neq('status', 'cancelled');

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      // Calculate occupancy for each villa
      const occupancyOverview = villas?.map(villa => {
        const { VILLA_INVENTORY } = require('./villaService');
        const totalUnits = VILLA_INVENTORY[villa.id]?.total || 1;
        const villaBookings = bookings?.filter(b => b.villa_id === villa.id) || [];
        const occupiedUnits = villaBookings.length;
        const availableUnits = Math.max(0, totalUnits - occupiedUnits);
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        return {
          villa_id: villa.id,
          villa_name: villa.name,
          total_units: totalUnits,
          occupied_units: occupiedUnits,
          available_units: availableUnits,
          occupancy_rate: Math.round(occupancyRate * 100) / 100,
          current_guests: villaBookings.map(booking => ({
            guest_name: booking.guest_name,
            email: booking.email,
            phone: booking.phone,
            guests: booking.guests,
            check_in: booking.check_in,
            check_out: booking.check_out,
            booking_id: booking.booking_id
          }))
        };
      }) || [];

      return occupancyOverview;
    } catch (error) {
      console.error('❌ Failed to get occupancy overview:', error);
      throw error;
    }
  }

  // Cleanup expired booking holds
  static async cleanupExpiredHolds(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase!
        .from('booking_holds')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup holds: ${error.message}`);
      }
      
      const deletedCount = data?.length || 0;
      console.log(`✅ Cleaned up ${deletedCount} expired booking holds`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Failed to cleanup expired holds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup expired holds';
      return { success: false, error: errorMessage };
    }
  }

  // Bulk operations
  static async bulkUpdateBookingStatus(bookingIds: string[], status: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      const result = await BookingService.bulkUpdateBookingStatus(bookingIds, status as any);
      return result;
    } catch (error) {
      console.error('❌ Failed to bulk update booking status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update bookings';
      return { success: false, error: errorMessage };
    }
  }

  // Fallback stats using direct table queries
  private static async getFallbackStats(): Promise<AdminStats> {
    try {
      if (!supabase) return this.getDemoStats();

      // Get basic stats using direct table queries
      const [
        { count: totalBookings },
        { data: paidBookings },
        { count: pendingBookings },
        { count: confirmedBookings },
        { count: completedBookings },
        { count: cancelledBookings },
        { count: totalVillas },
        { count: activeVillas },
        { count: totalPackages },
        { count: activePackages }
      ] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('villas').select('*', { count: 'exact', head: true }),
        supabase.from('villas').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('packages').select('*', { count: 'exact', head: true }),
        supabase.from('packages').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      const totalRevenue = paidBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const avgBookingValue = totalBookings && totalBookings > 0 ? totalRevenue / totalBookings : 0;

      return {
        totalBookings: totalBookings || 0,
        totalRevenue,
        advancePaymentCount: 0,
        advanceRevenue: 0,
        pendingBookings: pendingBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        completedBookings: completedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalVillas: totalVillas || 0,
        activeVillas: activeVillas || 0,
        totalPackages: totalPackages || 0,
        activePackages: activePackages || 0,
        occupancyRate: 65, // Simplified calculation
        avgBookingValue: Math.round(avgBookingValue),
        recentBookings: [],
        topVillas: [],
        monthlyRevenue: []
      };
    } catch (error) {
      console.warn('Fallback stats failed, using demo data:', error);
      return this.getDemoStats();
    }
  }

  // Generate demo statistics
  private static getDemoStats(): AdminStats {
    return {
      totalBookings: 2,
      totalRevenue: 85500,
      advancePaymentCount: 1,
      advanceRevenue: 21250,
      pendingBookings: 1,
      confirmedBookings: 1,
      completedBookings: 0,
      cancelledBookings: 0,
      totalVillas: 3,
      activeVillas: 3,
      totalPackages: 2,
      activePackages: 2,
      occupancyRate: 65,
      avgBookingValue: 42750,
      recentBookings: [],
      topVillas: [],
      monthlyRevenue: []
    };
  }

  private static getDemoVillaPerformance(): VillaPerformance[] {
    return [
      {
        villa_id: 'glass-cottage',
        villa_name: 'Glass Cottage',
        total_bookings: 5,
        total_revenue: 75000,
        occupancy_rate: 75,
        avg_booking_value: 15000,
        last_booking_date: new Date().toISOString()
      },
      {
        villa_id: 'hornbill-villa',
        villa_name: 'Hornbill Villa',
        total_bookings: 3,
        total_revenue: 54000,
        occupancy_rate: 60,
        avg_booking_value: 18000,
        last_booking_date: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  private static getDemoBookingAnalytics(): BookingAnalytics[] {
    const analytics = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 86400000);
      analytics.push({
        booking_date: date.toISOString().split('T')[0],
        total_bookings: Math.floor(Math.random() * 5),
        total_revenue: Math.floor(Math.random() * 100000),
        avg_booking_value: Math.floor(Math.random() * 50000) + 20000,
        confirmed_bookings: Math.floor(Math.random() * 3),
        cancelled_bookings: Math.floor(Math.random() * 2)
      });
    }
    return analytics;
  }

  private static getDemoOccupancyOverview(): OccupancyOverview[] {
    return [
      {
        villa_id: 'glass-cottage',
        villa_name: 'Glass Cottage',
        total_units: 14,
        occupied_units: 8,
        available_units: 6,
        occupancy_rate: 57.1,
        current_guests: []
      },
      {
        villa_id: 'hornbill-villa',
        villa_name: 'Hornbill Villa',
        total_units: 4,
        occupied_units: 2,
        available_units: 2,
        occupancy_rate: 50.0,
        current_guests: []
      }
    ];
  }

  // Process monthly data for charts
  private static processMonthlyData(data: BookingAnalytics[]): any[] {
    const monthlyStats: Record<string, { revenue: number; bookings: number }> = {};
    
    data.forEach(item => {
      const month = new Date(item.booking_date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, bookings: 0 };
      }
      monthlyStats[month].revenue += Number(item.total_revenue);
      monthlyStats[month].bookings += Number(item.total_bookings);
    });

    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      revenue: stats.revenue,
      bookings: stats.bookings
    }));
  }
}