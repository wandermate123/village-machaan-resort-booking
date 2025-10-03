const safariEnquiryService = require('../services/safariEnquiryService');
const { body, validationResult } = require('express-validator');

class SafariEnquiryController {
  // Create single safari enquiry
  async createEnquiry(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const result = await safariEnquiryService.createEnquiry(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error - createEnquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Create multiple safari enquiries (bulk)
  async createBulkEnquiries(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { enquiries } = req.body;
      
      if (!Array.isArray(enquiries) || enquiries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Enquiries array is required and must not be empty'
        });
      }

      const result = await safariEnquiryService.createBulkEnquiries(enquiries);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error - createBulkEnquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Get all enquiries with filtering and pagination
  async getEnquiries(req, res) {
    try {
      const {
        status,
        guestEmail,
        bookingId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10
      } = req.query;

      const filters = {
        status,
        guestEmail,
        bookingId,
        dateFrom,
        dateTo
      };

      const result = await safariEnquiryService.getEnquiries(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error - getEnquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Get enquiry by ID
  async getEnquiryById(req, res) {
    try {
      const { enquiryId } = req.params;
      
      const result = await safariEnquiryService.getEnquiryById(enquiryId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Controller error - getEnquiryById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Update enquiry status
  async updateEnquiryStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { enquiryId } = req.params;
      const { status, adminNotes, adminResponse } = req.body;

      const result = await safariEnquiryService.updateEnquiryStatus(
        enquiryId,
        status,
        adminNotes,
        adminResponse
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error - updateEnquiryStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Confirm enquiry
  async confirmEnquiry(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { enquiryId } = req.params;
      const { confirmedDate, confirmedTiming, quotedPrice } = req.body;

      const result = await safariEnquiryService.confirmEnquiry(
        enquiryId,
        confirmedDate,
        confirmedTiming,
        quotedPrice
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error - confirmEnquiry:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Get enquiry statistics
  async getEnquiryStats(req, res) {
    try {
      const result = await safariEnquiryService.getEnquiryStats();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error - getEnquiryStats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }
}

module.exports = new SafariEnquiryController();




