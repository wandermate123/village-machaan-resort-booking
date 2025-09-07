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