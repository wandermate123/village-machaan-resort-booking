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
    // Restore session on load
    const savedSession = localStorage.getItem('booking_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        // Check if session is less than 24 hours old
        if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
          dispatch({ type: 'RESTORE_SESSION', payload: sessionData });
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    }
  }, [dispatch]);

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