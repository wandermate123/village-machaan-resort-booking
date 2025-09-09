// Production monitoring and analytics utilities
import { ErrorHandler } from './errorHandler';

export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface UserEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export class MonitoringService {
  private static sessionId: string = this.generateSessionId();
  private static eventQueue: UserEvent[] = [];
  private static isOnline: boolean = navigator.onLine;

  // Initialize monitoring
  static init(): void {
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupUserActivityTracking();
    this.setupOnlineStatusTracking();
    this.startEventFlush();
  }

  // Performance monitoring
  private static setupPerformanceMonitoring(): void {
    if ('performance' in window && 'PerformanceObserver' in window) {
      // Web Vitals monitoring
      this.observeWebVitals();
      
      // Page load performance
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const metrics: PerformanceMetrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          timeToInteractive: this.calculateTTI(),
          firstContentfulPaint: this.getFCP(),
          largestContentfulPaint: this.getLCP(),
          cumulativeLayoutShift: this.getCLS(),
          firstInputDelay: this.getFID()
        };
        
        this.trackEvent('performance_metrics', metrics);
      });
    }
  }

  // Error tracking
  private static setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('unhandled_promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // User activity tracking
  private static setupUserActivityTracking(): void {
    // Track page views
    this.trackEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title
    });

    // Track user interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('button, a, [role="button"]')) {
        this.trackEvent('click', {
          element: target.tagName,
          text: target.textContent?.slice(0, 100),
          className: target.className,
          id: target.id
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        formId: form.id,
        formClass: form.className,
        action: form.action
      });
    });
  }

  // Online status tracking
  private static setupOnlineStatusTracking(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent('connection_restored', {});
      this.flushEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent('connection_lost', {});
    });
  }

  // Track custom events
  static trackEvent(event: string, properties: Record<string, any> = {}): void {
    const userEvent: UserEvent = {
      event,
      properties,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.eventQueue.push(userEvent);
    
    // Flush immediately for critical events
    if (['booking_created', 'payment_success', 'error'].includes(event)) {
      this.flushEvents();
    }
  }

  // Track business metrics
  static trackBookingCreated(bookingData: any): void {
    this.trackEvent('booking_created', {
      villa_id: bookingData.villa_id,
      total_amount: bookingData.total_amount,
      guests: bookingData.guests,
      check_in: bookingData.check_in,
      check_out: bookingData.check_out
    });
  }

  static trackPaymentSuccess(paymentData: any): void {
    this.trackEvent('payment_success', {
      amount: paymentData.amount,
      payment_method: paymentData.method,
      booking_id: paymentData.booking_id
    });
  }

  static trackUserRegistration(userData: any): void {
    this.trackEvent('user_registration', {
      email: userData.email,
      source: userData.source || 'website'
    });
  }

  // Performance metrics calculation
  private static calculateTTI(): number {
    // Simplified TTI calculation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation.domContentLoadedEventEnd - navigation.navigationStart;
  }

  private static getFCP(): number {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private static getLCP(): number {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }) as any;
  }

  private static getCLS(): number {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });
    observer.observe({ entryTypes: ['layout-shift'] });
    return clsValue;
  }

  private static getFID(): number {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        resolve(firstInput.processingStart - firstInput.startTime);
      });
      observer.observe({ entryTypes: ['first-input'] });
    }) as any;
  }

  // Web Vitals observer
  private static observeWebVitals(): void {
    // This would integrate with web-vitals library
    // For now, we'll use basic performance API
  }

  // Event flushing
  private static startEventFlush(): void {
    // Flush events every 30 seconds
    setInterval(() => {
      this.flushEvents();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents(true);
    });
  }

  private static async flushEvents(sync: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (sync) {
        // Synchronous request for page unload
        navigator.sendBeacon('/api/analytics', JSON.stringify(events));
      } else {
        // Asynchronous request
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(events)
        });
      }
    } catch (error) {
      // Re-queue events if sending fails
      this.eventQueue.unshift(...events);
      ErrorHandler.logError(error, 'analytics_flush');
    }
  }

  // Generate session ID
  private static generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Get current session ID
  static getSessionId(): string {
    return this.sessionId;
  }

  // Track page performance
  static trackPagePerformance(pageName: string, loadTime: number): void {
    this.trackEvent('page_performance', {
      page: pageName,
      load_time: loadTime,
      timestamp: Date.now()
    });
  }

  // Track API performance
  static trackAPIPerformance(endpoint: string, duration: number, status: number): void {
    this.trackEvent('api_performance', {
      endpoint,
      duration,
      status,
      timestamp: Date.now()
    });
  }

  // Track user journey
  static trackUserJourney(step: string, data: any = {}): void {
    this.trackEvent('user_journey', {
      step,
      ...data,
      timestamp: Date.now()
    });
  }
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  MonitoringService.init();
}
