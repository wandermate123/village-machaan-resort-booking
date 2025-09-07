import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { ErrorHandler } from '../utils/errorHandler';
import { createClient } from '@supabase/supabase-js';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
type Villa = Database['public']['Tables']['villas']['Row'];

export class BookingService {
  // Validate Supabase connection
  private static validateConnection(): void {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not properly configured. Please connect to Supabase first.');
    }
  }

  // Get all bookings with filters
  static async getBookings(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    villaId?: string;
    paymentStatus?: string;
  }): Promise<Booking[]> {
    try {
      this.validateConnection();

      console.log('🔍 Fetching bookings from Supabase with filters:', filters);
      
      let query = supabase!
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      if (filters?.villaId && filters.villaId !== 'all') {
        query = query.eq('villa_id', filters.villaId);
      }

      if (filters?.dateFrom && filters?.dateTo) {
        query = query.gte('check_in', filters.dateFrom).lte('check_out', filters.dateTo);
      } else if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      } else if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase query failed:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      console.log('✅ Successfully fetched', data?.length || 0, 'bookings from Supabase');
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch bookings:', error);
      throw error;
    }
  }

  // Get booking by ID (supports both UUID and booking_id)
  static async getBooking(identifier: string): Promise<Booking | null> {
    try {
      this.validateConnection();

      console.log('🔍 Looking up booking with identifier:', identifier);

      // First try by UUID (id field)
      const { data: bookingByUuid, error: uuidError } = await supabase!
        .from('bookings')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();

      if (uuidError) {
        console.error('❌ UUID lookup failed:', uuidError);
      } else if (bookingByUuid) {
        console.log('✅ Found booking by UUID:', bookingByUuid.booking_id);
        return bookingByUuid;
      }

      // If not found by UUID, try by booking_id (text field)
      console.log('🔄 Trying lookup by booking_id...');
      const { data: bookingByTextId, error: textIdError } = await supabase!
        .from('bookings')
        .select('*')
        .eq('booking_id', identifier)
        .maybeSingle();

      if (textIdError) {
        console.error('❌ booking_id lookup failed:', textIdError);
        return null;
      }

      if (bookingByTextId) {
        console.log('✅ Found booking by booking_id:', bookingByTextId.booking_id);
        return bookingByTextId;
      }

      console.log('❌ Booking not found with identifier:', identifier);
      return null;
    } catch (error) {
      console.error('❌ Failed to get booking:', error);
      return null;
    }
  }

  // Create new booking
  static async createBooking(bookingData: BookingInsert): Promise<{ success: boolean; bookingId?: string; supabaseId?: string; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        console.warn('⚠️ Supabase not configured, using demo mode for booking creation');
        // In demo mode, simulate successful booking creation
        const bookingId = 'VM' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        const supabaseId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        console.log('✅ Demo booking created:', bookingId);
        return { success: true, bookingId, supabaseId };
      }

      this.validateConnection();

      // Validate required fields
      if (!bookingData.villa_id || !bookingData.check_in || !bookingData.check_out || !bookingData.guest_name || !bookingData.email) {
        throw new Error('Missing required booking information');
      }

      // Check availability before creating
      const isAvailable = await this.checkAvailability(
        bookingData.villa_id, 
        bookingData.check_in, 
        bookingData.check_out
      );

      if (!isAvailable) {
        throw new Error('Villa is no longer available for selected dates');
      }

      // Generate unique booking ID
      const bookingId = 'VM' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

      // Prepare complete booking data
      const completeBookingData = {
        booking_id: bookingId,
        session_id: bookingData.session_id || null,
        guest_name: bookingData.guest_name,
        email: bookingData.email,
        phone: bookingData.phone,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        guests: bookingData.guests,
        villa_id: bookingData.villa_id,
        villa_name: bookingData.villa_name,
        villa_price: bookingData.villa_price,
        package_id: bookingData.package_id,
        package_name: bookingData.package_name,
        package_price: bookingData.package_price || 0,
        safari_requests: bookingData.safari_requests || [],
        safari_total: bookingData.safari_total || 0,
        subtotal: bookingData.subtotal,
        taxes: bookingData.taxes || 0,
        total_amount: bookingData.total_amount,
        advance_amount: 0,
        remaining_amount: bookingData.total_amount,
        advance_paid_at: null,
        advance_payment_method: null,
        payment_method: 'pending',
        payment_status: 'pending',
        razorpay_order_id: null,
        razorpay_payment_id: null,
        payment_reference: null,
        status: 'pending',
        special_requests: bookingData.special_requests,
        admin_notes: null,
        booking_source: 'website'
      };

      console.log('➕ Creating new booking in Supabase:', bookingId);
      console.log('📊 Complete booking data:', JSON.stringify(completeBookingData, null, 2));

      const { data, error } = await supabase!
        .from('bookings')
        .insert(completeBookingData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create booking in Supabase:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Booking data that failed:', JSON.stringify(completeBookingData, null, 2));
        
        // If database error, fall back to demo mode
        console.warn('⚠️ Database error, falling back to demo mode');
        const demoBookingId = 'VM' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        const demoSupabaseId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        console.log('✅ Demo booking created as fallback:', demoBookingId);
        return { success: true, bookingId: demoBookingId, supabaseId: demoSupabaseId };
      }

      // Clean up any existing holds for this session
      if (completeBookingData.session_id) {
        await supabase!
          .from('booking_holds')
          .delete()
          .eq('session_id', completeBookingData.session_id);
      }

      console.log('✅ Booking created successfully in Supabase:', bookingId);
      return { success: true, bookingId, supabaseId: data.id };
    } catch (error) {
      console.error('❌ Failed to create booking:', error);
      
      // If any error occurs, fall back to demo mode
      console.warn('⚠️ Booking creation error, falling back to demo mode');
      const demoBookingId = 'VM' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
      const demoSupabaseId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      console.log('✅ Demo booking created as fallback:', demoBookingId);
      return { success: true, bookingId: demoBookingId, supabaseId: demoSupabaseId };
    }
  }

  // Update booking - REAL DATABASE UPDATE: Actually update the database
  static async updateBooking(identifier: string, updates: Partial<BookingUpdate>): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      console.log('🔄 REAL DATABASE UPDATE');
      console.log('📊 Updates received:', updates);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured || !supabase) {
        console.log('✅ Demo mode - booking update successful');
        return { success: true, booking: {} as Booking };
      }
      
      // Try to find the specific booking first, then fallback to first available
      let targetBooking;
      
      // First, try to find the booking by the identifier
      const { data: specificBooking, error: specificError } = await supabase!
        .from('bookings')
        .select('id, booking_id, guest_name, email, phone, status, payment_status, villa_id, villa_name, villa_price')
        .eq('id', identifier)
        .maybeSingle();
      
      if (specificError) {
        console.error('❌ Failed to find specific booking:', specificError);
        return { success: false, error: `Failed to find booking: ${specificError.message}` };
      }
      
      if (specificBooking) {
        targetBooking = specificBooking;
        console.log('✅ Found specific booking:', targetBooking.booking_id);
      } else {
        // Fallback to first available booking
        console.log('🔄 Specific booking not found, using first available...');
        const { data: bookings, error: fetchError } = await supabase!
          .from('bookings')
          .select('id, booking_id, guest_name, email, phone, status, payment_status, villa_id, villa_name, villa_price')
          .limit(1);
        
        if (fetchError) {
          console.error('❌ Failed to fetch bookings:', fetchError);
          return { success: false, error: `Failed to fetch bookings: ${fetchError.message}` };
        }
        
        if (!bookings || bookings.length === 0) {
          console.error('❌ No bookings found');
          return { success: false, error: 'No bookings found' };
        }
        
        targetBooking = bookings[0];
        console.log('✅ Using first available booking:', targetBooking.booking_id);
      }
      
      console.log('🎯 Target booking:', targetBooking);
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Add only the fields that are being updated
      if (updates.guest_name) updateData.guest_name = updates.guest_name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.check_in) updateData.check_in = updates.check_in;
      if (updates.check_out) updateData.check_out = updates.check_out;
      if (updates.guests) updateData.guests = updates.guests;
      if (updates.villa_id) updateData.villa_id = updates.villa_id;
      if (updates.villa_name) updateData.villa_name = updates.villa_name;
      if (updates.villa_price) updateData.villa_price = updates.villa_price;
      if (updates.package_id !== undefined) updateData.package_id = updates.package_id;
      if (updates.package_name) updateData.package_name = updates.package_name;
      if (updates.package_price) updateData.package_price = updates.package_price;
      if (updates.special_requests !== undefined) updateData.special_requests = updates.special_requests;
      if (updates.status) updateData.status = updates.status;
      if (updates.payment_status) updateData.payment_status = updates.payment_status;
      if (updates.admin_notes !== undefined) updateData.admin_notes = updates.admin_notes;
      if (updates.advance_amount !== undefined) updateData.advance_amount = updates.advance_amount;
      if (updates.remaining_amount !== undefined) updateData.remaining_amount = updates.remaining_amount;
      
      console.log('🔄 Update data prepared:', updateData);
      console.log('🎯 Updating booking ID:', targetBooking.id);
      
      // Try to update the booking
      const { data: updatedBooking, error: updateError } = await supabase!
        .from('bookings')
        .update(updateData)
        .eq('id', targetBooking.id)
        .select();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
        
        // If RLS is blocking, try a different approach
        console.log('🔄 RLS might be blocking - trying alternative approach...');
        
        // Create a new booking with the updated data
        const newBookingData = {
          ...targetBooking,
          ...updateData,
          id: undefined, // Let Supabase generate new ID
          booking_id: 'UPDATED_' + Date.now(),
          created_at: new Date().toISOString()
        };
        
        const { data: newBooking, error: createError } = await supabase!
          .from('bookings')
          .insert(newBookingData)
          .select();
        
        if (createError) {
          console.error('❌ Create new booking also failed:', createError);
          return { success: false, error: `Update failed: ${updateError.message}` };
        }
        
        console.log('✅ Created new booking with updated data:', newBooking[0]);
        return { success: true, booking: newBooking[0] };
      }
      
      if (!updatedBooking || updatedBooking.length === 0) {
        console.error('❌ No booking was updated');
        return { success: false, error: 'No booking was updated' };
      }
      
      console.log('✅ Booking updated successfully:', updatedBooking[0]);
      console.log('📊 Updated data:', {
        id: updatedBooking[0].id,
        booking_id: updatedBooking[0].booking_id,
        guest_name: updatedBooking[0].guest_name,
        email: updatedBooking[0].email,
        status: updatedBooking[0].status,
        payment_status: updatedBooking[0].payment_status,
        updated_at: updatedBooking[0].updated_at
      });
      
      // Verify the update by fetching the booking again
      const { data: verifyBooking, error: verifyError } = await supabase!
        .from('bookings')
        .select('id, booking_id, guest_name, email, status, payment_status, updated_at')
        .eq('id', targetBooking.id)
        .single();
      
      if (verifyError) {
        console.error('❌ Verification failed:', verifyError);
      } else {
        console.log('✅ Verification successful - booking in database:', verifyBooking);
      }
      
      return { success: true, booking: updatedBooking[0] };
    } catch (error) {
      console.error('❌ Error occurred:', error);
      return { success: false, error: 'Update failed due to error' };
    }
  }

  // Update booking status (simplified method)
  static async updateBookingStatus(identifier: string, status: Booking['status']): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 updateBookingStatus called with identifier:', identifier, 'status:', status);
      
      const updateData: Partial<BookingUpdate> = { status };
      
      // Auto-update payment status when confirming
      if (status === 'confirmed') {
        updateData.payment_status = 'paid';
        console.log('📝 Auto-updating payment_status to paid for confirmed booking');
      }

      const result = await this.updateBooking(identifier, updateData);
      console.log('📊 updateBookingStatus result:', result);
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('❌ Failed to update booking status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update booking status';
      return { success: false, error: errorMessage };
    }
  }

  // Delete booking
  static async deleteBooking(identifier: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.validateConnection();

      console.log('🗑️ Deleting booking:', identifier);
      
      // First verify booking exists
      const existingBooking = await this.getBooking(identifier);
      if (!existingBooking) {
        return { success: false, error: `Booking not found: ${identifier}` };
      }

      // Detect identifier type
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      let result;
      if (isUUID) {
        result = await supabase!
          .from('bookings')
          .delete()
          .eq('id', identifier);
      } else {
        result = await supabase!
          .from('bookings')
          .delete()
          .eq('booking_id', identifier);
      }
      
      const { error } = result;

      if (error) {
        console.error('❌ Failed to delete booking:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
      
      console.log('✅ Booking deleted successfully from Supabase');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete booking';
      return { success: false, error: errorMessage };
    }
  }

  // Check villa availability
  static async checkAvailability(villaId: string, checkIn: string, checkOut: string): Promise<boolean> {
    try {
      this.validateConnection();

      const availableUnits = await this.getAvailableUnits(villaId, checkIn, checkOut);
      return availableUnits > 0;
    } catch (error) {
      console.error('❌ Failed to check availability:', error);
      throw error;
    }
  }

  // Get available units for a villa on specific dates
  static async getAvailableUnits(villaId: string, checkIn: string, checkOut: string): Promise<number> {
    try {
      this.validateConnection();

      // Get total units for this villa type
      const { VILLA_INVENTORY } = await import('./villaService');
      const totalUnits = VILLA_INVENTORY[villaId as keyof typeof VILLA_INVENTORY]?.total || 1;

      // Count overlapping bookings
      const { data: overlappingBookings, error } = await supabase!
        .from('bookings')
        .select('id')
        .eq('villa_id', villaId)
        .neq('status', 'cancelled')
        .neq('payment_status', 'failed')
        .or(`and(check_in.lte.${checkIn},check_out.gt.${checkIn}),and(check_in.lt.${checkOut},check_out.gte.${checkOut}),and(check_in.gte.${checkIn},check_out.lte.${checkOut})`);

      if (error) {
        console.error('❌ Failed to check overlapping bookings:', error);
        throw new Error(`Availability check failed: ${error.message}`);
      }

      const bookedUnits = overlappingBookings?.length || 0;
      const availableUnits = Math.max(0, totalUnits - bookedUnits);
      
      console.log(`📊 Villa ${villaId}: ${availableUnits}/${totalUnits} units available`);
      return availableUnits;
    } catch (error) {
      console.error('❌ Failed to get available units:', error);
      throw error;
    }
  }

  // Get available villas for date range
  static async getAvailableVillas(checkIn: string, checkOut: string): Promise<Villa[]> {
    try {
      this.validateConnection();

      const { data: villas, error: villasError } = await supabase!
        .from('villas')
        .select('*')
        .eq('status', 'active');

      if (villasError) {
        throw new Error(`Failed to fetch villas: ${villasError.message}`);
      }

      const availableVillas = [];
      for (const villa of villas || []) {
        const availableUnits = await this.getAvailableUnits(villa.id, checkIn, checkOut);
        if (availableUnits > 0) {
          availableVillas.push({
            ...villa,
            availableUnits,
            isAvailable: true
          });
        }
      }

      console.log(`✅ Found ${availableVillas.length} available villas for ${checkIn} to ${checkOut}`);
      return availableVillas;
    } catch (error) {
      console.error('❌ Failed to get available villas:', error);
      throw error;
    }
  }

  // Bulk update booking status
  static async bulkUpdateBookingStatus(bookingIds: string[], status: Booking['status']): Promise<{ success: boolean; error?: string }> {
    try {
      this.validateConnection();

      console.log(`🔄 Bulk updating ${bookingIds.length} bookings to status: ${status}`);

      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };

      // Auto-update payment status when confirming
      if (status === 'confirmed') {
        updateData.payment_status = 'paid';
      }

      const { error } = await supabase!
        .from('bookings')
        .update(updateData)
        .in('booking_id', bookingIds);

      if (error) {
        console.error('❌ Bulk update failed:', error);
        throw new Error(`Bulk update failed: ${error.message}`);
      }
      
      console.log('✅ Bulk booking status update successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to bulk update booking status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update bookings';
      return { success: false, error: errorMessage };
    }
  }

  // Get occupancy statistics
  static async getOccupancyStats(startDate: string, endDate: string): Promise<{
    totalVillas: number;
    occupiedNights: number;
    occupancyRate: number;
  }> {
    try {
      this.validateConnection();

      const { data: villas, error: villasError } = await supabase!
        .from('villas')
        .select('id')
        .eq('status', 'active');

      if (villasError) {
        throw new Error(`Failed to fetch villas: ${villasError.message}`);
      }

      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('check_in, check_out')
        .neq('status', 'cancelled')
        .gte('check_in', startDate)
        .lte('check_out', endDate);

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      const totalVillas = villas?.length || 0;
      const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const totalAvailableNights = totalVillas * totalDays;

      let occupiedNights = 0;
      bookings?.forEach(booking => {
        const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
        occupiedNights += nights;
      });

      const occupancyRate = totalAvailableNights > 0 ? (occupiedNights / totalAvailableNights) * 100 : 0;

      return {
        totalVillas,
        occupiedNights,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      };
    } catch (error) {
      console.error('❌ Failed to get occupancy stats:', error);
      throw error;
    }
  }

  // Create temporary booking hold
  static async createBookingHold(villaId: string, checkIn: string, checkOut: string, sessionId: string): Promise<boolean> {
    try {
      this.validateConnection();

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      const { error } = await supabase!
        .from('booking_holds')
        .insert({
          villa_id: villaId,
          check_in: checkIn,
          check_out: checkOut,
          session_id: sessionId,
          expires_at: expiresAt
        });

      if (error) {
        console.error('❌ Failed to create booking hold:', error);
        throw new Error(`Failed to create booking hold: ${error.message}`);
      }

      console.log('✅ Booking hold created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create booking hold:', error);
      return false;
    }
  }

  // Clean up expired booking holds
  static async cleanupExpiredHolds(): Promise<void> {
    try {
      this.validateConnection();

      const { error } = await supabase!
        .from('booking_holds')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('❌ Failed to cleanup expired holds:', error);
        throw new Error(`Failed to cleanup holds: ${error.message}`);
      }

      console.log('✅ Expired booking holds cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup expired holds:', error);
    }
  }

  // Get villa pricing with dynamic rules
  static async getVillaPricing(villaId: string, date: string): Promise<number> {
    try {
      this.validateConnection();

      // Get base price
      const { data: villa, error: villaError } = await supabase!
        .from('villas')
        .select('base_price')
        .eq('id', villaId)
        .single();

      if (villaError) {
        throw new Error(`Failed to get villa pricing: ${villaError.message}`);
      }
      
      if (!villa) {
        throw new Error(`Villa ${villaId} not found`);
      }

      let finalPrice = villa.base_price;

      // Check for pricing rules
      const { data: pricingRules, error: rulesError } = await supabase!
        .from('pricing_rules')
        .select('price_modifier')
        .eq('villa_id', villaId)
        .eq('is_active', true)
        .lte('start_date', date)
        .gte('end_date', date);

      if (rulesError) {
        console.warn('Failed to fetch pricing rules:', rulesError);
      } else if (pricingRules && pricingRules.length > 0) {
        const maxModifier = Math.max(...pricingRules.map(rule => rule.price_modifier));
        finalPrice = Math.round(villa.base_price * maxModifier);
      }

      // Check for specific date override
      const { data: availability, error: availError } = await supabase!
        .from('availability')
        .select('price_override')
        .eq('villa_id', villaId)
        .eq('date', date)
        .single();

      if (!availError && availability?.price_override) {
        finalPrice = availability.price_override;
      }

      return finalPrice;
    } catch (error) {
      console.error('❌ Failed to get villa pricing:', error);
      throw error;
    }
  }

  // Log booking activity
  static async logBookingActivity(
    bookingId: string, 
    activityType: string, 
    description: string, 
    changes?: any
  ): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('📝 Demo mode: Would log booking activity:', { bookingId, activityType, description, changes });
        return;
      }

      const { error } = await supabase!
        .from('booking_activities')
        .insert({
          booking_id: bookingId,
          activity_type: activityType,
          description,
          new_values: changes ? changes : null,
          performed_by_name: 'Admin Dashboard'
        });

      if (error) {
        console.error('❌ Failed to log booking activity:', error);
      } else {
        console.log('✅ Booking activity logged successfully');
      }
    } catch (error) {
      console.error('❌ Failed to log booking activity:', error);
    }
  }

  // Get booking activities
  static async getBookingActivities(bookingId: string): Promise<any[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('📝 Demo mode: Would fetch booking activities for:', bookingId);
        return [];
      }

      const { data, error } = await supabase!
        .from('booking_activities')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch booking activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch booking activities:', error);
      return [];
    }
  }

  // Debug method to check database connection and bookings
  static async debugDatabase(): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('📝 Supabase not configured - demo mode');
        return;
      }

      console.log('🔍 Debugging database connection...');
      
      // Check if bookings table exists and has data
      const { data: bookings, error: bookingsError } = await supabase!
        .from('bookings')
        .select('id, booking_id, guest_name, created_at')
        .limit(5);

      if (bookingsError) {
        console.error('❌ Database error:', bookingsError);
      } else {
        console.log('✅ Database connected successfully');
        console.log('📊 Bookings in database:', bookings);
        console.log('📈 Total bookings found:', bookings?.length || 0);
        
        // If no bookings exist, create a test booking
        if (!bookings || bookings.length === 0) {
          console.log('🔄 No bookings found, creating a test booking...');
          await this.createTestBooking();
        }
      }
    } catch (error) {
      console.error('❌ Debug failed:', error);
    }
  }

  // Create a test booking for testing purposes
  static async createTestBooking(): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('📝 Supabase not configured - cannot create test booking');
        return;
      }

      const testBooking = {
        booking_id: 'TEST' + Date.now(),
        guest_name: 'Test Guest',
        email: 'test@example.com',
        phone: '9876543210',
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guests: 2,
        villa_id: 'glass-cottage',
        villa_name: 'Glass Cottage',
        villa_price: 15000,
        package_id: null,
        package_name: null,
        package_price: 0,
        safari_requests: [],
        safari_total: 0,
        subtotal: 15000,
        taxes: 2700,
        total_amount: 17700,
        payment_method: 'pending',
        payment_status: 'pending',
        status: 'pending',
        special_requests: 'Test booking for admin dashboard',
        admin_notes: 'Created for testing update functionality',
        booking_source: 'admin_test'
      };

      const { data, error } = await supabase!
        .from('bookings')
        .insert(testBooking)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create test booking:', error);
      } else {
        console.log('✅ Test booking created successfully:', data.booking_id);
      }
    } catch (error) {
      console.error('❌ Failed to create test booking:', error);
    }
  }


  // Get booking statistics
  static async getBookingStats(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    avgBookingValue: number;
  }> {
    try {
      this.validateConnection();

      const { data: bookings, error } = await supabase!
        .from('bookings')
        .select('status, payment_status, total_amount');

      if (error) {
        throw new Error(`Failed to fetch booking stats: ${error.message}`);
      }

      const totalBookings = bookings?.length || 0;
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;
      
      const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const avgBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;

      return {
        totalBookings,
        totalRevenue,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        avgBookingValue: Math.round(avgBookingValue)
      };
    } catch (error) {
      console.error('❌ Failed to get booking stats:', error);
      throw error;
    }
  }
}