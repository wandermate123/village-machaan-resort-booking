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
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Safari Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-light text-gray-800 mb-2">Wildlife Safari Inquiries</h2>
            <p className="text-red-600 text-sm mb-4">
                Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
              </p>
            <div className="flex items-center text-gray-600">
              <Info className="w-4 h-4 mr-2" />
              <span className="text-sm">Submit your wildlife safari preferences for our team to review</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={addSafariBox}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              ADD SAFARI
            </button>
            <button 
              onClick={handleSkipSafari}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg border border-gray-200"
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
          <div className="space-y-8">
            {/* Safari Container */}
            <div className="w-full">
              {safariBookings.map((booking, index) => (
                <div key={booking.id} className="bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 mb-8 last:mb-0">
                {/* Safari Box - Exact Design Match */}
                <div className="flex mx-auto overflow-hidden" style={{ maxWidth: '900px', width: '100%', height: '415px', padding: 0, margin: 0 }}>
                  {/* Left Image Section */}
                  <div 
                    className="relative flex-shrink-0"
                    style={{
                      width: '45%',
                      minWidth: '400px',
                      height: '415px',
                      background: 'url(/images/safari/tiger-safari.jpg) no-repeat 0 0',
                      backgroundSize: 'cover',
                      zIndex: 10,
                      margin: 0,
                      padding: 0
                    }}
                  >
                    {/* Navigation Arrows */}
                    <button className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right Content Section */}
                  <div 
                    className="relative bg-white flex-shrink-0 overflow-hidden"
                    style={{
                      width: '55%',
                      minWidth: '500px',
                      height: '415px',
                      padding: '27px 24px'
                    }}
                  >
                    {/* Title */}
                    <h3 
                      className="text-gray-800 font-normal absolute"
                      style={{
                        fontFamily: 'TAN - Angleton, sans-serif',
                        fontSize: '15px',
                        fontWeight: '400',
                        lineHeight: '28.845px',
                        top: '27px',
                        left: '20px',
                        zIndex: 1
                      }}
                    >
                      Jungle Safari {index + 1}
                    </h3>

                    {/* Description */}
                    <p 
                      className="text-black absolute"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '10px',
                        fontWeight: '400',
                        lineHeight: '12.5px',
                        width: '334px',
                        height: '39px',
                        top: '62px',
                        left: '20px',
                        zIndex: 3
                      }}
                    >
                      The magic begins with the first light of day — mist rolling through the trees, peacocks calling from afar, and the forest slowly awakening. A morning safari is a window into Pench's most enchanting hour.
                    </p>


                    {/* Note */}
                    <p 
                      className="text-black absolute"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '7px',
                        fontWeight: '400',
                        lineHeight: '8.75px',
                        width: '229px',
                        height: '18px',
                        top: '134px',
                        right: '20px',
                        zIndex: 4
                      }}
                    >
                      Note: Payment and Safari Confirmation will happen later in our follow ups as possibility depends on many factors such as the weather.
                    </p>

                    {/* Tell us in more detail */}
                    <h4 
                      className="text-gray-800 font-normal absolute"
                      style={{
                        fontFamily: 'TAN - Angleton, sans-serif',
                        fontSize: '12px',
                        fontWeight: '400',
                        lineHeight: '23px',
                        top: '196px',
                        left: '20px',
                        zIndex: 2
                      }}
                    >
                      Tell us in more detail
                    </h4>

                    {/* Date Input */}
                    <div 
                      className="absolute"
                      style={{
                        width: '300px',
                        height: '46px',
                        top: '237px',
                        left: '20px',
                        zIndex: 11
                      }}
                    >
                      <div 
                        className="relative bg-white border w-full h-full"
                        style={{
                          border: '0.5px solid #3f3e3e'
                        }}
                      >
                          <select 
                            value={booking.date}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'date', e.target.value)}
                          className="w-full h-full px-4 text-gray-700 focus:outline-none appearance-none bg-transparent"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '10px',
                            fontWeight: '600',
                            lineHeight: '10px'
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
                            width: '9px',
                            height: '5px',
                            background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOSIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOSA1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik00LjUgNEwwIDBIOUw0LjUgNFoiIGZpbGw9IiM0RjRGN0YiLz48L3N2Zz4=) no-repeat center',
                            backgroundSize: 'cover'
                          }}
                        />
                      </div>
                        </div>
                        
                    {/* Time Input */}
                    <div 
                      className="absolute"
                      style={{
                        width: '300px',
                        height: '46px',
                        top: '291px',
                        left: '20px',
                        zIndex: 15
                      }}
                    >
                      <div 
                        className="relative bg-white border w-full h-full"
                        style={{
                          border: '0.5px solid #3f3e3e'
                        }}
                      >
                          <select 
                            value={booking.timing}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'timing', e.target.value)}
                          className="w-full h-full px-4 text-gray-700 focus:outline-none appearance-none bg-transparent"
                            style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '10px',
                            fontWeight: '600',
                            lineHeight: '10px'
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
                            width: '9px',
                            height: '5px',
                            background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOSIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOSA1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik00LjUgNEwwIDBIOUw0LjUgNFoiIGZpbGw9IiM0RjRGN0YiLz48L3N2Zz4=) no-repeat center',
                            backgroundSize: 'cover'
                          }}
                        />
                        <span 
                          className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '10px',
                            fontWeight: '600',
                            lineHeight: '12.5px'
                          }}
                        >
                          (Morning, Afternoon, Night)
                        </span>
                        </div>
                      </div>

                    {/* Time Note */}
                    <p 
                      className="text-black absolute"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '6px',
                        fontWeight: '400',
                        lineHeight: '7.492px',
                        width: '98px',
                        height: '49px',
                        top: '289px',
                        right: '5px',
                        zIndex: 5
                      }}
                    >
                      Note: The morning safari offers the best chance to spot tigers and other wildlife, as animals are most active at dawn. Guests can also experience cooler temperatures and excellent birdwatching opportunities. Morning safari is not available on your check-in day.
                    </p>
                        
                    {/* Persons Input */}
                    <div 
                      className="absolute"
                      style={{
                        width: '300px',
                        height: '46px',
                        top: '345px',
                        left: '20px',
                        zIndex: 20
                      }}
                    >
                      <div 
                        className="relative bg-white border flex items-center w-full h-full"
                        style={{
                          border: '0.5px solid #3f3e3e'
                        }}
                      >
                        <span 
                          className="px-4 text-gray-700"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '10px',
                            fontWeight: '600',
                            lineHeight: '10px'
                          }}
                        >
                          {booking.persons} Persons
                        </span>
                        <span 
                          className="text-gray-400"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '10px',
                            fontWeight: '600',
                            lineHeight: '12.5px'
                          }}
                        >
                          (6 people per Jeep)
                        </span>
                          <button 
                          onClick={() => handleSafariBookingChange(booking.id, 'persons', Math.min(6, booking.persons + 1))}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                          disabled={booking.enquirySent || booking.persons >= 6}
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                      </div>
                    </div>

                    {/* Enquiry Status Indicator */}
                    {booking.enquirySent && (
                      <div 
                        className="absolute top-4 right-4 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          top: '20px',
                          right: '20px'
                        }}
                      >
                        ✓ Sent
                      </div>
                    )}

                    {/* Remove Button */}
                    <button 
                      onClick={() => removeSafariBox(booking.id)}
                      className="absolute top-4 right-16 p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      style={{
                        top: '20px',
                        right: '5px'
                      }}
                      title="Remove Safari"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
        <div className="flex justify-between items-center mt-12 pt-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Package Selection</span>
          </button>
          
          <div className="flex gap-3">
            {/* Safari Enquiry Button - Always show if there are safari bookings */}
            {safariBookings.length > 0 && (
              <button
                onClick={completeSafariEnquiries}
                disabled={safariBookings.some(booking => !booking.date || !booking.timing)}
                className={`flex items-center space-x-2 px-6 py-3 rounded text-sm font-medium transition-colors ${
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