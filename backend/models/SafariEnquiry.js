const { createClient } = require('@supabase/supabase-js');

class SafariEnquiryModel {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.tableName = 'safari_queries';
  }

  // Generate unique enquiry ID
  generateEnquiryId() {
    return `safari_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a single safari enquiry
  async create(enquiryData) {
    try {
      const enquiry = {
        id: enquiryData.id || this.generateEnquiryId(),
        booking_id: enquiryData.bookingId || null,
        guest_name: enquiryData.guestName,
        email: enquiryData.guestEmail,
        phone: enquiryData.guestPhone || null,
        safari_option_id: enquiryData.safariOptionId || null,
        safari_name: enquiryData.safariName,
        preferred_date: enquiryData.preferredDate,
        preferred_timing: enquiryData.preferredTiming,
        number_of_persons: enquiryData.numberOfPersons,
        special_requirements: enquiryData.specialRequirements || null,
        status: enquiryData.status || 'pending',
        admin_notes: enquiryData.adminNotes || null,
        response: enquiryData.adminResponse || null,
        responded_at: enquiryData.respondedAt || null,
        responded_by: enquiryData.respondedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert([enquiry])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating safari enquiry:', error);
      throw error;
    }
  }

  // Create multiple safari enquiries (bulk)
  async createBulk(enquiriesData) {
    try {
      const enquiries = enquiriesData.map(data => ({
        id: data.id || this.generateEnquiryId(),
        booking_id: data.bookingId || null,
        guest_name: data.guestName,
        email: data.guestEmail,
        phone: data.guestPhone || null,
        safari_option_id: data.safariOptionId || null,
        safari_name: data.safariName,
        preferred_date: data.preferredDate,
        preferred_timing: data.preferredTiming,
        number_of_persons: data.numberOfPersons,
        special_requirements: data.specialRequirements || null,
        status: data.status || 'pending',
        admin_notes: data.adminNotes || null,
        response: data.adminResponse || null,
        responded_at: data.respondedAt || null,
        responded_by: data.respondedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(enquiries)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating bulk safari enquiries:', error);
      throw error;
    }
  }

  // Get enquiries with filtering and pagination
  async find(filters = {}, page = 1, limit = 10) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.guestEmail) {
        query = query.ilike('email', `%${filters.guestEmail}%`);
      }
      if (filters.bookingId) {
        query = query.eq('booking_id', filters.bookingId);
      }
      if (filters.dateFrom) {
        query = query.gte('preferred_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('preferred_date', filters.dateTo);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching safari enquiries:', error);
      throw error;
    }
  }

  // Get enquiry by ID
  async findById(enquiryId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', enquiryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching safari enquiry by ID:', error);
      throw error;
    }
  }

  // Update enquiry status
  async updateStatus(enquiryId, status, adminNotes = '', adminResponse = '') {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes) updateData.admin_notes = adminNotes;
      if (adminResponse) {
        updateData.response = adminResponse;
        updateData.responded_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', enquiryId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      throw error;
    }
  }

  // Confirm enquiry
  async confirm(enquiryId, confirmedDate, confirmedTiming, quotedPrice = 0) {
    try {
      const updateData = {
        status: 'confirmed',
        response: `Confirmed for ${confirmedDate} at ${confirmedTiming}. Price: ₹${quotedPrice}`,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', enquiryId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error confirming enquiry:', error);
      throw error;
    }
  }

  // Get enquiry statistics
  async getStats() {
    try {
      // Get total count
      const { count: total, error: totalError } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { count: todayCount, error: todayError } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      if (todayError) throw todayError;

      // Get this month's count
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthISO = thisMonth.toISOString();

      const { count: thisMonthCount, error: monthError } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthISO);

      if (monthError) throw monthError;

      // Get status counts
      const { data: statusData, error: statusError } = await this.supabase
        .from(this.tableName)
        .select('status');

      if (statusError) throw statusError;

      const byStatus = statusData.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      return {
        total: total || 0,
        today: todayCount || 0,
        thisMonth: thisMonthCount || 0,
        byStatus
      };
    } catch (error) {
      console.error('Error fetching enquiry stats:', error);
      throw error;
    }
  }

  // Check if enquiry can be confirmed
  canBeConfirmed(enquiry) {
    return enquiry.status === 'pending' && new Date(enquiry.preferred_date) > new Date();
  }

  // Check if enquiry is expired
  isExpired(enquiry) {
    return enquiry.status === 'pending' && new Date(enquiry.preferred_date) < new Date();
  }

  // Get formatted enquiry ID
  getFormattedEnquiryId(enquiry) {
    return `SE-${enquiry.id.slice(-8).toUpperCase()}`;
  }
}

module.exports = SafariEnquiryModel;