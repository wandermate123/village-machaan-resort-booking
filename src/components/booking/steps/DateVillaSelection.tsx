import React, { useState, useEffect } from 'react';
import { useBooking } from '../../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, X, ArrowRight, Users, Star, MapPin, ChevronDown } from 'lucide-react';
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
    arrival: '', 
    departure: '' 
  });
  const [rooms, setRooms] = useState<number | null>(1);
  const [adults, setAdults] = useState<number | null>(state.guests || 2);
  const [children, setChildren] = useState<number | null>(0);
  const [selectedVillaId, setSelectedVillaId] = useState(state.selectedVilla?.id || '');
  const [availableVillas, setAvailableVillas] = useState([]);
  const [allVillas, setAllVillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // 'available', 'not-available', or null

  // Load all villas on component mount and clear any cached dates
  useEffect(() => {
    loadAllVillas();
    // Clear any cached session data to ensure fresh start
    localStorage.removeItem('booking_session');
  }, []);

  // Update selected villa details when selection changes
  useEffect(() => {
    if (selectedVillaId) {
      const villa = allVillas.find(v => v.id === selectedVillaId);
      if (villa) {
        dispatch({ type: 'SET_VILLA', payload: villa });
        // Reset availability status when villa selection changes
        setAvailabilityStatus(null);
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
    setAvailabilityStatus(null);
    try {
      const available = await BookingService.getAvailableVillas(
        selectedDates.arrival, 
        selectedDates.departure
      );
      
      setAvailableVillas(available);
      
      // Set availability status based on results
      if (available.length > 0) {
        setAvailabilityStatus('available');
        showSuccess('Availability Checked', 'Villas are available for selected dates');
      } else {
        setAvailabilityStatus('not-available');
        showError('No Availability', 'No villas available for selected dates. Please try different dates.');
      }
    } catch (error) {
      setAvailabilityStatus('not-available');
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
    
    // Define images for each month - 12 different photos
    const monthImages = {
      0: '/images/calendar-months/january.png', // January
      1: '/images/calendar-months/february.png', // February
      2: '/images/calendar-months/march.png', // March
      3: '/images/calendar-months/april.png', // April
      4: '/images/calendar-months/may.png', // May
      5: '/images/calendar-months/june.png', // June
      6: '/images/calendar-months/july.png', // July
      7: '/images/calendar-months/august.png', // August
      8: '/images/calendar-months/september.png', // September
      9: '/images/calendar-months/october.png', // October
      10: '/images/calendar-months/november.png', // November
      11: '/images/calendar-months/december.png' // December
    };
    
    return (
        <div
          className="relative bg-white flex-shrink-0"
          style={{
            width: '280px',
            height: '380px',
            border: '0.5px solid #3F3E3E',
            borderRight: monthOffset === 2 ? '0.5px solid #3F3E3E' : 'none',
            borderLeft: monthOffset === 0 ? '0.5px solid #3F3E3E' : 'none',
            boxSizing: 'border-box'
          }}
        >
        {/* Month Image */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            width: '120px',
            height: '130px',
            left: 'calc(50% - 120px/2)',
            top: '15px',
            backgroundImage: `url(${monthImages[currentMonth]})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
        
        {/* Month Name */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            width: '160px',
            height: '35px',
            left: 'calc(50% - 160px/2)',
            top: '150px',
            fontFamily: 'Rethink Sans, sans-serif',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '24px',
            lineHeight: '35px',
            textAlign: 'center',
            letterSpacing: '0.01em',
            color: '#3F3E3E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {months[currentMonth].toLowerCase()}
        </div>
        
        {/* Calendar Grid Container */}
        <div 
          className="absolute"
          style={{
            width: '260px',
            height: '240px',
            left: 'calc(50% - 260px/2)',
            top: '200px'
          }}
        >
          {/* Days of Week Headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
            const positions = [
              { left: '15px', width: '32px' },   // S
              { left: '52px', width: '32px' },   // M
              { left: '89px', width: '32px' },   // T
              { left: '126px', width: '32px' },  // W
              { left: '163px', width: '32px' },  // T
              { left: '200px', width: '32px' },  // F
              { left: '237px', width: '32px' }   // S
            ];
            
            return (
              <div
                key={day}
                className="absolute"
                style={{
                  ...positions[index],
                  height: '25px',
                  top: '0px',
                  fontFamily: 'Rethink Sans, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '25px',
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  color: '#3F3E3E'
                }}
              >
                {day}
              </div>
            );
          })}
          
          {/* Calendar Dates */}
          {days.map((day, index) => {
            if (!day) return null;
            
            // Calculate grid position
            const row = Math.floor(index / 7);
            const col = index % 7;
            
            // Calculate grid positioning
            const leftPositions = [15, 52, 89, 126, 163, 200, 237];
            const topPositions = [35, 60, 85, 110, 135, 160, 185];
            
            const left = leftPositions[col];
            const top = topPositions[row] || 135;
            
            // Calculate width based on number of digits
            const width = '32px';
            
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
                className="absolute"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: width,
                  height: '25px',
                  fontFamily: 'Quicksand, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '25px',
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  color: isPast ? '#CCCCCC' : isSelected ? '#FFFFFF' : '#3F3E3E',
                  backgroundColor: isSelected ? '#3F3E3E' : isInRange ? '#E5E5E5' : 'transparent',
                  border: 'none',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px'
                }}
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
    <div className="min-h-screen" style={{ backgroundColor: '#F3EEE7' }}>
      {/* Header - Exact Vue.js Design */}
      <div 
        className="mx-auto"
        style={{
          width: '1280px',
          height: '54px',
          backgroundColor: '#f3eee7'
        }}
      >
        <div className="flex items-center justify-between h-full px-6">
          <img 
            src="/images/village-machaan-logo.png" 
            alt="Village Machaan" 
            className="h-16 w-auto mt-1"
          />
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

      {/* Navigation Border Line */}
      <div 
        className="mx-auto"
        style={{
          width: '1280px',
          height: '1px',
          backgroundColor: '#000000'
        }}
      />

       {/* Progress Steps - Exact Vue.js Design */}
       <div className="px-6 py-8" style={{ backgroundColor: '#F3EEE7' }}>
         <div className="max-w-4xl mx-auto">
           {/* Title */}
           <div 
             className="mx-auto mb-2"
             style={{
               width: '333px',
               height: '29px',
               color: '#3f3e3e',
               fontFamily: 'TAN - Angleton, sans-serif',
               fontSize: '18px',
               fontWeight: '400',
               lineHeight: '28.845px',
               textAlign: 'center'
             }}
           >
             Select your dates at Village Machaan
           </div>
           
           {/* Progress Steps */}
           <div className="flex items-center justify-center space-x-8 relative">
             {[
               { step: 1, label: 'Date Selection', active: true, completed: false },
               { step: 2, label: 'Package Selection', active: false, completed: false },
               { step: 3, label: 'Safari Selection', active: false, completed: false },
               { step: 4, label: 'Confirmation', active: false, completed: false }
             ].map((item, index) => (
               <div key={item.step} className="flex flex-col items-center">
                 <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                    item.completed ? 'border-black bg-white text-black' :
                    item.active ? 'border-black bg-white text-black' : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                   {item.completed ? (
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   ) : (
                     <span className="text-base font-medium" style={{ fontSize: '16px' }}>{item.step}</span>
                   )}
                 </div>
                 <span 
                   className="text-xs text-gray-600 mt-2 text-center font-serif leading-tight"
                   style={{ 
                     whiteSpace: 'nowrap',
                     width: '120px'
                   }}
                 >
                   {item.label}
                 </span>
               </div>
             ))}
             {/* Connecting Lines */}
             <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gray-300 -z-10"></div>
           </div>
         </div>
       </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
             {/* Calendar Section */}
             <div className="lg:col-span-2">
               {/* Header */}
               <div className="px-4 pt-4">
                 <div className="flex items-center justify-between mb-4">
                   <button 
                     onClick={() => navigateMonth('prev')}
                     className="p-2 hover:bg-gray-100 rounded"
                   >
                     <ChevronLeft className="w-5 h-5 text-gray-800" />
                   </button>
                   <h3 className="text-lg font-serif text-gray-800">Select Your Dates</h3>
                   <button 
                     onClick={() => navigateMonth('next')}
                     className="p-2 hover:bg-gray-100 rounded"
                   >
                     <ChevronRight className="w-5 h-5 text-gray-800" />
                   </button>
                 </div>
               </div>
               
               {/* Calendar */}
               <div className="flex justify-center items-start px-4">
                 {[0, 1, 2].map((offset, index) => (
                   <div key={offset} className="flex">
                     {renderCalendar(offset)}
                     {index < 2 && (
                       <div 
                         className="w-px bg-gray-400"
                         style={{ height: '380px' }}
                       />
                     )}
                   </div>
                 ))}
               </div>
             </div>

          {/* Combined Booking Details - Exact Design */}
          <div className="relative w-full max-w-sm mx-auto mt-16" style={{ height: '420px' }}>
            {/* Header */}
            <div className="relative w-full h-6 border border-gray-600" style={{ backgroundColor: '#3F3E3E' }}>
              <span 
                className="absolute text-white text-xs font-normal flex items-center justify-center"
                style={{ 
                  fontFamily: 'TAN - Angleton, sans-serif',
                  top: '0',
                  left: '0',
                  width: '50%',
                  height: '100%'
                }}
              >
                Arrival
              </span>
              <span 
                className="absolute text-white text-xs font-normal flex items-center justify-center"
                style={{ 
                  fontFamily: 'TAN - Angleton, sans-serif',
                  top: '0',
                  right: '0',
                  width: '50%',
                  height: '100%'
                }}
              >
                Departure
              </span>
            </div>

            {/* Date Display */}
            <div className="relative w-full h-28">
              {/* Arrival Date */}
              <div className="absolute w-1/2 h-full bg-white border border-gray-600 left-0">
                <div className="relative h-full flex flex-col items-center justify-center">
                    <span className="font-normal mb-1" style={{ fontFamily: 'TAN - Angleton, sans-serif', fontSize: '64px', lineHeight: '1', color: '#3F3E3E' }}>
                      {selectedDates.arrival ? new Date(selectedDates.arrival).getDate().toString().padStart(2, '0') : '--'}
                    </span>
                  <span className="text-xs font-normal text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                    {selectedDates.arrival ? months[new Date(selectedDates.arrival).getMonth()] : 'Select Date'}
                  </span>
                </div>
              </div>
              
              {/* Departure Date */}
              <div className="absolute w-1/2 h-full bg-white border border-gray-600 right-0">
                <div className="relative h-full flex flex-col items-center justify-center">
                    <span className="font-normal mb-1" style={{ fontFamily: 'TAN - Angleton, sans-serif', fontSize: '64px', lineHeight: '1', color: '#3F3E3E' }}>
                      {selectedDates.departure ? new Date(selectedDates.departure).getDate().toString().padStart(2, '0') : '--'}
                    </span>
                  <span className="text-xs font-normal text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                    {selectedDates.departure ? months[new Date(selectedDates.departure).getMonth()] : 'Select Date'}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2.5">
              <span className="absolute text-xs font-normal text-gray-700 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {rooms || 1} Room
              </span>
              <div className="absolute top-3 right-3">
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
              <select 
                value={rooms || 1}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ 
                  color: '#3F3E3E',
                  accentColor: '#3F3E3E'
                }}
              >
                <option value={1}>1 Room</option>
                <option value={2}>2 Rooms</option>
                <option value={3}>3 Rooms</option>
              </select>
            </div>

            {/* Adults Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2">
              <span className="absolute text-xs font-normal text-gray-700 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {adults || 2} Adults
              </span>
              <div className="absolute top-3 right-3">
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
              <select 
                value={adults || 2}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ 
                  color: '#3F3E3E',
                  accentColor: '#3F3E3E'
                }}
              >
                <option value={1}>1 Adult</option>
                <option value={2}>2 Adults</option>
                <option value={3}>3 Adults</option>
                <option value={4}>4 Adults</option>
              </select>
            </div>

            {/* Children Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2">
              <span className="absolute text-xs font-normal text-gray-700 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {children || 0} Children
              </span>
              <div className="absolute top-3 right-3">
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
              <select 
                value={children || 0}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ 
                  color: '#3F3E3E',
                  accentColor: '#3F3E3E'
                }}
              >
                <option value={0}>0 Children</option>
                <option value={1}>1 Child</option>
                <option value={2}>2 Children</option>
                <option value={3}>3 Children</option>
                <option value={4}>4 Children</option>
              </select>
            </div>

            {/* Villa Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2">
              <span className="absolute text-xs font-normal text-gray-400 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {selectedVillaId ? allVillas.find(v => v.id === selectedVillaId)?.name || 'Choose Your Villa' : 'Choose Your Villa'}
              </span>
              <div className="absolute top-3 right-3">
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
              <select 
                value={selectedVillaId}
                onChange={(e) => setSelectedVillaId(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ 
                  color: '#3F3E3E',
                  accentColor: '#3F3E3E'
                }}
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
            <div className="mt-4">
              <button
                onClick={checkAvailability}
                disabled={!selectedDates.arrival || !selectedDates.departure || checkingAvailability}
                className={`w-full py-3 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
                  checkingAvailability
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : availabilityStatus === 'available'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : availabilityStatus === 'not-available'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'text-white'
                }`}
                style={{
                  backgroundColor: checkingAvailability 
                    ? '#D1D5DB' 
                    : availabilityStatus === 'available'
                    ? '#059669'
                    : availabilityStatus === 'not-available'
                    ? '#DC2626'
                    : '#3F3E3E'
                }}
                onMouseEnter={(e) => {
                  if (!checkingAvailability && !availabilityStatus) {
                    e.target.style.backgroundColor = '#2A2929';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!checkingAvailability && !availabilityStatus) {
                    e.target.style.backgroundColor = '#3F3E3E';
                  }
                }}
              >
                {checkingAvailability ? (
                  <>
                    <LoadingSpinner size="sm" color="text-white" />
                    Checking...
                  </>
                ) : availabilityStatus === 'available' ? (
                  'Available'
                ) : availabilityStatus === 'not-available' ? (
                  'Not Available'
                ) : (
                  'Check Availability'
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Villa Details Section */}
        <div className="mt-32 px-4 sm:px-6 space-y-12">
          {/* Selected Villa Details */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light mb-2" style={{ color: '#3F3E3E' }}>Accommodation Details</h2>
            <p style={{ color: '#3F3E3E' }}>
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
                    className="w-full h-full object-cover"
                    style={{ minHeight: '400px' }}
                  />
                </div>

                {/* Villa Details */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-4">
                    {/* Villa Title */}
                    <h3 className="text-xl sm:text-2xl font-light mb-3" style={{ color: '#3F3E3E' }}>{selectedVilla.name}</h3>
                    
                    {/* Description and Pricing Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-6">
                        <p className="text-sm" style={{ color: '#3F3E3E', lineHeight: '1.3' }}>{selectedVilla.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm" style={{ color: '#3F3E3E' }}>From</div>
                        <div className="text-xl sm:text-2xl font-light" style={{ color: '#3F3E3E' }}>₹{selectedVilla.base_price.toLocaleString()}</div>
                        <div className="text-sm" style={{ color: '#3F3E3E' }}>/ night</div>
                      </div>
                    </div>

                    {/* Check Availability Button */}
                    <div className="mb-4">
                      <button
                        onClick={checkAvailability}
                        disabled={!selectedDates.arrival || !selectedDates.departure || checkingAvailability}
                        className={`px-6 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
                          checkingAvailability
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : availabilityStatus === 'available'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : availabilityStatus === 'not-available'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'text-white'
                        }`}
                        style={{
                          backgroundColor: checkingAvailability 
                            ? '#D1D5DB' 
                            : availabilityStatus === 'available'
                            ? '#059669'
                            : availabilityStatus === 'not-available'
                            ? '#DC2626'
                            : '#3F3E3E'
                        }}
                        onMouseEnter={(e) => {
                          if (!checkingAvailability && !availabilityStatus) {
                            e.target.style.backgroundColor = '#2A2929';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!checkingAvailability && !availabilityStatus) {
                            e.target.style.backgroundColor = '#3F3E3E';
                          }
                        }}
                      >
                        {checkingAvailability ? (
                          <>
                            <LoadingSpinner size="sm" color="text-white" />
                            Checking...
                          </>
                        ) : availabilityStatus === 'available' ? (
                          'Available'
                        ) : availabilityStatus === 'not-available' ? (
                          'Not Available'
                        ) : (
                          'Check Availability'
                        )}
                      </button>
                    </div>

                    {/* Guest and Location Info */}
                    <div className="flex items-center space-x-4 text-sm mb-4" style={{ color: '#3F3E3E' }}>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>Max {selectedVilla.max_guests} guests</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>Forest location</span>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Grid */}
                  <div className="mb-6">
                    {selectedVilla.id === 'kingfisher-villa' ? (
                      <div>
                        <h4 className="font-medium mb-3" style={{ color: '#3F3E3E' }}>Amenities</h4>
                        <div className="relative w-full overflow-hidden">
                        <img 
                          src="/images/kingfisher/amenities-icons.png" 
                          alt="Kingfisher villa amenities" 
                          className="w-full max-w-sm mx-auto h-auto object-contain"
                          style={{ minHeight: '120px' }}
                          onError={(e) => {
                            console.error('Failed to load amenities image:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Amenities image loaded successfully');
                          }}
                        />
                        </div>
                      </div>
                      ) : selectedVilla.id === 'glass-cottage' ? (
                        <div>
                          <h4 className="font-medium mb-3" style={{ color: '#3F3E3E' }}>Amenities</h4>
                          <div className="relative w-full overflow-hidden">
                            <img 
                              src="/images/glass-cottage/amenities-icons.png" 
                              alt="Glass Cottage amenities" 
                              className="w-full max-w-sm mx-auto h-auto object-contain"
                              style={{ minHeight: '120px' }}
                              onError={(e) => {
                                console.error('Failed to load amenities image:', e);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('Glass Cottage amenities image loaded successfully');
                              }}
                            />
                          </div>
                        </div>
                    ) : selectedVilla.id === 'hornbill-villa' ? (
                      <div>
                        <h4 className="font-medium mb-3" style={{ color: '#3F3E3E' }}>Amenities</h4>
                        <div className="relative w-full overflow-hidden">
                          <img 
                            src="/images/hornbill/amenities-icons.png" 
                            alt="Hornbill villa amenities" 
                            className="w-full max-w-sm mx-auto h-auto object-contain"
                            style={{ minHeight: '120px' }}
                            onError={(e) => {
                              console.error('Failed to load amenities image:', e);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Hornbill villa amenities image loaded successfully');
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium mb-3" style={{ color: '#3F3E3E' }}>Amenities</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedVilla.amenities?.slice(0, 8).map((amenity, index) => (
                          <div key={index} className="flex items-center text-sm" style={{ color: '#3F3E3E' }}>
                            <Star className="w-3 h-3 mr-2 flex-shrink-0" style={{ color: '#3F3E3E' }} />
                            <span className="truncate">{amenity}</span>
                          </div>
                        ))}
                      </div>
                      </div>
                    )}
                  </div>

                  {/* Availability Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#3F3E3E' }}>Availability Status:</span>
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