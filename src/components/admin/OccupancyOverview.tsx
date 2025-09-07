import React, { useState, useEffect } from 'react';
import { Calendar, Users, Home, MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, Filter, Download, Eye, X } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { VillaService } from '../../services/villaService';
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
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [villaFilter, setVillaFilter] = useState('all');

  useEffect(() => {
    fetchOccupancyData();
  }, [selectedDate, viewMode, villaFilter]);

  useEffect(() => {
    fetchVillas();
  }, []);

  const fetchVillas = async () => {
    try {
      const villasData = await VillaService.getAllVillas();
      setVillas(villasData);
    } catch (error) {
      showError('Loading Error', 'Failed to load villa data');
    }
  };

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      const dates = generateDateRange();
      const occupancyPromises = dates.map(async (date) => {
        const dateStr = date.toISOString().split('T')[0];
        
        // Group by villa
        const villaOccupancy: OccupancyData['villas'] = {};
        
        // Initialize all villas with real data from InventoryService
        for (const villa of villas) {
          if (villaFilter === 'all' || villaFilter === villa.id) {
            try {
              // Get real availability data
              const units = await InventoryService.getAvailableUnits(villa.id, dateStr, dateStr);
              
              // Get occupancy data for this date
              const occupancyForDate = await InventoryService.getOccupancyForDates(dateStr, dateStr);
              const villaOccupancyData = occupancyForDate.filter(occ => occ.villa_id === villa.id);
              
              villaOccupancy[villa.id] = {
                villaName: villa.name,
                totalUnits: units.totalUnits,
                occupiedUnits: villaOccupancyData.length,
                availableUnits: units.availableUnits,
                guests: villaOccupancyData.map(occ => ({
                  bookingId: occ.booking_id,
                  guestName: occ.guest_name,
                  email: occ.email,
                  phone: occ.phone,
                  guests: occ.guests,
                  checkIn: occ.check_in,
                  checkOut: occ.check_out,
                  status: occ.status,
                  unitNumber: occ.unit_number
                }))
              };
            } catch (error) {
              console.error(`Error fetching data for villa ${villa.id} on ${dateStr}:`, error);
              // Fallback to basic data
              const totalUnits = getVillaTotalUnits(villa.id);
              villaOccupancy[villa.id] = {
                villaName: villa.name,
                totalUnits,
                occupiedUnits: 0,
                availableUnits: totalUnits,
                guests: []
              };
            }
          }
        }

        return {
          date: dateStr,
          villas: villaOccupancy
        };
      });

      const occupancyResults = await Promise.all(occupancyPromises);
      setOccupancyData(occupancyResults);
      console.log('📊 Occupancy data loaded successfully:', occupancyResults);
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      showError('Loading Error', 'Failed to load occupancy data');
    } finally {
      setLoading(false);
    }
  };

  const generateDateRange = () => {
    const dates = [];
    const start = new Date(selectedDate);
    
    switch (viewMode) {
      case 'daily':
        dates.push(new Date(start));
        break;
      case 'weekly':
        // Get start of week (Sunday)
        const startOfWeek = new Date(start);
        startOfWeek.setDate(start.getDate() - start.getDay());
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          dates.push(date);
        }
        break;
      case 'monthly':
        // Get all days in the month
        const year = start.getFullYear();
        const month = start.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          dates.push(new Date(year, month, i));
        }
        break;
    }
    
    return dates;
  };

  const getVillaTotalUnits = (villaId: string) => {
    switch (villaId) {
      case 'glass-cottage': return 14;
      case 'hornbill-villa': return 4;
      case 'kingfisher-villa': return 4;
      default: return 1;
    }
  };

  const generateUnitNumber = (villaId: string, bookingId: string) => {
    // Generate consistent unit numbers based on booking ID
    const hash = bookingId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const totalUnits = getVillaTotalUnits(villaId);
    const unitNum = Math.abs(hash % totalUnits) + 1;
    
    switch (villaId) {
      case 'glass-cottage': return `GC-${unitNum.toString().padStart(2, '0')}`;
      case 'hornbill-villa': return `HV-${unitNum.toString().padStart(2, '0')}`;
      case 'kingfisher-villa': return `KV-${unitNum.toString().padStart(2, '0')}`;
      default: return `U-${unitNum}`;
    }
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

  const handleViewGuest = (guest: any) => {
    setSelectedGuest(guest);
    setShowGuestDetails(true);
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
    let totalUnits = 0;
    let occupiedUnits = 0;
    
    occupancyData.forEach(dayData => {
      Object.values(dayData.villas).forEach(villa => {
        totalUnits += villa.totalUnits;
        occupiedUnits += villa.occupiedUnits;
      });
    });
    
    return {
      totalUnits,
      occupiedUnits,
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
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
            {villas.map((villa: any) => (
              <option key={villa.id} value={villa.id}>{villa.name}</option>
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
            <p className="text-2xl font-bold text-gray-600">{totalStats.totalUnits - totalStats.occupiedUnits}</p>
            <p className="text-gray-700 text-sm">Available</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{totalStats.occupancyRate.toFixed(1)}%</p>
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
            {viewMode === 'daily' ? (
              // Daily View - Detailed guest list
              <div className="p-6">
                {occupancyData.length > 0 && (
                  <div className="space-y-6">
                    {Object.entries(occupancyData[0].villas).map(([villaId, villaData]) => (
                      <div key={villaId} className="border border-primary-200 rounded-lg overflow-hidden">
                        <div className="bg-primary-50 px-6 py-4 border-b border-primary-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-primary-950">{villaData.villaName}</h3>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-primary-700">
                                {villaData.occupiedUnits}/{villaData.totalUnits} units occupied
                              </span>
                              <div className="w-20 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className={`h-full rounded-full ${getOccupancyColor((villaData.occupiedUnits / villaData.totalUnits) * 100)}`}
                                  style={{ width: `${(villaData.occupiedUnits / villaData.totalUnits) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          {villaData.guests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {villaData.guests.map((guest, idx) => (
                                <div key={idx} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                                      Unit {guest.unitNumber}
                                    </span>
                                    <button
                                      onClick={() => handleViewGuest(guest)}
                                      className="text-primary-600 hover:text-secondary-600 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <h4 className="font-semibold text-primary-950 mb-2">{guest.guestName}</h4>
                                  <div className="space-y-1 text-sm text-primary-700">
                                    <div className="flex items-center">
                                      <Users className="w-3 h-3 mr-2" />
                                      <span>{guest.guests} guests</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-2" />
                                      <span>{new Date(guest.checkIn).toLocaleDateString()} - {new Date(guest.checkOut).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="w-3 h-3 mr-2" />
                                      <span>{guest.phone}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      guest.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                                      guest.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {guest.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-primary-600">
                              <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>All units available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Weekly/Monthly View - Grid format
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-200">
                        <th className="text-left p-3 font-semibold text-primary-950">Villa</th>
                        {occupancyData.map((dayData) => (
                          <th key={dayData.date} className="text-center p-3 font-semibold text-primary-950 min-w-32">
                            {formatDateHeader(dayData.date)}
                            <div className="text-xs text-primary-600 font-normal">
                              {new Date(dayData.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {villas.map((villa: any) => {
                        if (villaFilter !== 'all' && villaFilter !== villa.id) return null;
                        
                        return (
                          <tr key={villa.id} className="border-b border-primary-100">
                            <td className="p-3">
                              <div>
                                <p className="font-semibold text-primary-950">{villa.name}</p>
                                <p className="text-primary-600 text-sm">{getVillaTotalUnits(villa.id)} units</p>
                              </div>
                            </td>
                            {occupancyData.map((dayData) => {
                              const villaData = dayData.villas[villa.id];
                              if (!villaData) {
                                return (
                                  <td key={dayData.date} className="p-3 text-center">
                                    <div className="bg-gray-100 rounded p-2">
                                      <p className="text-sm text-gray-600">No data</p>
                                    </div>
                                  </td>
                                );
                              }
                              
                              const occupancyRate = (villaData.occupiedUnits / villaData.totalUnits) * 100;
                              
                              return (
                                <td key={dayData.date} className="p-3 text-center">
                                  <div className="space-y-2">
                                    <div className={`rounded-lg p-3 ${
                                      villaData.occupiedUnits === 0 ? 'bg-gray-100' :
                                      occupancyRate >= 90 ? 'bg-red-100' :
                                      occupancyRate >= 70 ? 'bg-yellow-100' :
                                      'bg-green-100'
                                    }`}>
                                      <p className="font-bold text-primary-950">
                                        {villaData.occupiedUnits}/{villaData.totalUnits}
                                      </p>
                                      <p className="text-xs text-primary-600">
                                        {villaData.guests.reduce((sum, guest) => sum + guest.guests, 0)} guests
                                      </p>
                                    </div>
                                    
                                    {villaData.guests.length > 0 && (
                                      <div className="space-y-1">
                                        {villaData.guests.slice(0, 2).map((guest, idx) => (
                                          <div key={idx} className="text-xs bg-white border border-primary-200 rounded p-1">
                                            <p className="font-medium text-primary-950 truncate">{guest.guestName}</p>
                                            <p className="text-primary-600">{guest.unitNumber}</p>
                                          </div>
                                        ))}
                                        {villaData.guests.length > 2 && (
                                          <p className="text-xs text-primary-600">+{villaData.guests.length - 2} more</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest Details Modal */}
      {showGuestDetails && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-950">Guest Details</h3>
                <button
                  onClick={() => setShowGuestDetails(false)}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-lg font-semibold text-primary-950">{selectedGuest.guestName}</h4>
                <p className="text-primary-600">Unit {selectedGuest.unitNumber}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">{selectedGuest.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">{selectedGuest.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">{selectedGuest.guests} guests</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span className="text-primary-700">
                    {new Date(selectedGuest.checkIn).toLocaleDateString()} - {new Date(selectedGuest.checkOut).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary-700">Booking Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedGuest.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                    selectedGuest.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedGuest.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary-700">Booking ID:</span>
                  <span className="font-mono text-primary-950 text-sm">#{selectedGuest.bookingId}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-3 pt-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors">
                  View Full Booking
                </button>
                <button className="flex-1 bg-primary-800 hover:bg-primary-900 text-white py-2 rounded-lg text-sm transition-colors">
                  Contact Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupancyOverview;