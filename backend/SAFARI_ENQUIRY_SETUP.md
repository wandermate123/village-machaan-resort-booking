# Safari Enquiry Backend Setup

## Overview
This backend handles safari enquiry management with the following features:
- Create single or bulk safari enquiries
- Email notifications to guests and admins
- Status tracking and updates
- Admin management interface
- Statistics and reporting

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/village_machaan

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@villagemachaan.com

# Security
JWT_SECRET=your-jwt-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup
Make sure MongoDB is running on your system:
```bash
# Install MongoDB locally or use MongoDB Atlas
# For local installation:
mongod
```

### 4. Start the Server
```bash
npm start
# or
node server.js
```

## API Endpoints

### Safari Enquiries

#### Create Single Enquiry
```http
POST /api/safari-enquiries/create
Content-Type: application/json

{
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+1234567890",
  "bookingId": "booking_123",
  "safariName": "Jungle Safari 1",
  "safariOptionId": "safari_option_1",
  "preferredDate": "2024-01-15T00:00:00.000Z",
  "preferredTiming": "morning",
  "numberOfPersons": 2,
  "specialRequirements": "Vegetarian meals"
}
```

#### Create Bulk Enquiries
```http
POST /api/safari-enquiries/create-bulk
Content-Type: application/json

{
  "enquiries": [
    {
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "guestPhone": "+1234567890",
      "bookingId": "booking_123",
      "safariName": "Jungle Safari 1",
      "safariOptionId": "safari_option_1",
      "preferredDate": "2024-01-15T00:00:00.000Z",
      "preferredTiming": "morning",
      "numberOfPersons": 2
    },
    {
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "guestPhone": "+1234567890",
      "bookingId": "booking_123",
      "safariName": "Jungle Safari 2",
      "safariOptionId": "safari_option_2",
      "preferredDate": "2024-01-16T00:00:00.000Z",
      "preferredTiming": "afternoon",
      "numberOfPersons": 4
    }
  ]
}
```

#### Get All Enquiries
```http
GET /api/safari-enquiries?status=pending&page=1&limit=10
```

#### Get Enquiry by ID
```http
GET /api/safari-enquiries/{enquiryId}
```

#### Update Enquiry Status
```http
PATCH /api/safari-enquiries/{enquiryId}/status
Content-Type: application/json

{
  "status": "confirmed",
  "adminNotes": "Confirmed for morning slot",
  "adminResponse": "Your safari has been confirmed for the requested date."
}
```

#### Confirm Enquiry
```http
PATCH /api/safari-enquiries/{enquiryId}/confirm
Content-Type: application/json

{
  "confirmedDate": "2024-01-15T00:00:00.000Z",
  "confirmedTiming": "morning",
  "quotedPrice": 2500
}
```

#### Get Statistics
```http
GET /api/safari-enquiries/stats/overview
```

## Database Schema

### SafariEnquiry Model
```javascript
{
  enquiryId: String (unique),
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  bookingId: String,
  safariName: String,
  safariOptionId: String,
  preferredDate: Date,
  preferredTiming: String (morning/afternoon/evening),
  numberOfPersons: Number (1-6),
  specialRequirements: String,
  status: String (pending/confirmed/cancelled/completed),
  adminNotes: String,
  adminResponse: String,
  confirmedDate: Date,
  confirmedTiming: String,
  quotedPrice: Number,
  paymentStatus: String (pending/paid/refunded),
  createdAt: Date,
  updatedAt: Date,
  confirmedAt: Date
}
```

## Email Notifications

The system automatically sends emails for:
- Enquiry confirmation to guests
- Admin notifications for new enquiries
- Status updates to guests
- Confirmation emails with payment details

## Frontend Integration

Update your frontend service to use the new bulk endpoint:

```javascript
// In your safariQueriesService.ts
export const createBulkSafariQueries = async (enquiries) => {
  const response = await fetch(`${API_BASE_URL}/api/safari-enquiries/create-bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enquiries })
  });
  
  return await response.json();
};
```

## Testing

Test the endpoints using curl or Postman:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test bulk enquiry creation
curl -X POST http://localhost:3001/api/safari-enquiries/create-bulk \
  -H "Content-Type: application/json" \
  -d '{"enquiries": [{"guestName": "Test User", "guestEmail": "test@example.com", "guestPhone": "1234567890", "bookingId": "test_123", "safariName": "Test Safari", "safariOptionId": "test_1", "preferredDate": "2024-01-15T00:00:00.000Z", "preferredTiming": "morning", "numberOfPersons": 2}]}'
```

## Production Considerations

1. **Database**: Use MongoDB Atlas for production
2. **Email**: Configure proper SMTP service (SendGrid, AWS SES, etc.)
3. **Security**: Add authentication and authorization
4. **Monitoring**: Add logging and monitoring
5. **Rate Limiting**: Adjust rate limits for production
6. **Validation**: Add more comprehensive input validation
7. **Error Handling**: Implement proper error logging and alerting

