import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for Intersection Observer with animation triggers
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element visible (0-1)
 * @param {string} options.rootMargin - Margin around root
 * @param {boolean} options.triggerOnce - Animation triggers once or every scroll
 * @param {number} options.delay - Delay before animation starts (ms)
 * @returns {Array} [ref, isInView, hasAnimated]
 */
export const useInView = (options = {}) => {
  const {
    threshold = 0.1,        // Trigger when 10% visible
    rootMargin = '0px',     // No margin
    triggerOnce = true,     // Animation triggers once by default
    delay = 0               // No delay by default
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
              setIsInView(true);
              if (triggerOnce) {
                setHasAnimated(true);
              }
            }, delay);
          } else {
            setIsInView(true);
            if (triggerOnce) {
              setHasAnimated(true);
            }
          }
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return [ref, isInView, hasAnimated];
};
