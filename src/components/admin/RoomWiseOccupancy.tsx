import React, { useState, useEffect } from 'react';
import { Calendar, Users, Home, RefreshCw, Eye, Phone, Mail, Clock } from 'lucide-react';
import { OccupancyService, VillaOccupancyData } from '../../services/occupancyService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

const RoomWiseOccupancy = () => {
  const { showError, showSuccess } = useToast();
  const [occupancyData, setOccupancyData] = useState<VillaOccupancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  useEffect(() => {
    fetchOccupancyData();
  }, [selectedDate]);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      const data = await OccupancyService.getOccupancyForDate(selectedDate.toISOString().split('T')[0]);
      setOccupancyData(data);
      console.log('📊 Room-wise occupancy data loaded:', data);
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

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'maintenance': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRoomStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied': return '🔴';
      case 'available': return '🟢';
      case 'maintenance': return '🟡';
      default: return '⚪';
    }
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
          <h1 className="text-2xl font-bold text-primary-950">Room-Wise Occupancy</h1>
          <p className="text-primary-700">Detailed view of which guest is staying in which room</p>
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
              <p className="text-primary-600 text-sm font-medium">Occupied</p>
              <p className="text-2xl font-bold text-red-600">{totalStats.occupiedUnits}</p>
            </div>
            <Users className="w-8 h-8 text-red-600" />
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
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">{totalStats.occupancyRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Villa Room Grids */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {occupancyData.map((villa) => (
            <div key={villa.villa_id} className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-primary-950">{villa.villa_name}</h3>
                  <p className="text-primary-600">
                    {villa.occupied_units}/{villa.total_units} rooms occupied ({villa.occupancy_rate}%)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-primary-600">Occupancy:</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${villa.occupancy_rate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Room Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {villa.rooms.map((room) => (
                  <div
                    key={room.room_number}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getRoomStatusColor(room.status)}`}
                    onClick={() => {
                      if (room.status === 'occupied') {
                        setSelectedRoom(room);
                        setShowRoomDetails(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{room.room_number}</span>
                      <span className="text-lg">{getRoomStatusIcon(room.status)}</span>
                    </div>
                    
                    {room.status === 'occupied' ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium truncate">{room.guest_name}</p>
                        <p className="text-xs opacity-75">{room.guests} guests</p>
                        <div className="flex items-center justify-between">
                          <Eye className="w-3 h-3" />
                          <span className="text-xs">Click for details</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-medium capitalize">{room.status}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Details Modal */}
      {showRoomDetails && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-950">Room Details</h3>
                <button
                  onClick={() => setShowRoomDetails(false)}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Home className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-lg font-semibold text-primary-950">Room {selectedRoom.room_number}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoomStatusColor(selectedRoom.status)}`}>
                  {selectedRoom.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">{selectedRoom.guest_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">{selectedRoom.guests} guests</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">
                    {new Date(selectedRoom.check_in).toLocaleDateString()} - {new Date(selectedRoom.check_out).toLocaleDateString()}
                  </span>
                </div>
                {selectedRoom.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-primary-600" />
                    <span className="text-primary-700">{selectedRoom.email}</span>
                  </div>
                )}
                {selectedRoom.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-primary-600" />
                    <span className="text-primary-700">{selectedRoom.phone}</span>
                  </div>
                )}
              </div>

              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary-700">Booking ID:</span>
                  <span className="font-mono text-primary-950 text-sm">#{selectedRoom.booking_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomWiseOccupancy;
