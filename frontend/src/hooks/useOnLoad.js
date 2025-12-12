import { useState, useEffect } from 'react';

/**
 * Hook for page load animations
 * @param {number} delay - Delay before animation triggers (ms)
 * @returns {boolean} hasLoaded - True after delay
 */
export const useOnLoad = (delay = 0) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoaded(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return hasLoaded;
};
