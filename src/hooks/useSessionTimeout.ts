import { useEffect, useRef } from 'react';
import { APP_CONFIG } from '../utils/constants';

export const useSessionTimeout = (onTimeout: () => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timeout (5 minutes before session expires)
    warningRef.current = setTimeout(() => {
      const shouldContinue = confirm(
        'Your session will expire in 5 minutes due to inactivity. Click OK to continue your session.'
      );
      
      if (shouldContinue) {
        resetTimeout();
      }
    }, (APP_CONFIG.SESSION_TIMEOUT_MINUTES - 5) * 60 * 1000);

    // Set session timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, APP_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000);
  };

  useEffect(() => {
    // Activity events to reset timeout
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetTimeoutHandler = () => resetTimeout();
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Initial timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [onTimeout]);

  return { resetTimeout };
};