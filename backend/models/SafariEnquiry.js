const mongoose = require('mongoose');

const safariEnquirySchema = new mongoose.Schema({
  // Basic enquiry information
  enquiryId: {
    type: String,
    required: true,
    unique: true,
    default: () => `safari_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Guest information
  guestName: {
    type: String,
    required: true,
    trim: true
  },
  guestEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  guestPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Booking reference
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  
  // Safari details
  safariName: {
    type: String,
    required: true,
    trim: true
  },
  safariOptionId: {
    type: String,
    required: true
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTiming: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening']
  },
  numberOfPersons: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  
  // Special requirements
  specialRequirements: {
    type: String,
    default: '',
    trim: true
  },
  
  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    index: true
  },
  
  // Admin notes and responses
  adminNotes: {
    type: String,
    default: '',
    trim: true
  },
  adminResponse: {
    type: String,
    default: '',
    trim: true
  },
  confirmedDate: {
    type: Date,
    default: null
  },
  confirmedTiming: {
    type: String,
    default: null,
    enum: ['morning', 'afternoon', 'evening', null]
  },
  
  // Pricing information
  quotedPrice: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date,
    default: null
  }
});

// Indexes for better query performance
safariEnquirySchema.index({ bookingId: 1, status: 1 });
safariEnquirySchema.index({ guestEmail: 1, createdAt: -1 });
safariEnquirySchema.index({ preferredDate: 1, status: 1 });
safariEnquirySchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
safariEnquirySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted enquiry ID
safariEnquirySchema.virtual('formattedEnquiryId').get(function() {
  return `SE-${this.enquiryId.slice(-8).toUpperCase()}`;
});

// Method to check if enquiry can be confirmed
safariEnquirySchema.methods.canBeConfirmed = function() {
  return this.status === 'pending' && this.preferredDate > new Date();
};

// Method to check if enquiry is expired
safariEnquirySchema.methods.isExpired = function() {
  return this.status === 'pending' && this.preferredDate < new Date();
};

// Static method to get enquiries by status
safariEnquirySchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get enquiries by date range
safariEnquirySchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    preferredDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ preferredDate: 1 });
};

module.exports = mongoose.model('SafariEnquiry', safariEnquirySchema);


