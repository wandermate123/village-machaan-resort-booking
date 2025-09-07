declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentData {
  amount: number;
  currency: string;
  bookingId: string;
  guestEmail: string;
  guestName: string;
  guestPhone: string;
}

export interface CardPaymentData {
  amount: number;
  currency: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  bookingId: string;
}

export class PaymentService {
  // Load Razorpay script
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order
  static async createOrder(paymentData: PaymentData): Promise<{ orderId?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const { orderId } = await response.json();
      return { orderId };
    } catch (error) {
      console.error('Order creation failed:', error);
      return { error: 'Failed to initialize payment' };
    }
  }

  // Process payment with Razorpay
  static async processPayment(
    orderId: string, 
    paymentData: PaymentData
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      return new Promise((resolve) => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: paymentData.amount * 100, // Convert to paise
          currency: paymentData.currency,
          name: 'Village Machaan Resort',
          description: `Booking Payment - ${paymentData.bookingId}`,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingId: paymentData.bookingId,
                }),
              });

              if (verifyResponse.ok) {
                resolve({ success: true, paymentId: response.razorpay_payment_id });
              } else {
                resolve({ success: false, error: 'Payment verification failed' });
              }
            } catch (error) {
              resolve({ success: false, error: 'Payment verification failed' });
            }
          },
          prefill: {
            name: paymentData.guestName,
            email: paymentData.guestEmail,
            contact: paymentData.guestPhone,
          },
          notes: {
            booking_id: paymentData.bookingId,
          },
          theme: {
            color: '#2d5a27',
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment cancelled by user' });
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });
    } catch (error) {
      console.error('Payment processing failed:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  // Process card payment (simplified for production)
  static async processCardPayment(cardData: CardPaymentData): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // Validate card data
      if (!this.validateCardData(cardData)) {
        throw new Error('Invalid card data');
      }

      // Simulate payment processing (replace with real payment gateway)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // In production, integrate with real payment gateway like:
      // - Razorpay
      // - Stripe
      // - PayU
      // - Paytm
      
      console.log('💳 Card payment processed:', {
        amount: cardData.amount,
        currency: cardData.currency,
        bookingId: cardData.bookingId,
        paymentId: paymentId,
        cardholderName: cardData.cardholderName
      });

      return {
        success: true,
        paymentId: paymentId
      };

    } catch (error) {
      console.error('Card payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  // Validate card data
  private static validateCardData(cardData: CardPaymentData): boolean {
    // Basic validation
    if (!cardData.cardNumber || cardData.cardNumber.length < 13) return false;
    if (!cardData.expiryDate || !/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) return false;
    if (!cardData.cvv || cardData.cvv.length < 3) return false;
    if (!cardData.cardholderName || cardData.cardholderName.trim().length < 2) return false;
    
    // Check expiry date
    const [month, year] = cardData.expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return false;
    }
    
    return true;
  }

  // Refund payment
  static async refundPayment(
    paymentId: string, 
    amount?: number, 
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ 
          paymentId, 
          amount: amount ? amount * 100 : undefined, // Convert to paise
          reason 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      const { refundId } = await response.json();
      return { success: true, refundId };
    } catch (error) {
      console.error('Refund failed:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  }

  // Get payment details
  static async getPaymentDetails(paymentId: string): Promise<{ success: boolean; payment?: any; error?: string }> {
    try {
      const response = await fetch(`/api/payments/details/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }

      const payment = await response.json();
      return { success: true, payment };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      return { success: false, error: 'Failed to fetch payment details' };
    }
  }
}