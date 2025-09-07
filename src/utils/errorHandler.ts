export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class ErrorHandler {
  // Log errors to console and external service
  static logError(error: any, context?: string) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('🚨 Application Error:', errorInfo);

    // In production, you could send to error tracking service
    // Example: Sentry, LogRocket, or custom endpoint
    if (import.meta.env.PROD) {
      // Send to error tracking service
      this.sendToErrorService(errorInfo);
    }
  }

  // Send errors to external service (placeholder)
  private static async sendToErrorService(errorInfo: any) {
    try {
      // Replace with your error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // });
    } catch (err) {
      console.error('Failed to send error to tracking service:', err);
    }
  }

  // Handle Supabase errors
  static handleSupabaseError(error: any): AppError {
    if (error.code === '23505') {
      return {
        code: 'DUPLICATE_ENTRY',
        message: 'This record already exists. Please try with different details.',
        details: error
      };
    }

    if (error.code === '23503') {
      return {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced record not found. Please refresh and try again.',
        details: error
      };
    }

    if (error.code === 'PGRST116') {
      return {
        code: 'NO_ROWS_FOUND',
        message: 'Record not found.',
        details: error
      };
    }

    return {
      code: 'DATABASE_ERROR',
      message: 'A database error occurred. Please try again.',
      details: error
    };
  }

  // Handle network errors
  static handleNetworkError(error: any): AppError {
    if (!navigator.onLine) {
      return {
        code: 'NETWORK_OFFLINE',
        message: 'You appear to be offline. Please check your internet connection.',
        details: error
      };
    }

    if (error.name === 'AbortError') {
      return {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out. Please try again.',
        details: error
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: 'Network error occurred. Please check your connection and try again.',
      details: error
    };
  }

  // Generic error handler
  static handleError(error: any, context?: string): AppError {
    this.logError(error, context);

    // Supabase errors
    if (error.code && typeof error.code === 'string') {
      return this.handleSupabaseError(error);
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.handleNetworkError(error);
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: error
    };
  }
}