import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';

export interface SafariQuery {
  id: string;
  booking_id?: string;
  guest_name: string;
  email: string;
  phone?: string;
  safari_option_id: string;
  safari_name: string;
  preferred_date?: string;
  preferred_timing?: string;
  number_of_persons: number;
  special_requirements?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  admin_notes?: string;
  response?: string;
  responded_at?: string;
  responded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SafariQueryFilters {
  status?: string;
  safari_option_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SafariQueryStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  this_month: number;
  this_week: number;
}

export class SafariQueriesService {
  // Get all safari queries with filters
  static async getSafariQueries(filters: SafariQueryFilters = {}): Promise<SafariQuery[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return this.getDemoSafariQueries();
      }

      let query = supabase
        .from('safari_queries')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.safari_option_id) {
        query = query.eq('safari_option_id', filters.safari_option_id);
      }

      if (filters.date_from) {
        query = query.gte('preferred_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('preferred_date', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`guest_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,safari_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`📊 Fetched ${data?.length || 0} safari queries`);
      return data as SafariQuery[] || [];
    } catch (error) {
      console.error('Error fetching safari queries:', error);
      ErrorHandler.logError(error, 'get_safari_queries');
      return this.getDemoSafariQueries();
    }
  }

  // Get safari query by ID
  static async getSafariQueryById(id: string): Promise<SafariQuery | null> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        const demoQueries = this.getDemoSafariQueries();
        return demoQueries.find(query => query.id === id) || null;
      }

      const { data, error } = await supabase
        .from('safari_queries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as SafariQuery;
    } catch (error) {
      console.error('Error fetching safari query:', error);
      ErrorHandler.logError(error, 'get_safari_query_by_id');
      return null;
    }
  }

  // Create new safari query
  static async createSafariQuery(queryData: Omit<SafariQuery, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase
        .from('safari_queries')
        .insert(queryData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Safari query created successfully:', data.id);
      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating safari query:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Update safari query
  static async updateSafariQuery(id: string, updates: Partial<SafariQuery>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await supabase
        .from('safari_queries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Safari query updated successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('Error updating safari query:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Respond to safari query
  static async respondToQuery(id: string, response: string, adminNotes?: string, respondedBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const updates = {
        response,
        responded_at: new Date().toISOString(),
        responded_by: respondedBy || 'admin',
        status: 'confirmed' as const,
        admin_notes: adminNotes
      };

      const { error } = await supabase
        .from('safari_queries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Safari query response sent successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('Error responding to safari query:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Update query status
  static async updateQueryStatus(id: string, status: SafariQuery['status'], adminNotes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const updates: Partial<SafariQuery> = {
        status,
        admin_notes: adminNotes
      };

      if (status === 'confirmed' && !updates.response) {
        updates.response = 'Query confirmed by admin';
        updates.responded_at = new Date().toISOString();
        updates.responded_by = 'admin';
      }

      const { error } = await supabase
        .from('safari_queries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ Safari query status updated to ${status}:`, id);
      return { success: true };
    } catch (error) {
      console.error('Error updating safari query status:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Delete safari query
  static async deleteSafariQuery(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await supabase
        .from('safari_queries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Safari query deleted successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting safari query:', error);
      const appError = ErrorHandler.handleSupabaseError(error);
      return { success: false, error: appError.message };
    }
  }

  // Get safari query statistics
  static async getSafariQueryStats(): Promise<SafariQueryStats> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return this.getDemoSafariQueryStats();
      }

      // Get total counts
      const { data: totalData, error: totalError } = await supabase
        .from('safari_queries')
        .select('status');

      if (totalError) throw totalError;

      const total = totalData?.length || 0;
      const pending = totalData?.filter(q => q.status === 'pending').length || 0;
      const confirmed = totalData?.filter(q => q.status === 'confirmed').length || 0;
      const cancelled = totalData?.filter(q => q.status === 'cancelled').length || 0;
      const completed = totalData?.filter(q => q.status === 'completed').length || 0;

      // Get this month's count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthData, error: monthError } = await supabase
        .from('safari_queries')
        .select('id')
        .gte('created_at', startOfMonth.toISOString());

      if (monthError) throw monthError;

      // Get this week's count
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weekData, error: weekError } = await supabase
        .from('safari_queries')
        .select('id')
        .gte('created_at', startOfWeek.toISOString());

      if (weekError) throw weekError;

      return {
        total,
        pending,
        confirmed,
        cancelled,
        completed,
        this_month: monthData?.length || 0,
        this_week: weekData?.length || 0
      };
    } catch (error) {
      console.error('Error fetching safari query stats:', error);
      return this.getDemoSafariQueryStats();
    }
  }

  // Demo data for when Supabase is not configured
  private static getDemoSafariQueries(): SafariQuery[] {
    return [
      {
        id: 'demo-1',
        booking_id: 'BK001',
        guest_name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+91-9876543210',
        safari_option_id: 'morning-wildlife-safari',
        safari_name: 'Morning Wildlife Safari',
        preferred_date: '2024-01-15',
        preferred_timing: 'early-morning',
        number_of_persons: 2,
        special_requirements: 'Vegetarian meals preferred',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-2',
        booking_id: 'BK002',
        guest_name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+91-9876543211',
        safari_option_id: 'evening-wildlife-safari',
        safari_name: 'Evening Wildlife Safari',
        preferred_date: '2024-01-16',
        preferred_timing: 'evening',
        number_of_persons: 4,
        special_requirements: 'Wheelchair accessible vehicle needed',
        status: 'confirmed',
        response: 'Confirmed for 4 persons. Wheelchair accessible vehicle arranged.',
        responded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responded_by: 'admin',
        admin_notes: 'Special vehicle arranged',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-3',
        booking_id: 'BK003',
        guest_name: 'Mike Wilson',
        email: 'mike.w@email.com',
        phone: '+91-9876543212',
        safari_option_id: 'morning-wildlife-safari',
        safari_name: 'Morning Wildlife Safari',
        preferred_date: '2024-01-17',
        preferred_timing: 'morning',
        number_of_persons: 1,
        special_requirements: 'Photography equipment allowed?',
        status: 'pending',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  private static getDemoSafariQueryStats(): SafariQueryStats {
    return {
      total: 3,
      pending: 2,
      confirmed: 1,
      cancelled: 0,
      completed: 0,
      this_month: 3,
      this_week: 2
    };
  }
}
