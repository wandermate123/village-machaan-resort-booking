import React, { useState, useEffect } from 'react';
import { Calendar, Users, Home, RefreshCw } from 'lucide-react';
import { OccupancyService, VillaOccupancyData } from '../../services/occupancyService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

const SimpleOccupancyCard = () => {
  const { showError, showSuccess } = useToast();
  const [occupancyData, setOccupancyData] = useState<VillaOccupancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOccupancyData();
  }, [selectedDate]);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      const data = await OccupancyService.getOccupancyForDate(selectedDate.toISOString().split('T')[0]);
      setOccupancyData(data);
      console.log('📊 Occupancy data loaded:', data);
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

  const getTotalStats = () => {
    const totalUnits = occupancyData.reduce((sum, villa) => sum + villa.total_units, 0);
    const occupiedUnits = occupancyData.reduce((sum, villa) => sum + villa.occupied_units, 0);
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    return { totalUnits, occupiedUnits, availableUnits, occupancyRate };
  };

  const totalStats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-950">Room Occupancy</h1>
          <p className="text-primary-700">Real-time room availability and bookings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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
              <p className="text-primary-600 text-sm font-medium">Total Rooms</p>
              <p className="text-2xl font-bold text-primary-950">{totalStats.totalUnits}</p>
            </div>
            <Home className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Booked</p>
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
              <p className="text-2xl font-bold text-purple-600">{totalStats.occupancyRate}%</p>
            </div>
            <div className={`w-8 h-8 rounded-full ${getOccupancyColor(totalStats.occupancyRate)}`} />
          </div>
        </div>
      </div>

      {/* Villa Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {occupancyData.map((villa) => (
            <div key={villa.villa_id} className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-primary-950">{villa.villa_name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOccupancyColor(villa.occupancy_rate)} text-white`}>
                  {villa.occupancy_rate}%
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-600">Total Rooms:</span>
                  <span className="font-medium text-lg">{villa.total_units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Booked:</span>
                  <span className="font-medium text-orange-600 text-lg">{villa.occupied_units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Available:</span>
                  <span className="font-medium text-green-600 text-lg">{villa.available_units}</span>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getOccupancyColor(villa.occupancy_rate)}`}
                  style={{ width: `${villa.occupancy_rate}%` }}
                />
              </div>

              {/* Current Bookings */}
              {villa.bookings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary-700">Current Bookings ({villa.bookings.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {villa.bookings.map((booking) => (
                      <div key={booking.booking_id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-primary-950">{booking.guest_name}</p>
                            <p className="text-primary-600">{booking.guests} guests</p>
                          </div>
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleOccupancyCard;
