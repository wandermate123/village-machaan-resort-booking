import React, { useState, useEffect } from 'react';
import { Calendar, Users, Home, MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, Filter, Download, Eye, X, RefreshCw } from 'lucide-react';
import { SimpleOccupancyService, SimpleOccupancyData } from '../../services/simpleOccupancyService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

const SimpleOccupancyOverview = () => {
  const { showError, showSuccess } = useToast();
  const [occupancyData, setOccupancyData] = useState<SimpleOccupancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [villaFilter, setVillaFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOccupancyData();
  }, [selectedDate, viewMode, villaFilter]);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      let data: SimpleOccupancyData[] = [];
      
      switch (viewMode) {
        case 'daily':
          data = await SimpleOccupancyService.getOccupancyForDate(selectedDate.toISOString().split('T')[0]);
          break;
        case 'weekly':
          data = await SimpleOccupancyService.getWeeklyOccupancy(selectedDate.toISOString().split('T')[0]);
          break;
        case 'monthly':
          data = await SimpleOccupancyService.getMonthlyOccupancy(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
          break;
      }

      // Filter by villa if needed
      if (villaFilter !== 'all') {
        data = data.filter(item => item.villa_id === villaFilter);
      }

      setOccupancyData(data);
      console.log('📊 Simple occupancy data loaded:', data.length, 'records');
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      showError('Loading Error', 'Failed to load occupancy data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchOccupancyData();
      showSuccess('Data Refreshed', 'Occupancy data has been updated');
    } catch (error) {
      showError('Refresh Failed', 'Failed to refresh occupancy data');
    } finally {
      setRefreshing(false);
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-orange-500';
    if (rate >= 50) return 'bg-yellow-500';
    if (rate >= 30) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getOccupancyTextColor = (rate: number) => {
    if (rate >= 90) return 'text-red-700';
    if (rate >= 70) return 'text-orange-700';
    if (rate >= 50) return 'text-yellow-700';
    if (rate >= 30) return 'text-blue-700';
    return 'text-green-700';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupDataByDate = (data: SimpleOccupancyData[]) => {
    const grouped: { [date: string]: SimpleOccupancyData[] } = {};
    data.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
    });
    return grouped;
  };

  const getTotalStats = (data: SimpleOccupancyData[]) => {
    const totalUnits = data.reduce((sum, item) => sum + item.total_units, 0);
    const occupiedUnits = data.reduce((sum, item) => sum + item.occupied_units, 0);
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    return { totalUnits, occupiedUnits, availableUnits, occupancyRate };
  };

  const groupedData = groupDataByDate(occupancyData);
  const totalStats = getTotalStats(occupancyData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-950">Occupancy Overview</h1>
          <p className="text-primary-700">Real-time villa occupancy tracking</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Units</p>
              <p className="text-2xl font-bold text-primary-950">{totalStats.totalUnits}</p>
            </div>
            <Home className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Occupied</p>
              <p className="text-2xl font-bold text-orange-600">{totalStats.occupiedUnits}</p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Available</p>
              <p className="text-2xl font-bold text-green-600">{totalStats.availableUnits}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Occupancy Rate</p>
              <p className={`text-2xl font-bold ${getOccupancyTextColor(totalStats.occupancyRate)}`}>
                {totalStats.occupancyRate}%
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full ${getOccupancyColor(totalStats.occupancyRate)}`} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary-600" />
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-primary-600" />
              <select
                value={villaFilter}
                onChange={(e) => setVillaFilter(e.target.value)}
                className="px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Villas</option>
                <option value="glass-cottage">Glass Cottage</option>
                <option value="hornbill-villa">Hornbill Villa</option>
                <option value="kingfisher-villa">Kingfisher Villa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Occupancy Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100">
          <div className="overflow-x-auto">
            {Object.keys(groupedData).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No occupancy data available for the selected period</p>
              </div>
            ) : (
              <div className="p-6">
                {Object.entries(groupedData).map(([date, villaData]) => (
                  <div key={date} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-semibold text-primary-950 mb-4">
                      {formatDate(date)}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {villaData.map((villa) => (
                        <div key={`${date}-${villa.villa_id}`} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-semibold text-primary-950">{villa.villa_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(villa.occupancy_rate)} text-white`}>
                              {villa.occupancy_rate}%
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-primary-600">Total Units:</span>
                              <span className="font-medium">{villa.total_units}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-orange-600">Occupied:</span>
                              <span className="font-medium text-orange-600">{villa.occupied_units}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Available:</span>
                              <span className="font-medium text-green-600">{villa.available_units}</span>
                            </div>
                          </div>

                          {/* Occupancy Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getOccupancyColor(villa.occupancy_rate)}`}
                              style={{ width: `${villa.occupancy_rate}%` }}
                            />
                          </div>

                          {/* Bookings */}
                          {villa.bookings.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-primary-700">Current Bookings:</p>
                              {villa.bookings.map((booking) => (
                                <div 
                                  key={booking.booking_id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setSelectedGuest(booking);
                                    setShowGuestDetails(true);
                                  }}
                                >
                                  <div>
                                    <p className="font-medium text-primary-950">{booking.guest_name}</p>
                                    <p className="text-primary-600">{booking.guests} guests</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-primary-600">
                                      {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                                    </p>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                      booking.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest Details Modal */}
      {showGuestDetails && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-950">Guest Details</h3>
              <button
                onClick={() => setShowGuestDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-primary-600">Guest Name</p>
                <p className="font-medium text-primary-950">{selectedGuest.guest_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-primary-600">Number of Guests</p>
                <p className="font-medium text-primary-950">{selectedGuest.guests}</p>
              </div>
              
              <div>
                <p className="text-sm text-primary-600">Check-in Date</p>
                <p className="font-medium text-primary-950">{new Date(selectedGuest.check_in).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-primary-600">Check-out Date</p>
                <p className="font-medium text-primary-950">{new Date(selectedGuest.check_out).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-primary-600">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedGuest.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedGuest.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedGuest.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleOccupancyOverview;
