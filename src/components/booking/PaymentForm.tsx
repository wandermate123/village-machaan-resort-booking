import React, { useState } from 'react';
import { CreditCard, Lock, Shield, MapPin, CheckCircle } from 'lucide-react';
import { PaymentService } from '../../services/paymentService';
import LoadingSpinner from '../common/LoadingSpinner';
import BookingProgressLoader from '../common/BookingProgressLoader';
import { BookingService } from '../../services/bookingService';
import { EmailService } from '../../services/emailService';

interface PaymentFormProps {
  amount: number;
  bookingId: string;
  supabaseBookingId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  bookingId,
  supabaseBookingId,
  guestDetails,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'property'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHalfPaymentConfirm, setShowHalfPaymentConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState<'processing' | 'updating' | 'emailing' | 'completing'>('processing');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const handleHalfPayment = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      console.log('🔄 Processing half payment for booking:', supabaseBookingId);
      console.log('📊 Payment form props - bookingId:', bookingId, 'supabaseBookingId:', supabaseBookingId);
      
      // Step 1: Simulate half payment processing delay - reduced from 2s to 1s
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Update booking status
      setCurrentStep('updating');
      const identifier = supabaseBookingId || bookingId;
      if (identifier) {
        console.log('🔄 Attempting to update booking status for half payment:', identifier);
        
        try {
          const halfAmount = Math.round(amount / 2);
          const remainingAmount = amount - halfAmount;
          
          const result = await BookingService.updateBooking(identifier, {
            payment_status: 'advance_paid',
            status: 'confirmed',
            advance_amount: halfAmount,
            remaining_amount: remainingAmount,
            advance_paid_at: new Date().toISOString(),
            advance_payment_method: 'bank_transfer',
            payment_reference: `advance_${Date.now()}`,
            admin_notes: `Half payment received: ₹${halfAmount.toLocaleString()} (50% advance). Remaining: ₹${remainingAmount.toLocaleString()} to be paid at property. Payment method: Bank Transfer.`
          });
          
          if (result.success) {
            console.log('✅ Half payment update successful');
            console.log('📊 Payment details:', {
              total_amount: amount,
              advance_paid: halfAmount,
              remaining: remainingAmount,
              payment_status: 'advance_paid',
              booking_id: identifier
            });
          } else {
            console.warn('⚠️ Half payment update failed, but continuing with payment:', result.error);
            // Don't fail the payment if update fails - continue with success
          }
        } catch (updateError) {
          console.warn('⚠️ Half payment update error, but continuing with payment:', updateError);
          // Don't fail the payment if update fails - continue with success
        }
      } else {
        console.warn('⚠️ No booking identifier available, proceeding with demo half payment');
      }
      
      // Step 3: Send confirmation email
      setCurrentStep('emailing');
      try {
        await EmailService.sendBookingConfirmation({
          guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
          email: guestDetails.email,
          bookingId,
          villaName: 'Village Machaan Resort',
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          totalAmount: Math.round(amount / 2),
          guestPhone: guestDetails.phone
        });
        console.log('✅ Half payment confirmation email sent');
        
        // Send admin notification for half payment
        await EmailService.sendAdminNotification({
          type: 'new_booking',
          bookingId: identifier || bookingId,
          guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
          amount: Math.round(amount / 2),
          details: `New booking created with 50% advance payment of ₹${Math.round(amount / 2).toLocaleString()}. Remaining amount: ₹${Math.round(amount / 2).toLocaleString()} to be paid at property. Payment method: Bank Transfer.`
        });
        console.log('✅ Admin notification email sent for half payment');
      } catch (emailError) {
        console.warn('⚠️ Failed to send confirmation email:', emailError);
        // Don't fail the payment if email fails
      }

      // Step 4: Complete
      setCurrentStep('completing');
      const halfPaymentId = `advance_${Date.now()}`;
      console.log('✅ Half payment completed successfully:', halfPaymentId);
      
