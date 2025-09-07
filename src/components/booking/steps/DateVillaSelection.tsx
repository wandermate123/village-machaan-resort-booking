import React, { useState, useEffect } from 'react';
import { useBooking } from '../../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, X, ArrowRight, Users, Star, MapPin } from 'lucide-react';
import ImageDebugger from '../../common/ImageDebugger';
import { VillaService } from '../../../services/villaService';
import { BookingService } from '../../../services/bookingService';
import { useToast } from '../../common/Toast';
import LoadingSpinner from '../../common/LoadingSpinner';
import VillaSlideshow from '../VillaSlideshow';

const DateVillaSelection = () => {
  const { state, dispatch } = useBooking();
  const { showError, showSuccess } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState({ 
    arrival: state.checkIn || '', 
    departure: state.checkOut || '' 
  });
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(state.guests || 2);
  const [children, setChildren] = useState(0);
  const [selectedVillaId, setSelectedVillaId] = useState(state.selectedVilla?.id || '');
  const [availableVillas, setAvailableVillas] = useState([]);
  const [allVillas, setAllVillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState(null);

  // Load all villas on component mount
  useEffect(() => {
    loadAllVillas();
  }, []);

  // Update selected villa details when selection changes
  useEffect(() => {
    if (selectedVillaId) {
      const villa = allVillas.find(v => v.id === selectedVillaId);
      if (villa) {
        dispatch({ type: 'SET_VILLA', payload: villa });
      }
    }
  }, [selectedVillaId, allVillas, dispatch]);

  const loadAllVillas = async () => {
    try {
      const villas = await VillaService.getActiveVillas();
      setAllVillas(villas);
      setAvailableVillas(villas);
      
      if (villas.length > 0) {
        console.log(`✅ Loaded ${villas.length} villas`);
      }
    } catch (error) {
      showError('Loading Error', 'Failed to load villa information. Please refresh the page.');
    }
  };

  const checkAvailability = async () => {
    if (!selectedDates.arrival || !selectedDates.departure) {
      showError('Missing Dates', 'Please select both arrival and departure dates');
      return;
    }

    setCheckingAvailability(true);
    setAvailabilityResults(null);
    try {
      const available = await BookingService.getAvailableVillas(
        selectedDates.arrival, 
        selectedDates.departure
      );
      
      setAvailableVillas(available);
      
      // Create detailed availability results
      const results = {
        checkIn: selectedDates.arrival,
        checkOut: selectedDates.departure,
        nights: Math.ceil((new Date(selectedDates.departure).getTime() - new Date(selectedDates.arrival).getTime()) / (1000 * 60 * 60 * 24)),
        villas: await Promise.all(
          allVillas.map(async (villa) => {
            const availableUnits = await BookingService.getAvailableUnits(villa.id, selectedDates.arrival, selectedDates.departure);
            return {
              ...villa,
              available: availableUnits > 0,
              availableUnits,
              roomType: villa.id === 'glass-cottage' ? 'Studio Cottage' : 'One Bedroom Villa'
            };
          })
        )
      };
      
      setAvailabilityResults(results);
      
      if (available.length === 0) {
        showError('No Availability', 'No villas available for selected dates. Please try different dates.');
      } else {
        showSuccess('Availability Checked', 'Villa availability checked successfully');
      }
    } catch (error) {
      showError('Availability Check Failed', 'Failed to check villa availability. Please try again.');
    } finally {
      setCheckingAvailability(false);
    }
  };
  
  const handleNext = () => {
    if (!selectedDates.arrival || !selectedDates.departure) {
      showError('Missing Dates', 'Please select both arrival and departure dates');
      return;
    }
    
    if (!selectedVillaId) {
      showError('No Villa Selected', 'Please select a villa to continue');
      return;
    }

    // Update booking state
    dispatch({ type: 'SET_DATES', payload: { checkIn: selectedDates.arrival, checkOut: selectedDates.departure } });
    dispatch({ type: 'SET_GUESTS', payload: adults + children });
    
    // Navigate to next step
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateCalendar = (month: number, year: number) => {
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

  const handleDateClick = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    
    // Prevent selecting past dates
    if (dateStr < today) {
      showError('Invalid Date', 'Cannot select past dates');
      return;
    }
    
    if (!selectedDates.arrival || (selectedDates.arrival && selectedDates.departure)) {
      setSelectedDates({ arrival: dateStr, departure: '' });
    } else if (selectedDates.arrival && !selectedDates.departure) {
      if (new Date(dateStr) > new Date(selectedDates.arrival)) {
        setSelectedDates(prev => ({ ...prev, departure: dateStr }));
      } else {
        setSelectedDates({ arrival: dateStr, departure: '' });
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    } else {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    }
  };

  const renderCalendar = (monthOffset: number) => {
    const currentMonth = (selectedMonth + monthOffset) % 12;
    const currentYear = selectedYear + Math.floor((selectedMonth + monthOffset) / 12);
    const days = generateCalendar(currentMonth, currentYear);
    const today = new Date().toISOString().split('T')[0];
    
    return (
      <div className="bg-white border border-gray-200 p-4 min-w-[280px]">
        <div className="text-center mb-4">
          <h3 className="font-medium text-gray-800">{months[currentMonth]} {currentYear}</h3>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="p-2 font-medium text-gray-600">{day}</div>
          ))}
          
          {days.map((day, index) => {
            if (!day) return <div key={index} className="p-2"></div>;
            
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDates.arrival || dateStr === selectedDates.departure;
            const isInRange = selectedDates.arrival && selectedDates.departure && 
              new Date(dateStr) > new Date(selectedDates.arrival) && 
              new Date(dateStr) < new Date(selectedDates.departure);
            const isPast = dateStr < today;
            
            return (
              <button
                key={day}
                onClick={() => !isPast && handleDateClick(day, currentMonth, currentYear)}
                disabled={isPast}
                className={`p-2 text-sm rounded hover:bg-gray-100 transition-colors ${
                  isPast ? 'text-gray-300 cursor-not-allowed' :
                  isSelected ? 'bg-black text-white' : 
                  isInRange ? 'bg-gray-200' : ''
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedVilla = allVillas.find(v => v.id === selectedVillaId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-800">Village Machaan</h1>
          <div className="flex items-center space-x-4">
            <select className="text-sm border-none bg-transparent">
              <option>English</option>
            </select>
            <select className="text-sm border-none bg-transparent">
              <option>INR (₹)</option>
            </select>
            <button className="p-2">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl text-gray-800 mb-8">Select your dates at Village Machaan</h2>
          
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Date & Accommodation Selection', active: true },
              { step: 2, label: 'Package Selection', active: false },
              { step: 3, label: 'Safari Selection', active: false },
              { step: 4, label: 'Confirmation', active: false }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${
                    item.active ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-400'
                  }`}>
                    {item.step}
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center max-w-24">{item.label}</span>
                </div>
                {index < 3 && <div className="w-16 h-px bg-gray-300 mx-4 mt-[-20px]"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-medium">Select Your Dates</h3>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex space-x-4 overflow-x-auto">
                {[0, 1, 2].map(offset => renderCalendar(offset))}
              </div>
            </div>
          </div>

          {/* Booking Details Sidebar */}
          <div className="space-y-6">
            {/* Date Summary */}
            <div className="bg-white border border-gray-200">
              <div className="grid grid-cols-2">
                <div className="bg-gray-800 text-white p-4 text-center">
                  <div className="text-sm">Arrival</div>
                </div>
                <div className="bg-gray-800 text-white p-4 text-center">
                  <div className="text-sm">Departure</div>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div className="p-6 text-center border-r border-gray-200">
                  <div className="text-3xl font-light">
                    {selectedDates.arrival ? new Date(selectedDates.arrival).getDate().toString().padStart(2, '0') : '--'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedDates.arrival ? months[new Date(selectedDates.arrival).getMonth()] : 'Month'}
                  </div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-light">
                    {selectedDates.departure ? new Date(selectedDates.departure).getDate().toString().padStart(2, '0') : '--'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedDates.departure ? months[new Date(selectedDates.departure).getMonth()] : 'Month'}
                  </div>
                </div>
              </div>
            </div>

            {/* Room & Guest Selection */}
            <div className="bg-white border border-gray-200 p-4 space-y-4">
              <div>
                <select 
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded text-gray-600"
                >
                  <option value={1}>1 Room</option>
                  <option value={2}>2 Rooms</option>
                  <option value={3}>3 Rooms</option>
                </select>
              </div>
              
              <div>
                <select 
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded text-gray-600"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                  <option value={5}>5 Adults</option>
                  <option value={6}>6 Adults</option>
                  <option value={7}>7 Adults</option>
                  <option value={8}>8 Adults</option>
                </select>
              </div>
              
              <div>
                <select 
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded text-gray-600"
                >
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                  <option value={3}>3 Children</option>
                  <option value={4}>4 Children</option>
                </select>
              </div>
              
              <div>
                <select 
                  value={selectedVillaId}
                  onChange={(e) => setSelectedVillaId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-600"
                >
                  <option value="">Choose Your Villa</option>
                  {allVillas.map((villa) => (
                    <option key={villa.id} value={villa.id}>
                      {villa.name} - ₹{villa.base_price.toLocaleString()}/night
                    </option>
                  ))}
                </select>
              </div>

              {/* Check Availability Button */}
              <button
                onClick={checkAvailability}
                disabled={!selectedDates.arrival || !selectedDates.departure || checkingAvailability}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
                {checkingAvailability ? (
                  <>
                    <LoadingSpinner size="sm" color="text-white" />
                    Checking...
                  </>
                ) : (
                  'Check Availability'
                )}
              </button>
            </div>
          </div>

          {/* Availability Results */}
          {availabilityResults && (
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Availability Results</h3>
              
              {/* Simple Villa Availability */}
              <div className="space-y-3">
                {availabilityResults.villas.map((villa) => (
                  <div key={villa.id} className={`border-2 rounded-lg p-4 transition-all ${
                    villa.available 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-semibold text-gray-800">{villa.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          villa.available 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {villa.available ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      
                      {villa.available && (
                        <button
                          onClick={() => setSelectedVillaId(villa.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedVillaId === villa.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-white hover:bg-gray-700'
                          }`}
                        >
                          {selectedVillaId === villa.id ? 'Selected ✓' : 'Select Villa'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Villa Details Section */}
        <div className="mt-12 space-y-12">
          {/* Selected Villa Details */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-800 mb-2">Accommodation Details</h2>
            <p className="text-gray-600">
              {selectedVilla ? `Details for ${selectedVilla.name}` : 'Select a villa to see details'}
            </p>
          </div>

          {selectedVilla ? (
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Villa Image */}
                <div className="relative">
                  <ImageDebugger
                    imagePath={selectedVilla.images?.[0] || '/images/glass-cottage/main.jpg'}
                    alt={selectedVilla.name}
                    className="w-full h-80 lg:h-96 object-cover"
                  />
                </div>

                {/* Villa Details */}
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-light text-gray-800 mb-2">{selectedVilla.name}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{selectedVilla.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>Max {selectedVilla.max_guests} guests</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>Forest location</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">From</div>
                      <div className="text-2xl font-light">₹{selectedVilla.base_price.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">/ night</div>
                    </div>
                  </div>

                  {/* Amenities Grid */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Amenities</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedVilla.amenities?.slice(0, 8).map((amenity, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <Star className="w-3 h-3 mr-2 text-secondary-600" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Availability Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        availableVillas.some(v => v.id === selectedVilla.id)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {availableVillas.some(v => v.id === selectedVilla.id) ? 'Available' : 'Check Dates'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <MapPin className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">Select a Villa</h3>
              <p className="text-gray-500">Choose a villa from the dropdown above to see detailed information</p>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        <div className="flex justify-end mt-12">
          <button
            onClick={handleNext}
            disabled={!selectedDates.arrival || !selectedDates.departure || !selectedVillaId}
            className={`flex items-center space-x-2 px-8 py-3 text-sm font-medium transition-colors ${
              selectedDates.arrival && selectedDates.departure && selectedVillaId
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Continue to Package Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <div>+91 7462 252052</div>
          <div>villagemachaan@gmail.com</div>
        </div>
      </div>
    </div>
  );
};

export default DateVillaSelection;