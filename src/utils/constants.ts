// Application Constants
export const APP_CONFIG = {
  // Booking constraints
  MAX_STAY_DAYS: 30,
  MIN_ADVANCE_BOOKING_HOURS: 24,
  MAX_ADVANCE_BOOKING_DAYS: 365,
  BOOKING_HOLD_DURATION_MINUTES: 15,
  
  // Guest limits
  MAX_GUESTS_PER_BOOKING: 12,
  MIN_GUESTS_PER_BOOKING: 1,
  
  // Payment
  CURRENCY: 'INR',
  TAX_RATE: 0.18, // 18% GST
  
  // Contact
  RESORT_PHONE: '+91 7462 252052',
  RESORT_EMAIL: 'villagemachaan@gmail.com',
  
  // Business hours
  CHECK_IN_TIME: '14:00',
  CHECK_OUT_TIME: '11:00',
  
  // Pricing
  WEEKEND_MULTIPLIER: 1.3,
  HOLIDAY_MULTIPLIER: 1.8,
  
  // Session
  SESSION_TIMEOUT_MINUTES: 30,
} as const;

// Villa amenity icons mapping
export const AMENITY_ICONS = {
  'Forest View': '🌲',
  'Lake View': '🏞️',
  'Private Pool': '🏊‍♂️',
  'Private Deck': '🏡',
  'Glass Walls': '🪟',
  'Eco-Friendly': '♻️',
  'Air Conditioning': '❄️',
  'Mini Bar': '🍷',
  'Garden View': '🌺',
  'BBQ Area': '🔥',
  'Spacious Living': '🛋️',
  'Modern Kitchen': '👨‍🍳',
  'Family Room': '👨‍👩‍👧‍👦',
  'Outdoor Seating': '🪑',
  'Premium Suite': '⭐',
  'Butler Service': '🤵',
  'Jacuzzi': '🛁',
  'Wine Cellar': '🍾',
} as const;

// Status colors
export const STATUS_COLORS = {
  pending: 'bg-warning-100 text-warning-700',
  confirmed: 'bg-success-100 text-success-700',
  checked_in: 'bg-purple-100 text-purple-700',
  checked_out: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-error-100 text-error-700',
  completed: 'bg-blue-100 text-blue-700',
  no_show: 'bg-neutral-100 text-neutral-700',
} as const;

// Payment status colors
export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-warning-100 text-warning-700',
  paid: 'bg-success-100 text-success-700',
  advance_paid: 'bg-orange-100 text-orange-700',
  failed: 'bg-error-100 text-error-700',
  refunded: 'bg-neutral-100 text-neutral-700',
  partial_refund: 'bg-orange-100 text-orange-700',
} as const;