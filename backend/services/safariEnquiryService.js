const SafariEnquiryModel = require('../models/SafariEnquiry');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

class SafariEnquiryService {
  constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      this.model = new SafariEnquiryModel(this.supabase);
    } else {
      console.warn('⚠️ Supabase credentials not found. Safari enquiry service will not work properly.');
      this.supabase = null;
      this.model = null;
    }
    
    this.emailTransporter = this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    // Configure email transporter (you can use your preferred email service)
    return nodemailer.createTransport({
      service: 'gmail', // or your preferred service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  // Create a single safari enquiry
  async createEnquiry(enquiryData) {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const enquiry = await this.model.create(enquiryData);
      
      // Send confirmation email to guest
      await this.sendEnquiryConfirmationEmail(enquiry);
      
      // Send notification to admin
      await this.sendAdminNotification(enquiry);
      
      return {
        success: true,
        enquiry,
        message: 'Safari enquiry created successfully'
      };
    } catch (error) {
      console.error('Error creating safari enquiry:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create safari enquiry'
      };
    }
  }

  // Create multiple safari enquiries (bulk)
  async createBulkEnquiries(enquiriesData) {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const enquiries = await this.model.createBulk(enquiriesData);
      
      // Send confirmation email for all enquiries
      await this.sendBulkEnquiryConfirmationEmail(enquiries);
      
      // Send admin notification
      await this.sendBulkAdminNotification(enquiries);
      
      return {
        success: true,
        enquiries,
        count: enquiries.length,
        message: `${enquiries.length} safari enquiries created successfully`
      };
    } catch (error) {
      console.error('Error creating bulk safari enquiries:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create safari enquiries'
      };
    }
  }

  // Get all enquiries with pagination and filtering
  async getEnquiries(filters = {}, page = 1, limit = 10) {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const result = await this.model.find(filters, page, limit);

      return {
        success: true,
        enquiries: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.count,
          pages: result.pages
        }
      };
    } catch (error) {
      console.error('Error fetching safari enquiries:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch safari enquiries'
      };
    }
  }

  // Get enquiry by ID
  async getEnquiryById(enquiryId) {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const enquiry = await this.model.findById(enquiryId);
      if (!enquiry) {
        return {
          success: false,
          message: 'Safari enquiry not found'
        };
      }

      return {
        success: true,
        enquiry
      };
    } catch (error) {
      console.error('Error fetching safari enquiry:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch safari enquiry'
      };
    }
  }

  // Update enquiry status
  async updateEnquiryStatus(enquiryId, status, adminNotes = '', adminResponse = '') {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const enquiry = await this.model.updateStatus(enquiryId, status, adminNotes, adminResponse);

      if (!enquiry) {
        return {
          success: false,
          message: 'Safari enquiry not found'
        };
      }

      // Send status update email to guest
      await this.sendStatusUpdateEmail(enquiry);

      return {
        success: true,
        enquiry,
        message: 'Enquiry status updated successfully'
      };
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update enquiry status'
      };
    }
  }

  // Confirm enquiry with specific date and timing
  async confirmEnquiry(enquiryId, confirmedDate, confirmedTiming, quotedPrice = 0) {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const enquiry = await this.model.confirm(enquiryId, confirmedDate, confirmedTiming, quotedPrice);

      if (!enquiry) {
        return {
          success: false,
          message: 'Safari enquiry not found'
        };
      }

      // Send confirmation email with payment link
      await this.sendConfirmationEmail(enquiry);

      return {
        success: true,
        enquiry,
        message: 'Enquiry confirmed successfully'
      };
    } catch (error) {
      console.error('Error confirming enquiry:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to confirm enquiry'
      };
    }
  }

  // Get enquiry statistics
  async getEnquiryStats() {
    try {
      if (!this.model) {
        return {
          success: false,
          error: 'Supabase not configured',
          message: 'Database not configured properly'
        };
      }

      const stats = await this.model.getStats();

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error fetching enquiry stats:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch enquiry statistics'
      };
    }
  }

  // Email methods
  async sendEnquiryConfirmationEmail(enquiry) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: enquiry.email,
        subject: `Safari Enquiry Confirmation - ${this.model.getFormattedEnquiryId(enquiry)}`,
        html: `
          <h2>Safari Enquiry Received</h2>
          <p>Dear ${enquiry.guest_name},</p>
          <p>Thank you for your safari enquiry. We have received your request and will get back to you soon.</p>
          
          <h3>Enquiry Details:</h3>
          <ul>
            <li><strong>Enquiry ID:</strong> ${this.model.getFormattedEnquiryId(enquiry)}</li>
            <li><strong>Safari:</strong> ${enquiry.safari_name}</li>
            <li><strong>Preferred Date:</strong> ${new Date(enquiry.preferred_date).toDateString()}</li>
            <li><strong>Preferred Timing:</strong> ${enquiry.preferred_timing}</li>
            <li><strong>Number of Persons:</strong> ${enquiry.number_of_persons}</li>
          </ul>
          
          <p>We will review your enquiry and contact you within 24 hours with availability and pricing details.</p>
          <p>Best regards,<br>Village Machaan Team</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }

  async sendBulkEnquiryConfirmationEmail(enquiries) {
    try {
      const guestEmail = enquiries[0].email;
      const guestName = enquiries[0].guest_name;
      
      const enquiryList = enquiries.map(enquiry => `
        <li>
          <strong>${enquiry.safari_name}</strong> - 
          ${new Date(enquiry.preferred_date).toDateString()} at ${enquiry.preferred_timing} 
          (${enquiry.number_of_persons} persons)
        </li>
      `).join('');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: guestEmail,
        subject: `Multiple Safari Enquiries Confirmation - ${enquiries.length} enquiries`,
        html: `
          <h2>Multiple Safari Enquiries Received</h2>
          <p>Dear ${guestName},</p>
          <p>Thank you for your safari enquiries. We have received ${enquiries.length} enquiry(ies) and will get back to you soon.</p>
          
          <h3>Your Enquiries:</h3>
          <ul>
            ${enquiryList}
          </ul>
          
          <p>We will review all your enquiries and contact you within 24 hours with availability and pricing details.</p>
          <p>Best regards,<br>Village Machaan Team</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending bulk confirmation email:', error);
    }
  }

  async sendAdminNotification(enquiry) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: process.env.ADMIN_EMAIL || 'admin@villagemachaan.com',
        subject: `New Safari Enquiry - ${this.model.getFormattedEnquiryId(enquiry)}`,
        html: `
          <h2>New Safari Enquiry Received</h2>
          <h3>Guest Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${enquiry.guest_name}</li>
            <li><strong>Email:</strong> ${enquiry.email}</li>
            <li><strong>Phone:</strong> ${enquiry.phone || 'Not provided'}</li>
          </ul>
          
          <h3>Safari Details:</h3>
          <ul>
            <li><strong>Enquiry ID:</strong> ${this.model.getFormattedEnquiryId(enquiry)}</li>
            <li><strong>Safari:</strong> ${enquiry.safari_name}</li>
            <li><strong>Preferred Date:</strong> ${new Date(enquiry.preferred_date).toDateString()}</li>
            <li><strong>Preferred Timing:</strong> ${enquiry.preferred_timing}</li>
            <li><strong>Number of Persons:</strong> ${enquiry.number_of_persons}</li>
            <li><strong>Special Requirements:</strong> ${enquiry.special_requirements || 'None'}</li>
          </ul>
          
          <p>Please review and respond to this enquiry.</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  async sendBulkAdminNotification(enquiries) {
    try {
      const enquiry = enquiries[0];
      const enquiryList = enquiries.map(e => `
        <li>
          <strong>${e.safari_name}</strong> - 
          ${new Date(e.preferred_date).toDateString()} at ${e.preferred_timing} 
          (${e.number_of_persons} persons)
        </li>
      `).join('');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: process.env.ADMIN_EMAIL || 'admin@villagemachaan.com',
        subject: `Multiple Safari Enquiries - ${enquiries.length} enquiries from ${enquiry.guest_name}`,
        html: `
          <h2>Multiple Safari Enquiries Received</h2>
          <h3>Guest Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${enquiry.guest_name}</li>
            <li><strong>Email:</strong> ${enquiry.email}</li>
            <li><strong>Phone:</strong> ${enquiry.phone || 'Not provided'}</li>
          </ul>
          
          <h3>Safari Enquiries (${enquiries.length}):</h3>
          <ul>
            ${enquiryList}
          </ul>
          
          <p>Please review and respond to these enquiries.</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending bulk admin notification:', error);
    }
  }

  async sendStatusUpdateEmail(enquiry) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: enquiry.email,
        subject: `Safari Enquiry Update - ${this.model.getFormattedEnquiryId(enquiry)}`,
        html: `
          <h2>Safari Enquiry Status Update</h2>
          <p>Dear ${enquiry.guest_name},</p>
          <p>Your safari enquiry status has been updated to: <strong>${enquiry.status.toUpperCase()}</strong></p>
          
          ${enquiry.response ? `<p><strong>Admin Response:</strong> ${enquiry.response}</p>` : ''}
          
          <p>Best regards,<br>Village Machaan Team</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending status update email:', error);
    }
  }

  async sendConfirmationEmail(enquiry) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: enquiry.email,
        subject: `Safari Confirmed - ${this.model.getFormattedEnquiryId(enquiry)}`,
        html: `
          <h2>Safari Confirmed!</h2>
          <p>Dear ${enquiry.guest_name},</p>
          <p>Great news! Your safari has been confirmed.</p>
          
          <h3>Confirmed Details:</h3>
          <ul>
            <li><strong>Enquiry ID:</strong> ${this.model.getFormattedEnquiryId(enquiry)}</li>
            <li><strong>Safari:</strong> ${enquiry.safari_name}</li>
            <li><strong>Confirmed Date:</strong> ${new Date(enquiry.preferred_date).toDateString()}</li>
            <li><strong>Confirmed Timing:</strong> ${enquiry.preferred_timing}</li>
            <li><strong>Number of Persons:</strong> ${enquiry.number_of_persons}</li>
          </ul>
          
          <p>Please complete your payment to secure your booking.</p>
          <p>Best regards,<br>Village Machaan Team</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }
}

module.exports = new SafariEnquiryService();