import React, { useState, useEffect } from 'react';
import { useBooking } from '../../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, X, ArrowLeft, ArrowRight, Info, Clock, Users, Calendar } from 'lucide-react';
import { useToast } from '../../common/Toast';
import { SafariService } from '../../../services/safariService';
import { SafariQueriesService } from '../../../services/safariQueriesService';
import LoadingSpinner from '../../common/LoadingSpinner';

const SafariEnquiries = () => {
  const { state, dispatch } = useBooking();
  const { showSuccess, showError } = useToast();
  const [safariOptions, setSafariOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safariBookings, setSafariBookings] = useState({
    safari1: { selected: false, date: '', timing: '', persons: 2 },
    safari2: { selected: false, date: '', timing: '', persons: 2 },
    safari3: { selected: false, date: '', timing: '', persons: 2 }
  });

  useEffect(() => {
    fetchSafariOptions();
  }, []);

  const fetchSafariOptions = async () => {
    setLoading(true);
    try {
      const options = await SafariService.getActiveSafariOptions();
      setSafariOptions(options);
      
      // Initialize booking state based on fetched options
      const initialBookings = {};
      options.forEach((option, index) => {
        initialBookings[`safari${index + 1}`] = {
          selected: false,
          date: '',
          timing: '',
          persons: 2,
          safariId: option.id
        };
      });
      setSafariBookings(initialBookings);
    } catch (error) {
      showError('Loading Error', 'Failed to load safari options');
    } finally {
      setLoading(false);
    }
  };

  const handleSafariToggle = (safariId: string) => {
    setSafariBookings(prev => ({
      ...prev,
      [safariId]: {
        ...prev[safariId],
        selected: !prev[safariId].selected
      }
    }));
  };

  const handleSafariBookingChange = (safariId: string, field: string, value: string | number) => {
    setSafariBookings(prev => ({
      ...prev,
      [safariId]: {
        ...prev[safariId],
        [field]: value
      }
    }));
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
    let total = 0;
    Object.entries(safariBookings).forEach(([safariId, booking]) => {
      if (booking.selected) {
        const safari = safariOptions.find(s => s.id === booking.safariId);
        if (safari) {
          total += safari.price_per_person * booking.persons;
        }
      }
    });
    return total;
  };

  const handleNext = () => {
    processSelectedSafaris();
  };

  const processSelectedSafaris = async () => {
    // Process safari bookings and add to context
    const selectedSafaris = [];
    const incompleteSelections = [];
    
    Object.entries(safariBookings).forEach(([safariId, booking]) => {
      if (booking.selected) {
        const safari = safariOptions.find(s => s.id === booking.safariId);
        if (safari) {
          if (!booking.date || !booking.timing) {
            incompleteSelections.push(safari.name);
          } else {
            const safariData = {
              id: booking.safariId,
              name: safari.name,
              date: booking.date,
              timing: booking.timing,
              persons: booking.persons,
              price: 0, // Safari inquiries are free
              description: safari.description,
              duration: safari.duration
            };
            selectedSafaris.push(safariData);
          }
        }
      }
    });

    // Check for incomplete selections
    if (incompleteSelections.length > 0) {
      showError('Incomplete Selection', `Please select date and timing for: ${incompleteSelections.join(', ')}`);
      return;
    }

    // Save safari queries to database
    if (selectedSafaris.length > 0) {
      try {
        const queryPromises = selectedSafaris.map(async (safari) => {
          const queryData = {
            booking_id: state.bookingId || `temp_${Date.now()}`,
            guest_name: `${state.guestDetails.firstName} ${state.guestDetails.lastName}`,
            email: state.guestDetails.email,
            phone: state.guestDetails.phone,
            safari_option_id: safari.id,
            safari_name: safari.name,
            preferred_date: safari.date,
            preferred_timing: safari.timing,
            number_of_persons: safari.persons,
            special_requirements: state.specialRequests || '',
            status: 'pending' as const
          };

          return SafariQueriesService.createSafariQuery(queryData);
        });

        const results = await Promise.all(queryPromises);
        const successCount = results.filter(r => r.success).length;
        
        if (successCount > 0) {
          showSuccess('Safari Inquiry Submitted', `Successfully submitted ${successCount} safari inquiry(ies). Our team will review and respond soon.`);
        }
      } catch (error) {
        console.error('Error saving safari queries:', error);
        showError('Submission Error', 'Failed to submit safari inquiries. Please try again.');
      }
    }

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

  const hasSelectedSafaris = Object.values(safariBookings).some(booking => booking.selected);
  const hasValidSelections = Object.entries(safariBookings).some(([safariId, booking]) => 
    booking.selected && booking.date && booking.timing
  );

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

      {/* Progress Steps */}
      <div className="border-b border-gray-200 px-6 py-8" style={{ backgroundColor: '#F3EEE7' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl text-gray-800 mb-8">Jungle Safari Selection</h2>
          
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Date & Accommodation Selection', active: false, completed: true },
              { step: 2, label: 'Package Selection', active: false, completed: true },
              { step: 3, label: 'Safari Selection', active: true, completed: false },
              { step: 4, label: 'Confirmation', active: false, completed: false }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${
                     item.completed ? 'border-black bg-white text-black' :
                     item.active ? 'border-black bg-white text-black' : 'border-gray-300 bg-white text-gray-400'
                   }`}>
                    {item.completed ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      item.step
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center max-w-32 font-serif leading-tight whitespace-nowrap">{item.label}</span>
                </div>
                {index < 3 && <div className="w-16 h-px bg-gray-300 mx-4 mt-[-20px]"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Summary Bar */}
      <div className="bg-blue-500 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <span>
            You have selected {state.selectedVilla?.name} for {state.guests} guests from {' '}
            {state.checkIn ? new Date(state.checkIn).toLocaleDateString() : 'selected dates'} to {' '}
            {state.checkOut ? new Date(state.checkOut).toLocaleDateString() : 'checkout date'}
          </span>
          <div className="flex items-center space-x-4">
            <span>Villa: ₹{state.selectedVilla?.base_price.toLocaleString() || '0'} / night</span>
            {safariTotal > 0 && <span>Safari Total: ₹{safariTotal.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Add a Safari Section */}
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
              onClick={processSelectedSafaris}
              disabled={!hasSelectedSafaris}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                hasSelectedSafaris 
                  ? 'bg-secondary-600 hover:bg-secondary-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {hasSelectedSafaris ? 'ADD SAFARI INQUIRY' : 'SELECT SAFARI FIRST'}
            </button>
            <button 
              onClick={handleSkipSafari}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 text-sm font-medium transition-colors"
            >
              CONTINUE WITHOUT SAFARI
            </button>
          </div>
        </div>

        {/* Safari Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : safariOptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No safari options available at the moment.</p>
          </div>
        ) : (
        <div className="space-y-8">
          {safariOptions.map((safari, index) => {
            const safariKey = `safari${index + 1}`;
            const booking = safariBookings[safariKey];
            if (!booking) return null;
            const isSelected = booking.selected;
            
            return (
              <div key={safariKey} className={`bg-white border-2 transition-all duration-300 overflow-hidden ${
                isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Safari Image */}
                  <div className="relative">
                    <div className="relative w-full h-80 lg:h-96 overflow-hidden">
                      <img
                        src={(safari.images && safari.images.length > 0) ? safari.images[0] : '/images/safari/tiger-safari.jpg'}
                        alt={safari.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          console.error(`Failed to load safari image: ${e.currentTarget.src}`);
                          e.currentTarget.src = '/images/safari/tiger-safari.jpg';
                        }}
                      />
                    </div>
                    <button className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg">
                      <div className="text-lg font-bold">INQUIRY</div>
                      <div className="text-xs">Only</div>
                    </div>
                  </div>

                  {/* Safari Details */}
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-light text-gray-800 mb-3">{safari.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{safari.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{safari.duration}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>Max 6 persons</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleSafariToggle(safariKey)}
                        className={`px-6 py-2 text-sm font-medium transition-colors ml-8 ${
                          isSelected 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Select Safari'}
                      </button>
                    </div>

                    {/* Booking Form - Only show if selected */}
                    {isSelected && (
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Safari Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Select Date
                            </label>
                            <select 
                              value={booking.date}
                              onChange={(e) => handleSafariBookingChange(safariKey, 'date', e.target.value)}
                              className={`w-full p-3 border rounded text-gray-600 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                booking.selected && !booking.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            >
                              <option value="">Choose Date</option>
                              {dateOptions.map((date) => (
                                <option key={date.value} value={date.value}>
                                  {date.label}
                                </option>
                              ))}
                            </select>
                            {booking.selected && !booking.date && (
                              <p className="text-red-600 text-xs mt-1">Date is required</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Select Timing
                            </label>
                            <select 
                              value={booking.timing}
                              onChange={(e) => handleSafariBookingChange(safariKey, 'timing', e.target.value)}
                              className={`w-full p-3 border rounded text-gray-600 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                booking.selected && !booking.timing ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              required
                            >
                              <option value="">Choose Timing</option>
                              {safari.timings?.map((timing) => (
                                <option key={timing.value} value={timing.value}>
                                  {timing.label}
                                </option>
                              ))}
                            </select>
                            {booking.selected && !booking.timing && (
                              <p className="text-red-600 text-xs mt-1">Timing is required</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Users className="w-4 h-4 inline mr-1" />
                              Number of Persons
                            </label>
                            <select 
                              value={booking.persons}
                              onChange={(e) => handleSafariBookingChange(safariKey, 'persons', parseInt(e.target.value))}
                              className="w-full p-3 border border-gray-300 rounded text-gray-600 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {Array.from({ length: safari.max_persons }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>
                                  {num} Person{num > 1 ? 's' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Price Calculation */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="text-center">
                            <span className="text-red-800 font-medium">Safari Inquiry Submitted</span>
                            <div className="text-red-700 text-sm mt-1">
                              For {booking.persons} person{booking.persons > 1 ? 's' : ''} - Confirmation pending
                            </div>
                          </div>
                        </div>

                        {/* Safari Highlights */}
                        <div className="text-xs text-gray-500 space-y-1">
                          {safari.highlights?.map((highlight, idx) => (
                            <p key={idx}>• {highlight}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safari Highlights - Always visible */}
                    {!isSelected && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {safari.highlights?.map((highlight, idx) => (
                          <p key={idx}>• {highlight}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Safari Summary */}
        {Object.values(safariBookings).some(booking => booking.selected) && (
          <div className="mt-8 bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Wildlife Safari Inquiries Summary</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">
                Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(safariBookings).map(([safariId, booking]) => {
                if (!booking.selected) return null;
                const safari = safariOptions.find(s => s.id === booking.safariId);
                if (!safari) return null;
                
                return (
                  <div key={safariId} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium text-gray-800">{safari.name}</span>
                      <span className="text-gray-600 text-sm ml-2">
                        ({booking.persons} person{booking.persons > 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className="font-semibold text-red-600">
                      INQUIRY SUBMITTED
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
            disabled={hasSelectedSafaris && !hasValidSelections}
            className={`flex items-center space-x-2 px-8 py-3 rounded text-sm font-medium transition-colors ${
              hasSelectedSafaris && !hasValidSelections
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <span>
              {hasSelectedSafaris && !hasValidSelections 
                ? 'Complete Safari Details' 
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