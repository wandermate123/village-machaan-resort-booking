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
    arrival: state.checkIn || '', 
    departure: state.checkOut || '' 
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
    
    // Define images for each month
    const monthImages = {
      0: '/images/safari/tiger-safari.jpg', // January - Tiger
      1: '/images/safari/tiger-safari.jpg', // February - Tiger
      2: '/images/safari/tiger-safari.jpg', // March - Tiger
      3: '/images/safari/tiger-safari.jpg', // April - Tiger
      4: '/images/safari/tiger-safari.jpg', // May - Tiger
      5: '/images/safari/tiger-safari.jpg', // June - Tiger
      6: '/images/safari/tiger-safari.jpg', // July - Tiger
      7: '/images/safari/tiger-safari.jpg', // August - Tiger
      8: '/images/safari/tiger-safari.jpg', // September - Tiger
      9: '/images/safari/tiger-safari.jpg', // October - Black Panther
      10: '/images/safari/tiger-safari.jpg', // November - Tree
      11: '/images/safari/tiger-safari.jpg'  // December - Tiger
    };
    
    return (
      <div 
        className="relative bg-white flex-shrink-0"
        style={{
          width: '200px',
          height: '250px',
          border: '0.5px solid #3F3E3E',
          boxSizing: 'border-box'
        }}
      >
        {/* Tree Image - positioned exactly as specified */}
        <div 
          className="absolute"
          style={{
            width: '90px',
            height: '100px',
            left: '45px',
            top: '10px',
            transform: 'rotate(-90deg)',
            backgroundImage: `url(${monthImages[currentMonth]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Month Name - positioned to avoid image overlap */}
        <div 
          className="absolute"
          style={{
            width: '120px',
            height: '28px',
            left: 'calc(50% - 120px/2)',
            top: '110px',
            fontFamily: 'Rethink Sans, sans-serif',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '28px',
            textAlign: 'center',
            letterSpacing: '0.01em',
            color: '#3F3E3E'
          }}
        >
          {months[currentMonth].toLowerCase()}
        </div>
        
        {/* Calendar Grid Container - positioned to accommodate month name */}
        <div 
          className="absolute"
          style={{
            width: '180px',
            height: '100px',
            left: 'calc(50% - 180px/2)',
            top: '140px'
          }}
        >
          {/* Days of Week Headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
            const positions = [
              { left: '5px', width: '20px' },   // S
              { left: '30px', width: '20px' },  // M
              { left: '55px', width: '20px' },  // T
              { left: '80px', width: '20px' },  // W
              { left: '105px', width: '20px' },  // T
              { left: '130px', width: '20px' }, // F
              { left: '155px', width: '20px' }  // S
            ];
            
            return (
              <div
                key={day}
                className="absolute"
                style={{
                  ...positions[index],
                  height: '21px',
                  top: '0px',
                  fontFamily: 'Rethink Sans, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: '18px',
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
            
            // Calculate exact positioning based on the CSS specifications
            const leftPositions = [5, 30, 55, 80, 105, 130, 155];
            const topPositions = [20, 35, 50, 65, 80];
            
            const left = leftPositions[col];
            const top = topPositions[row] || 80;
            
            // Calculate width based on number of digits
            const width = '20px';
            
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
                  height: '15px',
                  fontFamily: 'Quicksand, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '10px',
                  lineHeight: '15px',
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  color: isPast ? '#CCCCCC' : isSelected ? '#FFFFFF' : '#3F3E3E',
                  backgroundColor: isSelected ? '#3F3E3E' : isInRange ? '#E5E5E5' : 'transparent',
                  border: 'none',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
               fontSize: '15px',
               fontWeight: '400',
               lineHeight: '28.845px',
               textAlign: 'center'
             }}
           >
             Select your dates at Village Machaan
           </div>
           
           {/* Progress Circles and Connecting Line */}
           <div className="flex items-center justify-center relative">
             {/* Progress Circles */}
             <div className="flex items-center justify-center space-x-48">
               {[1, 2, 3, 4].map((step, index) => (
                 <div key={step} className="relative">
                   {/* Circle */}
                   <div 
                     className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                     style={{
                       backgroundColor: step === 1 ? '#ffffff' : '#f3eee7',
                       borderColor: step === 1 ? '#403b34' : '#d1d5db'
                     }}
                   >
                     <span 
                       className="text-xs font-normal"
                       style={{ 
                         fontFamily: 'TAN - AEGEAN, sans-serif',
                         color: step === 1 ? '#403b34' : '#9ca3af'
                       }}
                     >
                       {step}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Connecting Line */}
             <div 
               className="absolute top-3 w-96 h-0.5"
               style={{
                 background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTk4IiBoZWlnaHQ9IjIiIHZpZXdCb3g9IjAgMCA1OTggMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMSAxSDU5N1YxSDFaIiBmaWxsPSIjRkVGQkY3Ii8+PC9zdmc+) no-repeat center',
                 backgroundSize: 'cover',
                 transform: 'translateX(-50%)'
               }}
             />
           </div>
           
           {/* Progress Labels */}
           <div className="flex items-center justify-center space-x-48 mt-1">
             {[
               'Date & Accommodation Selection',
               'Package Selection', 
               'Safari Selection',
               'Confirmation'
             ].map((label, index) => (
               <span 
                 key={index}
                 className="text-xs text-gray-600 text-center w-32"
                 style={{ fontFamily: 'TAN - Angleton, sans-serif' }}
               >
                 {label}
               </span>
             ))}
           </div>
         </div>
       </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-black">
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
              
              {/* Calendar */}
              <div className="flex">
                {[0, 1, 2].map(offset => renderCalendar(offset))}
              </div>
            </div>
          </div>

          {/* Combined Booking Details - Exact Design */}
          <div className="relative w-full max-w-sm mx-auto" style={{ height: '362px' }}>
            {/* Header */}
            <div className="relative w-full h-6 bg-gray-800 border border-gray-600">
              <span className="absolute text-white text-xs font-normal leading-4 top-1.5 left-1/2 transform -translate-x-24" style={{ fontFamily: 'TAN - Angleton, sans-serif' }}>
                Arrival
              </span>
              <span className="absolute text-white text-xs font-normal leading-4 top-1.5 left-1/2 transform translate-x-16" style={{ fontFamily: 'TAN - Angleton, sans-serif' }}>
                Departure
              </span>
            </div>

            {/* Date Display */}
            <div className="relative w-full h-28">
              {/* Arrival Date */}
              <div className="absolute w-1/2 h-full bg-white border border-gray-600 left-0">
                <div className="relative h-full flex flex-col items-center justify-center">
                  <span className="text-3xl font-normal text-gray-700 mb-1" style={{ fontFamily: 'TAN - Angleton, sans-serif', lineHeight: '61.536px' }}>
                    {selectedDates.arrival ? new Date(selectedDates.arrival).getDate().toString().padStart(2, '0') : '01'}
                  </span>
                  <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                    {selectedDates.arrival ? months[new Date(selectedDates.arrival).getMonth()] : 'October'}
                  </span>
                </div>
              </div>
              
              {/* Departure Date */}
              <div className="absolute w-1/2 h-full bg-white border border-gray-600 right-0">
                <div className="relative h-full flex flex-col items-center justify-center">
                  <span className="text-3xl font-normal text-gray-700 mb-1" style={{ fontFamily: 'TAN - Angleton, sans-serif', lineHeight: '61.536px' }}>
                    {selectedDates.departure ? new Date(selectedDates.departure).getDate().toString().padStart(2, '0') : '23'}
                  </span>
                  <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                    {selectedDates.departure ? months[new Date(selectedDates.departure).getMonth()] : 'December'}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2.5">
              <span className="absolute text-xs font-semibold text-gray-700 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {rooms || 1} Room
              </span>
              <div className="absolute top-4.5 right-4">
                <ChevronDown className="w-2 h-1.5 text-gray-600" />
              </div>
              <select 
                value={rooms || 1}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value={1}>1 Room</option>
                <option value={2}>2 Rooms</option>
                <option value={3}>3 Rooms</option>
              </select>
            </div>

            {/* Adults Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2">
              <span className="absolute text-xs font-semibold text-gray-700 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {adults || 2} Adults
              </span>
              <div className="absolute top-4.5 right-4">
                <ChevronDown className="w-2 h-1.5 text-gray-600" />
              </div>
              <select 
                value={adults || 2}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value={1}>1 Adult</option>
                <option value={2}>2 Adults</option>
                <option value={3}>3 Adults</option>
                <option value={4}>4 Adults</option>
              </select>
            </div>

            {/* Children Selection */}
            <div className="relative w-full h-11 bg-white border border-gray-600 mt-2">
              <span className="absolute text-xs font-semibold text-gray-700 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {children || 0} Children
              </span>
              <div className="absolute top-4.5 right-4">
                <ChevronDown className="w-2 h-1.5 text-gray-600" />
              </div>
              <select 
                value={children || 0}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
              <span className="absolute text-xs font-semibold text-gray-400 top-4 left-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                {selectedVillaId ? allVillas.find(v => v.id === selectedVillaId)?.name || 'Choose Your Villa' : 'Choose Your Villa'}
              </span>
              <div className="absolute top-4.5 right-4">
                <ChevronDown className="w-2 h-1.5 text-gray-600" />
              </div>
              <select 
                value={selectedVillaId}
                onChange={(e) => setSelectedVillaId(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
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
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                  />
                </div>

                {/* Villa Details */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-4 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-light text-gray-800 mb-2">{selectedVilla.name}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{selectedVilla.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 mb-4">
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
                    <div className="text-left sm:text-right">
                      <div className="text-sm text-gray-600">From</div>
                      <div className="text-xl sm:text-2xl font-light">₹{selectedVilla.base_price.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">/ night</div>
                    </div>
                  </div>

                  {/* Amenities Grid */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Amenities</h4>
                    {selectedVilla.id === 'kingfisher-villa' ? (
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
                    ) : selectedVilla.id === 'glass-cottage' ? (
                      <div className="relative w-full overflow-hidden">
                        <img 
                          src="/images/glass-cottage/main.jpg" 
                          alt="Glass Cottage amenities" 
                          className="w-full max-w-sm mx-auto h-auto object-cover rounded-lg"
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
                    ) : selectedVilla.id === 'hornbill-villa' ? (
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
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedVilla.amenities?.slice(0, 8).map((amenity, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <Star className="w-3 h-3 mr-2 text-secondary-600 flex-shrink-0" />
                            <span className="truncate">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    )}
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