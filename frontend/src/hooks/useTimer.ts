import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialTime: number | null, onTimeout?: () => void) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    setIsRunning(true);
  }, [timeRemaining]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((newTime: number | null) => {
    stop();
    setTimeRemaining(newTime);
    setIsRunning(false);
  }, [stop]);

  useEffect(() => {
    if (!isRunning || timeRemaining === null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setIsRunning(false);
          if (onTimeout) {
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeRemaining, onTimeout]);

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    reset,
  };
};

