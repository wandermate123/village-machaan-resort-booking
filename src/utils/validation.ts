export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationService {
  // Email validation
  static validateEmail(email: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { field: 'email', message: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { field: 'email', message: 'Please enter a valid email address' };
    }
    return null;
  }

  // Phone validation (Indian format)
  static validatePhone(phone: string): ValidationError | null {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone) {
      return { field: 'phone', message: 'Phone number is required' };
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return { field: 'phone', message: 'Please enter a valid 10-digit Indian mobile number' };
    }
    return null;
  }

  // Name validation
  static validateName(name: string, fieldName: string): ValidationError | null {
    if (!name || name.trim().length < 2) {
      return { field: fieldName, message: `${fieldName} must be at least 2 characters long` };
    }
    if (name.trim().length > 50) {
      return { field: fieldName, message: `${fieldName} must be less than 50 characters` };
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return { field: fieldName, message: `${fieldName} can only contain letters and spaces` };
    }
    return null;
  }

  // Date validation
  static validateDates(checkIn: string, checkOut: string, allowPastDates: boolean = false): ValidationError[] {
    const errors: ValidationError[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!checkIn) {
      errors.push({ field: 'check_in', message: 'Check-in date is required' });
    }
    if (!checkOut) {
      errors.push({ field: 'check_out', message: 'Check-out date is required' });
    }

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (!allowPastDates && checkInDate < today) {
        errors.push({ field: 'check_in', message: 'Check-in date cannot be in the past' });
      }
      if (checkOutDate <= checkInDate) {
        errors.push({ field: 'check_out', message: 'Check-out date must be after check-in date' });
      }
      if (checkOutDate.getTime() - checkInDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
        errors.push({ field: 'check_out', message: 'Maximum stay duration is 30 days' });
      }
    }

    return errors;
  }

  // Guest count validation
  static validateGuests(guests: number, maxGuests: number): ValidationError | null {
    if (!guests || guests < 1) {
      return { field: 'guests', message: 'At least 1 guest is required' };
    }
    if (guests > maxGuests) {
      return { field: 'guests', message: `Maximum ${maxGuests} guests allowed for this villa` };
    }
    return null;
  }

  // Advance payment validation
  static validateAdvancePayment(advanceAmount: number, totalAmount: number): ValidationError | null {
    if (advanceAmount < 0) {
      return { field: 'advance_amount', message: 'Advance amount cannot be negative' };
    }
    if (advanceAmount > totalAmount) {
      return { field: 'advance_amount', message: 'Advance amount cannot exceed total amount' };
    }
    return null;
  }

  // Admin booking form validation
  static validateAdminBookingForm(data: {
    guest_name: string;
    email: string;
    phone: string;
    check_in: string;
    check_out: string;
    guests: number;
    villa_id: string;
    advance_amount?: number;
    total_amount?: number;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Guest name validation
    const nameError = this.validateName(data.guest_name, 'Guest Name');
    if (nameError) errors.push(nameError);

    // Email validation
    const emailError = this.validateEmail(data.email);
    if (emailError) errors.push(emailError);

    // Phone validation
    const phoneError = this.validatePhone(data.phone);
    if (phoneError) errors.push(phoneError);

    // Date validation (allow past dates for admin edits)
    errors.push(...this.validateDates(data.check_in, data.check_out, true));

    // Guest validation
    if (data.guests < 1) {
      errors.push({ field: 'guests', message: 'At least 1 guest is required' });
    }
    if (data.guests > 20) {
      errors.push({ field: 'guests', message: 'Maximum 20 guests allowed' });
    }

    // Villa validation
    if (!data.villa_id) {
      errors.push({ field: 'villa_id', message: 'Villa selection is required' });
    }

    // Advance payment validation
    if (data.advance_amount !== undefined && data.total_amount !== undefined) {
      const advanceError = this.validateAdvancePayment(data.advance_amount, data.total_amount);
      if (advanceError) errors.push(advanceError);
    }

    return errors;
  }

  // Booking form validation
  static validateBookingForm(data: {
    checkIn: string;
    checkOut: string;
    guests: number;
    villa: any;
    guestDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Date validation
    errors.push(...this.validateDates(data.checkIn, data.checkOut));

    // Guest validation
    if (data.villa) {
      const guestError = this.validateGuests(data.guests, data.villa.max_guests);
      if (guestError) errors.push(guestError);
    }

    // Guest details validation
    const firstNameError = this.validateName(data.guestDetails.firstName, 'First Name');
    if (firstNameError) errors.push(firstNameError);

    const lastNameError = this.validateName(data.guestDetails.lastName, 'Last Name');
    if (lastNameError) errors.push(lastNameError);

    const emailError = this.validateEmail(data.guestDetails.email);
    if (emailError) errors.push(emailError);

    const phoneError = this.validatePhone(data.guestDetails.phone);
    if (phoneError) errors.push(phoneError);

    return errors;
  }
}