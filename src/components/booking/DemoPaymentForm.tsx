import React, { useState } from 'react';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { DemoPaymentService } from '../../services/demoPaymentService';
import { BookingService } from '../../services/bookingService';
import LoadingSpinner from '../common/LoadingSpinner';
import BookingProgressLoader from '../common/BookingProgressLoader';

interface DemoPaymentFormProps {
  amount: number;
  bookingId: string;
  supabaseBookingId?: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

const DemoPaymentForm: React.FC<DemoPaymentFormProps> = ({
  amount,
  bookingId,
  supabaseBookingId,
  guestDetails,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [currentStep, setCurrentStep] = useState<'processing' | 'updating' | 'emailing' | 'completing'>('processing');

  const handleDemoPayment = async () => {
    setIsProcessing(true);
    setPaymentError('');
    setCurrentStep('processing');

    try {
      // Step 1: Create demo order
      const { orderId, error: orderError } = await DemoPaymentService.createOrder({
        amount,
        currency: 'INR',
        bookingId,
        guestEmail: guestDetails.email,
        guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
        guestPhone: guestDetails.phone,
      });

      if (orderError || !orderId) {
        throw new Error(orderError || 'Failed to create demo order');
      }

      // Step 2: Process demo payment
      setCurrentStep('updating');
      const { success, paymentId, error: paymentError } = await DemoPaymentService.processPayment({
        amount,
        currency: 'INR',
        bookingId,
        guestEmail: guestDetails.email,
        guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
        guestPhone: guestDetails.phone,
      });

      if (success && paymentId) {
        console.log('✅ Demo payment successful, updating booking status');
        
        // Step 3: Update booking status after successful payment
        const identifier = supabaseBookingId || bookingId;
        if (identifier) {
          console.log('🔄 Updating booking status for:', identifier);
          const updateResult = await BookingService.updateBooking(identifier, {
            payment_status: 'paid',
            status: 'confirmed',
            razorpay_payment_id: paymentId,
            payment_reference: paymentId
          });
          
          if (updateResult.success) {
            console.log('✅ Booking status updated successfully');
          } else {
            console.warn('⚠️ Failed to update booking status:', updateResult.error);
            // Don't fail the payment flow if booking update fails
          }
        } else {
          console.warn('⚠️ No booking identifier available for update');
        }
        
        // Step 4: Complete
        setCurrentStep('completing');
        setTimeout(() => {
          onPaymentSuccess(paymentId);
        }, 500);
      } else {
        console.error('❌ Demo payment failed:', paymentError);
        setPaymentError(paymentError || 'Demo payment failed');
        onPaymentError(paymentError || 'Demo payment failed');
      }
    } catch (error) {
      console.error('❌ Demo payment processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Demo payment processing failed';
      setPaymentError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show progress loader when processing
  if (isProcessing) {
    return (
      <BookingProgressLoader 
        currentStep={currentStep}
        message="Processing your payment securely..."
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-primary-100">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2 text-primary-800">
          <Shield className="w-6 h-6" />
          <span className="font-semibold">Demo Payment Gateway</span>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Demo Mode Active</span>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          This is a demo payment system. No real money will be charged. 
          90% success rate for testing purposes.
        </p>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h3 className="text-primary-800 font-medium mb-4">Select Payment Method (Demo)</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedMethod('card')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === 'card' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-primary-600" />
            <span className="text-sm font-medium">Demo Card</span>
          </button>
          
          <button
            onClick={() => setSelectedMethod('upi')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === 'upi' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-6 h-6 mx-auto mb-2 bg-primary-600 rounded text-white text-xs flex items-center justify-center">
              UPI
            </div>
            <span className="text-sm font-medium">Demo UPI</span>
          </button>
        </div>
      </div>

      {/* Demo Payment Details */}
      {selectedMethod === 'card' && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Demo Card Details</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Card Number:</strong> 4111 1111 1111 1111</p>
            <p><strong>Expiry:</strong> 12/25</p>
            <p><strong>CVV:</strong> 123</p>
            <p><strong>Name:</strong> Demo User</p>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-primary-700">Booking ID:</span>
            <span className="font-mono text-primary-950">{bookingId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-primary-700">Guest Name:</span>
            <span className="text-primary-950">{guestDetails.firstName} {guestDetails.lastName}</span>
          </div>
          <div className="border-t border-primary-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-primary-950 text-lg">Total Amount:</span>
              <span className="text-3xl font-bold text-secondary-600">₹{amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="bg-error-50 border border-error-200 text-error-600 p-4 rounded-lg text-sm mb-6">
          {paymentError}
        </div>
      )}

      <button
        onClick={handleDemoPayment}
        disabled={isProcessing}
        className="w-full bg-secondary-600 hover:bg-secondary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" color="text-white" />
            Processing Demo Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay ₹{amount.toLocaleString()} (Demo)
          </>
        )}
      </button>

      <div className="text-center text-xs text-primary-600 mt-4 space-y-1">
        <p>🔒 Demo payment system - No real charges</p>
        <p>✅ 90% success rate for testing</p>
        <p>📧 Confirmation emails will be sent automatically</p>
      </div>
    </div>
  );
};

export default DemoPaymentForm;