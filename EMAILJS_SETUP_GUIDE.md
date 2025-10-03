# EmailJS Setup Guide for Village Machaan

## 🚀 Email Automation is Already Configured!

Your project already has EmailJS integration set up. Here's what's configured and how to complete the setup:

## 📧 Current Email Features

### ✅ Already Implemented:
1. **Booking Confirmation Emails** - Sent to guests after successful booking
2. **Admin Notification Emails** - Sent to admin for new bookings
3. **Payment Reminder Emails** - For pending payments
4. **Half Payment Confirmations** - For advance payments

### 📋 Email Templates Needed:
You need to create these templates in your EmailJS dashboard:

1. **Booking Confirmation Template** (`template_confirmation`)
2. **Payment Reminder Template** (`template_payment_reminder`)
3. **Admin Notification Template** (`template_admin_notification`)

## 🔧 Setup Steps

### 1. Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com)
2. Sign up for a free account
3. Create a new service (Gmail, Outlook, etc.)

### 2. Get Your Credentials
1. **Service ID**: Found in your EmailJS dashboard
2. **Public Key**: Found in your EmailJS dashboard
3. **Template IDs**: Create templates and get their IDs

### 3. Create Environment File
Create a `.env` file in your project root with:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_TEMPLATE_ID_CONFIRMATION=template_confirmation
VITE_EMAILJS_TEMPLATE_ID_PAYMENT_REMINDER=template_payment_reminder
VITE_EMAILJS_TEMPLATE_ID_ADMIN_NOTIFICATION=template_admin_notification
```

### 4. Create Email Templates

#### Template 1: Booking Confirmation
**Template ID**: `template_confirmation`
**Subject**: `Booking Confirmation - {{booking_id}}`

**Content**:
```
Dear {{to_name}},

Thank you for choosing Village Machaan Resort! We're excited to confirm your reservation.

Booking Details:
• Booking ID: {{booking_id}}
• Villa: {{villa_name}}
• Check-in: {{check_in}}
• Check-out: {{check_out}}
• Total Amount: {{total_amount}}

We look forward to welcoming you to our resort. If you have any questions, please don't hesitate to contact us at +91 7462 252052.

Best regards,
Village Machaan Resort Team
```

#### Template 2: Payment Reminder
**Template ID**: `template_payment_reminder`
**Subject**: `Payment Reminder - {{booking_id}}`

**Content**:
```
Dear {{to_name}},

This is a friendly reminder about your upcoming payment for booking {{booking_id}}.

Amount Due: ₹{{due_amount}}
Due Date: {{due_date}}

Please complete your payment to confirm your reservation.

Best regards,
Village Machaan Resort Team
```

#### Template 3: Admin Notification
**Template ID**: `template_admin_notification`
**Subject**: `{{subject}}`

**Content**:
```
{{message}}

Please check the admin dashboard for more information.

Village Machaan Booking System
```

## 🎯 Email Automation Features

### 📧 Guest Emails:
- **Booking Confirmation**: Sent immediately after successful booking
- **Payment Reminders**: Automated reminders for pending payments
- **Half Payment Confirmations**: For advance payment bookings

### 📧 Admin Emails:
- **New Booking Notifications**: Instant alerts for new bookings
- **Payment Confirmations**: When payments are received
- **Booking Updates**: Status changes and modifications

## 🔄 How It Works

1. **Guest Books**: Selects dates, villa, and completes payment
2. **System Processes**: Creates booking in database
3. **Emails Sent**:
   - Confirmation email to guest
   - Notification email to admin
4. **Follow-up**: Payment reminders sent as needed

## 🛠️ Testing

To test email functionality:

1. Complete the EmailJS setup above
2. Make a test booking
3. Check your email for confirmation
4. Check admin email for notification

## 📱 Email Templates Variables

### Guest Confirmation:
- `{{to_name}}` - Guest's full name
- `{{booking_id}}` - Unique booking ID
- `{{villa_name}}` - Selected villa name
- `{{check_in}}` - Check-in date
- `{{check_out}}` - Check-out date
- `{{total_amount}}` - Total booking amount

### Admin Notification:
- `{{subject}}` - Email subject
- `{{message}}` - Detailed message
- `{{booking_id}}` - Booking reference

## 🚨 Important Notes

1. **Free Tier Limits**: EmailJS free tier has sending limits
2. **Template Testing**: Test templates before going live
3. **Admin Email**: Update admin email in `emailService.ts` if needed
4. **Error Handling**: Email failures won't break booking process

## 🎉 You're All Set!

Once you complete the EmailJS setup above, your email automation will be fully functional. The system will automatically send:

- ✅ Booking confirmations to guests
- ✅ Admin notifications for new bookings
- ✅ Payment reminders when needed
- ✅ Half payment confirmations

Your guests will receive professional email confirmations, and you'll be instantly notified of all new bookings!




