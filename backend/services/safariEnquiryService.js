const SafariEnquiry = require('../models/SafariEnquiry');
const nodemailer = require('nodemailer');

class SafariEnquiryService {
  constructor() {
    this.emailTransporter = this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    // Configure email transporter (you can use your preferred email service)
    return nodemailer.createTransporter({
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
      const enquiry = new SafariEnquiry(enquiryData);
      const savedEnquiry = await enquiry.save();
      
      // Send confirmation email to guest
      await this.sendEnquiryConfirmationEmail(savedEnquiry);
      
      // Send notification to admin
      await this.sendAdminNotification(savedEnquiry);
      
      return {
        success: true,
        enquiry: savedEnquiry,
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
      const enquiries = enquiriesData.map(data => new SafariEnquiry(data));
      const savedEnquiries = await SafariEnquiry.insertMany(enquiries);
      
      // Send confirmation email for all enquiries
      await this.sendBulkEnquiryConfirmationEmail(savedEnquiries);
      
      // Send admin notification
      await this.sendBulkAdminNotification(savedEnquiries);
      
      return {
        success: true,
        enquiries: savedEnquiries,
        count: savedEnquiries.length,
        message: `${savedEnquiries.length} safari enquiries created successfully`
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
      const query = {};
      
      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.guestEmail) query.guestEmail = new RegExp(filters.guestEmail, 'i');
      if (filters.bookingId) query.bookingId = filters.bookingId;
      if (filters.dateFrom || filters.dateTo) {
        query.preferredDate = {};
        if (filters.dateFrom) query.preferredDate.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.preferredDate.$lte = new Date(filters.dateTo);
      }

      const skip = (page - 1) * limit;
      
      const [enquiries, total] = await Promise.all([
        SafariEnquiry.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SafariEnquiry.countDocuments(query)
      ]);

      return {
        success: true,
        enquiries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
      const enquiry = await SafariEnquiry.findOne({ enquiryId });
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
      const updateData = { 
        status, 
        updatedAt: new Date() 
      };

      if (adminNotes) updateData.adminNotes = adminNotes;
      if (adminResponse) updateData.adminResponse = adminResponse;

      const enquiry = await SafariEnquiry.findOneAndUpdate(
        { enquiryId },
        updateData,
        { new: true }
      );

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
      const enquiry = await SafariEnquiry.findOneAndUpdate(
        { enquiryId },
        {
          status: 'confirmed',
          confirmedDate: new Date(confirmedDate),
          confirmedTiming,
          quotedPrice,
          confirmedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

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
      const stats = await SafariEnquiry.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await SafariEnquiry.countDocuments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = await SafariEnquiry.countDocuments({
        createdAt: { $gte: today }
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthCount = await SafariEnquiry.countDocuments({
        createdAt: { $gte: thisMonth }
      });

      return {
        success: true,
        stats: {
          total,
          today: todayCount,
          thisMonth: thisMonthCount,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
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
        to: enquiry.guestEmail,
        subject: `Safari Enquiry Confirmation - ${enquiry.formattedEnquiryId}`,
        html: `
          <h2>Safari Enquiry Received</h2>
          <p>Dear ${enquiry.guestName},</p>
          <p>Thank you for your safari enquiry. We have received your request and will get back to you soon.</p>
          
          <h3>Enquiry Details:</h3>
          <ul>
            <li><strong>Enquiry ID:</strong> ${enquiry.formattedEnquiryId}</li>
            <li><strong>Safari:</strong> ${enquiry.safariName}</li>
            <li><strong>Preferred Date:</strong> ${enquiry.preferredDate.toDateString()}</li>
            <li><strong>Preferred Timing:</strong> ${enquiry.preferredTiming}</li>
            <li><strong>Number of Persons:</strong> ${enquiry.numberOfPersons}</li>
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
      const guestEmail = enquiries[0].guestEmail;
      const guestName = enquiries[0].guestName;
      
      const enquiryList = enquiries.map(enquiry => `
        <li>
          <strong>${enquiry.safariName}</strong> - 
          ${enquiry.preferredDate.toDateString()} at ${enquiry.preferredTiming} 
          (${enquiry.numberOfPersons} persons)
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
        subject: `New Safari Enquiry - ${enquiry.formattedEnquiryId}`,
        html: `
          <h2>New Safari Enquiry Received</h2>
          <h3>Guest Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${enquiry.guestName}</li>
            <li><strong>Email:</strong> ${enquiry.guestEmail}</li>
            <li><strong>Phone:</strong> ${enquiry.guestPhone}</li>
          </ul>
          
          <h3>Safari Details:</h3>
          <ul>
            <li><strong>Enquiry ID:</strong> ${enquiry.formattedEnquiryId}</li>
            <li><strong>Safari:</strong> ${enquiry.safariName}</li>
            <li><strong>Preferred Date:</strong> ${enquiry.preferredDate.toDateString()}</li>
            <li><strong>Preferred Timing:</strong> ${enquiry.preferredTiming}</li>
            <li><strong>Number of Persons:</strong> ${enquiry.numberOfPersons}</li>
            <li><strong>Special Requirements:</strong> ${enquiry.specialRequirements || 'None'}</li>
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
          <strong>${e.safariName}</strong> - 
          ${e.preferredDate.toDateString()} at ${e.preferredTiming} 
          (${e.numberOfPersons} persons)
        </li>
      `).join('');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@villagemachaan.com',
        to: process.env.ADMIN_EMAIL || 'admin@villagemachaan.com',
        subject: `Multiple Safari Enquiries - ${enquiries.length} enquiries from ${enquiry.guestName}`,
        html: `
          <h2>Multiple Safari Enquiries Received</h2>
          <h3>Guest Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${enquiry.guestName}</li>
            <li><strong>Email:</strong> ${enquiry.guestEmail}</li>
            <li><strong>Phone:</strong> ${enquiry.guestPhone}</li>
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
        to: enquiry.guestEmail,
        subject: `Safari Enquiry Update - ${enquiry.formattedEnquiryId}`,
        html: `
          <h2>Safari Enquiry Status Update</h2>
          <p>Dear ${enquiry.guestName},</p>
          <p>Your safari enquiry status has been updated to: <strong>${enquiry.status.toUpperCase()}</strong></p>
          
          ${enquiry.adminResponse ? `<p><strong>Admin Response:</strong> ${enquiry.adminResponse}</p>` : ''}
          
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
        to: enquiry.guestEmail,
        subject: `Safari Confirmed - ${enquiry.formattedEnquiryId}`,
        html: `
          <h2>Safari Confirmed!</h2>
          <p>Dear ${enquiry.guestName},</p>
          <p>Great news! Your safari has been confirmed.</p>
          
          <h3>Confirmed Details:</h3>
          <ul>
            <li><strong>Enquiry ID:</strong> ${enquiry.formattedEnquiryId}</li>
            <li><strong>Safari:</strong> ${enquiry.safariName}</li>
            <li><strong>Confirmed Date:</strong> ${enquiry.confirmedDate.toDateString()}</li>
            <li><strong>Confirmed Timing:</strong> ${enquiry.confirmedTiming}</li>
            <li><strong>Number of Persons:</strong> ${enquiry.numberOfPersons}</li>
            <li><strong>Price:</strong> ₹${enquiry.quotedPrice}</li>
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

