import { useEffect, useRef, useState, useCallback } from 'react';

const EVENTS: (keyof DocumentEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'pointerdown',
];

interface UseIdleTimeoutOptions {
  /** Idle time before warning (ms). Default: 15 minutes */
  timeout?: number;
  /** Extra time after warning before auto-logout (ms). Default: 60 seconds */
  warningDuration?: number;
  /** Called when the user is finally logged out */
  onLogout: () => void;
  /** Whether the hook is active (e.g., only when authenticated) */
  enabled?: boolean;
}

export function useIdleTimeout({
  timeout = 15 * 60 * 1000,
  warningDuration = 60 * 1000,
  onLogout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const countdownInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  const clearAllTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const startIdleTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);

    idleTimer.current = setTimeout(() => {
      // User has been idle — show warning
      setShowWarning(true);
      setCountdown(Math.ceil(warningDuration / 1000));

      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      logoutTimer.current = setTimeout(() => {
        setShowWarning(false);
        onLogout();
      }, warningDuration);
    }, timeout);
  }, [timeout, warningDuration, onLogout, clearAllTimers]);

  const stayActive = useCallback(() => {
    startIdleTimer();
  }, [startIdleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      if (!showWarning) {
        startIdleTimer();
      }
    };

    for (const event of EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    startIdleTimer();

    return () => {
      for (const event of EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
      clearAllTimers();
    };
  }, [enabled, showWarning, startIdleTimer, clearAllTimers]);

  return { showWarning, countdown, stayActive };
}
