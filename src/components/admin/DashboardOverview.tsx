import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, Home, TrendingUp, Clock, Bell, AlertCircle, CheckCircle, Plus, FileText, Settings, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardOverview = () => {
  const { showError, showInfo } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    advancePaymentCount: 0,
    advanceRevenue: 0,
    occupancyRate: 0,
    activeGuests: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalVillas: 0,
    activeVillas: 0,
    totalPackages: 0,
    activePackages: 0,
    avgBookingValue: 0,
    recentBookings: [],
    topVillas: [],
    monthlyRevenue: []
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    database: 'checking',
    payment: 'checking',
    email: 'checking'
  });

  useEffect(() => {
    fetchDashboardData();
    checkSystemStatus();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (!loading) {
        refreshDashboardData();
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        showError('Database Not Connected', 'Please connect to Supabase to view dashboard data');
        return;
      }

      console.log('📊 Fetching dashboard statistics...');
      const dashboardStats = await AdminService.getDashboardStats();
      
      setStats(dashboardStats);
      
      // Generate recent activity from real data
      const activity = [];
      
      // Add recent bookings to activity
      dashboardStats.recentBookings.slice(0, 3).forEach((booking: any) => {
        activity.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          message: `New booking from ${booking.guest_name}`,
          details: `${booking.villa_name} - ₹${booking.total_amount.toLocaleString()}`,
          timestamp: new Date(booking.created_at),
          status: booking.status
        });
      });

      // Add payment confirmations
      dashboardStats.recentBookings
        .filter((b: any) => b.payment_status === 'paid')
        .slice(0, 2)
        .forEach((booking: any) => {
          activity.push({
            id: `payment-${booking.id}`,
            type: 'payment',
            message: `Payment confirmed for ${booking.guest_name}`,
            details: `₹${booking.total_amount.toLocaleString()} - ${booking.booking_id}`,
            timestamp: new Date(booking.updated_at),
            status: 'confirmed'
          });
        });

      // Sort activity by timestamp
      activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivity(activity.slice(0, 5));

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('Dashboard loading error:', error);
      showError('Dashboard Error', error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
      showInfo('Data Refreshed', 'Dashboard data has been updated');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const checkSystemStatus = async () => {
    const status = { database: 'offline', payment: 'demo', email: 'demo' };
    
    // Test database connection
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('villas').select('id').limit(1);
        if (!error) {
          status.database = 'online';
        } else {
          console.error('Database connection test failed:', error);
        }
      } catch (error) {
        console.error('Database connection test error:', error);
        status.database = 'offline';
      }
    } else {
      status.database = 'not_configured';
    }

    // Check if payment gateway is configured
    if (import.meta.env.VITE_RAZORPAY_KEY_ID && import.meta.env.VITE_RAZORPAY_KEY_ID !== 'demo') {
      status.payment = 'active';
    }

    // Check if email service is configured
    if (import.meta.env.VITE_EMAILJS_SERVICE_ID && import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
      status.email = 'connected';
    }
    
    setSystemStatus(status);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'checkin': return <Users className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success-50 border-success-200';
      case 'pending': return 'bg-warning-50 border-warning-200';
      case 'cancelled': return 'bg-error-50 border-error-200';
      default: return 'bg-primary-50 border-primary-200';
    }
  };

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'bg-blue-500',
      change: stats.totalBookings > 0 ? '+12%' : '0%',
      link: '/admin/bookings'
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: stats.totalRevenue > 0 ? '+8%' : '0%',
      link: '/admin/reports'
    },
    {
      title: 'Half Payments',
      value: stats.advancePaymentCount,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: stats.advancePaymentCount > 0 ? `₹${stats.advanceRevenue.toLocaleString()}` : '₹0',
      link: '/admin/bookings?filter=advance_paid',
      subtitle: `₹${stats.advanceRevenue.toLocaleString()} received`
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate.toFixed(1)}%`,
      icon: Home,
      color: 'bg-purple-500',
      change: stats.occupancyRate > 0 ? '+5%' : '0%',
      link: '/admin/occupancy'
    }
  ];

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-serif font-bold text-primary-950 mb-2">
                  Dashboard Overview
                </h1>
                <p className="text-primary-700">
                  Welcome back! Here's what's happening at Village Machaan today.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={refreshDashboardData}
                  disabled={refreshing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="text-right">
                  <p className="text-sm text-primary-600">Today</p>
                  <p className="font-semibold text-primary-950">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Link key={index} to={stat.link} className="block">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-primary-600 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-primary-950 mt-1">{stat.value}</p>
                        {stat.subtitle && (
                          <p className="text-orange-600 text-sm font-medium mt-1">{stat.subtitle}</p>
                        )}
                        <div className="flex items-center mt-2">
                          <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
                          <span className="text-success-600 text-sm font-medium">{stat.change}</span>
                        </div>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-950 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Recent Activity
                </h2>
                <Link 
                  to="/admin/bookings"
                  className="text-secondary-600 hover:text-secondary-700 text-sm font-medium transition-colors"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`p-3 rounded-lg border transition-colors ${getActivityColor(activity.status)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-950">{activity.message}</p>
                          <p className="text-xs text-primary-600 mt-1">{activity.details}</p>
                          <p className="text-xs text-primary-500 mt-1">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-primary-600">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-950">Recent Bookings</h2>
                <Link 
                  to="/admin/bookings"
                  className="text-secondary-600 hover:text-secondary-700 text-sm font-medium transition-colors"
                >
                  Manage All
                </Link>
              </div>
              <div className="space-y-4">
                {stats.recentBookings.length > 0 ? (
                  stats.recentBookings.slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                      <div>
                        <p className="font-medium text-primary-950">{booking.guest_name}</p>
                        <p className="text-primary-700 text-sm">{booking.villa_name}</p>
                        <p className="text-primary-600 text-xs">
                          {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-secondary-600">₹{booking.total_amount.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                          booking.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-error-100 text-error-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-primary-600">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No bookings yet</p>
                    <Link 
                      to="/admin/bookings"
                      className="text-secondary-600 hover:text-secondary-700 text-sm font-medium mt-2 inline-block"
                    >
                      View Booking Management
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
            <h2 className="text-xl font-semibold text-primary-950 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                to="/admin/bookings" 
                className="bg-secondary-600 hover:bg-secondary-700 text-white p-4 rounded-lg font-medium transition-all duration-300 text-left block transform hover:scale-105"
              >
                <Calendar className="w-5 h-5 mb-2" />
                <div>Manage Bookings</div>
                <div className="text-xs opacity-75">{stats.pendingBookings} pending</div>
              </Link>
              <Link 
                to="/admin/villas" 
                className="bg-primary-800 hover:bg-primary-900 text-white p-4 rounded-lg font-medium transition-all duration-300 text-left block transform hover:scale-105"
              >
                <Home className="w-5 h-5 mb-2" />
                <div>Villa Management</div>
                <div className="text-xs opacity-75">{stats.totalVillas} villas</div>
              </Link>
              <Link 
                to="/admin/reports" 
                className="bg-success-600 hover:bg-success-700 text-white p-4 rounded-lg font-medium transition-all duration-300 text-left block transform hover:scale-105"
              >
                <DollarSign className="w-5 h-5 mb-2" />
                <div>Revenue Reports</div>
                <div className="text-xs opacity-75">₹{stats.totalRevenue.toLocaleString()}</div>
              </Link>
              <Link 
                to="/admin/packages" 
                className="bg-warning-600 hover:bg-warning-700 text-white p-4 rounded-lg font-medium transition-all duration-300 text-left block transform hover:scale-105"
              >
                <Users className="w-5 h-5 mb-2" />
                <div>Package Management</div>
                <div className="text-xs opacity-75">{stats.totalPackages} packages</div>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
            <h2 className="text-xl font-semibold text-primary-950 mb-6">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                {systemStatus.database === 'online' ? (
                  <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
                ) : systemStatus.database === 'checking' ? (
                  <Clock className="w-8 h-8 text-warning-500 mx-auto mb-2" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-error-500 mx-auto mb-2" />
                )}
                <p className="text-primary-950 font-medium">Database</p>
                <p className={`text-sm ${
                  systemStatus.database === 'online' ? 'text-success-600' : 
                  systemStatus.database === 'checking' ? 'text-warning-600' : 'text-error-600'
                }`}>
                  {systemStatus.database === 'online' ? 'Connected' : 
                   systemStatus.database === 'checking' ? 'Checking...' : 'Disconnected'}
                </p>
              </div>
              <div className="text-center">
                {systemStatus.payment === 'active' ? (
                  <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-warning-500 mx-auto mb-2" />
                )}
                <p className="text-primary-950 font-medium">Payment Gateway</p>
                <p className={`text-sm ${systemStatus.payment === 'active' ? 'text-success-600' : 'text-warning-600'}`}>
                  {systemStatus.payment === 'active' ? 'Live' : 'Demo Mode'}
                </p>
              </div>
              <div className="text-center">
                {systemStatus.email === 'connected' ? (
                  <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-warning-500 mx-auto mb-2" />
                )}
                <p className="text-primary-950 font-medium">Email Service</p>
                <p className={`text-sm ${systemStatus.email === 'connected' ? 'text-success-600' : 'text-warning-600'}`}>
                  {systemStatus.email === 'connected' ? 'Active' : 'Demo Mode'}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <h2 className="text-xl font-semibold text-primary-950 mb-6">Booking Performance</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Pending Bookings</span>
                  <span className="font-semibold text-warning-600">{stats.pendingBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Confirmed Bookings</span>
                  <span className="font-semibold text-success-600">{stats.confirmedBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Completed Bookings</span>
                  <span className="font-semibold text-blue-600">{stats.completedBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Cancelled Bookings</span>
                  <span className="font-semibold text-error-600">{stats.cancelledBookings ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Average Booking Value</span>
                  <span className="font-semibold text-secondary-600">₹{Math.round(stats.avgBookingValue ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Conversion Rate</span>
                  <span className="font-semibold text-primary-950">
                    {stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <h2 className="text-xl font-semibold text-primary-950 mb-6">Property Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Total Villas</span>
                  <span className="font-semibold text-primary-950">{stats.totalVillas ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Active Villas</span>
                  <span className="font-semibold text-success-600">{stats.activeVillas ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Available Packages</span>
                  <span className="font-semibold text-primary-950">{stats.activePackages ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Current Occupancy</span>
                  <span className="font-semibold text-purple-600">{(stats.occupancyRate ?? 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Half Payments</span>
                  <span className="font-semibold text-orange-600">{stats.advancePaymentCount ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Database Status</span>
                  <span className={`font-semibold ${systemStatus.database === 'online' ? 'text-success-600' : 'text-error-600'}`}>
                    {systemStatus.database === 'online' ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;