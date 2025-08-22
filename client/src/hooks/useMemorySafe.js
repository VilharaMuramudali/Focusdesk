import { useEffect, useRef } from 'react';

/**
 * Custom hook for memory-safe operations
 * Prevents memory leaks by tracking component mount status
 */
export const useMemorySafe = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = (setState, value) => {
    if (isMountedRef.current) {
      setState(value);
    }
  };

  const safeAsyncOperation = async (asyncFn) => {
    if (!isMountedRef.current) return null;
    
    try {
      const result = await asyncFn();
      if (isMountedRef.current) {
        return result;
      }
    } catch (error) {
      if (isMountedRef.current) {
        throw error;
      }
    }
    return null;
  };

  return {
    isMounted: () => isMountedRef.current,
    safeSetState,
    safeAsyncOperation
  };
};

/**
 * Custom hook for safe intervals
 */
export const useSafeInterval = (callback, delay) => {
  const { isMounted, safeAsyncOperation } = useMemorySafe();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (delay !== null) {
      intervalRef.current = setInterval(() => {
        if (isMounted()) {
          callback();
        }
      }, delay);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [callback, delay, isMounted]);

  return intervalRef.current;
};

/**
 * Custom hook for safe timeouts
 */
export const useSafeTimeout = (callback, delay) => {
  const { isMounted } = useMemorySafe();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => {
        if (isMounted()) {
          callback();
        }
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [callback, delay, isMounted]);

  return timeoutRef.current;
};

