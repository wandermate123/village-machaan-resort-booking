const express = require('express');
const { body } = require('express-validator');
const safariEnquiryController = require('../controllers/safariEnquiryController');

const router = express.Router();

// Validation middleware for single enquiry
const validateSingleEnquiry = [
  body('guestName').notEmpty().withMessage('Guest name is required'),
  body('guestEmail').isEmail().withMessage('Valid email is required'),
  body('guestPhone').notEmpty().withMessage('Guest phone is required'),
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('safariName').notEmpty().withMessage('Safari name is required'),
  body('safariOptionId').notEmpty().withMessage('Safari option ID is required'),
  body('preferredDate').isISO8601().withMessage('Valid preferred date is required'),
  body('preferredTiming').isIn(['morning', 'afternoon', 'evening']).withMessage('Valid timing is required'),
  body('numberOfPersons').isInt({ min: 1, max: 6 }).withMessage('Number of persons must be between 1 and 6'),
  body('specialRequirements').optional().isString(),
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed'])
];

// Validation middleware for bulk enquiries
const validateBulkEnquiries = [
  body('enquiries').isArray({ min: 1 }).withMessage('Enquiries array is required and must not be empty'),
  body('enquiries.*.guestName').notEmpty().withMessage('Guest name is required for all enquiries'),
  body('enquiries.*.guestEmail').isEmail().withMessage('Valid email is required for all enquiries'),
  body('enquiries.*.guestPhone').notEmpty().withMessage('Guest phone is required for all enquiries'),
  body('enquiries.*.bookingId').notEmpty().withMessage('Booking ID is required for all enquiries'),
  body('enquiries.*.safariName').notEmpty().withMessage('Safari name is required for all enquiries'),
  body('enquiries.*.safariOptionId').notEmpty().withMessage('Safari option ID is required for all enquiries'),
  body('enquiries.*.preferredDate').isISO8601().withMessage('Valid preferred date is required for all enquiries'),
  body('enquiries.*.preferredTiming').isIn(['morning', 'afternoon', 'evening']).withMessage('Valid timing is required for all enquiries'),
  body('enquiries.*.numberOfPersons').isInt({ min: 1, max: 6 }).withMessage('Number of persons must be between 1 and 6 for all enquiries'),
  body('enquiries.*.specialRequirements').optional().isString()
];

// Validation middleware for status update
const validateStatusUpdate = [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Valid status is required'),
  body('adminNotes').optional().isString(),
  body('adminResponse').optional().isString()
];

// Validation middleware for enquiry confirmation
const validateEnquiryConfirmation = [
  body('confirmedDate').isISO8601().withMessage('Valid confirmed date is required'),
  body('confirmedTiming').isIn(['morning', 'afternoon', 'evening']).withMessage('Valid confirmed timing is required'),
  body('quotedPrice').optional().isNumeric().withMessage('Quoted price must be a number')
];

// Routes

// Create single safari enquiry
router.post('/create', validateSingleEnquiry, safariEnquiryController.createEnquiry);

// Create multiple safari enquiries (bulk)
router.post('/create-bulk', validateBulkEnquiries, safariEnquiryController.createBulkEnquiries);

// Get all enquiries with filtering and pagination
router.get('/', safariEnquiryController.getEnquiries);

// Get enquiry by ID
router.get('/:enquiryId', safariEnquiryController.getEnquiryById);

// Update enquiry status
router.patch('/:enquiryId/status', validateStatusUpdate, safariEnquiryController.updateEnquiryStatus);

// Confirm enquiry
router.patch('/:enquiryId/confirm', validateEnquiryConfirmation, safariEnquiryController.confirmEnquiry);

// Get enquiry statistics
router.get('/stats/overview', safariEnquiryController.getEnquiryStats);

module.exports = router;




