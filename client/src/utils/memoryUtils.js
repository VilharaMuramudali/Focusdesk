// Memory management utilities to prevent memory leaks

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Safe interval setter with cleanup
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Cleanup function
 */
export const safeSetInterval = (callback, delay) => {
  const intervalId = setInterval(callback, delay);
  return () => clearInterval(intervalId);
};

/**
 * Safe timeout setter with cleanup
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Cleanup function
 */
export const safeSetTimeout = (callback, delay) => {
  const timeoutId = setTimeout(callback, delay);
  return () => clearTimeout(timeoutId);
};

/**
 * Cleanup function for component unmounting
 * @param {Array} cleanupFunctions - Array of cleanup functions
 */
export const cleanupOnUnmount = (cleanupFunctions) => {
  return () => {
    cleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
  };
};

/**
 * Memory-efficient array update
 * @param {Array} oldArray - Previous array
 * @param {Array} newArray - New array
 * @returns {boolean} True if arrays are different
 */
export const hasArrayChanged = (oldArray, newArray) => {
  if (oldArray.length !== newArray.length) return true;
  return oldArray.some((item, index) => item !== newArray[index]);
};

/**
 * Safe state update that prevents memory leaks
 * @param {Function} setState - React setState function
 * @param {any} newValue - New state value
 * @param {boolean} isMounted - Component mounted status
 */
export const safeSetState = (setState, newValue, isMounted) => {
  if (isMounted) {
    setState(newValue);
  }
};

