import React, { useEffect } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import DateVillaSelection from './steps/DateVillaSelection';
import PackageSelection from './steps/PackageSelection';
import SafariEnquiries from './steps/SafariEnquiries';
import BookingSummary from './steps/BookingSummary';

const BookingFlow = () => {
  const { state, dispatch } = useBooking();

  useEffect(() => {
    // Save session data
    const sessionData = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem('booking_session', JSON.stringify(sessionData));
  }, [state]);

  useEffect(() => {
    // Clear any existing session data to start fresh with blank dates
    localStorage.removeItem('booking_session');
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // You can add logic here to sync with browser history if needed
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <DateVillaSelection />;
      case 2:
        return <PackageSelection />;
      case 3:
        return <SafariEnquiries />;
      case 4:
        return <BookingSummary />;
      default:
        return <DateVillaSelection />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderStep()}
    </div>
  );
};

export default BookingFlow;