import React, { useState } from 'react';
import { useBooking } from '../../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import ImageDebugger from '../../common/ImageDebugger';
import PaymentForm from '../PaymentForm';
import BookingConfirmation from '../BookingConfirmation';
import LoadingSpinner from '../../common/LoadingSpinner';
import { ValidationService } from '../../../utils/validation';
import { ErrorHandler } from '../../../utils/errorHandler';
import { useToast } from '../../common/Toast';
import FormField from '../../common/FormField';
import { BookingService } from '../../../services/bookingService';
import { EmailService } from '../../../services/emailService';

const BookingSummary = () => {
  const { state, dispatch } = useBooking();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [supabaseBookingId, setSupabaseBookingId] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const calculateNights = () => {
    if (!state.checkIn || !state.checkOut) return 0;
    const start = new Date(state.checkIn);
    const end = new Date(state.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleGuestDetailsChange = (field: string, value: string) => {
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
    
    dispatch({
      type: 'SET_GUEST_DETAILS',
      payload: { ...state.guestDetails, [field]: value }
    });
  };

  const validateForm = (): boolean => {
    const errors = ValidationService.validateBookingForm({
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      guests: state.guests,
      villa: state.selectedVilla,
      guestDetails: state.guestDetails
    });

    const errorMap: Record<string, string> = {};
    errors.forEach(error => {
      errorMap[error.field] = error.message;
    });

    // Check terms acceptance
    if (!termsAccepted) {
      errorMap['terms'] = 'You must accept the terms and conditions to proceed';
    }

    setValidationErrors(errorMap);
    return errors.length === 0 && termsAccepted;
  };

  const handleCreateBooking = async () => {
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors below and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Check availability one more time
      const isAvailable = await BookingService.checkAvailability(
        state.selectedVilla!.id,
        state.checkIn,
        state.checkOut
      );

      if (!isAvailable) {
        throw new Error('Villa is no longer available for selected dates');
      }

      const bookingData = {
        check_in: state.checkIn,
        check_out: state.checkOut,
        guests: state.guests,
        villa_id: state.selectedVilla!.id,
        villa_name: state.selectedVilla!.name,
        villa_price: state.selectedVilla!.base_price,
        package_id: state.selectedPackage?.id || null,
        package_name: state.selectedPackage?.name || null,
        package_price: state.selectedPackage?.price || 0,
        safari_requests: state.selectedSafaris,
        safari_total: state.selectedSafaris.reduce((sum, safari) => sum + safari.price, 0),
        guest_name: `${state.guestDetails.firstName} ${state.guestDetails.lastName}`,
        email: state.guestDetails.email,
        phone: state.guestDetails.phone,
        special_requests: state.guestDetails.specialRequests || null,
        subtotal: subtotal,
        taxes: taxes,
        total_amount: total,
        session_id: state.sessionId
      };

      const result = await BookingService.createBooking(bookingData);

      console.log('📊 Booking creation result:', result);

      if (result.success && result.bookingId) {
        setBookingId(result.bookingId);
        if (result.supabaseId) {
          setSupabaseBookingId(result.supabaseId);
          console.log('✅ Supabase booking ID set:', result.supabaseId);
        } else {
          console.warn('⚠️ No Supabase ID returned from booking creation');
          // Use bookingId as fallback for updates
          setSupabaseBookingId(result.bookingId);
        }
        setShowPayment(true);
        showSuccess('Booking Created', 'Your booking has been created successfully. Please proceed with payment.');
      } else {
        throw new Error(result.error || 'Booking creation failed');
      }
    } catch (error) {
      const appError = ErrorHandler.handleError(error, 'booking_creation');
      setSubmitError(appError.message);
      showError('Booking Failed', appError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setPaymentId(paymentId);
      
      // Update booking status to confirmed
      console.log('🔄 Updating booking status after payment success. Supabase ID:', supabaseBookingId, 'Display ID:', bookingId);
      
      // Use the Supabase UUID for database operations
      const bookingUpdateResult = await BookingService.updateBookingStatus(supabaseBookingId, 'confirmed');
      
      if (!bookingUpdateResult.success) {
        console.warn('⚠️ Failed to update booking status, but payment was successful:', bookingUpdateResult.error);
        // Don't fail the entire flow if booking update fails - payment was successful
      }
      
      showSuccess('Payment Successful', 'Your payment has been processed successfully!');

      // Send confirmation email using EmailJS
      await EmailService.sendBookingConfirmation({
        guestName: `${state.guestDetails.firstName} ${state.guestDetails.lastName}`,
        email: state.guestDetails.email,
        bookingId,
        villaName: state.selectedVilla?.name || 'Selected Villa',
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        totalAmount: total,
        guestPhone: state.guestDetails.phone,
        adults: state.guests,
        children: 0 // You can add children count if needed
      });

      // Send admin notification
      await EmailService.sendAdminNotification({
        type: 'new_booking',
        bookingId,
        guestName: `${state.guestDetails.firstName} ${state.guestDetails.lastName}`,
        amount: total,
        details: `New booking confirmed for ${state.selectedVilla?.name} from ${state.checkIn} to ${state.checkOut}`
      });

      // Clear session and show success
      localStorage.removeItem('booking_session');
      showSuccess(
        'Booking Confirmed!', 
        'Your booking is confirmed! Confirmation email sent successfully.'
      );
      
      // Redirect after delay
      setTimeout(() => {
        // Show booking confirmation page instead of redirecting
        setShowBookingConfirmation(true);
      }, 2000);
      
    } catch (error) {
      ErrorHandler.logError(error, 'post_payment_processing');
      showError(
        'Payment Successful', 
        `Payment completed but confirmation email failed. Please save your booking ID: ${bookingId}`
      );
      // Still show confirmation even if email fails
      setTimeout(() => {
        setShowBookingConfirmation(true);
      }, 2000);
    }
  };

  const handlePaymentError = (error: string) => {
    setSubmitError(`Payment failed: ${error}`);
    showError('Payment Failed', error);
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  const nights = calculateNights();
  const villaTotal = state.selectedVilla ? nights * state.selectedVilla.base_price : 0;
  const packageTotal = state.selectedPackage ? state.selectedPackage.price : 0;
  const safariTotal = state.selectedSafaris.reduce((sum, safari) => sum + safari.price, 0);
  const subtotal = villaTotal + packageTotal + safariTotal;
  const taxes = Math.round(subtotal * 0.18); // 18% tax
  const total = subtotal + taxes;

  // Calculate base villa price and package price per night for display
  const baseVillaPrice = state.selectedVilla ? state.selectedVilla.base_price : 0;
  const packagePricePerNight = state.selectedPackage ? state.selectedPackage.price : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Show booking confirmation page after successful payment
  if (showBookingConfirmation) {
    return <BookingConfirmation bookingId={bookingId} paymentId={paymentId} />;
  }

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
          <h2 className="text-center text-gray-800 mb-8" style={{ fontSize: '18px', fontWeight: '400' }}>Confirm Your Stay</h2>
          
          <div className="flex items-center justify-center space-x-8 relative">
            {[
              { step: 1, label: 'Dates & Accommodation', active: false, completed: true },
              { step: 2, label: 'Package Selection', active: false, completed: true },
              { step: 3, label: 'Safari Selection', active: false, completed: true },
              { step: 4, label: 'Confirmation', active: true, completed: false }
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
            onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })}
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

      {/* Date Summary Bar */}
      <div className="border-b border-gray-200 px-6 py-4" style={{ backgroundColor: '#F3EEE7' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBack}
              className="text-sm text-gray-600 underline hover:text-gray-800 transition-colors"
            >
              Edit
            </button>
            <span className="text-sm text-gray-600">
              Arrival: {state.checkIn ? formatDate(state.checkIn) : 'Not selected'} | 
              Departure: {state.checkOut ? formatDate(state.checkOut) : 'Not selected'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-800">
            {nights} Night{nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stay Summary Card */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-light text-gray-800 text-center mb-6">Stay Summary</h3>
              
              {/* Villa Image */}
              <div className="relative mb-6">
                <ImageDebugger
                  imagePath={state.selectedVilla?.images?.[0] || '/images/glass-cottage/main.jpg'}
                  alt={state.selectedVilla?.name || 'Villa'}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              {/* Stay Details */}
              <div className="text-center text-sm text-gray-600 space-y-1 mb-6">
                <p>Arriving: {state.checkIn ? formatDate(state.checkIn) : 'Not selected'}</p>
                <p>Departing: {state.checkOut ? formatDate(state.checkOut) : 'Not selected'}</p>
                <p>Adults: {Math.max(1, state.guests - Math.floor(state.guests * 0.2))} • Children: {Math.floor(state.guests * 0.2)}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-light text-gray-800 text-center mb-2">
                  {state.selectedVilla?.name || 'Villa'}
                </h4>
                {state.selectedPackage && (
                  <p className="text-center text-gray-600 mb-4">
                    Package: {state.selectedPackage.name}
                  </p>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {state.selectedVilla?.name} ({nights} night{nights !== 1 ? 's' : ''})
                      {state.selectedPackage && (
                        <div className="text-xs text-gray-500 mt-1">
                          Base: ₹{baseVillaPrice.toLocaleString()}/night
                          {packagePricePerNight > 0 && (
                            <span> + Package: ₹{packagePricePerNight.toLocaleString()}/night</span>
                          )}
                        </div>
                      )}
                    </span>
                    <span className="text-gray-800">₹{villaTotal.toLocaleString()}</span>
                  </div>
                  
                  {state.safariEnquiryCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Wildlife Safari Inquiries ({state.safariEnquiryCount} enquiry{state.safariEnquiryCount > 1 ? 'ies' : ''})
                      </span>
                      <span className="text-red-600 text-sm">Pending Confirmation</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taxes & Fees (18%)</span>
                    <span className="text-gray-800">₹{taxes.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center font-medium text-lg">
                      <span className="text-gray-800">Total Amount</span>
                      <span className="text-gray-800">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Information Form */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-xl font-light text-gray-800 text-center mb-6">Guest Information</h3>

            {/* Safari Warning */}
            {state.safariEnquiryCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm font-medium">
                  Safari requests are treated as inquiries only. Confirmation will be shared by our team with a payment link if dates are available, or alternate options if not.
                  {state.safariEnquiryCount > 0 && (
                    <span className="block mt-1 font-semibold">
                      You have {state.safariEnquiryCount} safari enquiry{state.safariEnquiryCount > 1 ? 'ies' : ''} pending.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Guest Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" required error={validationErrors['First Name']}>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={state.guestDetails.firstName}
                    onChange={(e) => handleGuestDetailsChange('firstName', e.target.value)}
                    className={`w-full p-3 border text-gray-800 text-sm placeholder-gray-500 rounded-lg transition-colors ${
                      validationErrors['First Name'] 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                </FormField>
                
                <FormField label="Last Name" required error={validationErrors['Last Name']}>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={state.guestDetails.lastName}
                    onChange={(e) => handleGuestDetailsChange('lastName', e.target.value)}
                    className={`w-full p-3 border text-gray-800 text-sm placeholder-gray-500 rounded-lg transition-colors ${
                      validationErrors['Last Name'] 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                </FormField>
              </div>
              
              <FormField label="Email Address" required error={validationErrors.email}>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={state.guestDetails.email}
                  onChange={(e) => handleGuestDetailsChange('email', e.target.value)}
                  className={`w-full p-3 border text-gray-800 text-sm placeholder-gray-500 rounded-lg transition-colors ${
                    validationErrors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </FormField>
              
              <FormField label="Phone Number" required error={validationErrors.phone}>
                <div className="flex">
                  <select className="p-3 border border-gray-300 border-r-0 text-gray-600 text-sm rounded-l-lg" style={{ color: '#3F3E3E', accentColor: '#3F3E3E' }}>
                    <option>+91</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={state.guestDetails.phone}
                    onChange={(e) => handleGuestDetailsChange('phone', e.target.value)}
                    className={`flex-1 p-3 border text-gray-800 text-sm placeholder-gray-500 rounded-r-lg transition-colors ${
                      validationErrors.phone 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </FormField>

              <FormField label="Special Requests" error={validationErrors.specialRequests}>
                <textarea
                  placeholder="Any special requests or requirements..."
                  value={state.guestDetails.specialRequests}
                  onChange={(e) => handleGuestDetailsChange('specialRequests', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 text-gray-800 text-sm placeholder-gray-500 rounded-lg transition-colors"
                />
              </FormField>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 mt-6">
              <label className="flex items-start space-x-3 text-xs text-gray-600">
                <input 
                  type="checkbox" 
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-gray-600" 
                />
                <span>
                  I consent to receiving email marketing from Village Machaan Resort, including discounts and special promotions, and 
                  understand that I can opt out anytime.
                </span>
              </label>

              <label className="flex items-start space-x-3 text-xs text-gray-600">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-gray-600" 
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="underline text-blue-600 hover:text-blue-800">Terms & Conditions</a>,{' '}
                  <a href="#" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</a>, and{' '}
                  <a href="#" className="underline text-blue-600 hover:text-blue-800">Cancellation Policy</a> of Village Machaan Resort.
                </span>
              </label>
              
              {validationErrors.terms && (
                <p className="text-red-600 text-xs">{validationErrors.terms}</p>
              )}
            </div>

            {/* Book Now Button */}
            <div className="mt-8">
              {!showPayment ? (
                <button
                  onClick={handleCreateBooking}
                  disabled={
                    !state.guestDetails.firstName || 
                    !state.guestDetails.lastName || 
                    !state.guestDetails.email || 
                    !state.guestDetails.phone ||
                    !termsAccepted ||
                    isSubmitting
                  }
                  className="w-full bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" color="text-white" />
                      <span>Creating Booking...</span>
                    </div>
                  ) : (
                    `Proceed to Payment - ₹${total.toLocaleString()}`
                  )}
                </button>
              ) : (
                <PaymentForm
                  amount={total}
                  bookingId={bookingId}
                  supabaseBookingId={supabaseBookingId}
                  guestDetails={state.guestDetails}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mt-4 text-center text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                {submitError}
              </div>
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

export default BookingSummary;