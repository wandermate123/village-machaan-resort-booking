import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { APP_CONFIG } from '../utils/constants';

export interface Villa {
  id: string;
  name: string;
  price: number;
  maxGuests: number;
  description: string;
  amenities: string[];
  images: string[];
}

export interface Package {
  id: string;
  name: string;
  description: string;
  inclusions: string[];
  price: number;
  duration: string;
}

export interface SafariOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
}

export interface BookingState {
  currentStep: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  selectedVilla: Villa | null;
  selectedPackage: Package | null;
  selectedSafaris: SafariOption[];
  safariEnquiryCount: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  totalAmount: number;
  sessionId: string;
}

type BookingAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_DATES'; payload: { checkIn: string; checkOut: string } }
  | { type: 'SET_GUESTS'; payload: number }
  | { type: 'SET_VILLA'; payload: Villa }
  | { type: 'SET_PACKAGE'; payload: Package }
  | { type: 'ADD_SAFARI'; payload: SafariOption }
  | { type: 'REMOVE_SAFARI'; payload: string }
  | { type: 'SET_SAFARIS'; payload: SafariOption[] }
  | { type: 'INCREMENT_SAFARI_ENQUIRY_COUNT' }
  | { type: 'SET_GUEST_DETAILS'; payload: BookingState['guestDetails'] }
  | { type: 'CALCULATE_TOTAL' }
  | { type: 'RESET_BOOKING' }
  | { type: 'RESTORE_SESSION'; payload: Partial<BookingState> };

const initialState: BookingState = {
  currentStep: 1,
  checkIn: '',
  checkOut: '',
  guests: 2,
  selectedVilla: null,
  selectedPackage: null,
  selectedSafaris: [],
  safariEnquiryCount: 0,
  guestDetails: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
  },
  totalAmount: 0,
  sessionId: '',
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_DATES':
      return { ...state, ...action.payload };
    case 'SET_GUESTS':
      return { ...state, guests: action.payload };
    case 'SET_VILLA':
      return { ...state, selectedVilla: action.payload };
    case 'SET_PACKAGE':
      return { ...state, selectedPackage: action.payload };
    case 'ADD_SAFARI':
      return { 
        ...state, 
        selectedSafaris: [...state.selectedSafaris, action.payload] 
      };
    case 'REMOVE_SAFARI':
      return { 
        ...state, 
        selectedSafaris: state.selectedSafaris.filter(s => s.id !== action.payload) 
      };
    case 'SET_SAFARIS':
      return { ...state, selectedSafaris: action.payload };
    case 'INCREMENT_SAFARI_ENQUIRY_COUNT':
      return { ...state, safariEnquiryCount: state.safariEnquiryCount + 1 };
    case 'SET_GUEST_DETAILS':
      return { ...state, guestDetails: action.payload };
    case 'CALCULATE_TOTAL':
      const nights = calculateNights(state.checkIn, state.checkOut);
      const guests = state.guests || 0;
      
      // Calculate villa total with dynamic pricing
      let villaTotal = 0;
      if (state.selectedVilla) {
        const baseVillaPrice = state.selectedVilla.base_price * nights;
        const extraGuests = Math.max(0, guests - 2);
        const extraGuestCharge = 2000; // ₹2000 per extra person per night
        const extraGuestTotal = extraGuests * extraGuestCharge * nights;
        villaTotal = baseVillaPrice + extraGuestTotal;
      }
      
      // Calculate package total with dynamic pricing
      let packageTotal = 0;
      if (state.selectedPackage) {
        const basePackagePrice = state.selectedPackage.price * nights;
        const extraGuests = Math.max(0, guests - 2);
        const extraGuestCharge = 500; // ₹500 per extra person per night for breakfast
        const extraGuestTotal = extraGuests * extraGuestCharge * nights;
        packageTotal = basePackagePrice + extraGuestTotal;
      }
      
      const safariTotal = state.selectedSafaris.reduce((sum, safari) => sum + safari.price, 0);
      return { ...state, totalAmount: villaTotal + packageTotal + safariTotal };
    case 'RESET_BOOKING':
      return { ...initialState, sessionId: generateSessionId() };
    case 'RESTORE_SESSION':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
} | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, {
    ...initialState,
    sessionId: generateSessionId()
  });

  // Session timeout handling
  useSessionTimeout(() => {
    alert('Your booking session has expired due to inactivity. Please start over.');
    dispatch({ type: 'RESET_BOOKING' });
    localStorage.removeItem('booking_session');
  });
  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}