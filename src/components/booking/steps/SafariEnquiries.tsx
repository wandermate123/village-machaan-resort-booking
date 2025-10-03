import React, { useState, useEffect } from 'react';
import { useBooking } from '../../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, X, ArrowLeft, ArrowRight, Info, Clock, Users, Calendar, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../common/Toast';
import { SafariService } from '../../../services/safariService';
import { SafariQueriesService } from '../../../services/safariQueriesService';
import LoadingSpinner from '../../common/LoadingSpinner';

interface SafariBooking {
  id: string;
  selected: boolean;
  date: string;
  timing: string;
  persons: number;
  safariId?: string;
  enquirySent?: boolean;
}

const SafariEnquiries = () => {
  const { state, dispatch } = useBooking();
  const { showSuccess, showError } = useToast();
  const [safariOptions, setSafariOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safariBookings, setSafariBookings] = useState<SafariBooking[]>([]);
  const [nextSafariId, setNextSafariId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSafariOptions();
  }, []);

  const fetchSafariOptions = async () => {
    setLoading(true);
    try {
      const options = await SafariService.getActiveSafariOptions();
      setSafariOptions(options);
    } catch (error) {
      showError('Loading Error', 'Failed to load safari options');
    } finally {
      setLoading(false);
    }
  };

  const addSafariBox = () => {
    const newSafari: SafariBooking = {
      id: `safari${nextSafariId}`,
      selected: true,
      date: '',
      timing: '',
      persons: 2,
      enquirySent: false
    };
    setSafariBookings(prev => [...prev, newSafari]);
    setNextSafariId(prev => prev + 1);
    // Increment safari enquiry counter
    dispatch({ type: 'INCREMENT_SAFARI_ENQUIRY_COUNT' });
  };

  const removeSafariBox = (safariId: string) => {
    setSafariBookings(prev => prev.filter(booking => booking.id !== safariId));
  };

  const handleSafariBookingChange = (safariId: string, field: string, value: string | number) => {
    setSafariBookings(prev => 
      prev.map(booking => {
        if (booking.id === safariId) {
          const updatedBooking = { ...booking, [field]: value };
          
          // If date is being changed to check-in day and current timing is morning, clear timing
          if (field === 'date' && value === state.checkIn && booking.timing === 'morning') {
            updatedBooking.timing = '';
          }
          
          return updatedBooking;
        }
        return booking;
      })
    );
  };

  const completeSafariEnquiries = () => {
    // Simple validation - just check if all required fields are filled
    const incompleteBookings = safariBookings.filter(booking => !booking.date || !booking.timing);
    if (incompleteBookings.length > 0) {
      showError('Incomplete Details', 'Please fill in all required fields for all safari bookings before proceeding');
      return;
    }

    // Check for morning safari on check-in day
    const morningOnCheckIn = safariBookings.filter(booking => 
      booking.date === state.checkIn && booking.timing === 'morning'
    );
    if (morningOnCheckIn.length > 0) {
      showError('Invalid Selection', 'Morning safari is not available on your check-in day. Please select afternoon or evening safari for that day.');
      return;
    }

    // Mark all enquiries as completed
    setSafariBookings(prev => 
      prev.map(booking => ({ ...booking, enquirySent: true }))
    );

    // Process selected safaris and proceed to next step
    processSelectedSafaris();
    dispatch({ type: 'SET_STEP', payload: 4 });
    
    showSuccess('Safari Enquiries Completed', `${safariBookings.length} safari enquiry(ies) have been noted and will be processed by our team.`);
  };

  const generateDateOptions = () => {
    if (!state.checkIn || !state.checkOut) return [];
    
    const dates = [];
    const start = new Date(state.checkIn);
    const end = new Date(state.checkOut);
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      dates.push({
        value: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
    
    return dates;
  };

  const calculateSafariTotal = () => {
    // Safari inquiries are free, so return 0
    return 0;
  };

  const handleNext = () => {
    processSelectedSafaris();
  };

  const processSelectedSafaris = async () => {
    // Process safari bookings and add to context
    const selectedSafaris = [];
    
    safariBookings.forEach((booking) => {
      if (booking.enquirySent) {
        const safariData = {
          id: booking.id,
          name: `Jungle Safari ${booking.id.replace('safari', '')}`,
          date: booking.date,
          timing: booking.timing,
          persons: booking.persons,
          price: 0, // Safari inquiries are free
          description: 'Wildlife Safari Experience',
          duration: '3-4 hours'
        };
        selectedSafaris.push(safariData);
      }
    });

    // Update context with selected safaris
    dispatch({ type: 'SET_SAFARIS', payload: selectedSafaris });
    dispatch({ type: 'CALCULATE_TOTAL' });
    
    if (selectedSafaris.length > 0) {
      showSuccess('Safari Inquiries Added', `${selectedSafaris.length} safari inquiry(ies) added to your booking`);
    }
    
    // Navigate to next step
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  const handleSkipSafari = () => {
    // Process any safari bookings that were added but not submitted
    if (safariBookings.length > 0) {
      processSelectedSafaris();
    } else {
    dispatch({ type: 'SET_SAFARIS', payload: [] });
    dispatch({ type: 'CALCULATE_TOTAL' });
    }
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const hasIncompleteEnquiries = safariBookings.some(booking => !booking.date || !booking.timing);
  const allEnquiriesSent = safariBookings.length > 0 && safariBookings.every(booking => booking.enquirySent);

  const dateOptions = generateDateOptions();
  const safariTotal = calculateSafariTotal();

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

      {/* Progress Steps */}
      <div className="border-b border-gray-200 px-6 py-8" style={{ backgroundColor: '#F3EEE7' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-gray-800 mb-8" style={{ fontSize: '18px', fontWeight: '400' }}>Jungle Safari Selection</h2>
          
          <div className="flex items-center justify-center space-x-8 relative">
            {[
              { step: 1, label: 'Dates & Accommodation', active: false, completed: true },
              { step: 2, label: 'Package Selection', active: false, completed: true },
              { step: 3, label: 'Safari Selection', active: true, completed: false },
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

      {/* Navigation Modal - Exact Vue.js Design */}
      <div className="flex justify-center py-4">
        <div 
          className="relative"
          style={{
            width: '618px',
            height: '48px'
          }}
        >
          {/* Date Summary Section */}
          <div 
            className="absolute"
            style={{
              width: '568px',
              height: '48px',
              top: '0',
              left: '50%',
              backgroundColor: '#ffffff',
              border: '0.2px solid #8b8881',
              transform: 'translate(-45.6%, 0)',
              zIndex: 5
            }}
          >
            {/* Night Count Text */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                width: '120px',
                height: '19px',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#403b34',
                fontFamily: 'TAN - Angleton, sans-serif',
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '19px',
                whiteSpace: 'nowrap',
                zIndex: 8
              }}
            >
              {state.checkIn && state.checkOut ? 
                `${Math.ceil((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / (1000 * 60 * 60 * 24))} Night${Math.ceil((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}` : 
                'Select Dates'
              }
            </div>
            
            {/* Date Details */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                width: '520px',
                height: '11px',
                top: '28px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#4f4f4f',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '10px',
                fontWeight: '400',
                lineHeight: '11px',
                whiteSpace: 'nowrap',
                zIndex: 7
              }}
            >
              {state.checkIn && state.checkOut ? 
                `Arrival : ${new Date(state.checkIn).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })} | Departure: ${new Date(state.checkOut).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}` : 
                'Please select your arrival and departure dates'
              }
            </div>
          </div>
          
          {/* Edit Button Section */}
          <div 
            className="absolute cursor-pointer"
            style={{
              width: '50px',
              height: '48px',
              top: '0',
              left: '0',
              backgroundColor: '#f9f7f3',
              border: '0.2px solid #8b8880',
              zIndex: 1
            }}
            onClick={handleBack}
          >
            {/* Arrow Icon */}
            <div 
              className="absolute"
              style={{
                width: '15px',
                height: '15px',
                top: '14px',
                left: '18px',
                background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNSAxNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOS4zNzUgMTEuMjVMNC4xMjUgNkw5LjM3NSAwLjc1TDEwLjEyNSAxLjUyNUw1LjYyNSA2TDEwLjEyNSAxMC40NzVMOS4zNzUgMTEuMjVaIiBmaWxsPSIjNEY0RjRGIi8+PC9zdmc+) no-repeat center',
                backgroundSize: 'cover',
                zIndex: 2
              }}
            />
            
            {/* Edit Text */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                width: '37px',
                height: '11px',
                top: '29px',
                left: '7px',
                color: '#4f4f4f',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                lineHeight: '11px',
                whiteSpace: 'nowrap',
                zIndex: 3
              }}
            >
              Edit
            </div>
          </div>
        </div>
        </div>

        {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Safari Section Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-light text-gray-800 mb-2">Wildlife Safari Inquiries</h2>
            <p className="text-red-600 text-sm mb-4">
                Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
              </p>
            <div className="flex items-center text-gray-600">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">Submit your wildlife safari preferences for our team to review</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={addSafariBox}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              ADD SAFARI
            </button>
            <button 
              onClick={handleSkipSafari}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg border border-gray-200"
            >
              CONTINUE
            </button>
          </div>
        </div>

        {/* Dynamic Safari Boxes */}
        {safariBookings.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Safari Added Yet</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">Add your safari preferences to enhance your wildlife experience</p>
              <button 
                onClick={addSafariBox}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                ADD YOUR FIRST SAFARI
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
             {/* Safari Container */}
             <div className="w-full">
            {safariBookings.map((booking, index) => (
                 <div key={booking.id} className="bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 mb-6 last:mb-0 rounded-lg">
                 {/* Safari Box - Mobile Responsive Design */}
                 <div className="flex flex-col lg:flex-row mx-auto overflow-hidden" style={{ maxWidth: '900px', width: '100%', minHeight: '415px', padding: 0, margin: 0 }}>
                   {/* Image Section - Mobile First */}
                   <div 
                     className="relative w-full lg:w-1/2 h-64 lg:h-auto"
                     style={{
                       minHeight: '250px',
                       background: 'url(/images/safari/tiger-safari.jpg) no-repeat center center',
                       backgroundSize: 'cover',
                       zIndex: 10,
                       margin: 0,
                       padding: 0
                     }}
                   >
                     {/* Navigation Arrows - Hidden on mobile */}
                     <button className="hidden lg:block absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                     <button className="hidden lg:block absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                   {/* Content Section - Mobile Responsive */}
                   <div 
                     className="relative bg-white w-full lg:w-1/2 p-4 lg:p-6"
                     style={{
                       minHeight: '300px'
                     }}
                   >
                    {/* Title */}
                    <h3 
                      className="text-gray-800 font-normal mb-2"
                      style={{
                        fontFamily: 'TAN - Angleton, sans-serif',
                        fontSize: '16px',
                        fontWeight: '400',
                        lineHeight: '1.5'
                      }}
                    >
                      Jungle Safari {index + 1}
                    </h3>

                    {/* Description */}
                    <p 
                      className="text-black mb-3 text-sm"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '12px',
                        fontWeight: '400',
                        lineHeight: '1.4'
                      }}
                    >
                      The magic begins with the first light of day — mist rolling through the trees, peacocks calling from afar, and the forest slowly awakening. A morning safari is a window into Pench's most enchanting hour.
                    </p>

                    {/* Note */}
                    <p 
                      className="text-black text-xs mb-4 p-2 bg-yellow-50 rounded"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '10px',
                        fontWeight: '400',
                        lineHeight: '1.3'
                      }}
                    >
                      Note: Payment and Safari Confirmation will happen later in our follow ups as possibility depends on many factors such as the weather.
                    </p>

                    {/* Tell us in more detail */}
                    <h4 
                      className="text-gray-800 font-normal mb-3"
                      style={{
                        fontFamily: 'TAN - Angleton, sans-serif',
                        fontSize: '14px',
                        fontWeight: '400',
                        lineHeight: '1.5'
                      }}
                    >
                      Tell us in more detail
                    </h4>

                    {/* Date Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Date
                          </label>
                      <div 
                        className="relative bg-white border rounded-lg"
                        style={{
                          border: '1px solid #d1d5db'
                        }}
                      >
                          <select 
                            value={booking.date}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'date', e.target.value)}
                            className="w-full h-12 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-transparent rounded-lg"
                            style={{
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                            disabled={booking.enquirySent}
                          >
                          <option value="">Select Date</option>
                            {dateOptions.map((date) => (
                              <option key={date.value} value={date.value}>
                                {date.label}
                              </option>
                            ))}
                          </select>
                        <div 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                          style={{
                            width: '12px',
                            height: '8px',
                            background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOSIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOSA1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik00LjUgNEwwIDBIOUw0LjUgNFoiIGZpbGw9IiM0RjRGN0YiLz48L3N2Zz4=) no-repeat center',
                            backgroundSize: 'cover'
                          }}
                        />
                      </div>
                        </div>
                        
                    {/* Time Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Time
                          </label>
                      <div 
                        className="relative bg-white border rounded-lg"
                        style={{
                          border: '1px solid #d1d5db'
                        }}
                      >
                          <select 
                            value={booking.timing}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'timing', e.target.value)}
                            className="w-full h-12 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-transparent rounded-lg"
                            style={{ 
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                            disabled={booking.enquirySent}
                          >
                          <option value="">Select Time</option>
                          <option 
                            value="morning" 
                            disabled={booking.date === state.checkIn}
                          >
                            Morning{booking.date === state.checkIn ? ' (Not available on check-in day)' : ''}
                              </option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          </select>
                        <div 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                          style={{
                            width: '12px',
                            height: '8px',
                            background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOSIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOSA1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik00LjUgNEwwIDBIOUw0LjUgNFoiIGZpbGw9IiM0RjRGN0YiLz48L3N2Zz4=) no-repeat center',
                            backgroundSize: 'cover'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        (Morning, Afternoon, Evening)
                      </p>
                        </div>
                        
                    {/* Persons Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Persons
                      </label>
                      <div 
                        className="relative bg-white border rounded-lg flex items-center"
                        style={{
                          border: '1px solid #d1d5db',
                          height: '48px'
                        }}
                      >
                        <span 
                          className="px-4 text-gray-700 flex-1"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          {booking.persons} Person{booking.persons > 1 ? 's' : ''}
                        </span>
                        <span 
                          className="text-gray-500 text-sm mr-4"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '12px'
                          }}
                        >
                          (Max 6 per Jeep)
                        </span>
                          <button 
                          onClick={() => handleSafariBookingChange(booking.id, 'persons', Math.min(6, booking.persons + 1))}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors mr-2"
                          disabled={booking.enquirySent || booking.persons >= 6}
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                      </div>
                    </div>

                    {/* Time Note */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p 
                        className="text-black text-xs"
                        style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '11px',
                          fontWeight: '400',
                          lineHeight: '1.4'
                        }}
                      >
                        <strong>Note:</strong> The morning safari offers the best chance to spot tigers and other wildlife, as animals are most active at dawn. Guests can also experience cooler temperatures and excellent birdwatching opportunities. Morning safari is not available on your check-in day.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center mt-4">
                      {/* Enquiry Status Indicator */}
                      {booking.enquirySent && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Enquiry Sent
                        </div>
                      )}
                      
                      {/* Remove Button */}
                      <button 
                        onClick={() => removeSafariBox(booking.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        title="Remove Safari"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Safari Summary */}
        {safariBookings.some(booking => booking.enquirySent) && (
          <div className="mt-8 bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Wildlife Safari Inquiries Summary</h3>
            <p className="text-red-600 text-sm mb-4">
                Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
              </p>
            <div className="space-y-2">
              {safariBookings.map((booking, index) => {
                if (!booking.enquirySent) return null;
                
                return (
                  <div key={booking.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium text-gray-800">Jungle Safari {index + 1}</span>
                      <span className="text-gray-600 text-sm ml-2">
                        ({booking.persons} person{booking.persons > 1 ? 's' : ''}) - {booking.date} at {booking.timing}
                      </span>
                    </div>
                    <span className="font-semibold text-green-600">
                      ENQUIRY SENT ✓
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Helpful Message for Safari Bookings */}
        {safariBookings.length > 0 && !allEnquiriesSent && (
          <div className={`border rounded-lg p-4 mb-6 ${
            hasIncompleteEnquiries 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              <Info className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                hasIncompleteEnquiries ? 'text-yellow-600' : 'text-blue-600'
              }`} />
              <div>
                <h4 className={`font-medium mb-1 ${
                  hasIncompleteEnquiries ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {hasIncompleteEnquiries ? 'Complete Your Safari Details' : 'Submit Your Safari Enquiries'}
                </h4>
                <p className={`text-sm ${
                  hasIncompleteEnquiries ? 'text-yellow-700' : 'text-blue-700'
                }`}>
                  {hasIncompleteEnquiries 
                    ? 'Please select a date and time for each safari booking before submitting.'
                    : 'Your safari details are complete! Click "Complete Safari Enquiries" to submit them, or use "Continue Without Safari" to skip.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors rounded-lg w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Package Selection</span>
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Safari Enquiry Button - Always show if there are safari bookings */}
            {safariBookings.length > 0 && (
          <button
                onClick={completeSafariEnquiries}
                disabled={safariBookings.some(booking => !booking.date || !booking.timing)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                  safariBookings.some(booking => !booking.date || !booking.timing)
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <span>Complete Safari Enquiries</span>
            <ArrowRight className="w-4 h-4" />
          </button>
            )}
          </div>
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

export default SafariEnquiries;