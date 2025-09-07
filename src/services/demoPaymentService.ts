export interface DemoPaymentData {
  amount: number;
  currency: string;
  bookingId: string;
  guestEmail: string;
  guestName: string;
  guestPhone: string;
}

export class DemoPaymentService {
  // Simulate payment processing for demo
  static async processPayment(
    paymentData: DemoPaymentData
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    return new Promise((resolve) => {
      // Simulate payment processing delay - reduced from 2s to 1s
      setTimeout(() => {
        // 90% success rate for demo
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          const demoPaymentId = `demo_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log('✅ Demo payment successful:', demoPaymentId);
          resolve({ 
            success: true, 
            paymentId: demoPaymentId 
          });
        } else {
          console.log('❌ Demo payment failed (simulated)');
          resolve({ 
            success: false, 
            error: 'Demo payment failed - please try again' 
          });
        }
      }, 1000); // Reduced from 2 seconds to 1 second
    });
  }

  // Create demo order
  static async createOrder(paymentData: DemoPaymentData): Promise<{ orderId?: string; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const demoOrderId = `demo_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('✅ Demo order created:', demoOrderId);
        resolve({ orderId: demoOrderId });
      }, 500); // Reduced from 1 second to 0.5 seconds
    });
  }

  // Check if we should use demo payment
  static shouldUseDemoPayment(): boolean {
    return !import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID === 'demo';
  }
}