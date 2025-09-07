# Village Machaan Resort Booking System

A comprehensive resort booking system built with React, TypeScript, and Supabase.

## 🚀 Quick Start

### 1. Database Setup
Before using the application, you need to connect to Supabase:

1. **Click the "Connect to Supabase" button** in the top right corner of this interface
2. This will set up your Supabase project and configure the environment variables
3. The database schema will be automatically created with sample data

### 2. Admin Login
Once Supabase is connected, you can access the admin dashboard:

- **URL**: `/admin/login`
- **Email**: `admin@villagemachaan.com`
- **Password**: `admin123`

### 3. Features

#### Guest Booking Flow
- **Date & Villa Selection**: Choose arrival/departure dates and select from 3 luxury villas
- **Package Selection**: Optional experience packages (Safari, Romance, Culinary)
- **Safari Add-ons**: Optional wildlife safari experiences
- **Guest Details & Payment**: Complete booking with demo payment system

#### Admin Dashboard
- **Booking Management**: View, edit, and manage all reservations
- **Villa Management**: Configure accommodations and pricing
- **Package Management**: Manage experience packages
- **User Management**: Handle guest profiles and preferences
- **Revenue Reports**: Analytics and financial insights
- **Dynamic Pricing**: Seasonal rates and pricing rules

### 4. Demo Credentials

#### Admin Access
- Email: `admin@villagemachaan.com`
- Password: `admin123`

#### Guest Booking (for testing)
- Email: `demo@test.com`
- Phone: `9876543210`
- Payment: Demo payment system (90% success rate)

### 5. Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payment**: Razorpay integration (with demo fallback)
- **Email**: EmailJS for notifications
- **Icons**: Lucide React

### 6. Environment Variables

The following environment variables are configured automatically when you connect to Supabase:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For full functionality, you can also configure:

```env
# Payment Gateway
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Email Service
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID_CONFIRMATION=your_confirmation_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### 7. Database Schema

The application uses the following main tables:
- `admin_users` - Admin authentication
- `villas` - Resort accommodations
- `packages` - Experience packages
- `bookings` - Guest reservations
- `payments` - Transaction records
- `availability` - Villa availability calendar

### 8. Security Features

- Row Level Security (RLS) enabled on all tables
- Admin-only access for management functions
- Session timeout and activity tracking
- Input validation and sanitization
- Error handling and logging

### 9. Production Checklist

The application includes a production readiness checker that validates:
- ✅ Database connection
- ✅ Email service configuration
- ✅ Payment gateway setup
- ✅ Admin access

## 🎯 Next Steps

1. **Connect to Supabase** using the button in the top right
2. **Test the booking flow** by visiting the homepage
3. **Access admin dashboard** at `/admin/login`
4. **Configure payment gateway** for live payments
5. **Set up email templates** for automated notifications

## 📞 Support

For technical support or questions about the booking system:
- Email: support@villagemachaan.com
- Phone: +91 7462 252052

---

**Note**: This is a production-ready booking system with comprehensive features for resort management. All sensitive operations are properly secured and validated.