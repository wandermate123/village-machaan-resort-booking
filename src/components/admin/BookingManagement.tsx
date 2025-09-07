import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit, Trash2, Eye, X, RefreshCw, Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { VillaService } from '../../services/villaService';
import { useToast } from '../common/Toast';
import { STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import BookingEditModal from './BookingEditModal';
import { isSupabaseConfigured } from '../../lib/supabase';

const BookingManagement = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [villaFilter, setVillaFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Check Supabase connection on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      showError('Database Not Connected', 'Please connect to Supabase to manage bookings');
      setLoading(false);
      return;
    }
    
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchTerm, statusFilter, paymentFilter, villaFilter, dateFilter]);

  const fetchData = async (forceRefresh = false) => {
    if (!isSupabaseConfigured) {
      showError('Database Not Connected', 'Please connect to Supabase first');
      return;
    }

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      console.log('🔄 Fetching booking management data...', forceRefresh ? '(Force Refresh)' : '', `[${timestamp}]`);
      
      // Fetch bookings and villas in parallel
      const [bookingsData, villasData] = await Promise.all([
        BookingService.getBookings(),
        VillaService.getAllVillas()
      ]);

      console.log('✅ Fetched data:', {
        bookings: bookingsData.length,
        villas: villasData.length,
        timestamp: timestamp
      });
      
      // Show sample booking data to verify freshness
      if (bookingsData.length > 0) {
        console.log('📊 Sample booking data:', {
          id: bookingsData[0].id,
          booking_id: bookingsData[0].booking_id,
          guest_name: bookingsData[0].guest_name,
          status: bookingsData[0].status,
          updated_at: bookingsData[0].updated_at
        });
      }

      setBookings(bookingsData);
      setVillas(villasData);
      
      if (bookingsData.length === 0) {
        showWarning('No Bookings Found', 'No bookings exist in the database yet. Bookings will appear here once guests make reservations.');
      }
    } catch (error) {
      console.error('❌ Failed to fetch booking data:', error);
      showError('Loading Failed', error instanceof Error ? error.message : 'Failed to load booking data');
      setBookings([]);
      setVillas([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData(true); // Force refresh
      showSuccess('Data Refreshed', 'Booking data has been updated from the database');
    } catch (error) {
      showError('Refresh Failed', 'Failed to refresh booking data');
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((booking: any) =>
        booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking: any) => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((booking: any) => booking.payment_status === paymentFilter);
    }

    // Villa filter
    if (villaFilter !== 'all') {
      filtered = filtered.filter((booking: any) => booking.villa_id === villaFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter((booking: any) => 
            booking.check_in === today || booking.check_out === today
          );
          break;
        case 'upcoming':
          filtered = filtered.filter((booking: any) => 
            new Date(booking.check_in) > now
          );
          break;
        case 'current':
          filtered = filtered.filter((booking: any) => 
            new Date(booking.check_in) <= now && new Date(booking.check_out) > now
          );
          break;
        case 'past':
          filtered = filtered.filter((booking: any) => 
            new Date(booking.check_out) < now
          );
          break;
      }
    }

    setFilteredBookings(filtered);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      console.log(`🔄 Updating booking ${bookingId} status to: ${newStatus}`);
      
      const result = await BookingService.updateBookingStatus(bookingId, newStatus as any);
      
      if (result.success) {
        console.log('✅ Status update successful, refreshing data...');
        showSuccess('Status Updated', `Booking status changed to ${newStatus}`);
        
        // Force immediate refresh
        await fetchData();
      } else {
        console.error('❌ Status update failed:', result.error);
        showError('Update Failed', result.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      showError('Update Failed', error instanceof Error ? error.message : 'Failed to update booking status');
    }
  };

  const handleEditBooking = (booking: any) => {
    console.log('✏️ Opening edit modal for booking:', booking.booking_id);
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBooking(null);
    // Force refresh after edit with a small delay to ensure database is updated
    setTimeout(() => {
      console.log('🔄 Refreshing data after booking update...');
      fetchData(true); // Force refresh
    }, 500);
  };

  const handleDeleteBooking = (booking: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Booking',
      message: `Are you sure you want to delete booking ${booking.booking_id} for ${booking.guest_name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          console.log('🗑️ Deleting booking:', booking.booking_id);
          
          const result = await BookingService.deleteBooking(booking.id);
          
          if (result.success) {
            console.log('✅ Booking deleted successfully');
            showSuccess('Booking Deleted', 'Booking has been permanently deleted');
            await fetchData();
          } else {
            console.error('❌ Delete failed:', result.error);
            showError('Delete Failed', result.error || 'Failed to delete booking');
          }
        } catch (error) {
          console.error('❌ Delete error:', error);
          showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete booking');
        }
      }
    });
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedBookings.length === 0) {
      showWarning('No Selection', 'Please select bookings to update');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Bulk Status Update',
      message: `Are you sure you want to change the status of ${selectedBookings.length} booking(s) to "${newStatus}"?`,
      onConfirm: async () => {
        try {
          console.log(`🔄 Bulk updating ${selectedBookings.length} bookings to: ${newStatus}`);
          
          const result = await BookingService.bulkUpdateBookingStatus(selectedBookings, newStatus as any);
          
          if (result.success) {
            console.log('✅ Bulk update successful');
            showSuccess('Bulk Update Complete', `Updated ${selectedBookings.length} booking(s)`);
            setSelectedBookings([]);
            await fetchData();
          } else {
            console.error('❌ Bulk update failed:', result.error);
            showError('Bulk Update Failed', result.error || 'Failed to update bookings');
          }
        } catch (error) {
          console.error('❌ Bulk update error:', error);
          showError('Bulk Update Failed', error instanceof Error ? error.message : 'Failed to update bookings');
        }
      }
    });
  };

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((booking: any) => booking.booking_id));
    }
  };

  const exportBookings = () => {
    try {
      const csvContent = generateCSV();
      downloadCSV(csvContent, `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
      showSuccess('Export Complete', 'Bookings exported successfully');
    } catch (error) {
      showError('Export Failed', 'Failed to export bookings');
    }
  };

  const generateCSV = () => {
    const headers = [
      'Booking ID', 'Guest Name', 'Email', 'Phone', 'Villa', 'Check-in', 'Check-out', 
      'Guests', 'Total Amount', 'Status', 'Payment Status', 'Created At'
    ];
    
    const rows = filteredBookings.map((booking: any) => [
      booking.booking_id,
      booking.guest_name,
      booking.email,
      booking.phone,
      booking.villa_name,
      booking.check_in,
      booking.check_out,
      booking.guests,
      booking.total_amount,
      booking.status,
      booking.payment_status,
      new Date(booking.created_at).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Show connection error if Supabase not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary-950 mb-2">Database Not Connected</h2>
          <p className="text-primary-700 mb-6">
            Please connect to Supabase to manage bookings. Click the "Connect to Supabase" button in the top right corner.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-950">Booking Management</h1>
          <p className="text-primary-700 mt-1">Manage guest reservations and bookings</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={refreshData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={exportBookings}
            disabled={filteredBookings.length === 0}
            className="bg-primary-800 hover:bg-primary-900 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="advance_paid">Half Paid (Advance)</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-primary-800 hover:bg-primary-900 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-primary-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={villaFilter}
              onChange={(e) => setVillaFilter(e.target.value)}
              className="px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
            >
              <option value="all">All Villas</option>
              {villas.map((villa: any) => (
                <option key={villa.id} value={villa.id}>{villa.name}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="current">Current Guests</option>
              <option value="past">Past Bookings</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentFilter('all');
                setVillaFilter('all');
                setDateFilter('all');
                setShowFilters(false);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedBookings.length} booking(s) selected
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkStatusUpdate('confirmed')}
                className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Confirm Selected
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('completed')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Complete Selected
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('cancelled')}
                className="bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Cancel Selected
              </button>
              <button 
                onClick={() => setSelectedBookings([])}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-primary-300" />
            <h3 className="text-xl font-medium text-primary-600 mb-2">
              {bookings.length === 0 ? 'No Bookings Yet' : 'No Matching Bookings'}
            </h3>
            <p className="text-primary-500 mb-6">
              {bookings.length === 0 
                ? 'Bookings will appear here once guests make reservations through the website.'
                : 'Try adjusting your search criteria or filters to find bookings.'
              }
            </p>
            {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || villaFilter !== 'all' || dateFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setVillaFilter('all');
                  setDateFilter('all');
                }}
                className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
                    />
                  </th>
                  <th className="text-left p-4 font-semibold text-primary-950">Booking Details</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Guest Info</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Stay Details</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Amount</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Status</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b border-primary-100 hover:bg-primary-25 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.booking_id)}
                        onChange={() => handleSelectBooking(booking.booking_id)}
                        className="rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-primary-950">#{booking.booking_id}</p>
                        <p className="text-primary-600 text-sm">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-primary-600 text-sm">{booking.villa_name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-primary-950">{booking.guest_name}</p>
                        <p className="text-primary-600 text-sm">{booking.email}</p>
                        <p className="text-primary-600 text-sm">{booking.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-primary-950">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                        <p className="text-primary-600 text-sm">{booking.guests} guests</p>
                        <p className="text-primary-600 text-sm">
                          {Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-secondary-600">₹{booking.total_amount.toLocaleString()}</p>
                        {booking.payment_status === 'advance_paid' && booking.advance_amount > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <p className="text-orange-600 text-sm font-medium">
                                Half Paid: ₹{booking.advance_amount.toLocaleString()}
                              </p>
                            </div>
                            <p className="text-orange-500 text-xs">
                              Remaining: ₹{booking.remaining_amount?.toLocaleString() || (booking.total_amount - booking.advance_amount).toLocaleString()}
                            </p>
                            <p className="text-orange-400 text-xs">
                              Due at property
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] || 'bg-neutral-100 text-neutral-700'}`}>
                          {booking.status}
                        </span>
                        <br />
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[booking.payment_status] || 'bg-neutral-100 text-neutral-700'}`}>
                          {booking.payment_status === 'advance_paid' ? 'Half Paid' : 
                           booking.payment_status === 'paid' ? 'Paid' :
                           booking.payment_status === 'pending' ? 'Pending' :
                           booking.payment_status === 'failed' ? 'Failed' :
                           booking.payment_status === 'refunded' ? 'Refunded' :
                           booking.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditBooking(booking)}
                          className="text-primary-600 hover:text-secondary-600 transition-colors p-1 rounded hover:bg-primary-100"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBooking(booking)}
                          className="text-error-600 hover:text-error-700 transition-colors p-1 rounded hover:bg-error-100"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {/* Quick Status Actions */}
                        <div className="flex space-x-1">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="bg-success-600 hover:bg-success-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Confirm Booking"
                            >
                              Confirm
                            </button>
                          )}
                          
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'completed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Mark as Completed"
                            >
                              Complete
                            </button>
                          )}
                          
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              className="bg-error-600 hover:bg-error-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Cancel Booking"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          onClose={handleCloseEditModal}
          onSave={handleCloseEditModal}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  );
};

export default BookingManagement;