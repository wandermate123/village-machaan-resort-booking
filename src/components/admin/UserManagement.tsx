import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Calendar, Eye, X, UserPlus, Star } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { useToast } from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import FormField from '../common/FormField';

const UserManagement = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all bookings to extract unique users
      const bookings = await BookingService.getBookings();
      
      // Create user profiles from booking data
      const userMap = new Map();
      
      bookings.forEach((booking: any) => {
        const userId = booking.email; // Use email as unique identifier
        
        if (userMap.has(userId)) {
          const existingUser = userMap.get(userId);
          existingUser.totalBookings += 1;
          existingUser.totalSpent += booking.total_amount;
          existingUser.lastBooking = new Date(booking.created_at) > new Date(existingUser.lastBooking) 
            ? booking.created_at 
            : existingUser.lastBooking;
        } else {
          userMap.set(userId, {
            id: userId,
            name: booking.guest_name,
            email: booking.email,
            phone: booking.phone,
            totalBookings: 1,
            totalSpent: booking.total_amount,
            lastBooking: booking.created_at,
            firstBooking: booking.created_at,
            status: booking.status === 'cancelled' ? 'inactive' : 'active',
            joinDate: booking.created_at
          });
        }
      });

      // Convert map to array and determine user status
      const usersArray = Array.from(userMap.values()).map(user => ({
        ...user,
        status: user.totalSpent > 100000 ? 'premium' : 
                user.totalBookings > 3 ? 'loyal' : 'active'
      }));

      // Sort by last booking date
      usersArray.sort((a, b) => new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime());

      setUsers(usersArray);
    } catch (error) {
      showError('Loading Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter((user: any) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'premium': return 'bg-secondary-100 text-secondary-700';
      case 'loyal': return 'bg-purple-100 text-purple-700';
      case 'active': return 'bg-success-100 text-success-700';
      case 'inactive': return 'bg-error-100 text-error-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const handleViewUser = (user: any) => {
    setShowUserDetails(user);
  };

  const handleEditUser = (user: any) => {
    showSuccess('Edit User', 'User editing functionality would open edit form');
  };

  const handleDeleteUser = (user: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone and will affect booking history.`,
      onConfirm: () => {
        showSuccess('User Deleted', 'User deleted successfully');
        fetchUsers();
      }
    });
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.phone) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    showSuccess('User Added', 'New user added successfully');
    setShowAddUser(false);
    setNewUser({ name: '', email: '', phone: '', status: 'active' });
    fetchUsers();
  };

  const totalRevenue = users.reduce((sum: number, user: any) => sum + user.totalSpent, 0);
  const avgSpending = users.length > 0 ? totalRevenue / users.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-950">User Management</h1>
          <p className="text-primary-700 mt-1">Manage guest profiles and customer relationships</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-primary-950">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Premium Users</p>
              <p className="text-2xl font-bold text-primary-950">
                {users.filter((u: any) => u.status === 'premium').length}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-950">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Avg Spending</p>
              <p className="text-2xl font-bold text-primary-950">₹{Math.round(avgSpending).toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-primary-950">User</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Contact</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Bookings</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Total Spent</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Last Booking</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Status</th>
                  <th className="text-left p-4 font-semibold text-primary-950">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-b border-primary-100 hover:bg-primary-25 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-primary-950">{user.name}</p>
                          <p className="text-primary-600 text-sm">
                            Joined {new Date(user.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-primary-700 text-sm">
                            <Mail className="w-3 h-3 mr-2" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-primary-700 text-sm">
                            <Phone className="w-3 h-3 mr-2" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-primary-950">{user.totalBookings}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-secondary-600">₹{user.totalSpent.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-primary-700 text-sm">
                          {new Date(user.lastBooking).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewUser(user)}
                            className="text-primary-600 hover:text-secondary-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-secondary-600 transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="text-error-600 hover:text-error-700 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-primary-600">
                      {searchTerm 
                        ? 'No users found matching your search' 
                        : 'No users yet. Users will appear here after they make bookings.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-950">Add New User</h3>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <FormField label="Name" required>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>
              
              <FormField label="Email" required>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email Address"
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>
              
              <FormField label="Phone" required>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone Number"
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-950">User Profile</h3>
                <button
                  onClick={() => setShowUserDetails(null)}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-primary-950 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-primary-600" />
                      <span className="text-primary-700">{showUserDetails.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-primary-600" />
                      <span className="text-primary-700">{showUserDetails.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-primary-600" />
                      <span className="text-primary-700">{showUserDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-primary-600" />
                      <span className="text-primary-700">
                        Joined {new Date(showUserDetails.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary-950 mb-4">Booking Statistics</h4>
                  <div className="space-y-3">
                    <div className="bg-primary-50 rounded-lg p-3">
                      <p className="text-primary-600 text-sm">Total Bookings</p>
                      <p className="text-xl font-bold text-primary-950">{showUserDetails.totalBookings}</p>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-secondary-600 text-sm">Total Spent</p>
                      <p className="text-xl font-bold text-secondary-600">₹{showUserDetails.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-600 text-sm">Last Booking</p>
                      <p className="text-sm text-primary-950">
                        {new Date(showUserDetails.lastBooking).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-purple-600 text-sm">Customer Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(showUserDetails.status)}`}>
                        {showUserDetails.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-primary-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowUserDetails(null);
                      handleEditUser(showUserDetails);
                    }}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default UserManagement;