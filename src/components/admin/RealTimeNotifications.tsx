import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, DollarSign, Calendar, Users, Package } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'cancellation' | 'system' | 'checkin' | 'checkout';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
    
    // Set up real-time subscription if Supabase is configured
    if (isSupabaseConfigured && supabase) {
      setupRealtimeSubscription();
    }

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentActivity = async () => {
    try {
      const bookings = await BookingService.getBookings();
      const recentBookings = bookings
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 20); // Get last 20 activities

      const activityNotifications: Notification[] = [];

      recentBookings.forEach((booking: any) => {
        const bookingDate = new Date(booking.created_at);
        const updateDate = new Date(booking.updated_at);
        const now = new Date();
        const hoursSinceCreated = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);
        const hoursSinceUpdated = (now.getTime() - updateDate.getTime()) / (1000 * 60 * 60);

        // Only show notifications from last 24 hours
        if (hoursSinceCreated <= 24) {
          // New booking notification
          activityNotifications.push({
            id: `booking-${booking.id}`,
            type: 'booking',
            title: 'New Booking Received',
            message: `${booking.guest_name} booked ${booking.villa_name} for ₹${booking.total_amount.toLocaleString()}`,
            timestamp: bookingDate,
            read: hoursSinceCreated > 1, // Mark as read if older than 1 hour
            data: booking
          });
        }

        // Payment confirmation notification
        if (booking.payment_status === 'paid' && hoursSinceUpdated <= 24) {
          activityNotifications.push({
            id: `payment-${booking.id}`,
            type: 'payment',
            title: 'Payment Confirmed',
            message: `Payment of ₹${booking.total_amount.toLocaleString()} confirmed for booking ${booking.booking_id}`,
            timestamp: updateDate,
            read: hoursSinceUpdated > 1,
            data: booking
          });
        }

        // Cancellation notification
        if (booking.status === 'cancelled' && hoursSinceUpdated <= 24) {
          activityNotifications.push({
            id: `cancellation-${booking.id}`,
            type: 'cancellation',
            title: 'Booking Cancelled',
            message: `Booking ${booking.booking_id} by ${booking.guest_name} has been cancelled`,
            timestamp: updateDate,
            read: hoursSinceUpdated > 1,
            data: booking
          });
        }

        // Check-in reminders (for today's check-ins)
        const checkInDate = new Date(booking.check_in);
        const isToday = checkInDate.toDateString() === now.toDateString();
        if (isToday && booking.status === 'confirmed') {
          activityNotifications.push({
            id: `checkin-${booking.id}`,
            type: 'checkin',
            title: 'Check-in Today',
            message: `${booking.guest_name} checking in today at ${booking.villa_name}`,
            timestamp: checkInDate,
            read: false,
            data: booking
          });
        }

        // Check-out reminders (for today's check-outs)
        const checkOutDate = new Date(booking.check_out);
        const isCheckoutToday = checkOutDate.toDateString() === now.toDateString();
        if (isCheckoutToday && booking.status === 'confirmed') {
          activityNotifications.push({
            id: `checkout-${booking.id}`,
            type: 'checkout',
            title: 'Check-out Today',
            message: `${booking.guest_name} checking out today from ${booking.villa_name}`,
            timestamp: checkOutDate,
            read: false,
            data: booking
          });
        }
      });

      // Remove duplicates and sort by timestamp
      const uniqueNotifications = activityNotifications
        .filter((notification, index, self) => 
          index === self.findIndex(n => n.id === notification.id)
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50); // Keep last 50 notifications

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!supabase) return;

    // Subscribe to booking changes
    const bookingSubscription = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          handleRealtimeBookingChange(payload);
        }
      )
      .subscribe();

    // Subscribe to payment changes
    const paymentSubscription = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          handleRealtimePaymentChange(payload);
        }
      )
      .subscribe();

    return () => {
      bookingSubscription.unsubscribe();
      paymentSubscription.unsubscribe();
    };
  };

  const handleRealtimeBookingChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      // New booking created
      addNotification({
        type: 'booking',
        title: 'New Booking Received',
        message: `${newRecord.guest_name} booked ${newRecord.villa_name} for ₹${newRecord.total_amount.toLocaleString()}`,
        data: newRecord
      });
    } else if (eventType === 'UPDATE') {
      // Booking status changed
      if (oldRecord.status !== newRecord.status) {
        if (newRecord.status === 'cancelled') {
          addNotification({
            type: 'cancellation',
            title: 'Booking Cancelled',
            message: `Booking ${newRecord.booking_id} has been cancelled`,
            data: newRecord
          });
        } else if (newRecord.status === 'confirmed') {
          addNotification({
            type: 'booking',
            title: 'Booking Confirmed',
            message: `Booking ${newRecord.booking_id} has been confirmed`,
            data: newRecord
          });
        }
      }

      // Payment status changed
      if (oldRecord.payment_status !== newRecord.payment_status) {
        if (newRecord.payment_status === 'paid') {
          addNotification({
            type: 'payment',
            title: 'Payment Confirmed',
            message: `Full payment of ₹${newRecord.total_amount.toLocaleString()} confirmed for booking ${newRecord.booking_id}`,
            data: newRecord
          });
        } else if (newRecord.payment_status === 'advance_paid') {
          addNotification({
            type: 'payment',
            title: 'Half Payment Received',
            message: `Half payment of ₹${newRecord.advance_amount?.toLocaleString() || Math.round(newRecord.total_amount / 2).toLocaleString()} received for booking ${newRecord.booking_id}. Remaining: ₹${newRecord.remaining_amount?.toLocaleString() || Math.round(newRecord.total_amount / 2).toLocaleString()}`,
            data: newRecord
          });
        }
      }
    }
  };

  const handleRealtimePaymentChange = (payload: any) => {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT' && newRecord.status === 'captured') {
      addNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `Payment of ₹${newRecord.amount.toLocaleString()} received`,
        data: newRecord
      });
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `${notificationData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'cancellation': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checkin': return <Users className="w-4 h-4 text-purple-500" />;
      case 'checkout': return <Users className="w-4 h-4 text-orange-500" />;
      case 'system': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return 'border-l-blue-500';
      case 'payment': return 'border-l-green-500';
      case 'cancellation': return 'border-l-red-500';
      case 'checkin': return 'border-l-purple-500';
      case 'checkout': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-primary-600 hover:text-secondary-600 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-primary-200 z-50">
          <div className="p-4 border-b border-primary-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary-950">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-secondary-600 hover:text-secondary-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full mx-auto mb-2"></div>
                <p className="text-primary-600 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-primary-100 hover:bg-primary-50 transition-colors cursor-pointer border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-primary-950`}>
                        {notification.title}
                      </p>
                      <p className="text-primary-700 text-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-primary-500 text-xs mt-2">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                      
                      {/* Additional context for specific notification types */}
                      {notification.type === 'booking' && notification.data && (
                        <div className="mt-2 text-xs text-primary-600">
                          <span className="bg-primary-100 px-2 py-1 rounded">
                            {new Date(notification.data.check_in).toLocaleDateString()} - {new Date(notification.data.check_out).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {notification.type === 'payment' && notification.data && (
                        <div className="mt-2 text-xs text-green-600">
                          <span className="bg-green-100 px-2 py-1 rounded">
                            Payment ID: {notification.data.razorpay_payment_id || 'Demo Payment'}
                          </span>
                        </div>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-primary-600">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent notifications</p>
                <p className="text-xs text-primary-500 mt-1">
                  Notifications will appear here when bookings are made or updated
                </p>
              </div>
            )}
          </div>

          {/* Notification Settings */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-primary-200 bg-primary-25">
              <div className="flex items-center justify-between text-xs text-primary-600">
                <span>
                  Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    if (Notification.permission === 'default') {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          new Notification('Notifications Enabled', {
                            body: 'You will now receive browser notifications for new bookings and updates.',
                            icon: '/favicon.ico'
                          });
                        }
                      });
                    }
                  }}
                  className="text-secondary-600 hover:text-secondary-700 transition-colors"
                >
                  {Notification.permission === 'granted' ? 'Notifications On' : 'Enable Notifications'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;