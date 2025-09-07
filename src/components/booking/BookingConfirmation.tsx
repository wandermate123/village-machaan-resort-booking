import React from 'react';
import { CheckCircle, Calendar, MapPin, Users, Mail, Phone, Download, Home } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';

interface BookingConfirmationProps {
  bookingId: string;
  paymentId: string;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingId, paymentId }) => {
  const { state, dispatch } = useBooking();

  const handleNewBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
    window.location.href = '/';
  };

  const calculateNights = () => {
    if (!state.checkIn || !state.checkOut) return 0;
    const start = new Date(state.checkIn);
    const end = new Date(state.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const villaTotal = state.selectedVilla ? nights * state.selectedVilla.base_price : 0;
  const packageTotal = state.selectedPackage ? state.selectedPackage.price : 0;
  const packagePricePerNight = state.selectedPackage && nights > 0 ? state.selectedPackage.price / nights : 0;
  const safariTotal = state.selectedSafaris.reduce((sum, safari) => sum + safari.price, 0);
  const subtotal = villaTotal + packageTotal + safariTotal;
  const taxes = Math.round(subtotal * 0.18);
  const total = subtotal + taxes;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold text-primary-950 mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-xl text-primary-700">
            Thank you for choosing Village Machaan Resort
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Information */}
            <div>
              <h2 className="text-2xl font-semibold text-primary-950 mb-6">Booking Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-950">Booking ID</p>
                    <p className="text-primary-700 font-mono">{bookingId}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-950">Villa</p>
                    <p className="text-primary-700">{state.selectedVilla?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-950">Guests</p>
                    <p className="text-primary-700">{state.guests} guests for {nights} nights</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-primary-950">Stay Period</p>
                    <p className="text-primary-700">
                      {new Date(state.checkIn).toLocaleDateString()} - {new Date(state.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-2xl font-semibold text-primary-950 mb-6">Payment Summary</h2>
              
              <div className="bg-primary-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-primary-700">
                      {state.selectedVilla?.name} ({nights} night{nights !== 1 ? 's' : ''})
                      {state.selectedPackage && (
                        <div className="text-xs mt-1">
                          {state.selectedPackage.name}
                          {packagePricePerNight > 0 && (
                            <span> (+₹{packagePricePerNight.toLocaleString()}/night)</span>
                          )}
                        </div>
                      )}
                    </span>
                    <span className="text-primary-950">₹{villaTotal.toLocaleString()}</span>
                  </div>
                  
                  {safariTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-primary-700">Safari Experiences</span>
                      <span className="text-primary-950">₹{safariTotal.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-primary-700">Taxes (18%)</span>
                    <span className="text-primary-950">₹{taxes.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-primary-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary-950 text-lg">Total Paid</span>
                      <span className="text-2xl font-bold text-green-600">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Payment ID: {paymentId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-primary-950 mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-secondary-600" />
              <div>
                <p className="font-medium text-primary-950">Resort Contact</p>
                <p className="text-primary-700">+91 7462 252052</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-secondary-600" />
              <div>
                <p className="font-medium text-primary-950">Email Support</p>
                <p className="text-primary-700">villagemachaan@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-primary-950 mb-6">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-primary-950 mb-2">Confirmation Email</h3>
              <p className="text-primary-700 text-sm">Check your email for detailed booking confirmation and resort information.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-primary-950 mb-2">Resort Contact</h3>
              <p className="text-primary-700 text-sm">Our team will contact you 24 hours before arrival with check-in details.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-primary-950 mb-2">Prepare for Stay</h3>
              <p className="text-primary-700 text-sm">Pack comfortable clothes and get ready for an amazing nature experience!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Download Confirmation
          </button>
          
          <button 
            onClick={handleNewBooking}
            className="bg-primary-800 hover:bg-primary-900 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Book Another Stay
          </button>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-yellow-800 mb-3">Important Information</h3>
          <ul className="space-y-2 text-yellow-700 text-sm">
            <li>• Check-in time: 2:00 PM | Check-out time: 11:00 AM</li>
            <li>• Please carry valid ID proof for all guests</li>
            <li>• Cancellation allowed up to 48 hours before check-in</li>
            <li>• For any changes, contact us at +91 7462 252052</li>
            {state.selectedSafaris.length > 0 && (
              <li className="text-red-700 font-medium">• Safari requests are inquiries only - confirmation will be shared separately with payment link</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;