import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Settings, Blocks as Block, Wrench, DollarSign, X, RefreshCw } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { InventoryService } from '../../services/inventoryService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

interface AvailabilityCalendarProps {
  villaId?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ villaId }) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [unitCounts, setUnitCounts] = useState<Record<string, { available: number; total: number }>>({});
  const [bookings, setBookings] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blockData, setBlockData] = useState({
    date: '',
    type: 'maintenance',
    notes: ''
  });

  useEffect(() => {
    loadAvailabilityData();
  }, [currentDate, villaId]);

  const loadAvailabilityData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const availabilityData: Record<string, boolean> = {};
      const unitCountData: Record<string, { available: number; total: number }> = {};
      const bookingData: Record<string, any[]> = {};

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (villaId) {
          const units = await InventoryService.getAvailableUnits(villaId, date, date);
          availabilityData[date] = units.availableUnits > 0;
          unitCountData[date] = {
            available: units.availableUnits,
            total: units.totalUnits
          };

          // Get bookings for this date
          const dayBookings = await BookingService.getBookings({
            dateFrom: date,
            dateTo: date,
            villaId: villaId
          });
          
          bookingData[date] = dayBookings.filter((booking: any) => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            const currentDate = new Date(date);
            return currentDate >= checkIn && currentDate < checkOut && 
                   booking.status !== 'cancelled' && booking.status !== 'no_show';
          });
        } else {
          availabilityData[date] = true; // Show all dates as available for overview
          unitCountData[date] = { available: 10, total: 10 };
          bookingData[date] = [];
        }
      }

      setAvailability(availabilityData);
      setUnitCounts(unitCountData);
      setBookings(bookingData);
    } catch (error) {
      showError('Loading Error', 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setBlockData(prev => ({ ...prev, date: dateStr }));
  };

  const handleBlockDate = () => {
    if (!selectedDate) return;
    setShowBlockModal(true);
  };

  const handleSaveBlock = async () => {
    if (!villaId || !blockData.date) return;
    
    try {
      // Get villa inventory units
      const inventory = await InventoryService.getVillaInventory(villaId);
      if (inventory.length > 0) {
        const result = await InventoryService.blockUnit(
          inventory[0].id, // Block first available unit for demo
          blockData.date,
          blockData.type as any,
          blockData.notes
        );
        
        if (result.success) {
          showSuccess('Date Blocked', 'Date blocked successfully');
          setShowBlockModal(false);
          setBlockData({ date: '', type: 'maintenance', notes: '' });
          await loadAvailabilityData();
        } else {
          showError('Block Failed', result.error || 'Failed to block date');
        }
      }
    } catch (error) {
      showError('Block Failed', 'Failed to block date');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = generateCalendar();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-primary-600" />
        </button>
        
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold text-primary-950">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={loadAvailabilityData}
            disabled={loading}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            title="Refresh Calendar"
          >
            <RefreshCw className={`w-4 h-4 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <button 
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-primary-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-primary-600 text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) return <div key={index} className="p-3"></div>;
              
              const year = currentDate.getFullYear();
              const month = currentDate.getMonth();
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isAvailable = availability[dateStr];
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toDateString() === new Date(dateStr).toDateString();
              const isPast = new Date(dateStr) < new Date(new Date().toDateString());
              const unitInfo = unitCounts[dateStr];
              const dayBookings = bookings[dateStr] || [];
              
              return (
                <button
                  key={day}
                  onClick={() => !isPast && handleDateClick(day)}
                  disabled={isPast}
                  className={`
                    p-2 text-sm rounded-lg transition-all duration-200 relative group min-h-[3rem] flex flex-col items-center justify-center
                    ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                      isSelected ? 'bg-secondary-600 text-white shadow-lg' : 
                      isAvailable ? 'bg-success-100 text-success-700 hover:bg-success-200' : 
                      'bg-error-100 text-error-700 hover:bg-error-200'}
                    ${isToday ? 'ring-2 ring-primary-400' : ''}
                  `}
                  title={unitInfo ? `${unitInfo.available}/${unitInfo.total} units available${dayBookings.length > 0 ? ` | ${dayBookings.length} booking(s)` : ''}` : ''}
                >
                  <span className="font-medium">{day}</span>
                  {unitInfo && (
                    <span className="text-xs opacity-75">
                      {unitInfo.available}/{unitInfo.total}
                    </span>
                  )}
                  {dayBookings.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-60"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-success-100 rounded"></div>
              <span className="text-primary-700">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-error-100 rounded"></div>
              <span className="text-primary-700">Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-secondary-600 rounded"></div>
              <span className="text-primary-700">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-primary-700">Past</span>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h4 className="font-semibold text-primary-950 mb-2">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              
              {unitCounts[selectedDate] && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-primary-950">{unitCounts[selectedDate].total}</p>
                      <p className="text-primary-600">Total Units</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-success-600">{unitCounts[selectedDate].available}</p>
                      <p className="text-primary-600">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-error-600">{unitCounts[selectedDate].total - unitCounts[selectedDate].available}</p>
                      <p className="text-primary-600">Booked</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show bookings for selected date */}
              {bookings[selectedDate] && bookings[selectedDate].length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <h5 className="font-medium text-blue-800 mb-2">Current Bookings:</h5>
                  <div className="space-y-1">
                    {bookings[selectedDate].map((booking: any, idx: number) => (
                      <div key={idx} className="text-sm text-blue-700">
                        • {booking.guest_name} ({booking.guests} guests) - {booking.status}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={handleBlockDate}
                  disabled={new Date(selectedDate) < new Date(new Date().toDateString())}
                  className="bg-error-600 hover:bg-error-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <Block className="w-3 h-3" />
                  Block Date
                </button>
                <button 
                  disabled={new Date(selectedDate) < new Date(new Date().toDateString())}
                  className="bg-primary-800 hover:bg-primary-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <DollarSign className="w-3 h-3" />
                  Set Special Rate
                </button>
                <button 
                  disabled={new Date(selectedDate) < new Date(new Date().toDateString())}
                  className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <Settings className="w-3 h-3" />
                  Manage Units
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Block Date Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-950">Block Date</h3>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Selected Date:</strong> {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'None'}
                </p>
              </div>

              <div>
                <label className="block text-primary-800 font-medium mb-2">Block Type</label>
                <select
                  value={blockData.type}
                  onChange={(e) => setBlockData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="owner_use">Owner Use</option>
                  <option value="seasonal_closure">Seasonal Closure</option>
                  <option value="deep_cleaning">Deep Cleaning</option>
                </select>
              </div>
              
              <div>
                <label className="block text-primary-800 font-medium mb-2">Notes</label>
                <textarea
                  value={blockData.notes}
                  onChange={(e) => setBlockData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reason for blocking this date..."
                  rows={3}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBlock}
                  className="bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Block className="w-4 h-4" />
                  Block Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;