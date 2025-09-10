import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Users,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { SafariQueriesService, SafariQuery, SafariQueryFilters, SafariQueryStats } from '../../services/safariQueriesService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

const SafariQueriesManagement = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [queries, setQueries] = useState<SafariQuery[]>([]);
  const [stats, setStats] = useState<SafariQueryStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    this_month: 0,
    this_week: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SafariQuery | null>(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState<SafariQueryFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queriesData, statsData] = await Promise.all([
        SafariQueriesService.getSafariQueries(filters),
        SafariQueriesService.getSafariQueryStats()
      ]);
      
      setQueries(queriesData);
      setStats(statsData);
      console.log('📊 Safari queries data loaded:', queriesData.length, 'queries');
    } catch (error) {
      console.error('Error fetching safari queries data:', error);
      showError('Loading Error', 'Failed to load safari queries data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      showSuccess('Data Refreshed', 'Safari queries data has been updated');
    } catch (error) {
      showError('Refresh Failed', 'Failed to refresh safari queries data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewQuery = (query: SafariQuery) => {
    setSelectedQuery(query);
    setShowQueryModal(true);
  };

  const handleRespondToQuery = (query: SafariQuery) => {
    setSelectedQuery(query);
    setResponseText(query.response || '');
    setAdminNotes(query.admin_notes || '');
    setShowResponseModal(true);
  };

  const handleSendResponse = async () => {
    if (!selectedQuery || !responseText.trim()) {
      showError('Validation Error', 'Please enter a response message');
      return;
    }

    try {
      const result = await SafariQueriesService.respondToQuery(
        selectedQuery.id,
        responseText,
        adminNotes,
        'admin'
      );

      if (result.success) {
        showSuccess('Response Sent', 'Safari query response sent successfully');
        setShowResponseModal(false);
        setResponseText('');
        setAdminNotes('');
        await fetchData();
      } else {
        showError('Response Failed', result.error || 'Failed to send response');
      }
    } catch (error) {
      showError('Response Failed', 'Failed to send response');
    }
  };

  const handleUpdateStatus = async (queryId: string, status: SafariQuery['status']) => {
    try {
      const result = await SafariQueriesService.updateQueryStatus(queryId, status);
      
      if (result.success) {
        showSuccess('Status Updated', `Safari query status updated to ${status}`);
        await fetchData();
      } else {
        showError('Update Failed', result.error || 'Failed to update status');
      }
    } catch (error) {
      showError('Update Failed', 'Failed to update status');
    }
  };

  const handleDeleteQuery = (query: SafariQuery) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Safari Query',
      message: `Are you sure you want to delete the safari query from ${query.guest_name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const result = await SafariQueriesService.deleteSafariQuery(query.id);
          
          if (result.success) {
            showSuccess('Query Deleted', 'Safari query deleted successfully');
            await fetchData();
          } else {
            showError('Delete Failed', result.error || 'Failed to delete query');
          }
        } catch (error) {
          showError('Delete Failed', 'Failed to delete query');
        }
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredQueries = queries.filter(query => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      query.guest_name.toLowerCase().includes(searchLower) ||
      query.email.toLowerCase().includes(searchLower) ||
      query.safari_name.toLowerCase().includes(searchLower) ||
      (query.booking_id && query.booking_id.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-950">Safari Queries Management</h1>
          <p className="text-primary-700">Manage and respond to safari-related inquiries</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Queries</p>
              <p className="text-2xl font-bold text-primary-950">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">This Week</p>
              <p className="text-2xl font-bold text-blue-600">{stats.this_week}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by guest name, email, or safari name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={() => setFilters({})}
              className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Queries Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Guest Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Safari Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Preferred Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary-200">
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>No safari queries found</p>
                    </td>
                  </tr>
                ) : (
                  filteredQueries.map((query) => (
                    <tr key={query.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-primary-950">{query.guest_name}</div>
                          <div className="text-sm text-primary-600">{query.email}</div>
                          {query.phone && (
                            <div className="text-sm text-primary-600">{query.phone}</div>
                          )}
                          {query.booking_id && (
                            <div className="text-xs text-gray-500">Booking: {query.booking_id}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-primary-950">{query.safari_name}</div>
                          <div className="text-sm text-primary-600">
                            {query.number_of_persons} person{query.number_of_persons !== 1 ? 's' : ''}
                          </div>
                          {query.preferred_timing && (
                            <div className="text-sm text-primary-600">Timing: {query.preferred_timing}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                        {query.preferred_date ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(query.preferred_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                          {getStatusIcon(query.status)}
                          <span className="ml-1 capitalize">{query.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                        {formatDate(query.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewQuery(query)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRespondToQuery(query)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Respond"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {/* Dropdown menu would go here */}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Query Details Modal */}
      {showQueryModal && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-950">Safari Query Details</h3>
              <button
                onClick={() => setShowQueryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Guest Information */}
              <div>
                <h4 className="text-md font-semibold text-primary-950 mb-3">Guest Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-primary-600">Name</label>
                    <p className="font-medium text-primary-950">{selectedQuery.guest_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-primary-600">Email</label>
                    <p className="font-medium text-primary-950">{selectedQuery.email}</p>
                  </div>
                  {selectedQuery.phone && (
                    <div>
                      <label className="text-sm text-primary-600">Phone</label>
                      <p className="font-medium text-primary-950">{selectedQuery.phone}</p>
                    </div>
                  )}
                  {selectedQuery.booking_id && (
                    <div>
                      <label className="text-sm text-primary-600">Booking ID</label>
                      <p className="font-medium text-primary-950">{selectedQuery.booking_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Safari Information */}
              <div>
                <h4 className="text-md font-semibold text-primary-950 mb-3">Safari Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-primary-600">Safari Name</label>
                    <p className="font-medium text-primary-950">{selectedQuery.safari_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-primary-600">Number of Persons</label>
                    <p className="font-medium text-primary-950">{selectedQuery.number_of_persons}</p>
                  </div>
                  {selectedQuery.preferred_date && (
                    <div>
                      <label className="text-sm text-primary-600">Preferred Date</label>
                      <p className="font-medium text-primary-950">{new Date(selectedQuery.preferred_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedQuery.preferred_timing && (
                    <div>
                      <label className="text-sm text-primary-600">Preferred Timing</label>
                      <p className="font-medium text-primary-950">{selectedQuery.preferred_timing}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Requirements */}
              {selectedQuery.special_requirements && (
                <div>
                  <h4 className="text-md font-semibold text-primary-950 mb-3">Special Requirements</h4>
                  <p className="text-primary-700 bg-gray-50 p-3 rounded-lg">{selectedQuery.special_requirements}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedQuery.admin_notes && (
                <div>
                  <h4 className="text-md font-semibold text-primary-950 mb-3">Admin Notes</h4>
                  <p className="text-primary-700 bg-blue-50 p-3 rounded-lg">{selectedQuery.admin_notes}</p>
                </div>
              )}

              {/* Response */}
              {selectedQuery.response && (
                <div>
                  <h4 className="text-md font-semibold text-primary-950 mb-3">Response</h4>
                  <p className="text-primary-700 bg-green-50 p-3 rounded-lg">{selectedQuery.response}</p>
                  {selectedQuery.responded_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Responded on {formatDate(selectedQuery.responded_at)}
                      {selectedQuery.responded_by && ` by ${selectedQuery.responded_by}`}
                    </p>
                  )}
                </div>
              )}

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedQuery.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedQuery.id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedQuery.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {selectedQuery.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedQuery.id, 'completed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-950">Respond to Safari Query</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Response Message *
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your response to the guest..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Internal notes (not visible to guest)..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendResponse}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default SafariQueriesManagement;



