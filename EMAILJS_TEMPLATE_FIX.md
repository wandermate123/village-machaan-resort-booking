# EmailJS Template Configuration Guide

## 🔧 Template Variables Mapping

Your EmailJS template should use these exact variable names to match the code:

### ✅ **Correct Template Variables:**

```
{{booking_reference}} - Booking ID (e.g., "VM-20250103-001")
{{cottage}} - Villa Name (e.g., "Hornbill Villa")
{{check_in}} - Check-in Date (e.g., "03/01/2025")
{{check_out}} - Check-out Date (e.g., "05/01/2025")
{{guests}} - Guest Count (e.g., "2 Adults, 1 Children")
{{total_amount}} - Total Amount (e.g., "₹12,390")
{{guest_name}} - Guest Full Name (e.g., "Ayush Singh")
{{guest_email}} - Guest Email
{{guest_phone}} - Guest Phone Number
```

## 📧 **Updated Email Template**

Here's the complete template you should use in your EmailJS dashboard:

**Subject:** `Booking Confirmation - {{booking_reference}}`

**Content:**
```
Dear {{guest_name}},

Thank you for choosing Village Machaan Resort! We're excited to confirm your reservation.

Booking Details:
• Booking Reference: {{booking_reference}}
• Cottage: {{cottage}}
• Check-in: {{check_in}}
• Check-out: {{check_out}}
• Guests: {{guests}}
• Total Amount: {{total_amount}}

We look forward to welcoming you to our resort. If you have any questions, please don't hesitate to contact us at +91 7462 252052.

Best regards,
Village Machaan Resort Team
```

## 🎯 **Template ID Configuration**

Make sure your template ID in EmailJS dashboard matches:
- **Template ID**: `template_gjl4n9y`
- **Template Name**: `Booking Confirmation`

## 🔄 **Steps to Update Your Template:**

1. **Go to EmailJS Dashboard**: [dashboard.emailjs.com](https://dashboard.emailjs.com)
2. **Navigate to Templates**: Click on "Email Templates"
3. **Find Your Template**: Look for template ID `template_gjl4n9y`
4. **Update Template Content**: Replace the content with the template above
5. **Save Changes**: Click "Save" to update the template

## 🧪 **Testing the Fix:**

1. **Deploy your updated code** to Vercel
2. **Make a test booking** on your live site
3. **Check the email** - all fields should now be populated correctly

## 📋 **Variable Checklist:**

- [ ] `{{booking_reference}}` - Shows booking ID
- [ ] `{{cottage}}` - Shows villa name
- [ ] `{{check_in}}` - Shows check-in date
- [ ] `{{check_out}}` - Shows check-out date
- [ ] `{{guests}}` - Shows guest count
- [ ] `{{total_amount}}` - Shows total amount
- [ ] `{{guest_name}}` - Shows guest name
- [ ] `{{guest_email}}` - Shows guest email
- [ ] `{{guest_phone}}` - Shows guest phone

## 🚨 **Important Notes:**

1. **Case Sensitive**: Variable names are case-sensitive
2. **No Spaces**: Don't add spaces around variable names
3. **Exact Match**: Variable names must match exactly
4. **Test First**: Test with a small booking before going live

Your email automation will now work perfectly with all booking details populated correctly! 🎉