      setTimeout(() => {
        onPaymentSuccess(halfPaymentId);
      }, 500);
      
    } catch (error) {
      console.error('❌ Half payment error:', error);
      onPaymentError('Failed to process advance payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmHalfPayment = () => {
    setShowHalfPaymentConfirm(false);
    handleHalfPayment();
  };

  const handleOnlinePayment = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Validate card details
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
        throw new Error('Please fill in all card details');
      }

      // Process payment using PaymentService
      setCurrentStep('updating');
      const paymentResult = await PaymentService.processCardPayment({
        amount: amount,
        currency: 'INR',
        cardNumber: cardDetails.cardNumber,
        expiryDate: cardDetails.expiryDate,
        cvv: cardDetails.cvv,
        cardholderName: cardDetails.cardholderName,
        bookingId: supabaseBookingId || bookingId
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Update booking status
      const identifier = supabaseBookingId || bookingId;
      if (identifier) {
        const result = await BookingService.updateBooking(identifier, {
          payment_status: 'paid',
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          payment_method: 'online',
          payment_reference: paymentResult.paymentId,
          admin_notes: `Full payment received: ₹${amount.toLocaleString()}. Payment method: Online Card Payment.`
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update booking');
        }
        
        console.log('✅ Online payment booking updated successfully');
      }

      // Send confirmation email
      setCurrentStep('emailing');
      try {
        await EmailService.sendBookingConfirmation({
          bookingId: identifier || bookingId,
          guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
          email: guestDetails.email,
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          villaName: 'Selected Villa',
          totalAmount: amount,
          advanceAmount: 0,
          remainingAmount: 0
        });
        console.log('✅ Online payment confirmation email sent');
        
        // Send admin notification
        await EmailService.sendAdminNotification({
          type: 'new_booking',
          bookingId: identifier || bookingId,
          guestName: `${guestDetails.firstName} ${guestDetails.lastName}`,
          amount: amount,
          details: `New booking created with full payment of ₹${amount.toLocaleString()}. Payment method: Online Card Payment.`
        });
        console.log('✅ Admin notification email sent');
      } catch (emailError) {
        console.warn('⚠️ Failed to send confirmation email:', emailError);
      }

      // Complete
      setCurrentStep('completing');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Online payment processed successfully');
      onPaymentSuccess(paymentResult.paymentId);
      
    } catch (error) {
      console.error('❌ Online payment failed:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show progress loader when processing half payment
  if (paymentMethod === 'property' && isProcessing) {
    return (
      <BookingProgressLoader 
        currentStep={currentStep}
        message="Processing your half payment..."
      />
    );
  }

  if (paymentMethod === 'property') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-primary-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-primary-950 mb-2">Pay Half Online & Half at Property</h3>
          <p className="text-primary-700">Pay 50% now and 50% when you arrive at the resort</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-blue-800 mb-3">Payment Details</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• Total Amount: ₹{amount.toLocaleString()}</p>
            <p>• Pay Now: ₹{Math.round(amount / 2).toLocaleString()} (50%)</p>
            <p>• Pay at Property: ₹{Math.round(amount / 2).toLocaleString()} (50%)</p>
            <p>• Accepted: Cash, Card, UPI</p>
            <p>• Booking will be confirmed immediately</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> You need to pay 50% now to confirm your booking. 
            The remaining 50% will be collected at the property during check-in.
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setPaymentMethod('online')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Full Payment
          </button>
          <button
            onClick={() => setShowHalfPaymentConfirm(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Pay ₹{Math.round(amount / 2).toLocaleString()} Now
          </button>
        </div>

        {/* Half Payment Confirmation Modal */}
        {showHalfPaymentConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-primary-950 mb-2">Confirm Half Payment</h3>
                <p className="text-primary-700">Have you completed the payment of ₹{Math.round(amount / 2).toLocaleString()}?</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-blue-800 font-semibold">Amount to Pay: ₹{Math.round(amount / 2).toLocaleString()}</p>
                  <p className="text-blue-700 text-sm mt-1">Remaining at property: ₹{Math.round(amount / 2).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-800 mb-3">Bank Transfer Details</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>A/c No:</strong> 50200010535327</p>
                  <p><strong>IFSC CODE:</strong> HDFC0001777</p>
                  <p><strong>A/c Holder Name:</strong> Village Resorts PVT LTD</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConfirmHalfPayment}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="sm" color="text-white" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Yes, I have completed the payment
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowHalfPaymentConfirm(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
                >
                  No, let me pay first
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <h3 className="text-lg font-semibold text-primary-950 mb-4">Choose Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('online')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'online' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-center">
              <p className="font-semibold text-primary-950">Pay Online</p>
              <p className="text-sm text-primary-600">Secure online payment</p>
            </div>
          </button>
          
          <button
            onClick={() => setPaymentMethod('property')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'property' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-center">
              <p className="font-semibold text-primary-950">Pay Half & Half</p>
              <p className="text-sm text-primary-600">50% now, 50% at property</p>
            </div>
          </button>
        </div>
      </div>

      {/* Online Payment Form */}
      {paymentMethod === 'online' && (
        <div className="space-y-6">
          {/* Card Details Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-primary-950">Card Details</h3>
            </div>

            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={5}
                  />
                </div>

                {/* CVV */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                  className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Secure Payment</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handleOnlinePayment}
            disabled={isProcessing}
            className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Pay ₹{amount.toLocaleString()}</span>
              </>
            )}
          </button>

          {/* Progress Loader for Online Payment */}
          {isProcessing && (
            <BookingProgressLoader 
              currentStep={currentStep}
              steps={[
                { key: 'processing', label: 'Processing Payment', icon: CreditCard },
                { key: 'updating', label: 'Updating Booking', icon: CheckCircle },
                { key: 'emailing', label: 'Sending Confirmation', icon: CheckCircle },
                { key: 'completing', label: 'Completing Booking', icon: CheckCircle }
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentForm;