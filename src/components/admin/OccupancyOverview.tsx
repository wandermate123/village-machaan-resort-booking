import React, { useState, useEffect } from 'react';
import { Calendar, Users, Home, MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, Filter, Download, Eye, X } from 'lucide-react';
import { OccupancyService, VillaOccupancyData } from '../../services/occupancyService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

interface OccupancyData {
  date: string;
  villas: {
    [villaId: string]: {
      villaName: string;
      totalUnits: number;
      occupiedUnits: number;
      availableUnits: number;
      guests: {
        bookingId: string;
        guestName: string;
        email: string;
        phone: string;
        guests: number;
        checkIn: string;
        checkOut: string;
        status: string;
        unitNumber?: string;
      }[];
    };
  };
}

const OccupancyOverview = () => {
  const { showError } = useToast();
  const [occupancyData, setOccupancyData] = useState<VillaOccupancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [villaFilter, setVillaFilter] = useState('all');

  useEffect(() => {
    fetchOccupancyData();
  }, [selectedDate, viewMode, villaFilter]);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      let data: VillaOccupancyData[] = [];
      
      switch (viewMode) {
        case 'daily':
          data = await OccupancyService.getOccupancyForDate(selectedDate.toISOString().split('T')[0]);
          break;
        case 'weekly':
          const weeklyData = await OccupancyService.getWeeklyOccupancy(selectedDate.toISOString().split('T')[0]);
          // Flatten weekly data for display
          data = weeklyData.flat();
          break;
        case 'monthly':
          const monthlyData = await OccupancyService.getMonthlyOccupancy(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
          // Flatten monthly data for display
          data = monthlyData.flat();
          break;
      }

      // Filter by villa if needed
      if (villaFilter !== 'all') {
        data = data.filter(item => item.villa_id === villaFilter);
      }

      setOccupancyData(data);
      console.log('📊 Occupancy data loaded successfully:', data);
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      showError('Loading Error', 'Failed to load occupancy data');
    } finally {
      setLoading(false);
    }
  };

  // Villa configuration
  const VILLA_CONFIG = {
    'hornbill-villa': { name: 'Hornbill Villa', total: 4 },
    'kingfisher-villa': { name: 'Kingfisher Villa', total: 4 },
    'glass-cottage': { name: 'Glass Cottage', total: 14 }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'daily':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setSelectedDate(newDate);
  };


  const exportOccupancyReport = () => {
    const csvData = generateOccupancyCSV();
    downloadCSV(csvData, `occupancy-report-${selectedDate.toISOString().split('T')[0]}.csv`);
  };

  const generateOccupancyCSV = () => {
    const headers = ['Date', 'Villa', 'Unit', 'Guest Name', 'Email', 'Phone', 'Guests', 'Check-in', 'Check-out', 'Status'];
    const rows = [];
    
    occupancyData.forEach(dayData => {
      Object.entries(dayData.villas).forEach(([villaId, villaData]) => {
        if (villaData.guests.length === 0) {
          rows.push([dayData.date, villaData.villaName, 'Available', '', '', '', '', '', '', 'Available']);
        } else {
          villaData.guests.forEach(guest => {
            rows.push([
              dayData.date,
              villaData.villaName,
              guest.unitNumber,
              guest.guestName,
              guest.email,
              guest.phone,
              guest.guests,
              guest.checkIn,
              guest.checkOut,
              guest.status
            ]);
          });
        }
      });
    });
    
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

  const getTotalOccupancy = () => {
    const totalUnits = occupancyData.reduce((sum, villa) => sum + villa.total_units, 0);
    const occupiedUnits = occupancyData.reduce((sum, villa) => sum + villa.occupied_units, 0);
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    return {
      totalUnits,
      occupiedUnits,
      availableUnits,
      occupancyRate
    };
  };

  const getOccupancyColor = (occupancyRate: number) => {
    if (occupancyRate >= 90) return 'bg-red-500';
    if (occupancyRate >= 70) return 'bg-yellow-500';
    if (occupancyRate >= 40) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const formatDateHeader = (date: string) => {
    const dateObj = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const totalStats = getTotalOccupancy();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-950">Villa Occupancy Overview</h1>
          <p className="text-primary-700 mt-1">Real-time view of current and upcoming guests</p>
        </div>
        <div className="flex gap-3">
          <select
            value={villaFilter}
            onChange={(e) => setVillaFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
          >
            <option value="all">All Villas</option>
            {Object.entries(VILLA_CONFIG).map(([villaId, config]) => (
              <option key={villaId} value={villaId}>{config.name}</option>
            ))}
          </select>
          <button 
            onClick={exportOccupancyReport}
            className="bg-primary-800 hover:bg-primary-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-primary-600" />
            </button>
            
            <h2 className="text-xl font-semibold text-primary-950">
              {viewMode === 'daily' && selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {viewMode === 'weekly' && `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              {viewMode === 'monthly' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-primary-600" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {['daily', 'weekly', 'monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-secondary-600 text-white'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Home className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{totalStats.totalUnits}</p>
            <p className="text-blue-700 text-sm">Total Units</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{totalStats.occupiedUnits}</p>
            <p className="text-green-700 text-sm">Occupied</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <MapPin className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-600">{totalStats.availableUnits}</p>
            <p className="text-gray-700 text-sm">Available</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{totalStats.occupancyRate}%</p>
            <p className="text-purple-700 text-sm">Occupancy Rate</p>
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
            {occupancyData.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No occupancy data available for the selected period</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {occupancyData.map((villa) => (
                    <div key={villa.villa_id} className="border border-primary-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-primary-950">{villa.villa_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOccupancyColor(villa.occupancy_rate)} text-white`}>
                          {villa.occupancy_rate}%
                              </span>
                              </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-primary-600">Total Units:</span>
                          <span className="font-medium text-lg">{villa.total_units}</span>
                            </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-orange-600">Occupied:</span>
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

                      {/* Bookings */}
                      {villa.bookings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-primary-700">Current Bookings:</p>
                          {villa.bookings.map((booking) => (
                            <div 
                              key={booking.booking_id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => console.log('Guest clicked:', booking)}
                            >
                              <div>
                                <p className="font-medium text-primary-950">{booking.guest_name}</p>
                                <p className="text-primary-600">{booking.guests} guests</p>
                                {booking.unit_number && (
                                  <p className="text-xs text-primary-500">Unit: {booking.unit_number}</p>
                                )}
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
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default OccupancyOverview;