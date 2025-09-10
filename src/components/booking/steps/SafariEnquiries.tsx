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
  };

  const removeSafariBox = (safariId: string) => {
    setSafariBookings(prev => prev.filter(booking => booking.id !== safariId));
  };

  const handleSafariBookingChange = (safariId: string, field: string, value: string | number) => {
    setSafariBookings(prev => 
      prev.map(booking => 
        booking.id === safariId 
          ? { ...booking, [field]: value }
          : booking
      )
    );
  };

  const sendSafariEnquiry = async (safariId: string) => {
    const booking = safariBookings.find(b => b.id === safariId);
    if (!booking || !booking.date || !booking.timing) {
      showError('Incomplete Details', 'Please fill in all required fields before sending enquiry');
      return;
    }

    try {
      const queryData = {
        booking_id: state.bookingId || `temp_${Date.now()}`,
        guest_name: `${state.guestDetails.firstName} ${state.guestDetails.lastName}`,
        email: state.guestDetails.email,
        phone: state.guestDetails.phone,
        safari_option_id: booking.safariId || 'general',
        safari_name: `Jungle Safari ${safariId.replace('safari', '')}`,
        preferred_date: booking.date,
        preferred_timing: booking.timing,
        number_of_persons: booking.persons,
        special_requirements: state.specialRequests || '',
        status: 'pending' as const
      };

      const result = await SafariQueriesService.createSafariQuery(queryData);
      
      if (result.success) {
        setSafariBookings(prev => 
          prev.map(b => 
            b.id === safariId 
              ? { ...b, enquirySent: true }
              : b
          )
        );
        showSuccess('Enquiry Sent', 'Safari enquiry has been submitted successfully');
      } else {
        showError('Submission Error', 'Failed to submit safari enquiry. Please try again.');
      }
    } catch (error) {
      console.error('Error sending safari enquiry:', error);
      showError('Submission Error', 'Failed to submit safari enquiry. Please try again.');
    }
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
    dispatch({ type: 'SET_SAFARIS', payload: [] });
    dispatch({ type: 'CALCULATE_TOTAL' });
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const hasEnquirySent = safariBookings.some(booking => booking.enquirySent);
  const hasIncompleteEnquiries = safariBookings.some(booking => booking.selected && !booking.enquirySent);

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
              { step: 1, label: 'Date & Accommodation Selection', active: false, completed: true },
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Safari Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-light text-gray-800 mb-2">Wildlife Safari Inquiries</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm font-medium">
                Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
              </p>
            </div>
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
              CONTINUE WITHOUT SAFARI
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
            {safariBookings.map((booking, index) => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Safari Image */}
                  <div className="relative">
                    <div className="relative w-full h-full overflow-hidden" style={{ minHeight: '400px' }}>
                      <img
                        src="/images/safari/tiger-safari.jpg"
                        alt={`Jungle Safari ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          console.error(`Failed to load safari image: ${e.currentTarget.src}`);
                          e.currentTarget.src = '/images/safari/tiger-safari.jpg';
                        }}
                      />
                    </div>
                    <button className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-black/90 text-white px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                      <div className="text-sm font-bold">INQUIRY</div>
                      <div className="text-xs opacity-90">Only</div>
                    </div>
                  </div>

                  {/* Safari Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Jungle Safari {index + 1}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                          Experience the thrill of wildlife safari with our expert guides.
                        </p>
                        
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            <span>3-4 hours</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1" />
                            <span>Max 6 persons</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 ml-4">
                        {booking.enquirySent && (
                          <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
                            Sent ✓
                          </div>
                        )}
                        <button 
                          onClick={() => removeSafariBox(booking.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                          title="Remove Safari"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Safari Details Form */}
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Safari Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-3.5 h-3.5 inline mr-1" />
                            Select Date
                          </label>
                          <select 
                            value={booking.date}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'date', e.target.value)}
                            className={`w-full p-2.5 border rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                              !booking.date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            required
                            disabled={booking.enquirySent}
                          >
                            <option value="">Choose Date</option>
                            {dateOptions.map((date) => (
                              <option key={date.value} value={date.value}>
                                {date.label}
                              </option>
                            ))}
                          </select>
                          {!booking.date && (
                            <p className="text-red-500 text-xs mt-1">Date is required</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            Select Timing
                          </label>
                          <select 
                            value={booking.timing}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'timing', e.target.value)}
                            className={`w-full p-2.5 border rounded-lg text-gray-700 text-sm focus:ring-2 transition-colors ${
                              !booking.timing ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{ 
                              color: '#3F3E3E',
                              accentColor: '#3F3E3E'
                            }}
                            required
                            disabled={booking.enquirySent}
                          >
                            <option value="">Choose Timing</option>
                            <option value="morning">Morning (6:00 AM - 10:00 AM)</option>
                            <option value="afternoon">Afternoon (2:00 PM - 6:00 PM)</option>
                            <option value="evening">Evening (4:00 PM - 8:00 PM)</option>
                          </select>
                          {!booking.timing && (
                            <p className="text-red-500 text-xs mt-1">Timing is required</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            <Users className="w-3.5 h-3.5 inline mr-1" />
                            Persons
                          </label>
                          <select 
                            value={booking.persons}
                            onChange={(e) => handleSafariBookingChange(booking.id, 'persons', parseInt(e.target.value))}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm focus:ring-2 transition-colors hover:border-gray-300"
                            disabled={booking.enquirySent}
                          >
                            {Array.from({ length: 6 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>
                                {num} Person{num > 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Price and Action Section */}
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-600 text-sm font-medium">Price:</div>
                          <div className="text-gray-900 text-lg font-bold">INQUIRY</div>
                          <div className="text-gray-500 text-xs">Free inquiry</div>
                        </div>
                        
                        {!booking.enquirySent ? (
                          <button 
                            onClick={() => sendSafariEnquiry(booking.id)}
                            disabled={!booking.date || !booking.timing}
                            className={`px-6 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                              booking.date && booking.timing
                                ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            SEND ENQUIRY
                          </button>
                        ) : (
                          <div className="text-emerald-600 font-medium text-sm flex items-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                            Enquiry sent
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Safari Summary */}
        {safariBookings.some(booking => booking.enquirySent) && (
          <div className="mt-8 bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Wildlife Safari Inquiries Summary</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">
                Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
              </p>
            </div>
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

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12 pt-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Package Selection</span>
          </button>
          
          <button
            onClick={handleNext}
            disabled={hasIncompleteEnquiries}
            className={`flex items-center space-x-2 px-8 py-3 rounded text-sm font-medium transition-colors ${
              hasIncompleteEnquiries
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <span>
              {hasIncompleteEnquiries 
                ? 'Complete Safari Enquiries' 
                : 'Continue to Confirmation'
              }
            </span>
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

export default SafariEnquiries;