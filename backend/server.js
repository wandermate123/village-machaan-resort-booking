const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Add startup logging
console.log('🚀 Starting Village Machaan Backend Server...');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase credentials not found. Some features may not work.');
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Import routes
const safariEnquiryRoutes = require('./routes/safariEnquiryRoutes');

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  
  if (supabase) {
    try {
      // Test Supabase connection by querying a simple table
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      if (!error) {
        dbStatus = 'connected';
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Village Machaan Backend',
    database: dbStatus,
    supabase_configured: !!supabase
  });
});

// API Routes
app.use('/api/safari-enquiries', safariEnquiryRoutes);

// Payment endpoints (demo implementation)
app.post('/api/payments/create-order', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').isIn(['INR']).withMessage('Currency must be INR'),
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('guestEmail').isEmail().withMessage('Valid email is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Demo order creation
  const orderId = `demo_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('✅ Demo order created:', orderId);
  res.json({ orderId });
});

// Advance payment confirmation endpoint
app.post('/api/payments/confirm-advance', [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('transactionDetails').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Demo advance payment confirmation
  const confirmationId = `advance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('✅ Demo advance payment confirmed:', confirmationId);
  res.json({ 
    success: true, 
    confirmationId,
    message: 'Advance payment confirmed - booking confirmed immediately'
  });
});
app.post('/api/payments/verify', [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('bookingId').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Demo payment verification (always successful for demo)
  console.log('✅ Demo payment verified:', req.body.razorpay_payment_id);
  res.json({ 
    success: true, 
    paymentId: req.body.razorpay_payment_id 
  });
});

app.post('/api/payments/refund', [
  body('paymentId').notEmpty().withMessage('Payment ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Demo refund processing
  const refundId = `demo_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('✅ Demo refund processed:', refundId);
  res.json({ refundId });
});

app.get('/api/payments/details/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  
  // Demo payment details
  const payment = {
    id: paymentId,
    amount: 25000,
    currency: 'INR',
    status: 'captured',
    method: 'card',
    created_at: new Date().toISOString()
  };
  
  res.json(payment);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Backend error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;