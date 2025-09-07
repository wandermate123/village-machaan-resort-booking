import { useState, useEffect } from 'react';
import { ValidationService, ValidationError } from '../utils/validation';
import { useBooking } from '../contexts/BookingContext';

export const useBookingValidation = () => {
  const { state } = useBooking();
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateCurrentStep();
  }, [state]);

  const validateCurrentStep = () => {
    const currentErrors: ValidationError[] = [];

    switch (state.currentStep) {
      case 1: // Date & Villa Selection
        if (state.checkIn && state.checkOut) {
          currentErrors.push(...ValidationService.validateDates(state.checkIn, state.checkOut));
        }
        if (state.selectedVilla && state.guests) {
          const guestError = ValidationService.validateGuests(state.guests, state.selectedVilla.max_guests);
          if (guestError) currentErrors.push(guestError);
        }
        break;

      case 4: // Guest Details
        if (state.guestDetails.firstName || state.guestDetails.lastName || 
            state.guestDetails.email || state.guestDetails.phone) {
          currentErrors.push(...ValidationService.validateBookingForm({
            checkIn: state.checkIn,
            checkOut: state.checkOut,
            guests: state.guests,
            villa: state.selectedVilla,
            guestDetails: state.guestDetails
          }));
        }
        break;
    }

    setErrors(currentErrors);
    setIsValid(currentErrors.length === 0);
  };

  const getFieldError = (fieldName: string): string | null => {
    const error = errors.find(err => err.field === fieldName);
    return error ? error.message : null;
  };

  const hasFieldError = (fieldName: string): boolean => {
    return errors.some(err => err.field === fieldName);
  };

  return {
    errors,
    isValid,
    getFieldError,
    hasFieldError,
    validateCurrentStep
  };
};