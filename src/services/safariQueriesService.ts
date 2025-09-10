import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';
import type { Database } from '../lib/supabase';

type SafariQueryRow = Database['public']['Tables']['safari_queries']['Row'];
type SafariQueryInsert = Database['public']['Tables']['safari_queries']['Insert'];

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
        throw new Error('Supabase not configured. Please connect to Supabase first.');
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
      throw error;
    }
  }

  // Get safari query by ID
  static async getSafariQueryById(id: string): Promise<SafariQuery | null> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured. Please connect to Supabase first.');
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

  // Create bulk safari queries using Supabase
  static async createBulkSafariQueries(enquiries: Omit<SafariQuery, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured');
      }

      // Convert enquiries to Supabase format
      const supabaseEnquiries: SafariQueryInsert[] = enquiries.map(enquiry => ({
        booking_id: enquiry.booking_id || null,
        guest_name: enquiry.guest_name,
        email: enquiry.email,
        phone: enquiry.phone || null,
        safari_option_id: enquiry.safari_option_id || null,
        safari_name: enquiry.safari_name,
        preferred_date: enquiry.preferred_date || null,
        preferred_timing: enquiry.preferred_timing || null,
        number_of_persons: enquiry.number_of_persons,
        special_requirements: enquiry.special_requirements || null,
        status: enquiry.status || 'pending',
        admin_notes: enquiry.admin_notes || null,
        response: enquiry.response || null,
        responded_at: enquiry.responded_at || null,
        responded_by: enquiry.responded_by || null
      }));

      // Insert all enquiries in a single batch
      const { data, error } = await supabase
        .from('safari_queries')
        .insert(supabaseEnquiries)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ ${data?.length || enquiries.length} safari enquiries created successfully`);
      return { 
        success: true, 
        count: data?.length || enquiries.length 
      };
    } catch (error) {
      console.error('Error creating bulk safari queries:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create safari queries'
      };
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
        throw new Error('Supabase not configured. Please connect to Supabase first.');
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
      throw error;
    }
  }

}


