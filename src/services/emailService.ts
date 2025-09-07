import emailjs from '@emailjs/browser';

export interface EmailTemplate {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  booking_id?: string;
  villa_name?: string;
  check_in?: string;
  check_out?: string;
  total_amount?: string;
  guest_phone?: string;
}

export class EmailService {
  private static serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  private static publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // Initialize EmailJS
  static init() {
    if (this.publicKey) {
      emailjs.init(this.publicKey);
    }
  }

  // Send booking confirmation email
  static async sendBookingConfirmation(bookingData: {
    guestName: string;
    email: string;
    bookingId: string;
    villaName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    guestPhone?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Always simulate email sending for demo
      if (!this.serviceId || !this.publicKey) {
        console.warn('EmailJS not configured, simulating email send for demo');
        
        // Simulate email sending for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('📧 Demo Email Sent:', {
          to: bookingData.email,
          subject: `Booking Confirmation - ${bookingData.bookingId}`,
          content: `Dear ${bookingData.guestName}, your booking for ${bookingData.villaName} is confirmed!`
        });
        
        return { success: true };
      }

      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONFIRMATION;
      
      const templateParams: EmailTemplate = {
        to_email: bookingData.email,
        to_name: bookingData.guestName,
        subject: `Booking Confirmation - ${bookingData.bookingId}`,
        message: `Dear ${bookingData.guestName},

Thank you for choosing Village Machaan Resort! We're excited to confirm your reservation.

Booking Details:
• Booking ID: ${bookingData.bookingId}
• Villa: ${bookingData.villaName}
• Check-in: ${new Date(bookingData.checkIn).toLocaleDateString('en-IN')}
• Check-out: ${new Date(bookingData.checkOut).toLocaleDateString('en-IN')}
• Total Amount: ₹${bookingData.totalAmount.toLocaleString()}

We look forward to welcoming you to our resort. If you have any questions, please don't hesitate to contact us at +91 7462 252052.

Best regards,
Village Machaan Resort Team`,
        booking_id: bookingData.bookingId,
        villa_name: bookingData.villaName,
        check_in: new Date(bookingData.checkIn).toLocaleDateString('en-IN'),
        check_out: new Date(bookingData.checkOut).toLocaleDateString('en-IN'),
        total_amount: `₹${bookingData.totalAmount.toLocaleString()}`,
        guest_phone: bookingData.guestPhone || ''
      };

      const response = await emailjs.send(
        this.serviceId,
        templateId,
        templateParams
      );

      console.log('✅ Confirmation email sent successfully:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error);
      return { success: false, error: 'Failed to send confirmation email' };
    }
  }

  // Send booking cancellation email
  static async sendCancellationEmail(bookingData: {
    guestName: string;
    email: string;
    bookingId: string;
    refundAmount?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.serviceId || !this.publicKey) {
        return { success: true };
      }

      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CANCELLATION;
      
      const templateParams: EmailTemplate = {
        to_email: bookingData.email,
        to_name: bookingData.guestName,
        subject: `Booking Cancellation - ${bookingData.bookingId}`,
        message: `Dear ${bookingData.guestName},

We're sorry to inform you that your booking ${bookingData.bookingId} has been cancelled.

${bookingData.refundAmount ? `Refund Details:
• Refund Amount: ₹${bookingData.refundAmount.toLocaleString()}
• Refund will be processed within 5-7 business days` : ''}

If you have any questions or would like to make a new reservation, please contact us at +91 7462 252052.

We hope to welcome you at Village Machaan Resort in the future.

Best regards,
Village Machaan Resort Team`,
        booking_id: bookingData.bookingId
      };

      const response = await emailjs.send(
        this.serviceId,
        templateId,
        templateParams
      );

      console.log('✅ Cancellation email sent successfully:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send cancellation email:', error);
      return { success: false, error: 'Failed to send cancellation email' };
    }
  }

  // Send payment reminder
  static async sendPaymentReminder(bookingData: {
    guestName: string;
    email: string;
    bookingId: string;
    dueAmount: number;
    dueDate: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.serviceId || !this.publicKey) {
        return { success: true };
      }

      const templateParams: EmailTemplate = {
        to_email: bookingData.email,
        to_name: bookingData.guestName,
        subject: `Payment Reminder - ${bookingData.bookingId}`,
        message: `Dear ${bookingData.guestName},

This is a friendly reminder that your payment for booking ${bookingData.bookingId} is pending.

Payment Details:
• Amount Due: ₹${bookingData.dueAmount.toLocaleString()}
• Due Date: ${new Date(bookingData.dueDate).toLocaleDateString('en-IN')}

Please complete your payment to confirm your reservation. You can pay online or contact us at +91 7462 252052.

Thank you for choosing Village Machaan Resort.

Best regards,
Village Machaan Resort Team`,
        booking_id: bookingData.bookingId,
        total_amount: `₹${bookingData.dueAmount.toLocaleString()}`
      };

      const response = await emailjs.send(
        this.serviceId,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONFIRMATION, // Reuse confirmation template
        templateParams
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send payment reminder:', error);
      return { success: false, error: 'Failed to send payment reminder' };
    }
  }

  // Send admin notification email
  static async sendAdminNotification(data: {
    type: 'new_booking' | 'payment_received' | 'cancellation';
    bookingId: string;
    guestName: string;
    amount?: number;
    details: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.serviceId || !this.publicKey) {
        return { success: true };
      }

      const adminEmail = 'admin@villagemachaan.com'; // Configure admin email
      
      const templateParams: EmailTemplate = {
        to_email: adminEmail,
        to_name: 'Village Machaan Admin',
        subject: `${data.type.replace('_', ' ').toUpperCase()} - ${data.bookingId}`,
        message: `Admin Notification:

Type: ${data.type.replace('_', ' ').toUpperCase()}
Booking ID: ${data.bookingId}
Guest: ${data.guestName}
${data.amount ? `Amount: ₹${data.amount.toLocaleString()}` : ''}

Details: ${data.details}

Please check the admin dashboard for more information.`,
        booking_id: data.bookingId
      };

      const response = await emailjs.send(
        this.serviceId,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONFIRMATION,
        templateParams
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      return { success: false, error: 'Failed to send admin notification' };
    }
  }
}

// Initialize EmailJS when the module loads
EmailService.init();